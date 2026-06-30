# ADR-0002: Using an Express REST API

## Status

Accepted

---

## Context

The application required a backend capable of handling routing, business logic, authentication, and communication with the database while keeping the frontend simple.

---

## Options Considered

### Node.js + Express

Pros

- Lightweight
- Large ecosystem
- Easy REST API development
- Familiar technology

Cons

- Requires manual project organization

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

---

## Consequences

### Benefits

- Better separation of concerns
- Easier maintenance
- Improved security
- Scalable architecture

### Trade-offs

- Additional backend code
- More deployment complexity than a frontend-only application