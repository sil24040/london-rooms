import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { mapEnquiry, notify, RoomRow, EnquiryRow } from '../utils/helpers';
import { sendEmail } from '../utils/email';

export async function createEnquiry(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'tenant') {
    return res.status(403).json({ error: 'Only tenants can send enquiries' });
  }
  
  const { message } = req.body;
  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: 'Message must be at least 5 characters' });
  }

  try {
    const roomResult = await pool.query<RoomRow>('SELECT * FROM rooms WHERE id=$1', [req.params.roomId]);
    if (!roomResult.rows[0]) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const r = roomResult.rows[0];

    const result = await pool.query<EnquiryRow>(
      'INSERT INTO enquiries (room_id,room_title,room_area,room_price,tenant_id,tenant_name,landlord_id,landlord_name,message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [r.id, r.title, r.area, r.price, req.user.userId, req.user.name, r.landlord_id, r.landlord_name, message.trim()]
    );

    await notify(r.landlord_id, 'enquiry_received', `${req.user.name} sent an enquiry about "${r.title}"`, 'dashboard');
    
    const landlord = await pool.query('SELECT email FROM users WHERE id=$1', [r.landlord_id]);
    await sendEmail({
      to: landlord.rows[0]?.email,
      subject: `New enquiry for ${r.title}`,
      text: `${req.user.name} sent an enquiry about "${r.title}":\n\n${message.trim()}`
    });

    return res.status(201).json(mapEnquiry(result.rows[0]));
  } catch (e: any) {
    console.error('POST /api/enquiries/:roomId failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function replyEnquiry(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'landlord') {
    return res.status(403).json({ error: 'Only landlords can reply' });
  }
  
  const { reply } = req.body;
  if (!reply || reply.trim().length < 2) {
    return res.status(400).json({ error: 'Reply must be at least 2 characters' });
  }

  try {
    const result = await pool.query<EnquiryRow>(
      'UPDATE enquiries SET reply=$1, status=$2 WHERE id=$3 AND landlord_id=$4 RETURNING *',
      [reply.trim(), 'replied', req.params.id, req.user.userId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    const e = result.rows[0];

    await notify(e.tenant_id, 'enquiry_replied', `${e.landlord_name} replied to your enquiry about "${e.room_title}"`, 'dashboard');
    
    const tenant = await pool.query('SELECT email FROM users WHERE id=$1', [e.tenant_id]);
    await sendEmail({
      to: tenant.rows[0]?.email,
      subject: `Reply about ${e.room_title}`,
      text: `${e.landlord_name} replied to your enquiry about "${e.room_title}":\n\n${reply.trim()}`
    });

    return res.json(mapEnquiry(e));
  } catch (e: any) {
    console.error('POST /api/enquiries/:id/reply failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function editEnquiry(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  const { message } = req.body;
  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: 'Message must be at least 5 characters' });
  }

  try {
    const result = await pool.query<EnquiryRow>(
      "UPDATE enquiries SET message=$1 WHERE id=$2 AND tenant_id=$3 AND status!='replied' RETURNING *",
      [message.trim(), req.params.id, req.user?.userId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Enquiry not found, not yours, or already replied' });
    }
    return res.json(mapEnquiry(result.rows[0]));
  } catch (e: any) {
    console.error('PUT /api/enquiries/:id failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteEnquiry(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query('DELETE FROM enquiries WHERE id=$1 AND tenant_id=$2', [req.params.id, req.user?.userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Enquiry not found or not yours' });
    }
    return res.json({ message: 'Enquiry deleted' });
  } catch (e: any) {
    console.error('DELETE /api/enquiries/:id failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function myEnquiries(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query<EnquiryRow>('SELECT * FROM enquiries WHERE tenant_id=$1 ORDER BY created_at DESC', [req.user?.userId]);
    return res.json(result.rows.map(mapEnquiry));
  } catch (e: any) {
    console.error('GET /api/enquiries/mine failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function receivedEnquiries(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query<EnquiryRow>('SELECT * FROM enquiries WHERE landlord_id=$1 ORDER BY created_at DESC', [req.user?.userId]);
    return res.json(result.rows.map(mapEnquiry));
  } catch (e: any) {
    console.error('GET /api/enquiries/received failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}