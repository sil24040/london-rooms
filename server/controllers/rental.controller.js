const pool = require('../config/db');
const { mapRoom } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const {
  stripeEnabled,
  getStripePublishableKey,
  createPaymentIntent,
  retrievePaymentIntent
} = require('../utils/stripe');

async function setRental(req, res) {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can set a rental' });
  const { roomId } = req.body;
  try {
    await pool.query('UPDATE users SET rental_room_id=$1 WHERE id=$2', [roomId || null, req.user.userId]);
    res.json({ rentalRoomId: roomId || null });
  } catch (e) {
    console.error('POST /api/rental/set failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function myRental(req, res) {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants have rentals' });
  try {
    const userResult = await pool.query('SELECT rental_room_id FROM users WHERE id=$1', [req.user.userId]);
    const rentalRoomId = userResult.rows[0]?.rental_room_id;
    if (!rentalRoomId) return res.json({ room: null, payments: [] });

    const roomResult = await pool.query('SELECT * FROM rooms WHERE id=$1', [rentalRoomId]);
    if (!roomResult.rows[0]) return res.json({ room: null, payments: [] });

    const paymentsResult = await pool.query(
      'SELECT * FROM payments WHERE tenant_id=$1 AND room_id=$2 ORDER BY month ASC',
      [req.user.userId, rentalRoomId]
    );
    res.json({ room: mapRoom(roomResult.rows[0]), payments: paymentsResult.rows.map(p => ({
      _id: p.id, tenantId: p.tenant_id, roomId: p.room_id,
      month: p.month, amount: p.amount, cardLast4: p.card_last4,
      paidAt: new Date(p.paid_at).getTime()
    }))});
  } catch (e) {
    console.error('GET /api/rental/mine failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function paymentConfig(req, res) {
  res.json({
    stripeEnabled: stripeEnabled(),
    publishableKey: getStripePublishableKey()
  });
}

async function createRentPaymentIntent(req, res) {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can pay rent' });
  if (!stripeEnabled()) return res.status(503).json({ error: 'Stripe test payments are not configured' });

  const { month } = req.body;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'Invalid month' });

  try {
    const userResult = await pool.query('SELECT rental_room_id FROM users WHERE id=$1', [req.user.userId]);
    const rentalRoomId = userResult.rows[0]?.rental_room_id;
    if (!rentalRoomId) return res.status(400).json({ error: 'No rental set' });

    const roomResult = await pool.query('SELECT id, title, price FROM rooms WHERE id=$1', [rentalRoomId]);
    if (!roomResult.rows[0]) return res.status(404).json({ error: 'Room not found' });

    const existing = await pool.query('SELECT id FROM payments WHERE tenant_id=$1 AND room_id=$2 AND month=$3',
      [req.user.userId, rentalRoomId, month]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'This month is already marked as paid' });

    const room = roomResult.rows[0];
    const amount = Math.round(Number(room.price) * 100);
    const intent = await createPaymentIntent({
      amount,
      tenantId: req.user.userId,
      roomId: rentalRoomId,
      month
    });

    res.status(201).json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount,
      currency: intent.currency
    });
  } catch (e) {
    console.error('POST /api/rental/pay/intent failed:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
}

async function confirmRentPayment(req, res) {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can pay rent' });
  if (!stripeEnabled()) return res.status(503).json({ error: 'Stripe test payments are not configured' });

  const { paymentIntentId, month } = req.body;
  if (!paymentIntentId) return res.status(400).json({ error: 'Missing Stripe payment id' });
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'Invalid month' });

  try {
    const userResult = await pool.query('SELECT id, email, rental_room_id FROM users WHERE id=$1', [req.user.userId]);
    const user = userResult.rows[0];
    const rentalRoomId = user?.rental_room_id;
    if (!rentalRoomId) return res.status(400).json({ error: 'No rental set' });

    const roomResult = await pool.query('SELECT id, title, price FROM rooms WHERE id=$1', [rentalRoomId]);
    const room = roomResult.rows[0];
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const intent = await retrievePaymentIntent(paymentIntentId);
    if (intent.status !== 'succeeded') return res.status(400).json({ error: 'Stripe payment has not succeeded yet' });
    if (intent.metadata?.tenantId !== req.user.userId || intent.metadata?.roomId !== rentalRoomId || intent.metadata?.month !== month) {
      return res.status(400).json({ error: 'Stripe payment does not match this rental' });
    }

    const existing = await pool.query('SELECT * FROM payments WHERE tenant_id=$1 AND room_id=$2 AND month=$3',
      [req.user.userId, rentalRoomId, month]);
    if (existing.rows[0]) {
      const p = existing.rows[0];
      return res.json({ _id: p.id, tenantId: p.tenant_id, roomId: p.room_id, month: p.month, amount: p.amount, cardLast4: p.card_last4, paidAt: new Date(p.paid_at).getTime() });
    }

    const last4 = intent.payment_method?.card?.last4 || 'test';
    const result = await pool.query(
      'INSERT INTO payments (tenant_id, room_id, month, amount, card_last4) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.userId, rentalRoomId, month, room.price, last4]
    );
    const p = result.rows[0];

    await sendEmail({
      to: user.email,
      subject: `Rent payment received for ${month}`,
      text: `Your rent payment for ${room.title} (${month}) was recorded successfully. Amount: £${room.price}.`
    });

    res.status(201).json({ _id: p.id, tenantId: p.tenant_id, roomId: p.room_id, month: p.month, amount: p.amount, cardLast4: p.card_last4, paidAt: new Date(p.paid_at).getTime() });
  } catch (e) {
    console.error('POST /api/rental/pay/confirm failed:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
}

async function deletePayment(req, res) {
  try {
    const result = await pool.query('DELETE FROM payments WHERE id=$1 AND tenant_id=$2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Payment not found or not yours' });
    res.json({ message: 'Payment record deleted' });
  } catch (e) {
    console.error('DELETE /api/rental/pay/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  setRental,
  myRental,
  paymentConfig,
  createRentPaymentIntent,
  confirmRentPayment,
  deletePayment
};
