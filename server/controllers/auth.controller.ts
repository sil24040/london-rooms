import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { JWT_SECRET, AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response): Promise<Response | void> {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'That email is already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email.toLowerCase(), hashed, role || 'tenant']
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.status(201).json({ token, user: { _id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e: any) {
    console.error('POST /api/auth/register failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req: Request, res: Response): Promise<Response | void> {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Wrong email or password' });
    }

    const token = jwt.sign({ userId: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { _id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e: any) {
    console.error('POST /api/auth/login failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    const userId = req.user?.userId;
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = result.rows[0];
    return res.json({ _id: u.id, name: u.name, email: u.email, role: u.role });
  } catch (e: any) {
    console.error('GET /api/auth/me failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  const { name, email, currentPassword, newPassword } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email?.includes('@')) return res.status(400).json({ error: 'Valid email is required' });

  try {
    const userId = req.user?.userId;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const u = result.rows[0];
    if (!u) return res.status(404).json({ error: 'User not found' });

    const emailLower = email.toLowerCase();
    if (emailLower !== u.email) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [emailLower]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'That email is already in use' });
      }
    }

    let hashedPw = u.password;
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Enter your current password' });
      if (!(await bcrypt.compare(currentPassword, u.password))) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }
      hashedPw = await bcrypt.hash(newPassword, 10);
    }

    await pool.query('UPDATE users SET name=$1, email=$2, password=$3 WHERE id=$4',
      [name.trim(), emailLower, hashedPw, userId]);
    await pool.query('UPDATE rooms SET landlord_name=$1 WHERE landlord_id=$2', [name.trim(), userId]);

    const token = jwt.sign({ userId: u.id, name: name.trim(), role: u.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { _id: u.id, name: name.trim(), email: emailLower, role: u.role } });
  } catch (e: any) {
    console.error('PUT /api/auth/profile failed:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Enter your password to confirm account deletion' });

  const userId = req.user?.userId;
  const client = await pool.connect();
  try {
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    const u = userResult.rows[0];
    if (!u) return res.status(404).json({ error: 'User not found' });
    if (!(await bcrypt.compare(password, u.password))) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    await client.query('BEGIN');

    if (u.role === 'landlord') {
      const roomsResult = await client.query('SELECT id FROM rooms WHERE landlord_id = $1', [u.id]);
      const roomIds = roomsResult.rows.map((r: any) => r.id);

      if (roomIds.length) {
        await client.query('DELETE FROM payments WHERE room_id = ANY($1)', [roomIds]);
        await client.query('DELETE FROM enquiries WHERE room_id = ANY($1)', [roomIds]);
        await client.query('UPDATE users SET rental_room_id = NULL WHERE rental_room_id = ANY($1)', [roomIds]);
      }
      await client.query('DELETE FROM rooms WHERE landlord_id = $1', [u.id]);
      await client.query('DELETE FROM enquiries WHERE landlord_id = $1', [u.id]);
    } else {
      await client.query('DELETE FROM payments WHERE tenant_id = $1', [u.id]);
      await client.query('DELETE FROM enquiries WHERE tenant_id = $1', [u.id]);
    }

    // Remove this user from any room's saved_by list, regardless of role
    await client.query('UPDATE rooms SET saved_by = array_remove(saved_by, $1) WHERE $1 = ANY(saved_by)', [u.id]);

    await client.query('DELETE FROM users WHERE id = $1', [u.id]);
    await client.query('COMMIT');

    return res.json({ message: 'Account deleted' });
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error('DELETE /api/auth/account failed:', e);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}