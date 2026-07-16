import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import { EnquiryRow } from '../utils/helpers';

export interface MessageRow {
  id: string;
  enquiry_id: string;
  sender_id: string | number;
  sender_name: string;
  sender_role: string;
  body: string;
  read_by: (string | number)[];
  created_at: string | Date | number;
}

export async function getMessages(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  const { id } = req.params;
  try {
    const enq = await pool.query<EnquiryRow>('SELECT * FROM enquiries WHERE id=$1', [id]);
    if (!enq.rows[0]) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    const e = enq.rows[0];
    
    const userId = req.user?.userId;
    if (e.tenant_id !== userId && e.landlord_id !== userId) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    
    const result = await pool.query<MessageRow>('SELECT * FROM messages WHERE enquiry_id=$1 ORDER BY created_at ASC', [id]);
    await pool.query(
      `UPDATE messages SET read_by = array_append(read_by, $1) WHERE enquiry_id=$2 AND NOT ($1 = ANY(read_by))`, 
      [userId, id]
    );
    
    return res.json(result.rows.map(mapMessage));
  } catch (e: any) {
    console.error('GET /api/messages/:id/messages failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  const { id } = req.params;
  const { body } = req.body;
  if (!body || body.trim().length < 1) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }
  
  try {
    const enq = await pool.query<EnquiryRow>('SELECT * FROM enquiries WHERE id=$1', [id]);
    if (!enq.rows[0]) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    const e = enq.rows[0];
    
    const userId = req.user?.userId;
    if (e.tenant_id !== userId && e.landlord_id !== userId) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    
    const result = await pool.query<MessageRow>(
      'INSERT INTO messages (enquiry_id, sender_id, sender_name, sender_role, body, read_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, userId, req.user?.name, req.user?.role, body.trim(), [userId]]
    );
    
    if (req.user?.role === 'landlord') {
      await pool.query("UPDATE enquiries SET status='replied' WHERE id=$1", [id]);
    }
    
    const recipientId = req.user?.role === 'landlord' ? e.tenant_id : e.landlord_id;
    const recipient = await pool.query('SELECT email FROM users WHERE id=$1', [recipientId]);
    await sendEmail({
      to: recipient.rows[0]?.email,
      subject: `New message about ${e.room_title}`,
      text: `${req.user?.name} sent a message about "${e.room_title}":\n\n${body.trim()}`
    });
    
    return res.status(201).json(mapMessage(result.rows[0]));
  } catch (e: any) {
    console.error('POST /api/messages/:id/messages failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function unreadCount(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const userId = req.user?.userId;
    const result = await pool.query(
      `SELECT COUNT(*) FROM messages m JOIN enquiries e ON m.enquiry_id = e.id WHERE (e.tenant_id=$1 OR e.landlord_id=$1) AND m.sender_id != $1 AND NOT ($1 = ANY(m.read_by))`,
      [userId]
    );
    return res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (e: any) {
    console.error('GET /api/messages/unread failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export function mapMessage(m: MessageRow) {
  return { 
    _id: m.id, 
    enquiryId: m.enquiry_id, 
    senderId: m.sender_id, 
    senderName: m.sender_name, 
    senderRole: m.sender_role, 
    body: m.body, 
    readBy: m.read_by || [], 
    createdAt: new Date(m.created_at).getTime() 
  };
}