import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { mapRoom, RoomRow } from '../utils/helpers';
import { sendEmail } from '../utils/email';
import {
  stripeEnabled,
  getStripePublishableKey,
  createPaymentIntent,
  retrievePaymentIntent
} from '../utils/stripe';

interface PaymentRow {
  id: string;
  tenant_id: string | number;
  room_id: string;
  month: string;
  amount: number | string;
  card_last4: string;
  paid_at: string | Date | number;
}

export async function setRental(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'tenant') {
    return res.status(403).json({ error: 'Only tenants can set a rental' });
  }
  const { roomId } = req.body;
  try {
    await pool.query('UPDATE users SET rental_room_id=$1 WHERE id=$2', [roomId || null, req.user.userId]);
    return res.json({ rentalRoomId: roomId || null });
  } catch (e: any) {
    console.error('POST /api/rental/set failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function myRental(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'tenant') {
    return res.status(403).json({ error: 'Only tenants have rentals' });
  }
  try {
    const userResult = await pool.query('SELECT rental_room_id FROM users WHERE id=$1', [req.user.userId]);
    const rentalRoomId = userResult.rows[0]?.rental_room_id;
    if (!rentalRoomId) {
      return res.json({ room: null, payments: [] });
    }

    const roomResult = await pool.query<RoomRow>('SELECT * FROM rooms WHERE id=$1', [rentalRoomId]);
    if (!roomResult.rows[0]) {
      return res.json({ room: null, payments: [] });
    }

    const paymentsResult = await pool.query<PaymentRow>(
      'SELECT * FROM payments WHERE tenant_id=$1 AND room_id=$2 ORDER BY month ASC',
      [req.user.userId, rentalRoomId]
    );

    return res.json({
      room: mapRoom(roomResult.rows[0]),
      payments: paymentsResult.rows.map(p => ({
        _id: p.id,
        tenantId: p.tenant_id,
        roomId: p.room_id,
        month: p.month,
        amount: p.amount,
        cardLast4: p.card_last4,
        paidAt: new Date(p.paid_at).getTime()
      }))
    });
  } catch (e: any) {
    console.error('GET /api/rental/mine failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function paymentConfig(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  return res.json({
    stripeEnabled: stripeEnabled(),
    publishableKey: getStripePublishableKey()
  });
}

export async function createRentPaymentIntent(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'tenant') {
    return res.status(403).json({ error: 'Only tenants can pay rent' });
  }
  if (!stripeEnabled()) {
    return res.status(503).json({ error: 'Stripe test payments are not configured' });
  }

  const { month } = req.body;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month' });
  }

  try {
    const userResult = await pool.query('SELECT rental_room_id FROM users WHERE id=$1', [req.user.userId]);
    const rentalRoomId = userResult.rows[0]?.rental_room_id;
    if (!rentalRoomId) {
      return res.status(400).json({ error: 'No rental set' });
    }

    const roomResult = await pool.query<RoomRow>('SELECT id, title, price FROM rooms WHERE id=$1', [rentalRoomId]);
    if (!roomResult.rows[0]) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const existing = await pool.query('SELECT id FROM payments WHERE tenant_id=$1 AND room_id=$2 AND month=$3',
      [req.user.userId, rentalRoomId, month]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'This month is already marked as paid' });
    }

    const room = roomResult.rows[0];
    const amount = Math.round(Number(room.price) * 100);
    const intent = await createPaymentIntent({
      amount,
      tenantId: String(req.user.userId),
      roomId: rentalRoomId,
      month
    });

    return res.status(201).json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount,
      currency: intent.currency
    });
  } catch (e: any) {
    console.error('POST /api/rental/pay/intent failed:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}

export async function confirmRentPayment(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'tenant') {
    return res.status(403).json({ error: 'Only tenants can pay rent' });
  }
  if (!stripeEnabled()) {
    return res.status(503).json({ error: 'Stripe test payments are not configured' });
  }

  const { paymentIntentId, month } = req.body;
  if (!paymentIntentId) {
    return res.status(400).json({ error: 'Missing Stripe payment id' });
  }
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month' });
  }

  try {
    const userResult = await pool.query('SELECT id, email, rental_room_id FROM users WHERE id=$1', [req.user.userId]);
    const user = userResult.rows[0];
    const rentalRoomId = user?.rental_room_id;
    if (!rentalRoomId) {
      return res.status(400).json({ error: 'No rental set' });
    }

    const roomResult = await pool.query<RoomRow>('SELECT id, title, price FROM rooms WHERE id=$1', [rentalRoomId]);
    const room = roomResult.rows[0];
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const intent = await retrievePaymentIntent(paymentIntentId);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Stripe payment has not succeeded yet' });
    }
    if (intent.metadata?.tenantId !== String(req.user.userId) || intent.metadata?.roomId !== rentalRoomId || intent.metadata?.month !== month) {
      return res.status(400).json({ error: 'Stripe payment does not match this rental' });
    }

    const existing = await pool.query<PaymentRow>('SELECT * FROM payments WHERE tenant_id=$1 AND room_id=$2 AND month=$3',
      [req.user.userId, rentalRoomId, month]);
    if (existing.rows[0]) {
      const p = existing.rows[0];
      return res.json({
        _id: p.id,
        tenantId: p.tenant_id,
        roomId: p.room_id,
        month: p.month,
        amount: p.amount,
        cardLast4: p.card_last4,
        paidAt: new Date(p.paid_at).getTime()
      });
    }

    const last4 = intent.payment_method?.card?.last4 || 'test';
    const result = await pool.query<PaymentRow>(
      'INSERT INTO payments (tenant_id, room_id, month, amount, card_last4) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.userId, rentalRoomId, month, room.price, last4]
    );
    const p = result.rows[0];

    await sendEmail({
      to: user.email,
      subject: `Rent payment received for ${month}`,
      text: `Your rent payment for ${room.title} (${month}) was recorded successfully. Amount: £${room.price}.`
    });

    return res.status(201).json({
      _id: p.id,
      tenantId: p.tenant_id,
      roomId: p.room_id,
      month: p.month,
      amount: p.amount,
      cardLast4: p.card_last4,
      paidAt: new Date(p.paid_at).getTime()
    });
  } catch (e: any) {
    console.error('POST /api/rental/pay/confirm failed:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}

export async function deletePayment(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query('DELETE FROM payments WHERE id=$1 AND tenant_id=$2', [req.params.id, req.user?.userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Payment not found or not yours' });
    }
    return res.json({ message: 'Payment record deleted' });
  } catch (e: any) {
    console.error('DELETE /api/rental/pay/:id failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}