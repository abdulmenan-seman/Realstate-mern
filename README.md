# RealEstateHub 🏡

> A full-stack MERN Real Estate Marketplace connecting buyers/renters, property owners, and platform administrators. Built with React (Vite), Node.js, Express, MongoDB, Tailwind CSS, Redux Toolkit, and Cloudinary.

---

## 1. Project Overview

**RealEstateHub** provides a secure, modern platform for discovering, listing, and moderating real estate. It features strict role-based access control, automated review workflows, server-side search and filtering, inquiry and viewing appointment systems, and administrative consoles.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Redux Toolkit, React Router DOM v6, React Icons, Axios |
| **Backend** | Node.js, Express.js (ES Modules), Mongoose, JWT, bcryptjs, Multer |
| **Database** | MongoDB (Atlas & Local with automatic fallback) |
| **Media / Storage** | Cloudinary API (with buffer stream pipeline and fallback) |
| **Security** | Helmet HTTP headers, express-rate-limit, HttpOnly cookies, RBAC middleware, NoSQL sanitization |
| **Testing** | Automated Node.js integration test suites across all 5 phases |

---

## 3. Key Features

- **Authentication & Authorization**:
  - Secure registration, login, logout, and current user retrieval.
  - JWT token verification via HttpOnly cookies and Bearer headers.
  - Role-based authorization (`customer`, `owner`, `admin`).
  - Suspension enforcement and protection of the last active administrator.
- **Property Management**:
  - Property listings with up to 8 Cloudinary-backed images (5MB max each, JPEG/PNG/WebP).
  - Segregated `approvalStatus` (`pending`, `approved`, `rejected`) and `availabilityStatus` (`available`, `rented`, `sold`).
  - Mandatory rejection reason enforcement.
  - Material edit detection returning approved listings to pending review.
- **Marketplace Discovery & Search**:
  - Multi-criteria filtering: keyword, city, area, property type, listing type, price range, bedrooms, bathrooms, parking, furnished.
  - Sorting (newest, price ascending, price descending).
  - Server-side pagination with full total/page metadata.
  - Related property recommendations.
- **Customer Interactions**:
  - Customer favorites wishlist with idempotent toggle and batch check.
  - Inquiry messaging between customers and owners with derived owner identity.
  - Property viewing appointments with future-date validation, conflict detection, and status management.
  - Property reporting with duplicate prevention and admin resolution actions.
- **Role Dashboards**:
  - **Admin Dashboard**: Real-time aggregated statistics (users, properties, availability, reports), recent submission tables, and queue shortcuts.
  - **User Management**: Admin user search, role updates, and suspension/reactivation.
  - **Owner Dashboard**: Personalized listing metrics, inquiry alerts, viewing request queues, and listing management.
  - **Customer Dashboard**: Overview of saved favorites, sent inquiries, scheduled viewing tours, and reported listings.

---

## 4. System Roles & Access Matrix

| Capability | Public | Customer | Owner | Admin |
|---|:---:|:---:|:---:|:---:|
| Browse Approved & Available Properties | ✅ | ✅ | ✅ | ✅ |
| Search & Filter Marketplace | ✅ | ✅ | ✅ | ✅ |
| Save / Manage Favorites | ❌ | ✅ | ✅ | ✅ |
| Send Listing Inquiries | ❌ | ✅ | ❌ | ❌ |
| Request Viewing Appointments | ❌ | ✅ | ❌ | ❌ |
| Report Inappropriate Listings | ❌ | ✅ | ✅ | ✅ |
| Create Property Listings | ❌ | ❌ | ✅ | ✅ |
| Edit / Archive Own Properties | ❌ | ❌ | ✅ | ✅ |
| Respond to Received Inquiries | ❌ | ❌ | ✅ | ✅ |
| Accept / Reject Viewing Requests | ❌ | ❌ | ✅ | ✅ |
| Review Pending Property Queue | ❌ | ❌ | ❌ | ✅ |
| Approve / Reject Listings | ❌ | ❌ | ❌ | ✅ |
| Moderate Reports & Takedown Listings | ❌ | ❌ | ❌ | ✅ |
| Suspend / Reactivate Users | ❌ | ❌ | ❌ | ✅ |
| Modify User Roles | ❌ | ❌ | ❌ | ✅ |
| View System Overview Statistics | ❌ | ❌ | ❌ | ✅ |

---

## 5. Architecture & Project Structure

```
Realstat mern/
├── client/                      # Frontend Application (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/          # Reusable components & navigation
│   │   │   ├── common/          # Button, Input, Alert, Loader, StatusBadge
│   │   │   ├── layout/          # Header, Footer, MainLayout
│   │   │   └── properties/      # PropertyCard, ImageUploader
│   │   ├── pages/               # Application view controllers
│   │   │   ├── admin/           # AdminDashboard, AdminProperties, AdminReports, AdminUsers
│   │   │   ├── customer/        # CustomerDashboard, FavoritesPage, MyInquiries, MyAppointments, MyReports
│   │   │   ├── owner/           # OwnerDashboard, MyProperties, CreateProperty, EditProperty, OwnerInquiries, OwnerAppointments
│   │   │   └── properties/      # PropertyListPage, PropertyDetailsPage
│   │   ├── redux/               # Redux Toolkit user authentication slice & store
│   │   ├── services/            # Axios API client configured with credentials
│   │   ├── App.jsx              # Application router with ProtectedRoute & RoleRoute
│   │   └── main.jsx
│   └── package.json
│
├── server/                      # Backend REST API (Node.js + Express + Mongoose)
│   ├── config/                  # Database & Cloudinary configurations
│   ├── controllers/             # Endpoint business logic
│   ├── middleware/              # Auth, Authorize, Multer upload, Validator
│   ├── models/                  # Mongoose schemas (User, Property, Favorite, Inquiry, Appointment, PropertyReport)
│   ├── routes/                  # Express routers
│   ├── tests/                   # Automated integration test suites
│   │   ├── phase1.test.js       # Auth & User tests (22 tests)
│   │   ├── phase2.test.js       # Property CRUD & Moderation tests (21 tests)
│   │   ├── phase3.test.js       # Marketplace & Favorites tests (25 tests)
│   │   ├── phase4.test.js       # Inquiries, Appointments & Reports tests (22 tests)
│   │   ├── phase5.test.js       # Dashboards, Users & Security tests (20 tests)
│   │   └── runAll.js            # Master test runner (110 total tests)
│   ├── utils/                   # Error handler & async helpers
│   ├── index.js                 # Server entry point & security middleware
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 6. Database Collections & Relationships

- **`users`**:
  - Fields: `username`, `fullName`, `email`, `password`, `phone`, `role` (`customer` | `owner` | `admin`), `accountStatus` (`active` | `suspended`), `avatar`, timestamps.
  - Safe extraction: Password hash is excluded via schema `toJSON` transform.
- **`properties`**:
  - Fields: `title`, `description`, `propertyType`, `listingType`, `price`, `currency`, `location` (city, area, address), `specifications` (bedrooms, bathrooms, areaSqm, parking, furnished), `images` (publicId, secureUrl, width, height, isCover), `owner` (ref: User), `approvalStatus` (`pending` | `approved` | `rejected`), `availabilityStatus` (`available` | `rented` | `sold`), `rejectionReason`, `reviewedBy`, `reviewedAt`, `isArchived`, timestamps.
  - Compound indexes on location, pricing, and status.
- **`favorites`**:
  - Fields: `user` (ref: User), `property` (ref: Property), timestamps.
  - Unique compound index `{ user: 1, property: 1 }` prevents duplicates.
- **`inquiries`**:
  - Fields: `property` (ref: Property), `customer` (ref: User), `owner` (ref: User), `message`, `contactPhone`, `status` (`new` | `read` | `responded` | `closed`), `ownerResponse`, `respondedAt`, timestamps.
- **`appointments`**:
  - Fields: `property` (ref: Property), `customer` (ref: User), `owner` (ref: User), `requestedDateTime`, `note`, `status` (`pending` | `accepted` | `rejected` | `cancelled` | `completed`), `ownerNote`, `actionAt`, timestamps.
- **`propertyreports`**:
  - Fields: `property` (ref: Property), `reporter` (ref: User), `reason`, `description`, `status` (`open` | `reviewed` | `resolved` | `dismissed`), `adminNote`, `reviewedBy`, `reviewedAt`, timestamps.

---

## 7. Installation Instructions

### Prerequisites
- Node.js >= 18.x
- MongoDB (local running at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)
- Cloudinary account (optional; local base64 fallback included)

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd Realstat-mern

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

## 8. Environment Variables

### Backend Configuration (`server/.env`)
```env
NODE_ENV=development
PORT=3000
MONGO=mongodb://127.0.0.1:27017/realestatehub
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173

# Cloudinary Credentials (Optional for local testing)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend Configuration (`client/.env`)
```env
VITE_API_BASE_URL=/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
```

---

## 9. Starting the Application

### Start the Backend Server
```bash
cd server
npm run dev
# Server starts at http://localhost:3000
```

### Start the Frontend Client
```bash
cd client
npm run dev
# Vite dev server starts at http://localhost:5173
```

---

## 10. Automated Testing

The project includes an end-to-end integration test runner validating all five phases:

```bash
cd server

# Run the complete test suite (all 110 tests)
npm test

# Run individual phase suites
npm run test:phase1   # Auth & RBAC (22 tests)
npm run test:phase2   # Property CRUD & Moderation (21 tests)
npm run test:phase3   # Marketplace & Favorites (25 tests)
npm run test:phase4   # Inquiries, Appointments & Reports (22 tests)
npm run test:phase5   # Dashboards, Users & Security (20 tests)
```

---

## 11. API Endpoint Inventory

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register new customer or owner (admin self-reg blocked) |
| `POST` | `/api/auth/signin` | Public | Authenticate user, returns JWT and sets cookie |
| `POST` | `/api/auth/google` | Public | Google OAuth token signin/registration |
| `POST` | `/api/auth/logout` | Authenticated | Clears auth cookie |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile |

### User Profile & Dashboards (`/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Authenticated | Get logged-in user profile |
| `PATCH` | `/api/users/me` | Authenticated | Update profile details (role/status protected) |
| `GET` | `/api/users/customer/stats` | Authenticated | Customer activity statistics |
| `GET` | `/api/users/:id` | Public | Public owner/agent profile information |

### Property Management (`/api/properties`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/properties` | Public | Filtered & paginated approved/available listings |
| `GET` | `/api/properties/:id` | Public/Auth | Single property details |
| `GET` | `/api/properties/:id/related` | Public | Related listings by city or property type |
| `GET` | `/api/properties/mine` | Owner, Admin | Retrieve logged-in owner's properties |
| `GET` | `/api/properties/owner/stats` | Owner, Admin | Aggregated owner dashboard statistics |
| `POST` | `/api/properties` | Owner, Admin | Create listing (starts in pending status) |
| `POST` | `/api/properties/upload-images` | Owner, Admin | Upload up to 8 images via Cloudinary |
| `PATCH` | `/api/properties/:id` | Owner, Admin | Edit listing (material edits trigger pending review) |
| `PATCH` | `/api/properties/:id/availability` | Owner, Admin | Update availability status (available, rented, sold) |
| `DELETE` | `/api/properties/:id` | Owner, Admin | Soft delete/archive listing |

### Favorites (`/api/favorites`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/favorites` | Authenticated | Retrieve customer's saved favorite properties |
| `GET` | `/api/favorites/ids` | Authenticated | Array of all favorited property IDs |
| `GET` | `/api/favorites/check/:propertyId` | Authenticated | Boolean check if property is favorited |
| `POST` | `/api/favorites/:propertyId` | Authenticated | Add property to favorites (idempotent) |
| `DELETE` | `/api/favorites/:propertyId` | Authenticated | Remove property from favorites |

### Inquiries (`/api/inquiries`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/inquiries` | Customer | Submit new inquiry on approved property |
| `GET` | `/api/inquiries/my` | Customer | List inquiries submitted by the customer |
| `GET` | `/api/inquiries/received` | Owner, Admin | List inquiries received for owner's listings |
| `PATCH` | `/api/inquiries/:id/read` | Owner, Admin | Mark received inquiry as read |
| `PATCH` | `/api/inquiries/:id/respond` | Owner, Admin | Provide owner response to inquiry |
| `PATCH` | `/api/inquiries/:id/close` | Owner, Admin | Close completed inquiry |

### Appointments (`/api/appointments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/appointments` | Customer | Request viewing tour (future date validated) |
| `GET` | `/api/appointments/my` | Customer | List viewing requests submitted by customer |
| `GET` | `/api/appointments/received` | Owner, Admin | List viewing requests received by owner |
| `PATCH` | `/api/appointments/:id/accept` | Owner, Admin | Accept viewing request with optional note |
| `PATCH` | `/api/appointments/:id/reject` | Owner, Admin | Reject viewing request |
| `PATCH` | `/api/appointments/:id/complete` | Owner, Admin | Mark tour completed |
| `PATCH` | `/api/appointments/:id/cancel` | Customer, Owner | Cancel active viewing appointment |

### Property Reports (`/api/reports`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/reports` | Authenticated | Submit report on property listing |
| `GET` | `/api/reports/my` | Authenticated | List reports submitted by user |

### System Administration (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard/stats` | Admin | Real-time aggregated system statistics |
| `GET` | `/api/admin/users` | Admin | Filtered, searchable user list with pagination |
| `GET` | `/api/admin/users/:id` | Admin | User profile and activity metrics |
| `PATCH` | `/api/admin/users/:id/status` | Admin | Suspend or reactivate user (last admin protected) |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Modify user role (last admin protected) |
| `GET` | `/api/admin/properties` | Admin | Moderation property list |
| `GET` | `/api/admin/properties/pending` | Admin | Oldest-first pending review queue |
| `PATCH` | `/api/admin/properties/:id/review` | Admin | Approve or reject listing (mandatory reason) |
| `GET` | `/api/admin/reports` | Admin | Filtered and searchable report queue |
| `PATCH` | `/api/admin/reports/:id` | Admin | Resolve/dismiss report with optional property takedown |

### System Health (`/api/health`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Server uptime, health status, and timestamp |

---

## 12. Production Deployment Guide

### A. Frontend Deployment (Vercel)
1. Push repository to GitHub.
2. In Vercel, import the repository and set the **Root Directory** to `client`.
3. Set Framework Preset to **Vite**.
4. Configure Build & Output:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Configure Environment Variables in Vercel:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com/api`
   - `VITE_FIREBASE_API_KEY`: `<your-firebase-key>`
6. Deploy.

### B. Backend Deployment (Render / Railway / AWS)
1. Create a Web Service pointing to the `server` directory.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGO`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/realestatehub`
   - `JWT_SECRET`: `<secure-random-string-at-least-32-chars>`
   - `JWT_EXPIRES_IN`: `24h`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `CLOUDINARY_CLOUD_NAME`: `<cloudinary-cloud-name>`
   - `CLOUDINARY_API_KEY`: `<cloudinary-api-key>`
   - `CLOUDINARY_API_SECRET`: `<cloudinary-api-secret>`

### C. MongoDB Atlas Setup
1. Create an M0 Free Tier or Dedicated Cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a database user with read/write privileges.
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) or whitelist your server's static IP.
4. Copy the connection string and paste it into `MONGO` in your backend environment variables.

---

## 13. Security Features & Defenses

1. **Anti-Privilege Escalation**:
   - Public registration strictly restricts roles to `customer` and `owner`. Any attempt to pass `role: admin` is rejected with `403 Forbidden`.
   - Profile updates (`PATCH /api/users/me`) ignore role and accountStatus changes.
2. **Last Administrator Protection**:
   - The system queries for active administrators before applying suspension or demotion. If only one active administrator remains, the action is blocked with `400 Bad Request`.
3. **Suspended Account Enforcement**:
   - Both token generation (`/api/auth/signin`) and token verification middleware verify `accountStatus !== 'suspended'`.
4. **Identity Derivation**:
   - Inquiries and appointments derive `owner` from the database `property.owner` record, preventing spoofed communication.
5. **Rate Limiting & Headers**:
   - `helmet` applies Content Security Policy, XSS filter, and frame protection.
   - `express-rate-limit` throttles requests per IP window.

---

## 14. License
ISC License. Built as an enterprise-grade real estate marketplace architecture.
