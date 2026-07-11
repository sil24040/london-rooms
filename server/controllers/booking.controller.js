const pool = require('../config/db');
const { mapBooking, notify } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');

async function createBooking(req, res) {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can request bookings' });
  const { message } = req.body;

  try {
    const room = await pool.query('SELECT * FROM rooms WHERE id=$1', [req.params.roomId]);
    if (!room.rows[0]) return res.status(404).json({ error: 'Room not found' });
    const r = room.rows[0];

    const existing = await pool.query(
      "SELECT id FROM bookings WHERE room_id=$1 AND tenant_id=$2 AND status='pending'",
      [r.id, req.user.userId]
    );
    if (existing.rows.length > 0) return res.status(409).json({ error: 'You already have a pending request for this room' });

    const result = await pool.query(
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

    res.status(201).json(mapBooking(result.rows[0]));
  } catch (e) {
    console.error('POST /api/bookings/:roomId failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function myBookings(req, res) {
  try {
    const result = await pool.query('SELECT * FROM bookings WHERE tenant_id=$1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows.map(mapBooking));
  } catch (e) {
    console.error('GET /api/bookings/mine failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function receivedBookings(req, res) {
  try {
    const result = await pool.query('SELECT * FROM bookings WHERE landlord_id=$1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows.map(mapBooking));
  } catch (e) {
    console.error('GET /api/bookings/received failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function approveBooking(req, res) {
  if (req.user.role !== 'landlord') return res.status(403).json({ error: 'Only landlords can approve bookings' });

  const client = await pool.connect();
  try {
    const bookingResult = await client.query(
      "SELECT * FROM bookings WHERE id=$1 AND landlord_id=$2 AND status='pending'",
      [req.params.id, req.user.userId]
    );
    const booking = bookingResult.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking request not found or already handled' });

    await client.query('BEGIN');

    await client.query("UPDATE bookings SET status='approved', updated_at=now() WHERE id=$1", [booking.id]);
    const rejectedResult = await client.query(
      "UPDATE bookings SET status='rejected', updated_at=now() WHERE room_id=$1 AND id!=$2 AND status='pending' RETURNING *",
      [booking.room_id, booking.id]
    );
    await client.query('UPDATE rooms SET available_now=false WHERE id=$1', [booking.room_id]);
    await client.query('UPDATE users SET rental_room_id=$1 WHERE id=$2', [booking.room_id, booking.tenant_id]);

    await client.query('COMMIT');

    await notify(booking.tenant_id, 'booking_approved', `Your booking request for "${booking.room_title}" was approved!`, 'dashboard');
    const approvedTenant = await pool.query('SELECT email FROM users WHERE id=$1', [booking.tenant_id]);
    await sendEmail({
      to: approvedTenant.rows[0]?.email,
      subject: `Booking approved: ${booking.room_title}`,
      text: `Good news. Your booking request for "${booking.room_title}" was approved.`
    });
    for (const rejected of rejectedResult.rows) {
      await notify(rejected.tenant_id, 'booking_rejected', `Your booking request for "${rejected.room_title}" was rejected - the room was booked by someone else`, 'dashboard');
      const rejectedTenant = await pool.query('SELECT email FROM users WHERE id=$1', [rejected.tenant_id]);
      await sendEmail({
        to: rejectedTenant.rows[0]?.email,
        subject: `Booking update: ${rejected.room_title}`,
        text: `Your booking request for "${rejected.room_title}" was rejected because the room was booked by another tenant.`
      });
    }

    res.json({ message: 'Booking approved' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('PUT /api/bookings/:id/approve failed:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

async function rejectBooking(req, res) {
  if (req.user.role !== 'landlord') return res.status(403).json({ error: 'Only landlords can reject bookings' });
  try {
    const result = await pool.query(
      "UPDATE bookings SET status='rejected', updated_at=now() WHERE id=$1 AND landlord_id=$2 AND status='pending' RETURNING *",
      [req.params.id, req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Booking request not found or already handled' });
    const b = result.rows[0];

    await notify(b.tenant_id, 'booking_rejected', `Your booking request for "${b.room_title}" was rejected`, 'dashboard');
    const tenant = await pool.query('SELECT email FROM users WHERE id=$1', [b.tenant_id]);
    await sendEmail({
      to: tenant.rows[0]?.email,
      subject: `Booking rejected: ${b.room_title}`,
      text: `Your booking request for "${b.room_title}" was rejected.`
    });

    res.json(mapBooking(b));
  } catch (e) {
    console.error('PUT /api/bookings/:id/reject failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function cancelBooking(req, res) {
  try {
    const result = await pool.query(
      "DELETE FROM bookings WHERE id=$1 AND tenant_id=$2 AND status='pending'",
      [req.params.id, req.user.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Booking request not found, not yours, or already handled' });
    res.json({ message: 'Booking request cancelled' });
  } catch (e) {
    console.error('DELETE /api/bookings/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { createBooking, myBookings, receivedBookings, approveBooking, rejectBooking, cancelBooking };
