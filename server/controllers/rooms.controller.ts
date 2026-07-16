import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { uid, coordsForArea, mapRoom } from '../utils/helpers';

// Define expected request query parameters for search/filtering
interface GetRoomsQuery {
  search?: string;
  maxPrice?: string;
  type?: string;
  billsIncluded?: string;
  availableNow?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export async function getRooms(req: Request<{}, {}, {}, GetRoomsQuery>, res: Response): Promise<Response | void> {
  const { search, maxPrice, type, billsIncluded, availableNow, sort, page, limit } = req.query;
  try {
    let query = 'SELECT * FROM rooms WHERE 1=1';
    const params: any[] = [];
    let i = 1;

    if (search) {
      query += ` AND (LOWER(title) LIKE $${i} OR LOWER(area) LIKE $${i} OR LOWER(address) LIKE $${i})`;
      params.push(`%${search.toLowerCase()}%`); 
      i++;
    }
    if (maxPrice) { 
      query += ` AND price <= $${i}`; 
      params.push(Number(maxPrice)); 
      i++; 
    }
    if (type) { 
      query += ` AND type = $${i}`; 
      params.push(type); 
      i++; 
    }
    if (billsIncluded === 'true') { 
      query += ` AND bills_included = true`; 
    }
    if (availableNow === 'true') { 
      query += ` AND available_now = true`; 
    }

    if (sort === 'price_asc') query += ' ORDER BY price ASC';
    else if (sort === 'price_desc') query += ' ORDER BY price DESC';
    else if (sort === 'oldest') query += ' ORDER BY created_at ASC';
    else query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    const rooms = result.rows.map(mapRoom);
    const total = rooms.length;
    
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || total || 1);
    const start = (pageNum - 1) * limitNum;
    const paged = (page || limit) ? rooms.slice(start, start + limitNum) : rooms;

    return res.json({ 
      items: paged, 
      total, 
      page: pageNum, 
      totalPages: Math.max(1, Math.ceil(total / limitNum)) 
    });
  } catch (e: any) {
    console.error('GET /api/rooms failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function getSavedRooms(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const userId = req.user?.userId;
    const result = await pool.query('SELECT * FROM rooms WHERE $1 = ANY(saved_by)', [userId]);
    return res.json(result.rows.map(mapRoom));
  } catch (e: any) {
    console.error('GET /api/rooms/saved failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function compareRooms(req: Request, res: Response): Promise<Response | void> {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: 'No room ids provided' });
  }
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = ANY($1)', [ids]);
    return res.json(result.rows.map(mapRoom));
  } catch (e: any) {
    console.error('POST /api/rooms/compare failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function getRoom(req: Request, res: Response): Promise<Response | void> {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Room not found' });
    }
    return res.json(mapRoom(result.rows[0]));
  } catch (e: any) {
    console.error('GET /api/rooms/:id failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function createRoom(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  if (!req.user || req.user.role !== 'landlord') {
    return res.status(403).json({ error: 'Only landlords can list rooms' });
  }
  
  const { title, description, price, area, address, type, billsIncluded, availableNow } = req.body;
  if (!title || !description || !price || !area || !address) {
    return res.status(400).json({ error: 'Please fill in all required fields' });
  }

  const [lat, lng] = coordsForArea(area);
  const id = uid();
  const image = req.file ? '/uploads/' + req.file.filename : null;

  try {
    const result = await pool.query(
      'INSERT INTO rooms (id, title, description, price, area, address, type, bills_included, available_now, landlord_id, landlord_name, lat, lng, image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
      [
        id, 
        title, 
        description, 
        Number(price), 
        area, 
        address, 
        type || 'Double',
        billsIncluded === 'true' || billsIncluded === true,
        !(availableNow === 'false' || availableNow === false),
        req.user.userId, 
        req.user.name, 
        lat, 
        lng, 
        image
      ]
    );
    return res.status(201).json(mapRoom(result.rows[0]));
  } catch (e: any) {
    console.error('POST /api/rooms failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function updateRoom(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  const { title, description, price, area, address, type, billsIncluded, availableNow, removeImage } = req.body;
  if (!title || !description || !price || !area || !address) {
    return res.status(400).json({ error: 'Please fill in all required fields' });
  }

  try {
    const userId = req.user?.userId;
    const existing = await pool.query('SELECT * FROM rooms WHERE id=$1 AND landlord_id=$2', [req.params.id, userId]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Room not found or not yours' });
    }

    const [lat, lng] = area !== existing.rows[0].area ? coordsForArea(area) : [existing.rows[0].lat, existing.rows[0].lng];
    let image = existing.rows[0].image;
    if (req.file) {
      image = '/uploads/' + req.file.filename;
    } else if (removeImage === 'true') {
      image = null;
    }

    const result = await pool.query(
      'UPDATE rooms SET title=$1,description=$2,price=$3,area=$4,address=$5,type=$6,bills_included=$7,available_now=$8,lat=$9,lng=$10,image=$11 WHERE id=$12 RETURNING *',
      [
        title, 
        description, 
        Number(price), 
        area, 
        address, 
        type,
        billsIncluded === 'true' || billsIncluded === true,
        !(availableNow === 'false' || availableNow === false),
        lat, 
        lng, 
        image, 
        req.params.id
      ]
    );
    return res.json(mapRoom(result.rows[0]));
  } catch (e: any) {
    console.error('PUT /api/rooms/:id failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteRoom(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const userId = req.user?.userId;
    const result = await pool.query('DELETE FROM rooms WHERE id=$1 AND landlord_id=$2', [req.params.id, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Room not found or not yours' });
    }
    return res.json({ message: 'Room deleted' });
  } catch (e: any) {
    console.error('DELETE /api/rooms/:id failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function toggleSaveRoom(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const userId = req.user?.userId;
    const result = await pool.query('SELECT saved_by FROM rooms WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const savedBy: (string | number)[] = result.rows[0].saved_by || [];
    const already = savedBy.includes(userId as string | number);
    const newSaved = already 
      ? savedBy.filter(id => id !== userId) 
      : [...savedBy, userId as string | number];
      
    await pool.query('UPDATE rooms SET saved_by=$1 WHERE id=$2', [newSaved, req.params.id]);
    return res.json({ saved: !already });
  } catch (e: any) {
    console.error('POST /api/rooms/:id/save failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}