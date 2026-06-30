# Deployment and Environment Setup Documentation

## Local Development Setup

## Prerequisites

Install:

* Node.js version 18+
* npm
* Supabase account
* Git

---

# Clone Repository

Clone the project:

```bash
git clone https://github.com/sil24040/london-rooms.git
```

Navigate into the project:

```bash
cd london-rooms
```

---

# Install Dependencies

Install project dependencies:

```bash
npm install
```

If frontend and backend dependencies are separated:

```bash
cd client
npm install

cd ../server
npm install
```

---

# Environment Variables

Create a `.env` file inside the server directory.

Required variables:

```env
PORT=

SUPABASE_URL=

SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
```

Do not commit `.env` files to GitHub.

---

# Running the Application

Start development mode:

```bash
npm run dev
```

Alternative:

```bash
npm start
```

The application should be available at:

```
http://localhost:3000
```

---

# Deployment

## Hosting

Frontend and backend deployment is handled through Render.

Database hosting:

```
Supabase PostgreSQL
```

Deployment process:

1. Push changes to GitHub.
2. Render automatically builds the application.
3. Environment variables are loaded from Render settings.
4. Application starts using the configured start command.

---

# CI/CD Status

## Current Status

Automated CI/CD:

```
TBD
```

---

## Recommended CI/CD Pipeline

Future implementation:

### Continuous Integration

Using GitHub Actions:

* Install dependencies.
* Run automated tests.
* Check code formatting.
* Verify successful builds.

### Continuous Deployment

After successful builds:

* Deploy automatically to Render.
* Generate deployment preview.
* Monitor production logs.

---

# Deployment Links

GitHub Repository:

```
https://github.com/sil24040/london-rooms
```

Render Deployment:

```
TBD
```

Supabase Project:

```
TBD
```
