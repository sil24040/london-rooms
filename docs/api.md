# API Documentation

## Overview

The London Rooms application uses a RESTful API built with Node.js and Express.js. The API communicates with the Supabase PostgreSQL database to manage room rental listings and user data.

Base URL:

```
http://localhost:3000/api
```

Production URL:

```
TBD - Render deployment URL
```

---

# API Endpoints

## Listings

### GET /api/listings

Retrieves all available room listings.

### Authentication

Public endpoint.

### Request

No request body required.

Example:

```
GET /api/listings
```

### Success Response

Status Code:

```
200 OK
```

Example Response:

```json
[
  {
    "id": "123",
    "title": "Single Room in London",
    "location": "London",
    "price": 800
  }
]
```

---

## GET /api/listings/:id

Retrieves a single room listing by ID.

### Authentication

Public endpoint.

### Request

Example:

```
GET /api/listings/123
```

### Success Response

Status Code:

```
200 OK
```

Example Response:

```json
{
  "id": "123",
  "title": "Single Room in London",
  "location": "London",
  "price": 800
}
```

---

## POST /api/listings

Creates a new room listing.

### Authentication

Protected endpoint.

Only authenticated users can create listings.

### Request Body

Example:

```json
{
  "title": "Room Near University",
  "location": "London",
  "price": 750,
  "description": "Small furnished room"
}
```

### Success Response

Status Code:

```
201 Created
```

Example:

```json
{
  "message": "Listing created successfully",
  "listing": {
    "id": "456",
    "title": "Room Near University"
  }
}
```

---

## PUT /api/listings/:id

Updates an existing listing.

### Authentication

Protected endpoint.

Only the listing owner can modify their listing.

### Request Body

Example:

```json
{
  "price": 900,
  "description": "Updated room description"
}
```

### Success Response

Status Code:

```
200 OK
```

---

## DELETE /api/listings/:id

Deletes a room listing.

### Authentication

Protected endpoint.

Only authorized users can delete their own listings.

### Request

Example:

```
DELETE /api/listings/456
```

### Success Response

Status Code:

```
200 OK
```

---

# Authentication Requirements

| Endpoint                 | Public / Protected |
| ------------------------ | ------------------ |
| GET /api/listings        | Public             |
| GET /api/listings/:id    | Public             |
| POST /api/listings       | Protected          |
| PUT /api/listings/:id    | Protected          |
| DELETE /api/listings/:id | Protected          |

Authentication is handled through Supabase authentication services.

---

# Error Responses

Common API errors:

## 400 Bad Request

Returned when required fields are missing or invalid.

Example:

```json
{
  "error": "Invalid request data"
}
```

---

## 401 Unauthorized

Returned when a protected route is accessed without authentication.

Example:

```json
{
  "error": "Authentication required"
}
```

---

## 404 Not Found

Returned when a requested resource does not exist.

Example:

```json
{
  "error": "Listing not found"
}
```

---

## 500 Internal Server Error

Returned when an unexpected server error occurs.

Example:

```json
{
  "error": "Internal server error"
}
```
