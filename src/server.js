require('dotenv').config();
const express = require('express');
const path    = require('path');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const multer  = require('multer');
const { Pool } = require('pg');

const app        = express();
const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'londonrooms-secret-key';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Surface any unexpected pool errors instead of crashing silently
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const fs = require('fs');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

app.use(express.json());

// ── LANDING PAGE AS HOMEPAGE ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

app.use(express.static(path.join(__dirname, '../public')));

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Please sign in first' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please sign in again' });
  }
}

// ── AUTH ──
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'That email is already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email.toLowerCase(), hashed, role || 'tenant']
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { _id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error('POST /api/auth/register failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Wrong email or password' });

    const token = jwt.sign({ userId: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error('POST /api/auth/login failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.userId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({ _id: u.id, name: u.name, email: u.email, role: u.role });
  } catch (e) {
    console.error('GET /api/auth/me failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PROFILE ──
app.put('/api/auth/profile', authRequired, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email?.includes('@')) return res.status(400).json({ error: 'Valid email is required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    const u = result.rows[0];
    if (!u) return res.status(404).json({ error: 'User not found' });

    const emailLower = email.toLowerCase();
    if (emailLower !== u.email) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [emailLower]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'That email is already in use' });
    }

    let hashedPw = u.password;
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Enter your current password' });
      if (!(await bcrypt.compare(currentPassword, u.password)))
        return res.status(401).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      hashedPw = await bcrypt.hash(newPassword, 10);
    }

    await pool.query('UPDATE users SET name=$1, email=$2, password=$3 WHERE id=$4',
      [name.trim(), emailLower, hashedPw, req.user.userId]);
    await pool.query('UPDATE rooms SET landlord_name=$1 WHERE landlord_id=$2', [name.trim(), req.user.userId]);

    const token = jwt.sign({ userId: u.id, name: name.trim(), role: u.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: u.id, name: name.trim(), email: emailLower, role: u.role } });
  } catch (e) {
    console.error('PUT /api/auth/profile failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── ROOMS ──
const AREA_COORDS = {
  E1: [51.5180, -0.0700], E2: [51.5290, -0.0610], E8: [51.5390, -0.0550], E9: [51.5390, -0.0420],
  E14: [51.5070, -0.0190], E15: [51.5390, -0.0040], E17: [51.5810, -0.0150],
  N1: [51.5390, -0.1020], N16: [51.5630, -0.0750],
  NW1: [51.5390, -0.1430], NW3: [51.5560, -0.1780],
  SE1: [51.4980, -0.0900], SE13: [51.4620, -0.0120], SE15: [51.4700, -0.0700], SE10: [51.4810, -0.0090],
  SW2: [51.4540, -0.1150], SW4: [51.4620, -0.1380], SW9: [51.4660, -0.1140], SW15: [51.4620, -0.2160],
  W1: [51.5140, -0.1490], W10: [51.5200, -0.2150],
};
function coordsForArea(area) {
  const match = area.match(/([A-Z]{1,2}\d{1,2})/);
  if (match && AREA_COORDS[match[1]]) return AREA_COORDS[match[1]];
  return [51.509 + (Math.random()-0.5)*0.06, -0.118 + (Math.random()-0.5)*0.1];
}

function mapRoom(r) {
  return {
    _id: r.id, title: r.title, description: r.description, price: r.price,
    area: r.area, address: r.address, type: r.type,
    billsIncluded: r.bills_included, availableNow: r.available_now,
    landlordId: r.landlord_id, landlordName: r.landlord_name,
    savedBy: r.saved_by || [], lat: r.lat, lng: r.lng, image: r.image,
    createdAt: new Date(r.created_at).getTime()
  };
}

app.get('/api/rooms', async (req, res) => {
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
});

app.get('/api/rooms/saved', authRequired, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE $1 = ANY(saved_by)', [req.user.userId]);
    res.json(result.rows.map(mapRoom));
  } catch (e) {
    console.error('GET /api/rooms/saved failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/rooms/compare', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No room ids provided' });
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = ANY($1)', [ids]);
    res.json(result.rows.map(mapRoom));
  } catch (e) {
    console.error('POST /api/rooms/compare failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Room not found' });
    res.json(mapRoom(result.rows[0]));
  } catch (e) {
    console.error('GET /api/rooms/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/rooms', authRequired, upload.single('image'), async (req, res) => {
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
});

app.put('/api/rooms/:id', authRequired, upload.single('image'), async (req, res) => {
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
});

app.delete('/api/rooms/:id', authRequired, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM rooms WHERE id=$1 AND landlord_id=$2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Room not found or not yours' });
    res.json({ message: 'Room deleted' });
  } catch (e) {
    console.error('DELETE /api/rooms/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/rooms/:id/save', authRequired, async (req, res) => {
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
});

// ── ENQUIRIES ──
function mapEnquiry(e) {
  return {
    _id: e.id, roomId: e.room_id, roomTitle: e.room_title, roomArea: e.room_area, roomPrice: e.room_price,
    tenantId: e.tenant_id, tenantName: e.tenant_name,
    landlordId: e.landlord_id, landlordName: e.landlord_name,
    message: e.message, reply: e.reply, status: e.status,
    createdAt: new Date(e.created_at).getTime()
  };
}

app.post('/api/enquiries/:roomId', authRequired, async (req, res) => {
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
});

app.post('/api/enquiries/:id/reply', authRequired, async (req, res) => {
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
});

app.put('/api/enquiries/:id', authRequired, async (req, res) => {
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
});

app.delete('/api/enquiries/:id', authRequired, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM enquiries WHERE id=$1 AND tenant_id=$2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Enquiry not found or not yours' });
    res.json({ message: 'Enquiry deleted' });
  } catch (e) {
    console.error('DELETE /api/enquiries/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/enquiries/mine', authRequired, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM enquiries WHERE tenant_id=$1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows.map(mapEnquiry));
  } catch (e) {
    console.error('GET /api/enquiries/mine failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/enquiries/received', authRequired, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM enquiries WHERE landlord_id=$1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows.map(mapEnquiry));
  } catch (e) {
    console.error('GET /api/enquiries/received failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── RENTAL / PAYMENTS ──
app.post('/api/rental/set', authRequired, async (req, res) => {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can set a rental' });
  const { roomId } = req.body;
  try {
    await pool.query('UPDATE users SET rental_room_id=$1 WHERE id=$2', [roomId || null, req.user.userId]);
    res.json({ rentalRoomId: roomId || null });
  } catch (e) {
    console.error('POST /api/rental/set failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/rental/mine', authRequired, async (req, res) => {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants have rentals' });
  try {
    const userResult = await pool.query('SELECT rental_room_id FROM users WHERE id=$1', [req.user.userId]);
    const rentalRoomId = userResult.rows[0]?.rental_room_id;
    if (!rentalRoomId) return res.json({ room: null, payments: [] });

    const roomResult = await pool.query('SELECT * FROM rooms WHERE id=$1', [rentalRoomId]);
    if (!roomResult.rows[0]) return res.json({ room: null, payments: [] });

    const paymentsResult = await pool.query(
      'SELECT * FROM payments WHERE tenant_id=$1 AND room_id=$2 ORDER BY month ASC',
      [req.user.userId, rentalRoomId]
    );
    res.json({ room: mapRoom(roomResult.rows[0]), payments: paymentsResult.rows.map(p => ({
      _id: p.id, tenantId: p.tenant_id, roomId: p.room_id,
      month: p.month, amount: p.amount, cardLast4: p.card_last4,
      paidAt: new Date(p.paid_at).getTime()
    }))});
  } catch (e) {
    console.error('GET /api/rental/mine failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/rental/pay', authRequired, async (req, res) => {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can pay rent' });
  const { month, cardNumber, cardName, expiry, cvc } = req.body;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'Invalid month' });
  if (!cardName?.trim()) return res.status(400).json({ error: 'Cardholder name is required' });
  if (!cardNumber || !/^\d{12,19}$/.test(cardNumber.replace(/\s/g,''))) return res.status(400).json({ error: 'Enter a valid card number' });
  if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) return res.status(400).json({ error: 'Expiry must be MM/YY' });
  if (!cvc || !/^\d{3,4}$/.test(cvc)) return res.status(400).json({ error: 'Enter a valid CVC' });

  try {
    const userResult = await pool.query('SELECT rental_room_id FROM users WHERE id=$1', [req.user.userId]);
    const rentalRoomId = userResult.rows[0]?.rental_room_id;
    if (!rentalRoomId) return res.status(400).json({ error: 'No rental set' });

    const roomResult = await pool.query('SELECT price FROM rooms WHERE id=$1', [rentalRoomId]);
    if (!roomResult.rows[0]) return res.status(404).json({ error: 'Room not found' });

    const existing = await pool.query('SELECT id FROM payments WHERE tenant_id=$1 AND room_id=$2 AND month=$3',
      [req.user.userId, rentalRoomId, month]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'This month is already marked as paid' });

    const last4 = cardNumber.replace(/\s/g,'').slice(-4);
    const result = await pool.query(
      'INSERT INTO payments (tenant_id, room_id, month, amount, card_last4) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.userId, rentalRoomId, month, roomResult.rows[0].price, last4]
    );
    const p = result.rows[0];
    res.status(201).json({ _id: p.id, tenantId: p.tenant_id, roomId: p.room_id, month: p.month, amount: p.amount, cardLast4: p.card_last4, paidAt: new Date(p.paid_at).getTime() });
  } catch (e) {
    console.error('POST /api/rental/pay failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/rental/pay/:id', authRequired, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM payments WHERE id=$1 AND tenant_id=$2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Payment not found or not yours' });
    res.json({ message: 'Payment record deleted' });
  } catch (e) {
    console.error('DELETE /api/rental/pay/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── MULTER ERROR HANDLER ──
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.listen(PORT, async () => {
  console.log(`✅ LondonRooms running at http://localhost:${PORT}`);

  // Verify the database connection is actually working, and report honestly.
  if (!process.env.DATABASE_URL) {
    console.error('⚠️  DATABASE_URL is not set! Check your .env file and that dotenv is loaded.');
    return;
  }
  try {
    await pool.query('SELECT 1');
    console.log('🗄️  Database connected: Supabase PostgreSQL');
  } catch (e) {
    console.error('❌ Database connection FAILED:', e.message);
    console.error('    Full error:', e);
  }
});