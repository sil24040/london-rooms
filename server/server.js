require('dotenv').config();
const express = require('express');
const path = require('path');

const pool = require('./config/db');
const { uploadErrorHandler } = require('./middleware/upload');

const authRoutes = require('./routes/auth.routes');
const roomsRoutes = require('./routes/rooms.routes');
const enquiriesRoutes = require('./routes/enquiries.routes');
const rentalRoutes = require('./routes/rental.routes');
const offersRoutes = require("./routes/offers.routes");
const messagesRoutes = require('./routes/messages.routes');
const bookingRoutes = require('./routes/booking.routes');
const notificationRoutes = require('./routes/notification.routes');
const reviewsRoutes = require('./routes/reviews.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── LANDING PAGE AS HOMEPAGE ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/landing.html'));
});

// Serve static frontend files with browser caching for repeat visits.
app.use(express.static(path.join(__dirname, '../client'), {
  etag: true,
  maxAge: '7d',
  setHeaders(res, filePath) {
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
  } catch (e) {
    console.error('❌ Database connection FAILED:', e.message);
    console.error('    Full error:', e);
  }
});
