# ADR-0001: Selecting Supabase

## Status

Accepted

---

## Context

The project required a cloud-hosted relational database capable of storing room listings and user information while also supporting authentication. The solution needed to minimize infrastructure management so the team could focus on application development.

---

## Options Considered

### Supabase

Pros

- Managed PostgreSQL database
- Built-in authentication
- Free tier suitable for development
- Easy integration with Node.js
- Minimal server administration

Cons

- Free tier limitations
- Vendor-specific services

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

The team selected Supabase because it provides a managed PostgreSQL database with integrated authentication while requiring very little infrastructure management.

---

## Consequences

### Benefits

- Faster development
- Reliable cloud database
- Built-in authentication
- Relational database support

### Trade-offs

- Dependence on Supabase services
- Free-tier resource limitations