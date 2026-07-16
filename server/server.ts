import dotenv from 'dotenv';
// Load environment variables immediately before any other code executes
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';

// Import our DB Pool
import pool from './config/db';
import { uploadErrorHandler } from './middleware/upload';

// Import our API routes
import authRoutes from './routes/auth.routes';
import roomsRoutes from './routes/rooms.routes';
import enquiriesRoutes from './routes/enquiries.routes';
import rentalRoutes from './routes/rental.routes';
import offersRoutes from './routes/offers.routes';
import messagesRoutes from './routes/messages.routes';
import bookingRoutes from './routes/booking.routes';
import notificationRoutes from './routes/notification.routes';
import reviewsRoutes from './routes/reviews.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── LANDING PAGE AS HOMEPAGE ──
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../client/landing.html'));
});

// Serve static frontend files with browser caching for repeat visits.
app.use(express.static(path.join(__dirname, '../client'), {
  etag: true,
  maxAge: '7d',
  setHeaders(res: Response, filePath: string) {
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// ── API ROUTES ──
app.use("/api/enquiries", messagesRoutes);
app.use("/api/offers", offersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/rental', rentalRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewsRoutes);

// ── MULTER / UPLOAD ERROR HANDLER ──
app.use(uploadErrorHandler);

// ── START SERVER + VERIFY DB CONNECTION ──
app.listen(PORT, async () => {
  console.log(`✅ LondonRooms running at http://localhost:${PORT}`);

  if (!process.env.DATABASE_URL) {
    console.error('⚠️  DATABASE_URL is not set! Check your .env file and that dotenv is loaded.');
    return;
  }
  try {
    await pool.query('SELECT 1');
    console.log('🗄️  Database connected: Supabase PostgreSQL');
  } catch (e: any) {
    console.error('❌ Database connection FAILED:', e.message);
    console.error('    Full error:', e);
  }
});