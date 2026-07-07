const pool = require('../config/db');
const { mapEnquiry } = require('../utils/helpers');

async function createEnquiry(req, res) {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can send enquiries' });
  const { message } = req.body;
  if (!message || message.trim().length < 5) return res.status(400).json({ error: 'Message must be at least 5 characters' });

  try {
    const room = await pool.query('SELECT * FROM rooms WHERE id=$1', [req.params.roomId]);
    if (!room.rows[0]) return res.status(404).json({ error: 'Room not found' });
    const r = room.rows[0];

    const result = await pool.query(
      'INSERT INTO enquiries (room_id,room_title,room_area,room_price,tenant_id,tenant_name,landlord_id,landlord_name,message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [r.id, r.title, r.area, r.price, req.user.userId, req.user.name, r.landlord_id, r.landlord_name, message.trim()]
    );
    res.status(201).json(mapEnquiry(result.rows[0]));
  } catch (e) {
    console.error('POST /api/enquiries/:roomId failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function replyEnquiry(req, res) {
  if (req.user.role !== 'landlord') return res.status(403).json({ error: 'Only landlords can reply' });
  const { reply } = req.body;
  if (!reply || reply.trim().length < 2) return res.status(400).json({ error: 'Reply must be at least 2 characters' });

  try {
    const result = await pool.query(
      'UPDATE enquiries SET reply=$1, status=$2 WHERE id=$3 AND landlord_id=$4 RETURNING *',
      [reply.trim(), 'replied', req.params.id, req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Enquiry not found' });
    res.json(mapEnquiry(result.rows[0]));
  } catch (e) {
    console.error('POST /api/enquiries/:id/reply failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function editEnquiry(req, res) {
  const { message } = req.body;
  if (!message || message.trim().length < 5) return res.status(400).json({ error: 'Message must be at least 5 characters' });

  try {
    const result = await pool.query(
      'UPDATE enquiries SET message=$1 WHERE id=$2 AND tenant_id=$3 AND status!=\'replied\' RETURNING *',
      [message.trim(), req.params.id, req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Enquiry not found, not yours, or already replied' });
    res.json(mapEnquiry(result.rows[0]));
  } catch (e) {
    console.error('PUT /api/enquiries/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteEnquiry(req, res) {
  try {
    const result = await pool.query('DELETE FROM enquiries WHERE id=$1 AND tenant_id=$2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Enquiry not found or not yours' });
    res.json({ message: 'Enquiry deleted' });
  } catch (e) {
    console.error('DELETE /api/enquiries/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function myEnquiries(req, res) {
  try {
    const result = await pool.query('SELECT * FROM enquiries WHERE tenant_id=$1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows.map(mapEnquiry));
  } catch (e) {
    console.error('GET /api/enquiries/mine failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function receivedEnquiries(req, res) {
  try {
    const result = await pool.query('SELECT * FROM enquiries WHERE landlord_id=$1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows.map(mapEnquiry));
  } catch (e) {
    console.error('GET /api/enquiries/received failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  createEnquiry, replyEnquiry, editEnquiry, deleteEnquiry, myEnquiries, receivedEnquiries
};