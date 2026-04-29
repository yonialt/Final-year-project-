# Auth Backend — Express + Prisma + PostgreSQL

A clean, production-ready Node.js REST API with JWT authentication and role-based access control.

---

## Tech Stack

| Layer        | Technology                     |
|--------------|--------------------------------|
| Runtime      | Node.js                        |
| Framework    | Express 4                      |
| ORM          | Prisma 5                       |
| Database     | PostgreSQL                     |
| Auth         | JWT (`jsonwebtoken`)           |
| Hashing      | bcryptjs                       |
| Validation   | express-validator              |

---

## Folder Structure

```
src/
├── app.js                    # Express app (middleware + routes)
├── server.js                 # Entry point (listen)
├── config/
│   ├── jwt.js                # Sign / verify helpers
│   └── prisma.js             # Singleton Prisma client
├── controllers/
│   └── auth.controller.js    # HTTP handlers (thin)
├── middleware/
│   ├── auth.middleware.js    # authenticate + authorize
│   ├── error.middleware.js   # Global error handler
│   └── validate.middleware.js# express-validator chains
├── routes/
│   └── auth.routes.js        # /auth/* route wiring
└── services/
    └── auth.service.js       # Business logic + DB calls

prisma/
├── schema.prisma             # Data model
└── seed.js                   # Initial data
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and set DATABASE_URL and JWT_SECRET
```

### 3. Run database migration
```bash
npm run db:migrate
# Prisma will prompt for a migration name, e.g. "init"
```

### 4. (Optional) Seed the database
```bash
npm run db:seed
# Creates an ACADEMIC_DEAN user: dean@university.edu / Admin@1234
```

### 5. Start the dev server
```bash
npm run dev
```

---

## API Reference

### `POST /auth/register`
Register a new user.

**Body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secret@99",
  "role": "STAFF"          // optional, defaults to STAFF
}
```

**201 Response**
```json
{
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "name": "Jane Doe", "email": "...", "role": "STAFF", "createdAt": "..." },
    "token": "<JWT>"
  }
}
```

---

### `POST /auth/login`
Login with email + password.

**Body**
```json
{
  "email": "jane@example.com",
  "password": "Secret@99"
}
```

**200 Response**
```json
{
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "<JWT>"
  }
}
```

---

### `GET /auth/me` 🔒
Get the authenticated user's profile.

**Headers**
```
Authorization: Bearer <JWT>
```

**200 Response**
```json
{
  "message": "Profile retrieved",
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "...", "createdAt": "...", "updatedAt": "..." }
  }
}
```

---

## Roles

| Role              | Description                     |
|-------------------|---------------------------------|
| `STAFF`           | Default role for new users      |
| `DEPARTMENT_HEAD` | Head of an academic department  |
| `ACADEMIC_DEAN`   | Dean-level access               |
| `RESOURCE_OFFICER`| Manages resource allocation     |
| `TECHNICIAN`      | Technical support staff         |

---

## Using the `authorize` Middleware

To protect any route by role, import and use the `authorize` factory:

```js
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Only ACADEMIC_DEAN and DEPARTMENT_HEAD can access this
router.get('/reports', authenticate, authorize('ACADEMIC_DEAN', 'DEPARTMENT_HEAD'), reportsController.list);
```

---

## Error Responses

All errors follow a consistent shape:

```json
{ "message": "Human-readable description" }
```

| Status | Meaning                              |
|--------|--------------------------------------|
| 401    | Missing / invalid / expired token    |
| 403    | Authenticated but insufficient role  |
| 404    | Resource not found                   |
| 409    | Email already registered             |
| 422    | Validation failed (+ `errors` array) |
| 500    | Internal server error                |
