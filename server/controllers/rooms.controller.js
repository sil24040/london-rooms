const pool = require('../config/db');
const { uid, coordsForArea, mapRoom } = require('../utils/helpers');

async function getRooms(req, res) {
  const { search, maxPrice, type, billsIncluded, availableNow, sort, page, limit } = req.query;
  try {
    let query = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];
    let i = 1;

    if (search) {
      query += ` AND (LOWER(title) LIKE $${i} OR LOWER(area) LIKE $${i} OR LOWER(address) LIKE $${i})`;
      params.push(`%${search.toLowerCase()}%`); i++;
    }
    if (maxPrice) { query += ` AND price <= $${i}`; params.push(Number(maxPrice)); i++; }
    if (type) { query += ` AND type = $${i}`; params.push(type); i++; }
    if (billsIncluded === 'true') { query += ` AND bills_included = true`; }
    if (availableNow === 'true') { query += ` AND available_now = true`; }

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

    res.json({ items: paged, total, page: pageNum, totalPages: Math.max(1, Math.ceil(total / limitNum)) });
  } catch (e) {
    console.error('GET /api/rooms failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getSavedRooms(req, res) {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE $1 = ANY(saved_by)', [req.user.userId]);
    res.json(result.rows.map(mapRoom));
  } catch (e) {
    console.error('GET /api/rooms/saved failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function compareRooms(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No room ids provided' });
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = ANY($1)', [ids]);
    res.json(result.rows.map(mapRoom));
  } catch (e) {
    console.error('POST /api/rooms/compare failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getRoom(req, res) {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Room not found' });
    res.json(mapRoom(result.rows[0]));
  } catch (e) {
    console.error('GET /api/rooms/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createRoom(req, res) {
  if (req.user.role !== 'landlord') return res.status(403).json({ error: 'Only landlords can list rooms' });
  const { title, description, price, area, address, type, billsIncluded, availableNow } = req.body;
  if (!title || !description || !price || !area || !address)
    return res.status(400).json({ error: 'Please fill in all required fields' });

  const [lat, lng] = coordsForArea(area);
  const id = uid();
  const image = req.file ? '/uploads/' + req.file.filename : null;

  try {
    const result = await pool.query(
      'INSERT INTO rooms (id, title, description, price, area, address, type, bills_included, available_now, landlord_id, landlord_name, lat, lng, image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
      [id, title, description, Number(price), area, address, type || 'Double',
       billsIncluded === 'true' || billsIncluded === true,
       !(availableNow === 'false' || availableNow === false),
       req.user.userId, req.user.name, lat, lng, image]
    );
    res.status(201).json(mapRoom(result.rows[0]));
  } catch (e) {
    console.error('POST /api/rooms failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateRoom(req, res) {
  const { title, description, price, area, address, type, billsIncluded, availableNow, removeImage } = req.body;
  if (!title || !description || !price || !area || !address)
    return res.status(400).json({ error: 'Please fill in all required fields' });

  try {
    const existing = await pool.query('SELECT * FROM rooms WHERE id=$1 AND landlord_id=$2', [req.params.id, req.user.userId]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Room not found or not yours' });

    const [lat, lng] = area !== existing.rows[0].area ? coordsForArea(area) : [existing.rows[0].lat, existing.rows[0].lng];
    let image = existing.rows[0].image;
    if (req.file) image = '/uploads/' + req.file.filename;
    else if (removeImage === 'true') image = null;

    const result = await pool.query(
      'UPDATE rooms SET title=$1,description=$2,price=$3,area=$4,address=$5,type=$6,bills_included=$7,available_now=$8,lat=$9,lng=$10,image=$11 WHERE id=$12 RETURNING *',
      [title, description, Number(price), area, address, type,
       billsIncluded === 'true' || billsIncluded === true,
       !(availableNow === 'false' || availableNow === false),
       lat, lng, image, req.params.id]
    );
    res.json(mapRoom(result.rows[0]));
  } catch (e) {
    console.error('PUT /api/rooms/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteRoom(req, res) {
  try {
    const result = await pool.query('DELETE FROM rooms WHERE id=$1 AND landlord_id=$2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Room not found or not yours' });
    res.json({ message: 'Room deleted' });
  } catch (e) {
    console.error('DELETE /api/rooms/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function toggleSaveRoom(req, res) {
  try {
    const result = await pool.query('SELECT saved_by FROM rooms WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Room not found' });
    const savedBy = result.rows[0].saved_by || [];
    const already = savedBy.includes(req.user.userId);
    const newSaved = already ? savedBy.filter(id => id !== req.user.userId) : [...savedBy, req.user.userId];
    await pool.query('UPDATE rooms SET saved_by=$1 WHERE id=$2', [newSaved, req.params.id]);
    res.json({ saved: !already });
  } catch (e) {
    console.error('POST /api/rooms/:id/save failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getRooms, getSavedRooms, compareRooms, getRoom,
  createRoom, updateRoom, deleteRoom, toggleSaveRoom
};