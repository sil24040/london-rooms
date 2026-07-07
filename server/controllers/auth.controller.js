const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
 
async function register(req, res) {
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
}
 
async function login(req, res) {
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
}
 
async function me(req, res) {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.userId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({ _id: u.id, name: u.name, email: u.email, role: u.role });
  } catch (e) {
    console.error('GET /api/auth/me failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}
 
async function updateProfile(req, res) {
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
}
 
module.exports = { register, login, me, updateProfile };