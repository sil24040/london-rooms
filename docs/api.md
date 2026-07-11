# API Documentation

## Overview

LondonRooms exposes a REST API from the Express server under:

```text
/api
```

Local base URL:

```text
http://localhost:3000/api
```

Production base URL:

```text
https://crystalclearliving.solutions/api
```

All request and response bodies are JSON unless noted. Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

Common error response:

```json
{
  "error": "Message describing the problem"
}
```

## Authentication

### POST `/api/auth/register`

Creates a tenant or landlord account.

Body:

```json
{
  "name": "Jane Tenant",
  "email": "jane@example.com",
  "password": "password123",
  "role": "tenant"
}
```

Response: `201 Created`

```json
{
  "token": "jwt-token",
  "user": {
    "_id": "user-id",
    "name": "Jane Tenant",
    "email": "jane@example.com",
    "role": "tenant"
  }
}
```

### POST `/api/auth/login`

Signs in an existing user.

Body:

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

Response: `200 OK`

```json
{
  "token": "jwt-token",
  "user": {
    "_id": "user-id",
    "name": "Jane Tenant",
    "email": "jane@example.com",
    "role": "tenant"
  }
}
```

### GET `/api/auth/me`

Protected. Returns the current user.

### PUT `/api/auth/profile`

Protected. Updates name, email, and optionally password.

Body:

```json
{
  "name": "Jane Tenant",
  "email": "jane@example.com",
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

`currentPassword` and `newPassword` are only required when changing password.

### DELETE `/api/auth/account`

Protected. Deletes the current account and related data.

Body:

```json
{
  "password": "password123"
}
```

## Rooms

### GET `/api/rooms`

Public. Returns rooms with optional filters, sorting, and pagination.

Query parameters:

| Parameter | Description |
| --- | --- |
| `search` | Matches title, area, or address |
| `maxPrice` | Maximum monthly price |
| `type` | Room type, such as `Double`, `Single`, `En-suite`, `Studio` |
| `billsIncluded` | `true` to show only bills-included rooms |
| `availableNow` | `true` to show only currently available rooms |
| `sort` | `newest`, `oldest`, `price_asc`, or `price_desc` |
| `page` | Page number |
| `limit` | Items per page |

Response:

```json
{
  "items": [
    {
      "_id": "room-id",
      "title": "Bright double room",
      "description": "Large furnished room",
      "price": 750,
      "area": "Hackney, E8",
      "address": "Mare Street",
      "type": "Double",
      "billsIncluded": true,
      "availableNow": true,
      "landlordId": "user-id",
      "landlordName": "Sam Landlord",
      "savedBy": [],
      "lat": 51.539,
      "lng": -0.055,
      "image": "/uploads/example.webp",
      "createdAt": 1760000000000
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### GET `/api/rooms/:id`

Public. Returns one room.

### GET `/api/rooms/saved`

Protected tenant endpoint. Returns rooms saved by the current user.

### POST `/api/rooms/compare`

Public. Returns room records for selected IDs.

Body:

```json
{
  "ids": ["room-id-1", "room-id-2"]
}
```

### POST `/api/rooms`

Protected landlord endpoint. Creates a room.

Content type: `multipart/form-data`

Fields:

| Field | Required | Notes |
| --- | --- | --- |
| `title` | Yes | Room title |
| `description` | Yes | Room description |
| `price` | Yes | Monthly price |
| `area` | Yes | Area and postcode |
| `address` | Yes | Street or address |
| `type` | No | Defaults to `Double` |
| `billsIncluded` | No | Boolean |
| `availableNow` | No | Boolean, defaults true |
| `image` | No | JPEG, PNG, WebP, or GIF up to 4 MB |

### PUT `/api/rooms/:id`

Protected landlord endpoint. Updates a room owned by the current landlord. Uses the same `multipart/form-data` shape as create. Include `removeImage=true` to remove the current photo.

### DELETE `/api/rooms/:id`

Protected landlord endpoint. Deletes a room owned by the current landlord.

### POST `/api/rooms/:id/save`

Protected tenant endpoint. Toggles the current user in the room's saved list.

Response:

```json
{
  "saved": true
}
```

## Enquiries and Messages

### POST `/api/enquiries/:roomId`

Protected tenant endpoint. Sends an enquiry about a room.

Body:

```json
{
  "message": "Hi, is this room still available?"
}
```

### GET `/api/enquiries/mine`

Protected tenant endpoint. Returns enquiries sent by the current tenant.

### GET `/api/enquiries/received`

Protected landlord endpoint. Returns enquiries received by the current landlord.

### POST `/api/enquiries/:id/reply`

Protected landlord endpoint. Adds a simple reply to an enquiry and marks it replied.

Body:

```json
{
  "reply": "Yes, it is still available."
}
```

### PUT `/api/enquiries/:id`

Protected tenant endpoint. Edits an unreplied enquiry owned by the current tenant.

### DELETE `/api/enquiries/:id`

Protected tenant endpoint. Deletes an enquiry owned by the current tenant.

### GET `/api/enquiries/:id/messages`

Protected tenant or landlord endpoint. Returns threaded messages for an enquiry and marks unread messages as read by the current user.

### POST `/api/enquiries/:id/messages`

Protected tenant or landlord endpoint. Sends a threaded message.

Body:

```json
{
  "body": "Could I view it this weekend?"
}
```

### GET `/api/enquiries/unread`

Protected. Returns unread threaded message count for the current user.

```json
{
  "count": 2
}
```

## Bookings

### POST `/api/bookings/:roomId`

Protected tenant endpoint. Requests to book a room.

Body:

```json
{
  "message": "I am ready to move in next month."
}
```

### GET `/api/bookings/mine`

Protected tenant endpoint. Returns the current tenant's booking requests.

### GET `/api/bookings/received`

Protected landlord endpoint. Returns booking requests received by the current landlord.

### PUT `/api/bookings/:id/approve`

Protected landlord endpoint. Approves a pending booking. Approval also rejects other pending requests for the room, marks the room unavailable, assigns the room to the tenant, and creates notifications.

### PUT `/api/bookings/:id/reject`

Protected landlord endpoint. Rejects a pending booking.

### DELETE `/api/bookings/:id`

Protected tenant endpoint. Cancels a pending booking owned by the tenant.

## Rental and Payments

### POST `/api/rental/set`

Protected tenant endpoint. Sets or clears the current tenant's rental room.

Body:

```json
{
  "roomId": "room-id"
}
```

Use `null` or omit `roomId` to clear the rental.

### GET `/api/rental/mine`

Protected tenant endpoint. Returns the current rental room and payment records.

### POST `/api/rental/pay`

Protected tenant endpoint. Records a demo rent payment for the current rental room.

Body:

```json
{
  "month": "2026-07",
  "cardName": "Jane Tenant",
  "cardNumber": "4242424242424242",
  "expiry": "12/30",
  "cvc": "123"
}
```

This does not process real payments. It records the room price and card last four digits.

### DELETE `/api/rental/pay/:id`

Protected tenant endpoint. Deletes a payment record owned by the current tenant.

## Notifications

### GET `/api/notifications`

Protected. Returns the current user's latest notifications and unread count.

```json
{
  "items": [],
  "unreadCount": 0
}
```

### PUT `/api/notifications/:id/read`

Protected. Marks one notification as read.

### PUT `/api/notifications/read-all`

Protected. Marks all current user notifications as read.

## Reviews

### GET `/api/reviews/room/:roomId`

Public. Returns reviews for a room, plus average and count.

```json
{
  "items": [],
  "average": 0,
  "count": 0
}
```

### GET `/api/reviews/mine/:roomId`

Protected tenant endpoint. Returns the current tenant's review for a room, or `null`.

### POST `/api/reviews/:roomId`

Protected tenant endpoint. Creates or updates a review. The tenant must either have an approved booking for the room or have it set as their rental.

Body:

```json
{
  "rating": 5,
  "comment": "Great room and responsive landlord."
}
```

### DELETE `/api/reviews/:id`

Protected tenant endpoint. Deletes a review owned by the current tenant.

## Status Codes

Common status codes:

| Code | Meaning |
| --- | --- |
| `200` | Request succeeded |
| `201` | Resource created |
| `400` | Missing or invalid input |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not allowed |
| `404` | Resource not found |
| `409` | Conflict, such as duplicate account or duplicate pending request |
| `500` | Unexpected server error |
