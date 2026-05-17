# AI-Integrated Smart Resource Management System (SRMS)
### University of Gondar

A full-stack web application for university resource lifecycle management with AI-powered maintenance decisions.

---

## 🎯 System Overview

SRMS is a **role-based portal** where university staff request new resources and report damaged ones. Requests go through **multi-level approval**, maintenance is handled by technicians, and a **Python-based AI engine (Random Forest Classifier)** helps decide whether to **repair or replace** assets.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│           Tailwind CSS + Recharts + Lucide Icons             │
│                  http://localhost:5173                        │
└───────────────────────┬──────────────────────────────────────┘
                        │ REST API (axios)
┌───────────────────────▼──────────────────────────────────────┐
│               BACKEND (Node.js + Express)                    │
│          JWT Authentication + RBAC Middleware                 │
│          Prisma ORM + PostgreSQL (NeonDB)                    │
│                  http://localhost:3000                        │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP POST /ai/recommend
┌───────────────────────▼──────────────────────────────────────┐
│            AI MICROSERVICE (Python + Flask)                   │
│         Scikit-learn Random Forest Classifier                │
│                  http://localhost:5000                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles & Responsibilities

| Role | Responsibilities |
|------|-----------------|
| **STAFF** | Submit new resource requests, report damage, track status |
| **DEPARTMENT_HEAD** | Approve/reject staff requests, forward damage reports to officer |
| **ACADEMIC_DEAN** | Second-level approval for resource procurement |
| **RESOURCE_OFFICER** | Final procurement approval, assign technicians, execute AI decisions |
| **TECHNICIAN** | Inspect damaged assets, submit damage data, complete repairs |
| **ADMIN** | Full system administration, user management, analytics |

---

## 🔄 Workflow Diagrams

### Procurement (New Resource Request)
```
STAFF submits request
    → DEPARTMENT_HEAD approves/rejects
        → ACADEMIC_DEAN approves/rejects
            → RESOURCE_OFFICER approves → procures → completes
```

### Maintenance (Damage Report)
```
STAFF reports damage
    → DEPARTMENT_HEAD forwards to officer
        → RESOURCE_OFFICER assigns technician
            → TECHNICIAN inspects → submits damage data
                → AI ENGINE (Python) recommends REPAIR / REPLACE
                    → RESOURCE_OFFICER makes final decision
                        → If REPAIR: TECHNICIAN repairs → marks complete
                        → If REPLACE: Resource marked DISPOSED
```

---

## 🧠 AI Decision Engine

The AI service uses a **Random Forest Classifier** trained on synthetic data with these features:

| Feature | Description |
|---------|-------------|
| `damage_level` | 1 (Minor) / 2 (Moderate) / 3 (Severe) |
| `repair_cost` | Technician's cost estimate ($) |
| `new_price` | Market price from e-commerce API ($) |
| `asset_age` | Years since purchase |
| `cost_ratio` | repair_cost / new_price (derived) |

**Output:** `REPAIR` or `REPLACE` with confidence score (0-100%)

The model is trained in `ai-service/train_model.py` and served via Flask API in `ai-service/app.py`.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Python** 3.9+
- **PostgreSQL** (or NeonDB cloud)

### 1. Clone & Install

```bash
# Backend
npm install

# Frontend
cd frontend && npm install

# AI Service
cd ai-service
pip install -r requirements.txt
```

### 2. Environment Variables

Create `.env` in the project root:
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=3000
AI_SERVICE_URL=http://localhost:5000
```

### 3. Database Setup

```bash
# Push schema to database
npx prisma db push

# Seed demo data
npx prisma db seed
```

### 4. Train AI Model

```bash
cd ai-service
python train_model.py
```

### 5. Start All Services

```bash
# Terminal 1: AI Service
cd ai-service && python app.py

# Terminal 2: Backend
npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **AI Service:** http://localhost:5000

---

## 🔑 Demo Credentials

All accounts use password: **`Admin@1234`**

| Email | Role | Department |
|-------|------|------------|
| `admin@uog.edu.et` | ADMIN | IT Administration |
| `dean@uog.edu.et` | ACADEMIC_DEAN | Academic Affairs |
| `head@uog.edu.et` | DEPARTMENT_HEAD | Computer Science |
| `head2@uog.edu.et` | DEPARTMENT_HEAD | Engineering |
| `officer@uog.edu.et` | RESOURCE_OFFICER | Logistics & Procurement |
| `tech@uog.edu.et` | TECHNICIAN | Maintenance Unit |
| `tech2@uog.edu.et` | TECHNICIAN | Maintenance Unit |
| `hana@uog.edu.et` | STAFF | Computer Science |
| `abel@uog.edu.et` | STAFF | Computer Science |
| `selam@uog.edu.et` | STAFF | Engineering |

---

## 📁 Project Structure

```
├── ai-service/                   # Python AI Microservice
│   ├── app.py                    # Flask API server
│   ├── train_model.py            # Model training script
│   ├── rf_model.joblib           # Trained model (generated)
│   └── requirements.txt          # Python dependencies
│
├── frontend/                     # React Frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── Layout.jsx        # Main layout with sidebar + notifications
│       │   └── ProtectedLayout.jsx
│       ├── context/
│       │   └── AuthContext.jsx    # JWT auth state management
│       ├── lib/
│       │   └── api.js            # Axios HTTP client
│       └── pages/
│           ├── Login.jsx         # Authentication page
│           ├── Dashboard.jsx     # Role-specific home dashboard
│           ├── Resources.jsx     # Asset inventory management
│           ├── Requests.jsx      # New resource procurement workflow
│           ├── DamageReports.jsx # Damage reporting & tracking
│           ├── Maintenance.jsx   # Technician inspection + AI + repair
│           ├── Analytics.jsx     # Charts & KPIs
│           └── Users.jsx         # Admin user management
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.js                   # Demo data seeder
│
├── src/                          # Express Backend
│   ├── config/
│   │   ├── jwt.js                # JWT sign/verify
│   │   └── prisma.js             # Prisma client instance
│   ├── controllers/              # Route handlers
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT + RBAC middleware
│   │   └── error.middleware.js   # Global error handler
│   ├── routes/                   # Express route definitions
│   ├── services/                 # Business logic
│   │   ├── ai.service.js         # Fallback AI (JS heuristic)
│   │   ├── maintenance.service.js # Full maintenance workflow
│   │   ├── notification.service.js
│   │   ├── pricing.service.js    # E-commerce API simulation
│   │   └── request.service.js    # Procurement workflow
│   ├── app.js                    # Express app config
│   └── server.js                 # Entry point
│
├── .env                          # Environment variables
└── package.json
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (returns JWT) |
| GET | `/auth/me` | Get current user profile |

### Resources
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/resources` | Any | List all resources |
| POST | `/resources` | Officer/Admin | Create resource |
| PUT | `/resources/:id` | Officer/Admin | Update resource |
| DELETE | `/resources/:id` | Officer/Admin | Delete resource |

### Requests (Procurement)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/requests` | Any (filtered) | List requests by role |
| POST | `/requests` | Any | Submit new request |
| PATCH | `/requests/:id/status` | Role-based | Approve/reject |

### Damage Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/damage-reports` | Any (filtered) | List reports by role |
| POST | `/damage-reports` | Any | Submit damage report |
| PATCH | `/damage-reports/:id/forward` | Dept Head | Forward to officer |

### Maintenance
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/maintenance` | Officer/Tech | List tasks |
| POST | `/maintenance/assign` | Officer | Assign technician |
| PATCH | `/maintenance/:id/inspect` | Technician | Submit inspection → triggers AI |
| PATCH | `/maintenance/:id/finalize` | Officer | Final repair/replace decision |
| PATCH | `/maintenance/:id/complete-repair` | Technician | Mark repair done |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Any | Get user notifications |
| PATCH | `/notifications/read-all` | Any | Mark all as read |
| PATCH | `/notifications/:id/read` | Any | Mark single as read |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/analytics` | Officer/Dean/Admin | System analytics |
| GET | `/admin/users` | Officer/Admin | List all users |
| PATCH | `/admin/users/:id` | Admin | Update user role |
| DELETE | `/admin/users/:id` | Admin | Delete user |

### AI Service (Python)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/health` | Service health check |
| POST | `/ai/recommend` | Get repair/replace recommendation |
| POST | `/ai/batch` | Batch predictions |

---

## 🛡️ Security

- **JWT Authentication** with 7-day expiry
- **Role-Based Access Control** enforced at middleware level
- **Password Hashing** with bcryptjs (10 rounds)
- **CORS** enabled for frontend origin
- **401 Auto-Redirect** on expired tokens

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4, Recharts, Lucide React |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL (NeonDB) |
| AI Engine | Python, Flask, Scikit-learn (Random Forest) |
| Auth | JSON Web Tokens (JWT) |

---

## 📄 License

University of Gondar © 2026 — Academic Project
