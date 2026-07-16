import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { mapBooking, notify, RoomRow, BookingRow } from '../utils/helpers';
import { sendEmail } from '../utils/email';

export async function createBooking(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'tenant') {
    return res.status(403).json({ error: 'Only tenants can request bookings' });
  }
  const { message } = req.body;

  try {
    const room = await pool.query<RoomRow>('SELECT * FROM rooms WHERE id=$1', [req.params.roomId]);
    if (!room.rows[0]) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const r = room.rows[0];

    const existing = await pool.query(
      "SELECT id FROM bookings WHERE room_id=$1 AND tenant_id=$2 AND status='pending'",
      [r.id, req.user.userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You already have a pending request for this room' });
    }

    const result = await pool.query<BookingRow>(
      `INSERT INTO bookings (room_id, room_title, room_area, room_price, tenant_id, tenant_name, landlord_id, landlord_name, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [r.id, r.title, r.area, r.price, req.user.userId, req.user.name, r.landlord_id, r.landlord_name, (message || '').trim() || null]
    );

    await notify(r.landlord_id, 'booking_received', `${req.user.name} requested to book "${r.title}"`, 'dashboard');
    
    const landlord = await pool.query('SELECT email FROM users WHERE id=$1', [r.landlord_id]);
    await sendEmail({
      to: landlord.rows[0]?.email,
      subject: `New booking request for ${r.title}`,
      text: `${req.user.name} requested to book "${r.title}".\n\n${(message || '').trim() || 'No message provided.'}`
    });

    return res.status(201).json(mapBooking(result.rows[0]));
  } catch (e: any) {
    console.error('POST /api/bookings/:roomId failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function myBookings(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query<BookingRow>('SELECT * FROM bookings WHERE tenant_id=$1 ORDER BY created_at DESC', [req.user?.userId]);
    return res.json(result.rows.map(mapBooking));
  } catch (e: any) {
    console.error('GET /api/bookings/mine failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function receivedBookings(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query<BookingRow>('SELECT * FROM bookings WHERE landlord_id=$1 ORDER BY created_at DESC', [req.user?.userId]);
    return res.json(result.rows.map(mapBooking));
  } catch (e: any) {
    console.error('GET /api/bookings/received failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function approveBooking(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'landlord') {
    return res.status(403).json({ error: 'Only landlords can approve bookings' });
  }

  const client = await pool.connect();
  try {
    const bookingResult = await client.query<BookingRow>(
      "SELECT * FROM bookings WHERE id=$1 AND landlord_id=$2 AND status='pending'",
      [req.params.id, req.user.userId]
    );
    const booking = bookingResult.rows[0];
    if (!booking) {
      client.release();
      return res.status(404).json({ error: 'Booking request not found or already handled' });
    }

    await client.query('BEGIN');

    await client.query("UPDATE bookings SET status='approved', updated_at=now() WHERE id=$1", [booking.id]);
    
    // Automatically decline any rival booking requests and fetch their details so we can email them
    const rejectedResult = await client.query<BookingRow>(
      "UPDATE bookings SET status='rejected', updated_at=now() WHERE room_id=$1 AND id!=$2 AND status='pending' RETURNING *",
      [booking.room_id, booking.id]
    );
    
    await client.query('UPDATE rooms SET available_now=false WHERE id=$1', [booking.room_id]);
    await client.query('UPDATE users SET rental_room_id=$1 WHERE id=$2', [booking.room_id, booking.tenant_id]);

    await client.query('COMMIT');

    // Post-commit communications
    await notify(booking.tenant_id, 'booking_approved', `Your booking request for "${booking.room_title}" was approved!`, 'dashboard');
    
    const approvedTenant = await pool.query('SELECT email FROM users WHERE id=$1', [booking.tenant_id]);
    await sendEmail({
      to: approvedTenant.rows[0]?.email,
      subject: `Booking approved: ${booking.room_title}`,
      text: `Good news. Your booking request for "${booking.room_title}" was approved.`
    });

    // Notify other applicants who missed out
    for (const rejected of rejectedResult.rows) {
      await notify(
        rejected.tenant_id, 
        'booking_rejected', 
        `Your booking request for "${rejected.room_title}" was rejected - the room was booked by someone else`, 
        'dashboard'
      );
      
      const rejectedTenant = await pool.query('SELECT email FROM users WHERE id=$1', [rejected.tenant_id]);
      await sendEmail({
        to: rejectedTenant.rows[0]?.email,
        subject: `Booking update: ${rejected.room_title}`,
        text: `Your booking request for "${rejected.room_title}" was rejected because the room was booked by another tenant.`
      });
    }

    return res.json({ message: 'Booking approved' });
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error('PUT /api/bookings/:id/approve failed:', e);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

export async function rejectBooking(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'landlord') {
    return res.status(403).json({ error: 'Only landlords can reject bookings' });
  }
  try {
    const result = await pool.query<BookingRow>(
      "UPDATE bookings SET status='rejected', updated_at=now() WHERE id=$1 AND landlord_id=$2 AND status='pending' RETURNING *",
      [req.params.id, req.user.userId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Booking request not found or already handled' });
    }
    const b = result.rows[0];

    await notify(b.tenant_id, 'booking_rejected', `Your booking request for "${b.room_title}" was rejected`, 'dashboard');
    
    const tenant = await pool.query('SELECT email FROM users WHERE id=$1', [b.tenant_id]);
    await sendEmail({
      to: tenant.rows[0]?.email,
      subject: `Booking rejected: ${b.room_title}`,
      text: `Your booking request for "${b.room_title}" was rejected.`
    });

    return res.json(mapBooking(b));
  } catch (e: any) {
    console.error('PUT /api/bookings/:id/reject failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function cancelBooking(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query(
      "DELETE FROM bookings WHERE id=$1 AND tenant_id=$2 AND status='pending'",
      [req.params.id, req.user?.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking request not found, not yours, or already handled' });
    }
    return res.json({ message: 'Booking request cancelled' });
  } catch (e: any) {
    console.error('DELETE /api/bookings/:id failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}