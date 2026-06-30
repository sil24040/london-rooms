# System Architecture

## Overview

London Rooms follows a traditional three-tier architecture consisting of a client application, a REST API backend, and a cloud-hosted PostgreSQL database. Separating responsibilities between each layer improves maintainability, scalability, and security.

---

## Architecture Diagram

```text
                     +-----------------------+
                     |     User Browser      |
                     | HTML / CSS / JS       |
                     +-----------+-----------+
                                 |
                           HTTPS Requests
                                 |
                                 v
                +-------------------------------+
                |      Frontend (Render)        |
                | Static HTML/CSS/JavaScript    |
                +---------------+---------------+
                                |
                          REST API Requests
                                |
                                v
                +-------------------------------+
                |    Express Backend (Render)   |
                |-------------------------------|
                | Routing                       |
                | Business Logic                |
                | Authentication                |
                | Input Validation              |
                +---------------+---------------+
                                |
                     Supabase JavaScript Client
                                |
                                v
                +-------------------------------+
                |          Supabase             |
                |-------------------------------|
                | PostgreSQL Database           |
                | Authentication                |
                | Row-Level Security            |
                +---------------+---------------+
                                |
                                v
                     Listings • Users • Data
```

---

## Data Flow

1. A user interacts with the frontend in their browser.
2. The frontend sends HTTP requests to the Express backend.
3. Express validates the request and executes business logic.
4. Express communicates with Supabase using the Supabase client.
5. Supabase reads or writes data in the PostgreSQL database.
6. The backend returns a JSON response.
7. The frontend updates the user interface.

---

## Infrastructure

### Frontend

Hosted on **Render**.

Responsibilities include:

- Rendering the user interface
- Collecting user input
- Sending API requests
- Displaying responses

### Backend

Hosted on **Render**.

Responsibilities include:

- REST API endpoints
- Business logic
- Authentication
- Database communication
- Error handling

### Database

Hosted by **Supabase**.

Responsibilities include:

- PostgreSQL database
- User authentication
- Secure data storage
- Persistent application data

---

## Communication

All communication between the browser, backend, and database occurs over HTTPS.

The backend communicates with Supabase through the official JavaScript client library, which securely manages database operations and authentication.