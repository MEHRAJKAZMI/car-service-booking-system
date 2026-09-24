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
   COMMISSION_RATE_PERCENT=5
   ```

   The payment settlement flow uses MongoDB transactions. For local development,
   run MongoDB as a replica set (including a single-node replica set); standalone
   MongoDB instances do not support transactions.

4. Seed the initial roles and administrator:
   ```
   node seed.js
   ```
   This creates the `Super Admin` and safe default `Customer` roles. Public
   registration always assigns the Customer role; administrators assign privileged
   roles through the user-management API.

5. Run the API:
   ```
   npm start
   ```

6. Run the included checks:
   ```
   npm test
   ```

## Payment and wallet rules

- A booking must belong to the customer, use an approved shop, and be completed
  before a booking payment can be created.
- Marking a payment as paid atomically debits the customer wallet, records the
  commission, credits the company wallet, creates the shop payout transfer, and
  writes ledger entries.
- A refund is allowed only for a settled booking payment whose shop transfer has
  not already completed. It reverses both wallet effects and marks the transfer
  failed in the same transaction.
- Direct wallet top-ups are restricted to users with `Wallet Management`; normal
  production recharges should be completed through a verified payment-gateway
  callback before marking their payment paid.

## Security and access control

- Authentication rejects inactive or deleted users.
- Customers can view/cancel only their own bookings and view only their own
  payments and invoices. Shop owners can view records for their own shops.
- Payout accounts can only be viewed or modified by their owner or a wallet
  manager.
- Public shop discovery exposes approved shops only; management users retain
  access to the full shop list.

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
| GET | `/` | Logged in | Get approved shops; managers get all shops |
| GET | `/:id` | Logged in | Get an approved shop; managers/owners may view non-approved shops |
| PUT | `/:id` | `Shop Management` or `ALL` | Update shop details |
| DELETE | `/:id` | `Shop Management` or `ALL` | Delete a shop |
| PUT | `/:id/approve` | `Shop Management` or `ALL` | Approve a shop |
| PUT | `/:id/reject` | `Shop Management` or `ALL` | Reject a shop (accepts a `reason`) |
| PUT | `/:id/status` | `Shop Management` or `ALL` | Change shop status to any valid value |

**Register Shop file fields** (multipart/form-data): `ownerCnic`, `shopLogo`, `businessRegistrationCertificate` (optional). Accepted types: jpeg, jpg, png, pdf. Max size: 5MB per file.

### Shop Embedded Services (`/api/shops/:id/services`) - requires `Shop Management` or `ALL`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/:id/services` | Add service to a shop |
| PUT | `/:id/services/:serviceId` | Update a shop service |
| DELETE | `/:id/services/:serviceId` | Remove a service from a shop |

### Wallets & Balances (`/api/wallets`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/` | Yes (Customer) | Create customer wallet |
| GET | `/my-wallet` | Yes (Customer) | Get current wallet balance |
| POST | `/add-money` | `Wallet Management` or `ALL` | Direct wallet credit |
| GET | `/my-transactions` | Yes (Customer) | Customer's wallet transaction ledger |
| GET | `/user/:userId` | `Wallet Management` or `ALL` | View user's wallet balance |
| PUT | `/:id/status` | `Wallet Management` or `ALL` | Freeze or activate a wallet |
| PUT | `/:id/deduct-money` | `Wallet Management` or `ALL` | Direct wallet debit/penalty |
| GET | `/transactions/all` | `Wallet Management` or `ALL` | System-wide wallet transaction ledger |

### Bookings (`/api/bookings`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/` | Yes (Customer) | Create a booking (shop visit or roadside) |
| GET | `/my-bookings` | Yes (Customer) | Get customer's booking history |
| GET | `/:id` | Yes (Owner/Customer) | Get booking details |
| PUT | `/:id/cancel` | Yes (Customer) | Cancel customer's own booking |
| GET | `/` | `Shop Management` or `ALL` | Get all platform bookings |
| PUT | `/:id/status` | `Shop Management` or `ALL` | Update booking status (`confirmed`, `in_progress`, `completed`, `cancelled`) |
| PUT | `/:id/customer-arrived` | `Shop Management` or `ALL` | Record customer arrival timestamp at shop |

### Payments & Settlement (`/api/payments`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/` | Yes (Customer) | Create booking payment or wallet recharge payment |
| GET | `/my-payments` | Yes (Customer) | Get customer payments |
| GET | `/:id` | Yes (Owner/Customer/Manager) | Get payment details |
| GET | `/:id/invoice` | Yes (Owner/Customer/Manager) | Generate invoice breakdown |
| GET | `/` | `Shop Management` or `ALL` | Get all platform payments |
| PUT | `/:id/status` | `Shop Management` or `ALL` | Settle payment as `paid` or `refunded` (triggers atomic split & ledger) |

### Commissions (`/api/commissions`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/booking/:bookingId` | `Shop Management` or `ALL` | View commission calculated for a booking |
| GET | `/my-history` | Yes (Shop Owner) | Shop owner's commission history |
| GET | `/` | `Wallet Management` or `ALL` | System-wide commission revenue ledger |

### Transfers & Payouts (`/api/transfers`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/my-transfers` | Yes (Shop Owner) | View shop payout transfer history |
| GET | `/:id` | `Wallet Management` or `ALL` | View transfer details |
| PUT | `/:id/send` | `Wallet Management` or `ALL` | Dispatch payout to shop (marks completed) |
| PUT | `/:id/status` | `Wallet Management` or `ALL` | Update transfer status (`processing`, `failed`, etc.) |
| GET | `/` | `Wallet Management` or `ALL` | Get all platform payout transfers |
| GET | `/shop/:shopId` | `Wallet Management` or `ALL` | Get transfers for a specific shop |

### Financial History (Ledger) (`/api/financial-history`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/my-history` | Yes (Customer) | View own financial transactions |
| GET | `/user/:userId` | `Wallet Management` or `ALL` | View user's financial transactions |
| GET | `/` | `Wallet Management` or `ALL` | View complete ledger of all financial transactions |
| GET | `/:id` | `Wallet Management` or `ALL` | View single transaction details |

### Payout Accounts (`/api/accounts`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/` | Yes (Shop Owner) | Add bank or mobile wallet payout destination |
| GET | `/user/:userId` | Yes (Owner/Manager) | Get user's payout accounts |
| GET | `/:id` | `Wallet Management` or `ALL` | Get payout account details |
| PUT | `/:id` | Yes (Owner/Manager) | Update payout account |
| PUT | `/:id/deactivate` | Yes (Owner/Manager) | Deactivate payout account |
| GET | `/` | `Wallet Management` or `ALL` | Get all system payout accounts |

### Reviews (`/api/reviews`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/` | Yes (Customer) | Review a completed booking (1-5 stars) |
| GET | `/shop/:shopId` | Yes | Get all reviews and average rating for a shop |
| GET | `/:id` | Yes | Get review details |
| PUT | `/:id` | Yes (Owner) | Update review |
| DELETE | `/:id` | Yes (Owner) | Delete review |

### Notifications (`/api/notifications`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/` | Yes | Get notifications & unread count |
| PUT | `/:id/read` | Yes | Mark single notification as read |
| PUT | `/read-all` | Yes | Mark all notifications as read |
| DELETE | `/:id` | Yes | Delete notification |

### Reports & Analytics (`/api/reports`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/revenue` | `Reports` or `ALL` | Total revenue, penalties, net commission, shop payouts |
| GET | `/bookings` | `Reports` or `ALL` | Bookings breakdown by status |
| GET | `/top-shops` | `Reports` or `ALL` | Top 5 shops by completed bookings |
| GET | `/user-growth` | `Reports` or `ALL` | User registration growth statistics |
| GET | `/wallet` | `Wallet Management` or `ALL` | Customer wallet liabilities & platform balance |
| GET | `/commission` | `Wallet Management` or `ALL` | Total commission revenue and average rate |
| GET | `/shop-earnings` | `Wallet Management` or `ALL` | Shop net earnings leaderboard |
| GET | `/transfers` | `Wallet Management` or `ALL` | Payout transfers counts and totals by status |
| GET | `/financial` | `Wallet Management` or `ALL` | Executive financial summary |

### Audit Logs (`/api/audit-logs`) - requires `Audit Log` or `ALL`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Query audit trail (supports `performedBy`, `module`, `startDate`, `endDate`) |
| GET | `/:id` | Get audit log details |

## Postman Collection

A full Postman collection covering every endpoint above is included in this repository (`Car Service API.postman_collection.json`). Import it into Postman and set the collection-level Authorization to Bearer Token using `{{accessToken}}` after logging in.

## Notes

- OTPs generated by `/forgot-password` are returned directly in the API response for development/testing purposes. In production, this would be sent via email/SMS instead.
- Access tokens expire in 15 minutes; refresh tokens expire in 7 days and are stored on the User document to allow server-side revocation.
