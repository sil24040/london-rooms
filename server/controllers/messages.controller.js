const pool = require('../config/db');

async function getMessages(req, res) {
  const { id } = req.params;
  try {
    const enq = await pool.query('SELECT * FROM enquiries WHERE id=$1', [id]);
    if (!enq.rows[0]) return res.status(404).json({ error: 'Enquiry not found' });
    const e = enq.rows[0];
    if (e.tenant_id !== req.user.userId && e.landlord_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    const result = await pool.query('SELECT * FROM messages WHERE enquiry_id=$1 ORDER BY created_at ASC', [id]);
    await pool.query(`UPDATE messages SET read_by = array_append(read_by, $1) WHERE enquiry_id=$2 AND NOT ($1 = ANY(read_by))`, [req.user.userId, id]);
    res.json(result.rows.map(mapMessage));
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function sendMessage(req, res) {
  const { id } = req.params;
  const { body } = req.body;
  if (!body || body.trim().length < 1) return res.status(400).json({ error: 'Message cannot be empty' });
  try {
    const enq = await pool.query('SELECT * FROM enquiries WHERE id=$1', [id]);
    if (!enq.rows[0]) return res.status(404).json({ error: 'Enquiry not found' });
    const e = enq.rows[0];
    if (e.tenant_id !== req.user.userId && e.landlord_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    const result = await pool.query(
      'INSERT INTO messages (enquiry_id, sender_id, sender_name, sender_role, body, read_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, req.user.userId, req.user.name, req.user.role, body.trim(), [req.user.userId]]
    );
    if (req.user.role === 'landlord') {
      await pool.query("UPDATE enquiries SET status='replied' WHERE id=$1", [id]);
    }
    res.status(201).json(mapMessage(result.rows[0]));
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function unreadCount(req, res) {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM messages m JOIN enquiries e ON m.enquiry_id = e.id WHERE (e.tenant_id=$1 OR e.landlord_id=$1) AND m.sender_id != $1 AND NOT ($1 = ANY(m.read_by))`,
      [req.user.userId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

function mapMessage(m) {
  return { _id: m.id, enquiryId: m.enquiry_id, senderId: m.sender_id, senderName: m.sender_name, senderRole: m.sender_role, body: m.body, readBy: m.read_by || [], createdAt: new Date(m.created_at).getTime() };
}

module.exports = { getMessages, sendMessage, unreadCount };
