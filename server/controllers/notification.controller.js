const pool = require('../config/db');
const { mapNotification } = require('../utils/helpers');

async function myNotifications(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user.userId]
    );
    const unreadResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND read=false',
      [req.user.userId]
    );
    res.json({
      items: result.rows.map(mapNotification),
      unreadCount: parseInt(unreadResult.rows[0].count, 10)
    });
  } catch (e) {
    console.error('GET /api/notifications failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function markRead(req, res) {
  try {
    const result = await pool.query(
      'UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Notification not found' });
    res.json(mapNotification(result.rows[0]));
  } catch (e) {
    console.error('PUT /api/notifications/:id/read failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function markAllRead(req, res) {
  try {
    await pool.query('UPDATE notifications SET read=true WHERE user_id=$1 AND read=false', [req.user.userId]);
    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    console.error('PUT /api/notifications/read-all failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { myNotifications, markRead, markAllRead };