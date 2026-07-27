# Car Service & Repair Booking System - Backend API

A secure, role-based backend system for managing car service shops, bookings, users, and permissions. Built as a backend assessment task demonstrating JWT authentication, dynamic role/permission-based authorization, file uploads, and a full MVC architecture.

## Tech Stack

- **Node.js** + **Express.js** - server and routing
- **MongoDB** + **Mongoose** - database and ODM
- **JWT (jsonwebtoken)** - authentication (access + refresh tokens)
- **bcrypt** - password hashing
- **Multer** - file uploads (shop documents/logos)
- **express-validator** - request input validation
- **dotenv** - environment configuration
- **nodemon** - development auto-restart

## Project Structure

```
car-service-booking-system/
├── config/
│   └── db.js                    # MongoDB connection setup
├── controllers/
│   ├── authController.js        # Auth logic (register, login, OTP flow, etc.)
│   ├── roleController.js        # Role CRUD + permission assignment
│   ├── permissionController.js  # Permission CRUD
│   ├── userController.js        # User management (admin CRUD)
│   └── shopController.js        # Shop registration & approval workflow
├── middlewares/
│   ├── authMiddleware.js        # JWT verification ("protect")
│   ├── authorizeMiddleware.js   # Dynamic permission checking ("authorize")
│   ├── uploadMiddleware.js      # Multer file upload configuration
│   ├── errorHandler.js          # Global error handler
│   └── validateRequest.js       # express-validator result handler
├── models/
│   ├── User.js
│   ├── Role.js
│   ├── Permission.js
│   └── Shop.js
├── routes/
│   ├── authRoutes.js
│   ├── roleRoutes.js
│   ├── permissionRoutes.js
│   ├── userRoutes.js
│   └── shopRoutes.js
├── utils/
│   ├── apiResponse.js           # sendSuccess / sendError helpers
│   ├── asyncHandler.js          # async wrapper for route handlers
│   └── validators.js            # express-validator rule sets
├── uploads/                     # Uploaded shop files (CNIC, logo, certificate)
├── .env                         # Environment variables (not committed)
├── .gitignore
├── server.js                    # App entry point
└── package.json
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally (or a connection string to a remote instance)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/MEHRAJKAZMI/car-service-booking-system.git
   cd car-service-booking-system
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/car-service-booking-system
   JWT_SECRET=your_access_token_secret
   JWT_REFRESH_SECRET=your_refresh_token_secret
   ```

4. Start the development server
   ```
   npm run dev
   ```

The API will be available at `http://localhost:5000`.

## Authentication & Authorization Overview

- **JWT-based auth**: Login issues a short-lived access token (15 min) and a longer-lived refresh token (7 days, stored server-side for revocation).
- **Role-Based + Permission-Based Authorization**: Every user has a Role. Every Role has zero or more Permissions. Protected routes check whether the logged-in user's Role includes the specific permission required.
- **The `ALL` permission**: A Role that has a Permission named exactly `ALL` automatically passes every authorization check, regardless of the specific permission required - useful for a Super Admin role.
- **Two middlewares work together**:
  - `protect` - verifies the JWT is valid and attaches the decoded user info to `req.user`
  - `authorize('Permission Name')` - checks that the user's Role has the required permission (or `ALL`)

## API Endpoints

All endpoints are prefixed with `/api`. All responses follow this format:

```json
{ "success": true, "message": "...", "data": { ... } }
```
or on error:
```json
{ "success": false, "message": "..." }
```

### Auth (`/api/auth`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login, returns access + refresh tokens |
| POST | `/refresh-token` | No (needs refresh token) | Get a new access token |
| GET | `/profile` | Yes | Get logged-in user's profile |
| PUT | `/profile` | Yes | Update own profile |
| PUT | `/change-password` | Yes | Change password (requires current password) |
| POST | `/forgot-password` | No | Request an OTP for password reset |
| POST | `/verify-otp` | No | Verify OTP, receive a reset token |
| POST | `/reset-password` | No (needs reset token) | Set new password using reset token |
| POST | `/logout` | Yes | Logout (client-side token disposal) |

### Roles (`/api/roles`) - requires `Role Management` permission or `ALL`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a role |
| GET | `/` | Get all roles |
| GET | `/:id` | Get role details |
| PUT | `/:id` | Update a role |
| DELETE | `/:id` | Delete a role |
| PUT | `/:id/permissions` | Assign permissions to a role |

### Permissions (`/api/permissions`) - requires `Permission Management` permission or `ALL`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a permission |
| GET | `/` | Get all permissions |
| GET | `/:id` | Get permission details |
| PUT | `/:id` | Update a permission |
| DELETE | `/:id` | Delete a permission |

### User Management (`/api/users`) - requires `User Management` permission or `ALL`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a user |
| GET | `/` | Get all users |
| GET | `/:id` | Get user details |
| PUT | `/:id` | Update a user |
| DELETE | `/:id` | Delete a user |
| PUT | `/:id/activate` | Activate a user |
| PUT | `/:id/deactivate` | Deactivate a user |

### Shop Registration (`/api/shops`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/` | Logged in (any role) | Register a shop (multipart/form-data with file uploads) |
| GET | `/` | `Shop Management` or `ALL` | Get all shops |
| GET | `/:id` | `Shop Management` or `ALL` | Get shop details |
| PUT | `/:id` | `Shop Management` or `ALL` | Update shop details |
| DELETE | `/:id` | `Shop Management` or `ALL` | Delete a shop |
| PUT | `/:id/approve` | `Shop Management` or `ALL` | Approve a shop |
| PUT | `/:id/reject` | `Shop Management` or `ALL` | Reject a shop (accepts a `reason`) |
| PUT | `/:id/status` | `Shop Management` or `ALL` | Change shop status to any valid value |

**Register Shop file fields** (multipart/form-data): `ownerCnic`, `shopLogo`, `businessRegistrationCertificate` (optional). Accepted types: jpeg, jpg, png, pdf. Max size: 5MB per file.

## Postman Collection

A full Postman collection covering every endpoint above is included in this repository (`Car Service API.postman_collection.json`). Import it into Postman and set the collection-level Authorization to Bearer Token using `{{accessToken}}` after logging in.

## Notes

- OTPs generated by `/forgot-password` are returned directly in the API response for development/testing purposes. In production, this would be sent via email/SMS instead.
- Access tokens expire in 15 minutes; refresh tokens expire in 7 days and are stored on the User document to allow server-side revocation.