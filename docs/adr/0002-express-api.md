# ADR-0002: Using an Express REST API

## Status

Accepted

---

## Context

The application required a backend capable of handling routing, business logic, authentication, file uploads, notifications, and direct SQL communication with the database while keeping the frontend simple.

---

## Options Considered

### Node.js + Express

Pros

- Lightweight
- Large ecosystem
- Easy REST API development
- Familiar technology
- Works well with `pg`, bcrypt, JWT, and Multer

Cons

- Requires manual project organization
- More responsibility for validation and security

### Direct Frontend-to-Database Access

Pros

- Less backend code
- Simpler architecture

Cons

- Reduced security
- Business logic exposed to the client
- Harder to maintain

---

## Decision

The team selected Node.js with Express as the backend framework. This keeps business logic separate from the frontend while providing a secure layer between users and the database.

The Express backend owns:

- application authentication with bcrypt and JWT
- room listing workflows
- enquiry and message workflows
- booking approvals and rejections
- rent tracker records
- notification creation
- review eligibility checks
- image upload validation

---

## Consequences

### Benefits

- Better separation of concerns
- Easier maintenance
- Improved security
- Scalable architecture
- Frontend can stay static and simple

### Trade-offs

- Additional backend code
- More deployment complexity than a frontend-only application
- Schema and route changes need to stay documented as features grow
