# LondonRooms

LondonRooms is a full-stack room rental web application for browsing, comparing, listing, booking, and managing rooms in London. It includes a public marketing landing page, an interactive room-search app, tenant and landlord dashboards, authentication, enquiries, booking requests, rent tracking, notifications, reviews, image uploads, and progressive web app support.

The frontend is a static HTML/CSS/JavaScript client served by an Express application. The backend exposes a JSON REST API and stores data in a hosted PostgreSQL database.

Production site:

```text
https://crystalclearliving.solutions/
```

## Tech Stack

- Frontend: HTML5, CSS3, vanilla JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL, hosted on Supabase
- Authentication: application-managed users, bcrypt password hashing, JWT sessions
- File uploads: Multer, stored under `client/uploads`
- Payments API: Stripe Payment Intents in test mode
- Messaging API: Resend transactional email
- Maps: Leaflet, lazy-loaded only when map views are opened
- Hosting target: Render

## Features

- Public landing page at `/`
- Interactive app at `/index.html`
- Browse rooms with search, filters, sorting, pagination, list view, and map view
- Compare up to four rooms
- Tenant and landlord account registration and sign-in
- Tenant saved rooms
- Landlord listing management with optional room photos
- Tenant enquiries and landlord replies
- Threaded messages attached to enquiries
- Booking requests with approve, reject, and cancel workflows
- Approved bookings can mark a room unavailable and set the tenant rental
- Tenant rent tracker with demo card payment recording
- Stripe test-mode rent payments
- Resend email notifications for enquiries, messages, bookings, and payment receipts
- In-app notifications for enquiries and bookings
- Room reviews from eligible tenants
- Profile updates, password changes, and account deletion
- Accessibility improvements including landmarks, focus styles, labeled dialogs, keyboard-closeable modals, and ARIA state
- PWA manifest and service worker asset caching

## Project Structure

```text
london-rooms/
  client/
    index.html          Interactive app shell
    landing.html        Public landing page
    app.js              Client application logic
    i18n.js             English and Portuguese UI strings
    manifest.json       PWA manifest
    sw.js               Service worker
    uploads/            Runtime room image uploads
  server/
    server.js           Express app entry point
    config/db.js        PostgreSQL connection pool
    controllers/        Route handlers and business logic
    middleware/         Auth and upload middleware
    routes/             API route definitions
    utils/helpers.js    Mappers, notifications, coordinate helpers
    package.json        Server dependencies and scripts
  docs/
    api.md
    architecture.md
    data-model.md
    deployment.md
    adr/
```

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL database, such as Supabase PostgreSQL
- A `server/.env` file with the required environment variables

## Installation

Install backend dependencies from the `server` folder:

```bash
cd server
npm install
```

## Environment Variables

Create `server/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=replace-with-a-long-random-secret
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
RESEND_API_KEY=re_your_key
EMAIL_FROM=LondonRooms <onboarding@resend.dev>
```

`DATABASE_URL` is required for the PostgreSQL connection. In this project it points to Supabase PostgreSQL. `JWT_SECRET` is optional in development, but should always be set in production.

Stripe and Resend keys are optional while developing, but the advanced API features need them:

- Stripe keys must be test-mode keys.
- Resend can use `onboarding@resend.dev` for early testing, or a verified domain sender.

## Running Locally

Start the Express server from the `server` folder:

```bash
npm run dev
```

or:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Use the Express URL rather than a static preview server. Static preview tools such as Live Server can display the HTML, but they do not provide the `/api` backend routes.

## API Overview

The API base path is:

```text
/api
```

Main route groups:

- `/api/auth` for registration, login, profile, and account deletion
- `/api/rooms` for room browsing, listing management, saved rooms, and compare
- `/api/enquiries` for enquiries, replies, and enquiry messages
- `/api/bookings` for booking requests and landlord decisions
- `/api/rental` for tenant rental selection and demo rent payments
- `/api/notifications` for notification inbox state
- `/api/reviews` for room reviews

See [docs/api.md](docs/api.md) for endpoint details.

## Documentation

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Data model](docs/data-model.md)
- [Deployment](docs/deployment.md)
- [Architecture decisions](docs/adr)

## Deployment

The app is designed to deploy as a single Render web service from the `server` folder. The Express server serves both frontend files and API routes.

See [docs/deployment.md](docs/deployment.md) for setup details.

## Notes

- Uploaded images are written to `client/uploads`. On ephemeral hosts, persistent uploads require a persistent disk or external object storage.
- The rent payment flow is a demo tracker only. It records month, amount, and card last four digits; it does not process real payments.
- Supabase is used as hosted PostgreSQL for users, rooms, payments, messages, bookings, notifications, and reviews. The backend connects directly and runs SQL queries through `pg`.
- Supabase SQL Editor was used during development to create tables, inspect schema issues, and fix demo data by hand when needed.
- Authentication is handled by the Express app, not Supabase Auth.
