# Data Model Documentation

## Database Overview

The application uses Supabase as the hosted PostgreSQL database.

The database stores room listings, user authentication information, and relationships between users and listings.

---

# Entity Relationship Diagram (ERD)

Current database design:

```
User
 |
 | 1-to-many
 |
Listing
```

---

# Entities

## User

Managed through Supabase Authentication.

Fields:

| Field      | Type      | Constraints             |
| ---------- | --------- | ----------------------- |
| id         | UUID      | Primary Key             |
| email      | String    | Unique                  |
| created_at | Timestamp | Automatically generated |

---

## Listing

Stores available room rental information.

Fields:

| Field       | Type      | Constraints             |
| ----------- | --------- | ----------------------- |
| id          | UUID      | Primary Key             |
| user_id     | UUID      | Foreign Key → User      |
| title       | String    | Required                |
| description | Text      | Required                |
| location    | String    | Required                |
| price       | Number    | Must be greater than 0  |
| created_at  | Timestamp | Automatically generated |

---

# Relationships

## User → Listing

A single user can create multiple listings.

Relationship:

```
User (1) -------- (Many) Listing
```

The `user_id` field connects listings to their owners.

---

# Validation Rules

## User Validation

* Email addresses must be unique.
* Password requirements are handled by Supabase authentication.
* Users must authenticate before creating or modifying listings.

---

## Listing Validation

Required fields:

* Title
* Description
* Location
* Price

Constraints:

* Price cannot be negative.
* Listing ownership must match the authenticated user.
* Listing IDs must be unique.

---

# Future Database Improvements

Possible additions:

* Images table for room photos.
* Reviews table.
* Messaging table between renters and owners.
* User profile information.
* Favorites/saved listings.
