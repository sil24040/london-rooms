# ADR-0001: Selecting Supabase

## Status

Accepted

---

## Context

The project required a cloud-hosted relational database capable of storing users, room listings, payments, tenant-landlord messages, bookings, notifications, and reviews. The solution needed to minimize infrastructure management so the team could focus on application features.

---

## Options Considered

### Supabase

Pros

- Managed PostgreSQL database
- SQL Editor available in the dashboard
- Free tier suitable for development
- Easy integration with Node.js through direct PostgreSQL connections
- Minimal server administration

Cons

- Free tier limitations
- Vendor-specific services
- Manual schema changes can become hard to track without migrations

### Self-Hosted PostgreSQL

Pros

- Complete control
- Highly customizable

Cons

- Requires server administration
- More deployment complexity

### MongoDB Atlas

Pros

- Flexible schema
- Managed cloud service

Cons

- Less appropriate for relational rental data
- More complex querying for relationships

---

## Decision

The team selected Supabase because it provides managed PostgreSQL while requiring very little infrastructure management. The backend connects directly with the `pg` package and runs SQL queries from Express controllers.

Supabase Auth is not used by the current app. Authentication is handled in the backend with a `users` table, bcrypt password hashes, and JWT sessions.

The Supabase dashboard SQL Editor was used during development to create tables as features were added, check schema details while debugging, and manually fix demo data when needed.

---

## Consequences

### Benefits

- Faster development
- Reliable cloud database
- Direct SQL access from the backend
- Convenient SQL Editor for schema and data inspection
- Relational database support

### Trade-offs

- Dependence on Supabase services
- Free-tier resource limitations
- Schema changes currently depend on manual SQL rather than versioned migrations
