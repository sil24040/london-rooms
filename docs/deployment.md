# Deployment and Environment Setup

## Production Site

Hosted site:

```text
https://crystalclearliving.solutions/
```

The application is deployed as a Node.js web application. Express serves both the public frontend and the API.

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Git
- Supabase PostgreSQL project

### Install Dependencies

From the project root:

```bash
cd server
npm install
```

### Environment Variables

Create `server/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=replace-with-a-long-random-secret
```

`DATABASE_URL` should point to the Supabase-hosted PostgreSQL database.

### Start the App

From `server/`:

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

Do not use a static-only local preview server for normal testing. The frontend depends on Express API routes under `/api`.

## Supabase Usage

Supabase is used as the hosted PostgreSQL database. Everything the app stores lives there:

- users
- room listings
- rent payment records
- enquiry messages between tenants and landlords
- booking requests
- notifications
- reviews

The backend connects directly to Supabase PostgreSQL through the `pg` package and runs SQL queries from the controllers. The app does not use Supabase Auth for login; authentication is handled by the Express backend with bcrypt password hashes and JWT sessions.

During development, the Supabase dashboard SQL Editor was used to:

- create tables as features were added
- inspect schema details while debugging
- manually correct development/demo data
- reassign demo rooms to real test accounts so landlord dashboards, enquiries, and bookings appeared under the right users

## Production Deployment Notes

Recommended Render-style configuration:

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Runtime | Node.js |

Required production environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`, if the host does not inject one automatically

## Static Files and Uploads

Express serves static files from `client/`, including:

- `landing.html`
- `index.html`
- `app.js`
- `i18n.js`
- `manifest.json`
- `sw.js`
- `uploads/*`

Room image uploads are written to `client/uploads`. If the production host uses an ephemeral filesystem, uploaded files can disappear across deploys or restarts. For long-term production use, move uploads to persistent disk storage or object storage.

## Health Checks

On startup, the server attempts a simple database query:

```sql
SELECT 1
```

If `DATABASE_URL` is missing or the database cannot be reached, the server logs an error.

## CI/CD

Current CI/CD status:

```text
Manual / host-managed deployment
```

Recommended future CI checks:

- install dependencies
- run JavaScript syntax checks
- run route/controller tests
- run accessibility and Lighthouse checks against a deployed preview
- verify database migrations or schema setup scripts
