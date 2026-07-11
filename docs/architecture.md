# System Architecture

## Overview

LondonRooms is a three-layer web application:

1. A static browser client in `client/`
2. A Node.js and Express API in `server/`
3. A hosted PostgreSQL database on Supabase

The Express server is the single runtime entry point. It serves the public landing page, static frontend assets, uploaded images, the service worker, and all `/api` routes.

Production site:

```text
https://crystalclearliving.solutions/
```

## Runtime Diagram

```text
User browser
  |
  | GET /, /index.html, /app.js, /manifest.json, /uploads/*
  | POST/GET/PUT/DELETE /api/*
  v
Express server
  |
  | Static file serving
  | REST route dispatch
  | JWT authentication
  | Multer uploads
  | Business rules
  v
Supabase PostgreSQL database
  |
  | users, rooms, enquiries, messages, bookings,
  | payments, notifications, reviews
```

## Frontend

The frontend uses plain HTML, CSS, and JavaScript.

Important files:

- `client/landing.html`: public marketing page served at `/`
- `client/index.html`: main application shell
- `client/app.js`: page switching, API calls, room rendering, dashboards, forms, modals, maps, notifications, and payment tracker UI
- `client/i18n.js`: English and Portuguese labels
- `client/manifest.json`: PWA metadata
- `client/sw.js`: service worker asset cache

The app uses client-side page sections rather than a frontend router. `showPage()` switches visible sections, updates active nav state, and loads page data as needed.

## Backend

The backend is an Express app in `server/server.js`.

Responsibilities:

- Serve the landing page at `/`
- Serve static files from `client/`
- Expose JSON API routes under `/api`
- Authenticate protected routes with JWT bearer tokens
- Hash passwords with bcrypt
- Store and validate uploaded room images with Multer
- Query Supabase PostgreSQL directly through the `pg` connection pool
- Send notification records after key actions
- Return consistent JSON error objects

## API Route Groups

- `/api/auth`: registration, login, current user, profile update, account deletion
- `/api/rooms`: browse, filter, compare, save, create, update, delete
- `/api/enquiries`: tenant enquiries, landlord replies, threaded messages, unread message count
- `/api/bookings`: booking requests, received bookings, approval, rejection, cancellation
- `/api/rental`: tenant rental room, payment tracker records
- `/api/notifications`: notification inbox and read state
- `/api/reviews`: room review creation, retrieval, update, deletion

## Authentication

Authentication is application-managed:

- Users are stored in the `users` table.
- Passwords are hashed with bcrypt.
- Login and registration issue JWTs signed with `JWT_SECRET`.
- Protected routes require `Authorization: Bearer <token>`.
- JWT payloads include `userId`, `name`, and `role`.

Supabase is used for database hosting, not for Supabase Auth.

Roles:

- `tenant`: can save rooms, send enquiries, request bookings, set a rental, record rent payments, and review eligible rooms.
- `landlord`: can create and manage listings, reply to enquiries, and approve or reject bookings.

## Data Flow

Example room browse flow:

1. Browser loads `/index.html`.
2. `client/app.js` calls `GET /api/rooms` with filters and pagination.
3. Express routes the request to `rooms.controller.getRooms`.
4. The controller builds a PostgreSQL query, maps database rows to frontend objects, and returns JSON.
5. The browser renders room cards or map markers.

During development, the Supabase dashboard SQL Editor was also used to create tables, inspect schema issues, and manually correct demo data when needed.

Example booking approval flow:

1. Tenant submits `POST /api/bookings/:roomId`.
2. Landlord sees the request under received bookings.
3. Landlord approves with `PUT /api/bookings/:id/approve`.
4. The backend marks the booking approved, rejects other pending requests for that room, marks the room unavailable, sets the tenant's rental room, and creates notifications.

## Files and Uploads

Room photos are accepted through `multipart/form-data` on room create and update endpoints. Multer stores accepted image files in `client/uploads` and exposes them through Express static file serving.

Accepted image MIME types:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

Maximum file size: 4 MB.

## Performance and Accessibility

Recent frontend improvements include:

- A single `main` landmark on both public pages
- Skip links
- Visible focus styles
- Larger touch targets
- Labeled modal dialogs
- Escape-to-close and focus restoration for modals
- ARIA state for navigation, language selection, view toggles, and notifications
- Lazy loading of Leaflet map assets
- Removal of eager third-party analytics script loading
- Service worker caching for local shell assets
- HTTP caching for static assets served by Express

## Deployment Model

The application should be deployed as one Node.js web service from the `server` folder. The frontend does not need a separate static host because Express serves `client/`.
