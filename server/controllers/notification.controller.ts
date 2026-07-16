import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { mapNotification, NotificationRow } from '../utils/helpers';

export async function myNotifications(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query<NotificationRow>(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user?.userId]
    );
    
    const unreadResult = await pool.query<{ count: string }>(
      'SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND read=false',
      [req.user?.userId]
    );
    
    return res.json({
      items: result.rows.map(mapNotification),
      unreadCount: parseInt(unreadResult.rows[0].count, 10)
    });
  } catch (e: any) {
    console.error('GET /api/notifications failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function markRead(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query<NotificationRow>(
      'UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2 RETURNING *',
      [req.params.id, req.user?.userId]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    return res.json(mapNotification(result.rows[0]));
  } catch (e: any) {
    console.error('PUT /api/notifications/:id/read failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function markAllRead(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    await pool.query(
      'UPDATE notifications SET read=true WHERE user_id=$1 AND read=false', 
      [req.user?.userId]
    );
    
    return res.json({ message: 'All notifications marked as read' });
  } catch (e: any) {
    console.error('PUT /api/notifications/read-all failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}