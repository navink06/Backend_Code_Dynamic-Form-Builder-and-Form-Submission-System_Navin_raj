 `backend/README.md`

```markdown
# Enterprise Dynamic Form Builder — Backend API

> Built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**, featuring zero-trust dynamic schema validation, automatic in-memory database fallback, streaming CSV exports, and horizontal scalability patterns.

---

### Step 1: Install Dependencies

From the repository root:

````bash
# Install backend dependencies
cd backend && npm install


### Step 2: Configure Environment Variables

 `backend/.env`
```bash
# In backend/ directory:
PORT=5000
NODE_ENV=development
MONGODB_URI= # Mongodb connect
JWT_SECRET=super_secret_jwt_key_dynamic_form_builder_4y_exp_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
````

### Step 3: Run the Application

**Terminal (Backend API):**

```bash
cd backend
npm start
```

_The server will start on `http://localhost:5000` and automatically seed default admin credentials and sample forms!_

---

## Admin Credentials

The database automatically seeds an administrator account upon launch:

- **Email**: `admin@formbuilder.com`
- **Password**: `Admin@12345`
- **Role**: `admin`

_(You may also register new administrator accounts via the `/register` route)._

---

## 🌟 Core Capabilities

### 1. Zero-Trust Independent Validation & Sanitization

- **Dynamic Schema Enforcement**: Independently re-validates every incoming submission against the stored form definition (`formValidationService.js`), checking required flags, data types, min/max lengths and ranges, regex formats, and allowed option sets across all 9 field types (`TEXT`, `EMAIL`, `NUMBER`, `PHONE`, `TEXTAREA`, `DATE`, `SELECT`, `RADIO`, `CHECKBOX`).
- **Payload Sanitization**: Strips unconfigured or extraneous fields from incoming payloads to prevent NoSQL injection and schema pollution.

### 2. Zero-Configuration Database Setup

- **Automatic In-Memory Fallback**: Ships with `mongodb-memory-server` integration. If `MONGODB_URI` is left blank, the server automatically spins up an embedded MongoDB instance and seeds default admin credentials and sample forms on startup.

### 3. Security & Resilience

- **Authentication & RBAC**: JWT Bearer token authentication and role-based access control protecting administrative routes.
- **Rate Limiting**: Configured via `express-rate-limit` (public submission endpoint capped at 120 requests per 15 minutes per IP).
- **HTTP Hardening**: Secured with `helmet` headers, strict CORS whitelisting, and centralized global error handling (`ApiError` / `ApiResponse`).

### 4. Streaming Exports & Analytics

- **Streaming CSV Export**: Memory-safe CSV generation powered by `json2csv`.
- **Form Statistics**: Aggregated submission metrics and automatic counter updates on submission creation/deletion.

---

## 📁 Folder Structure

```text
backend/
├── src/
│   ├── config/             # MongoDB connection manager with in-memory fallback
│   ├── constants/          # Supported field types, form statuses, and user roles
│   ├── controllers/        # Request handlers for Auth, Forms, and Submissions
│   ├── middlewares/        # JWT verification, rate limiters, global error handler
│   ├── models/             # Mongoose schemas (User, Form, Submission)
│   ├── routes/             # Express REST API route definitions
│   ├── services/           # Dynamic form validation engine & CSV export service
│   ├── utils/              # ApiError, ApiResponse, and initial database seeder
│   ├── app.js              # Express app configuration (Helmet, CORS, routes)
│   └── server.js           # HTTP server bootstrap & graceful shutdown handler
├── tests/                  # Automated test suite using Node's native test runner
├── .env
└── package.json



##  REST API Documentation

| Method   | Endpoint                                | Description                           | Auth Required         |
| -------- | --------------------------------------- | ------------------------------------- | --------------------- |
| `POST`   | `/api/auth/login`                       | Admin authentication                  | Public                |
| `POST`   | `/api/auth/register`                    | Create administrator account          | Public                |
| `GET`    | `/api/auth/me`                          | Fetch current authenticated user      | Bearer Token          |
| `GET`    | `/api/forms`                            | List all forms (paginated, filtered)  | Optional              |
| `POST`   | `/api/forms`                            | Create a new dynamic form             | Bearer Token          |
| `GET`    | `/api/forms/:id`                        | Get form definition (Admin or Public) | Optional              |
| `PUT`    | `/api/forms/:id`                        | Update form fields & metadata         | Bearer Token          |
| `DELETE` | `/api/forms/:id`                        | Delete form and cascade submissions   | Bearer Token          |
| `GET`    | `/api/forms/:id/stats`                  | Form submission analytics             | Bearer Token          |
| `POST`   | `/api/forms/:formId/submissions`        | Submit form response                  | Public (Rate Limited) |
| `GET`    | `/api/forms/:formId/submissions`        | List form submissions (paginated)     | Bearer Token          |
| `GET`    | `/api/forms/:formId/submissions/:id`    | View single submission details        | Bearer Token          |
| `DELETE` | `/api/forms/:formId/submissions/:id`    | Delete a single submission            | Bearer Token          |
| `GET`    | `/api/forms/:formId/submissions/export` | Download submissions as CSV           | Bearer Token          |

---
```
