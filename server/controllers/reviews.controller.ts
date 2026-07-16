import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { mapReview, RoomRow, ReviewRow } from '../utils/helpers';

async function isEligibleToReview(userId: string | number, roomId: string): Promise<boolean> {
  const approved = await pool.query(
    "SELECT id FROM bookings WHERE room_id=$1 AND tenant_id=$2 AND status='approved' LIMIT 1",
    [roomId, userId]
  );
  if (approved.rows.length > 0) return true;

  const rental = await pool.query('SELECT rental_room_id FROM users WHERE id=$1', [userId]);
  return rental.rows[0]?.rental_room_id === roomId;
}

export async function reviewEligibility(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'tenant') {
    return res.json({ eligible: false, reason: 'Only tenants can leave reviews' });
  }

  try {
    const eligible = await isEligibleToReview(req.user.userId, req.params.roomId as string);
    return res.json({
      eligible,
      reason: eligible ? null : 'Only tenants who have rented this room can leave a review'
    });
  } catch (e: any) {
    console.error('GET /api/reviews/eligibility/:roomId failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function createOrUpdateReview(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'tenant') {
    return res.status(403).json({ error: 'Only tenants can leave reviews' });
  }
  
  const { rating, comment } = req.body;
  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const room = await pool.query<RoomRow>('SELECT * FROM rooms WHERE id=$1', [req.params.roomId]);
    if (!room.rows[0]) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const r = room.rows[0];

    const eligible = await isEligibleToReview(req.user.userId, r.id);
    if (!eligible) {
      return res.status(403).json({ error: 'Only tenants who have rented this room can leave a review' });
    }

    const result = await pool.query<ReviewRow>(
      `INSERT INTO reviews (room_id, room_title, tenant_id, tenant_name, landlord_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (room_id, tenant_id)
       DO UPDATE SET rating=EXCLUDED.rating, comment=EXCLUDED.comment, updated_at=now()
       RETURNING *`,
      [r.id, r.title, req.user.userId, req.user.name, r.landlord_id, ratingNum, (comment || '').trim() || null]
    );
    
    return res.status(201).json(mapReview(result.rows[0]));
  } catch (e: any) {
    console.error('POST /api/reviews/:roomId failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Public route (uses standard express Request)
export async function getRoomReviews(req: Request, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query<ReviewRow>(
      'SELECT * FROM reviews WHERE room_id=$1 ORDER BY created_at DESC',
      [req.params.roomId]
    );
    const reviews = result.rows.map(mapReview);
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    
    return res.json({ 
      items: reviews, 
      average: Math.round(average * 10) / 10, 
      count 
    });
  } catch (e: any) {
    console.error('GET /api/reviews/room/:roomId failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function myReview(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query<ReviewRow>(
      'SELECT * FROM reviews WHERE room_id=$1 AND tenant_id=$2',
      [req.params.roomId, req.user?.userId]
    );
    return res.json(result.rows[0] ? mapReview(result.rows[0]) : null);
  } catch (e: any) {
    console.error('GET /api/reviews/mine/:roomId failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteReview(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query(
      'DELETE FROM reviews WHERE id=$1 AND tenant_id=$2', 
      [req.params.id, req.user?.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Review not found or not yours' });
    }
    return res.json({ message: 'Review deleted' });
  } catch (e: any) {
    console.error('DELETE /api/reviews/:id failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}