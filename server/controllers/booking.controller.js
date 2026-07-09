const pool = require('../config/db');
const { mapBooking } = require('../utils/helpers');

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
    await client.query(
      "UPDATE bookings SET status='rejected', updated_at=now() WHERE room_id=$1 AND id!=$2 AND status='pending'",
      [booking.room_id, booking.id]
    );
    await client.query('UPDATE rooms SET available_now=false WHERE id=$1', [booking.room_id]);
    await client.query('UPDATE users SET rental_room_id=$1 WHERE id=$2', [booking.room_id, booking.tenant_id]);

    await client.query('COMMIT');
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
    res.json(mapBooking(result.rows[0]));
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