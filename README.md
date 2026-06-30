# London Rooms

London Rooms is a full-stack web application that allows users to browse and manage room rental listings throughout London. The project was developed as part of WDD 430 to demonstrate modern web development practices using a cloud-hosted PostgreSQL database, RESTful API architecture, and continuous deployment.

The application separates the frontend, backend, and database into independent services, making it easier to develop, maintain, and deploy.

---

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- Supabase

### Hosting
- Render

---

## Features

- Browse available room listings
- View listing details
- User authentication
- Create, edit, and delete listings (authorized users)
- Responsive interface
- Persistent cloud database
- RESTful API

---

## Project Structure

```
london-rooms/
│
├── client/            # Frontend files
├── server/            # Express backend
├── docs/
│   ├── architecture.md
│   └── adr/
├── package.json
└── README.md
```

---

## Prerequisites

Before running the project, install:

- Node.js (v18 or newer recommended)
- npm
- A Supabase project
- A Render account (for deployment)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/sil24040/london-rooms.git
```

Navigate into the project directory:

```bash
cd london-rooms
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file inside the server directory.

Example:

```env
PORT=3000

SUPABASE_URL=your_supabase_url

SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Running the Project

Start the development server:

```bash
npm run dev
```

or

```bash
npm start
```

depending on the available scripts.

Open:

```
http://localhost:3000
```

---

## API Overview

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | /api/listings | Retrieve all listings |
| GET | /api/listings/:id | Retrieve one listing |
| POST | /api/listings | Create a listing |
| PUT | /api/listings/:id | Update a listing |
| DELETE | /api/listings/:id | Delete a listing |

---

## Deployment

The application is deployed using Render.

Supabase provides the hosted PostgreSQL database and authentication services.

Deployment documentation can be found in the `/docs` directory.

---

## Documentation

Additional project documentation includes:

- System Architecture
- Architecture Decision Records (ADRs)
- API Documentation
- Deployment Documentation

---

## Future Improvements

Possible future enhancements include:

- Role-based access control
- Payment integration
- Messaging between users
- CI/CD automation
- Expanded accessibility improvements