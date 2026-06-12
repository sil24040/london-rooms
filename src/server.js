const express = require('express');
const fs      = require('fs');
const path    = require('path');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const multer  = require('multer');

const app        = express();
const PORT       = 3000;
const JWT_SECRET = 'londonrooms-secret-key';
const DB_FILE    = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

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

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const seed = {
      users: [],
      rooms: [
        { _id: 'r1', title: 'Bright double room in Hackney', description: 'Lovely double room in a shared house with 3 professionals. Modern kitchen, fast WiFi and a garden.', price: 750, area: 'Hackney, E8', address: 'Mare Street', type: 'Double', billsIncluded: true, availableNow: true, landlordId: 'demo', landlordName: 'Demo Landlord', savedBy: [], lat: 51.5396, lng: -0.0553, image: null, createdAt: Date.now() },
        { _id: 'r2', title: 'Large double — female household', description: 'Spacious double room in a clean quiet flat. 5 mins walk to Peckham Rye station. Zone 2.', price: 695, area: 'Peckham, SE15', address: 'Rye Lane', type: 'Double', billsIncluded: true, availableNow: true, landlordId: 'demo', landlordName: 'Demo Landlord', savedBy: [], lat: 51.4703, lng: -0.0702, image: null, createdAt: Date.now() - 1000 },
        { _id: 'r3', title: 'En-suite room in Shoreditch', description: 'Modern en-suite room in a boutique flat. Gym access included. Perfect for professionals.', price: 875, area: 'Shoreditch, E1', address: 'Bethnal Green Road', type: 'En-suite', billsIncluded: true, availableNow: true, landlordId: 'demo', landlordName: 'Demo Landlord', savedBy: [], lat: 51.5255, lng: -0.0729, image: null, createdAt: Date.now() - 2000 },
        { _id: 'r4', title: 'Cosy single room — best value', description: 'Compact but cosy single room. Pet-friendly, garden, 3 mins from Lewisham DLR.', price: 620, area: 'Lewisham, SE13', address: 'Loampit Vale', type: 'Single', billsIncluded: false, availableNow: true, landlordId: 'demo', landlordName: 'Demo Landlord', savedBy: [], lat: 51.4625, lng: -0.0119, image: null, createdAt: Date.now() - 3000 },
        { _id: 'r5', title: 'Double room in creative house', description: 'Room in a creative house share near Hackney Wick. Housemates work in design and tech. Big kitchen.', price: 800, area: 'Hackney Wick, E9', address: 'White Post Lane', type: 'Double', billsIncluded: true, availableNow: true, landlordId: 'demo', landlordName: 'Demo Landlord', savedBy: [], lat: 51.5390, lng: -0.0246, image: null, createdAt: Date.now() - 4000 },
        { _id: 'r6', title: 'Quiet double — Clapham South', description: 'Well-presented double room in a quiet professional flat. Close to Clapham South tube.', price: 725, area: 'Clapham, SW4', address: 'Clapham Park Road', type: 'Double', billsIncluded: true, availableNow: true, landlordId: 'demo', landlordName: 'Demo Landlord', savedBy: [], lat: 51.4536, lng: -0.1367, image: null, createdAt: Date.now() - 5000 },
        { _id: 'r7', title: 'Studio flat in Camden', description: 'Self-contained studio with your own kitchenette. 10 mins to Camden Market.', price: 1050, area: 'Camden, NW1', address: 'Kentish Town Road', type: 'Studio', billsIncluded: true, availableNow: false, landlordId: 'demo', landlordName: 'Demo Landlord', savedBy: [], lat: 51.5390, lng: -0.1426, image: null, createdAt: Date.now() - 6000 },
        { _id: 'r8', title: 'Double room near Brixton tube', description: 'Bright double in a well-kept Victorian terrace. Shared with 2 friendly professionals and a lovely garden.', price: 760, area: 'Brixton, SW2', address: 'Railton Road', type: 'Double', billsIncluded: true, availableNow: true, landlordId: 'demo', landlordName: 'Demo Landlord', savedBy: [], lat: 51.4543, lng: -0.1153, image: null, createdAt: Date.now() - 7000 },
      ],
      enquiries: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  db.rooms.forEach(r => { if (r.image === undefined) r.image = null; });
  db.enquiries.forEach(e => { if (e.reply === undefined) e.reply = null; });
  return db;
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

app.use(express.json());
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

  const db = readDB();
  if (db.users.find(u => u.email === email.toLowerCase()))
    return res.status(409).json({ error: 'That email is already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user   = { _id: uid(), name, email: email.toLowerCase(), password: hashed, role: role || 'tenant' };
  db.users.push(user);
  writeDB(db);

  const token = jwt.sign({ userId: user._id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const db   = readDB();
  const user = db.users.find(u => u.email === email.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Wrong email or password' });

  const token = jwt.sign({ userId: user._id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const db = readDB();
  const u = db.users.find(x => x._id === req.user.userId);
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({ _id: u._id, name: u.name, email: u.email, role: u.role });
});

// ── PROFILE ──
app.put('/api/auth/profile', authRequired, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const db = readDB();
  const u = db.users.find(x => x._id === req.user.userId);
  if (!u) return res.status(404).json({ error: 'User not found' });

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });

  const emailLower = email.toLowerCase();
  if (emailLower !== u.email && db.users.find(x => x.email === emailLower))
    return res.status(409).json({ error: 'That email is already in use' });

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Enter your current password to set a new one' });
    if (!(await bcrypt.compare(currentPassword, u.password)))
      return res.status(401).json({ error: 'Current password is incorrect' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    u.password = await bcrypt.hash(newPassword, 10);
  }

  u.name = name.trim();
  u.email = emailLower;

  // keep room/enquiry denormalised names in sync
  db.rooms.forEach(r => { if (r.landlordId === u._id) r.landlordName = u.name; });
  db.enquiries.forEach(e => {
    if (e.tenantId === u._id) e.tenantName = u.name;
    if (e.landlordId === u._id) e.landlordName = u.name;
  });

  writeDB(db);
  const token = jwt.sign({ userId: u._id, name: u.name, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { _id: u._id, name: u.name, email: u.email, role: u.role } });
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

app.get('/api/rooms', (req, res) => {
  const { search, maxPrice, type, billsIncluded, availableNow, sort, page, limit } = req.query;
  const db = readDB();
  let rooms = [...db.rooms];

  if (search) {
    const q = search.toLowerCase();
    rooms = rooms.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.area.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
    );
  }
  if (maxPrice)                    rooms = rooms.filter(r => r.price <= Number(maxPrice));
  if (type)                        rooms = rooms.filter(r => r.type === type);
  if (billsIncluded === 'true')    rooms = rooms.filter(r => r.billsIncluded);
  if (availableNow  === 'true')    rooms = rooms.filter(r => r.availableNow);

  if (sort === 'price_asc')        rooms.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc')  rooms.sort((a, b) => b.price - a.price);
  else if (sort === 'oldest')      rooms.sort((a, b) => a.createdAt - b.createdAt);
  else                             rooms.sort((a, b) => b.createdAt - a.createdAt);

  const total = rooms.length;
  const pageNum  = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || total || 1);
  const start = (pageNum - 1) * limitNum;
  const paged = (page || limit) ? rooms.slice(start, start + limitNum) : rooms;

  res.json({
    items: paged,
    total,
    page: pageNum,
    totalPages: Math.max(1, Math.ceil(total / limitNum)),
  });
});

app.get('/api/rooms/saved', authRequired, (req, res) => {
  const db = readDB();
  res.json(db.rooms.filter(r => r.savedBy.includes(req.user.userId)));
});

app.post('/api/rooms/compare', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No room ids provided' });
  const db = readDB();
  const rooms = db.rooms.filter(r => ids.includes(r._id));
  res.json(rooms);
});

app.get('/api/rooms/:id', (req, res) => {
  const db   = readDB();
  const room = db.rooms.find(r => r._id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

app.post('/api/rooms', authRequired, upload.single('image'), (req, res) => {
  if (req.user.role !== 'landlord')
    return res.status(403).json({ error: 'Only landlords can list rooms' });

  const { title, description, price, area, address, type, billsIncluded, availableNow } = req.body;
  if (!title || !description || !price || !area || !address)
    return res.status(400).json({ error: 'Please fill in all required fields' });

  const [lat, lng] = coordsForArea(area);

  const db   = readDB();
  const room = {
    _id: uid(), title, description, price: Number(price), area, address,
    type: type || 'Double',
    billsIncluded: billsIncluded === 'true' || billsIncluded === true,
    availableNow:  !(availableNow === 'false' || availableNow === false),
    landlordId:   req.user.userId,
    landlordName: req.user.name,
    savedBy: [],
    lat, lng,
    image: req.file ? '/uploads/' + req.file.filename : null,
    createdAt: Date.now(),
  };
  db.rooms.push(room);
  writeDB(db);
  res.status(201).json(room);
});

app.put('/api/rooms/:id', authRequired, upload.single('image'), (req, res) => {
  const db = readDB();
  const room = db.rooms.find(r => r._id === req.params.id && r.landlordId === req.user.userId);
  if (!room) return res.status(404).json({ error: 'Room not found or not yours' });

  const { title, description, price, area, address, type, billsIncluded, availableNow, removeImage } = req.body;
  if (!title || !description || !price || !area || !address)
    return res.status(400).json({ error: 'Please fill in all required fields' });

  if (area !== room.area) {
    const [lat, lng] = coordsForArea(area);
    room.lat = lat; room.lng = lng;
  }

  room.title = title;
  room.description = description;
  room.price = Number(price);
  room.area = area;
  room.address = address;
  room.type = type || room.type;
  room.billsIncluded = billsIncluded === 'true' || billsIncluded === true;
  room.availableNow  = !(availableNow === 'false' || availableNow === false);

  if (req.file) {
    room.image = '/uploads/' + req.file.filename;
  } else if (removeImage === 'true') {
    room.image = null;
  }

  writeDB(db);
  res.json(room);
});

app.delete('/api/rooms/:id', authRequired, (req, res) => {
  const db  = readDB();
  const idx = db.rooms.findIndex(r => r._id === req.params.id && r.landlordId === req.user.userId);
  if (idx === -1) return res.status(404).json({ error: 'Room not found or not yours' });
  db.rooms.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'Room deleted' });
});

app.post('/api/rooms/:id/save', authRequired, (req, res) => {
  const db   = readDB();
  const room = db.rooms.find(r => r._id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const uid2    = req.user.userId;
  const already = room.savedBy.includes(uid2);
  if (already) room.savedBy = room.savedBy.filter(id => id !== uid2);
  else         room.savedBy.push(uid2);
  writeDB(db);
  res.json({ saved: !already });
});

// ── ENQUIRIES ──
app.post('/api/enquiries/:roomId', authRequired, (req, res) => {
  if (req.user.role !== 'tenant')
    return res.status(403).json({ error: 'Only tenants can send enquiries' });

  const { message } = req.body;
  if (!message || message.trim().length < 5)
    return res.status(400).json({ error: 'Message must be at least 5 characters' });

  const db   = readDB();
  const room = db.rooms.find(r => r._id === req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const enquiry = {
    _id: uid(),
    roomId:       room._id,
    roomTitle:    room.title,
    roomArea:     room.area,
    roomPrice:    room.price,
    tenantId:     req.user.userId,
    tenantName:   req.user.name,
    landlordId:   room.landlordId,
    landlordName: room.landlordName,
    message:      message.trim(),
    reply:        null,
    status:       'pending',
    createdAt:    Date.now(),
  };
  db.enquiries.push(enquiry);
  writeDB(db);
  res.status(201).json(enquiry);
});

app.post('/api/enquiries/:id/reply', authRequired, (req, res) => {
  if (req.user.role !== 'landlord')
    return res.status(403).json({ error: 'Only landlords can reply' });

  const { reply } = req.body;
  if (!reply || reply.trim().length < 2)
    return res.status(400).json({ error: 'Reply must be at least 2 characters' });

  const db = readDB();
  const enquiry = db.enquiries.find(e => e._id === req.params.id && e.landlordId === req.user.userId);
  if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

  enquiry.reply = reply.trim();
  enquiry.status = 'replied';
  writeDB(db);
  res.json(enquiry);
});

app.get('/api/enquiries/mine', authRequired, (req, res) => {
  const db = readDB();
  const list = db.enquiries
    .filter(e => e.tenantId === req.user.userId)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(list);
});

app.get('/api/enquiries/received', authRequired, (req, res) => {
  const db = readDB();
  const list = db.enquiries
    .filter(e => e.landlordId === req.user.userId)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(list);
});

// ── ERROR HANDLER for multer ──
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`✅ LondonRooms running at http://localhost:${PORT}`);
  console.log(`📁 Data saved to: ${DB_FILE}`);
});