# 🐾 VetNest - Monorepo Platform for Veterinary Hospitals (Bengaluru)

> **Slogan**: *"Smart healthcare for every paw."*

**VetNest** is a 3-tier monorepo platform for veterinary hospitals across **Bengaluru, India**. It combines a **Pet Owner Interactive Heat Map Portal**, a **Hospital Staff OPD & Crowd Management Portal**, and a **Node.js/Express REST API + Socket.io Server** with background crowd simulation.

---

## 🏗️ Monorepo Directory Architecture

```text
vetnest-monorepo/
├── .gitignore
├── .env.example
├── README.md
├── package.json            # Root package.json with workspace scripts
├── render.yaml             # Plug-and-play Render deployment spec
├── backend/                # Express + Socket.io REST API Server
│   ├── config/
│   │   └── db.js           # Mongoose MongoDB connection & fallback
│   ├── models/
│   │   ├── Hospital.js     # GeoJSON Point & crowd level schema
│   │   ├── User.js         # Roles: PET_OWNER, HOSPITAL_STAFF, ADMIN
│   │   └── Appointment.js  # OPD token & triage status schema
│   ├── middleware/
│   │   └── auth.js         # JWT protection & hospital isolation middleware
│   ├── routes/
│   │   ├── authRoutes.js   # Dual auth (/owner/register, /owner/login, /staff/login)
│   │   ├── hospitalRoutes.js # GeoJSON heat-map list & staff manual crowd override
│   │   └── appointmentRoutes.js # Appointment booking & staff queue management
│   ├── scripts/
│   │   └── seedAndSimulate.js # Seeds 12 Bengaluru hospitals + live simulator
│   ├── server.js           # Express + Helmet + CORS + Socket.io + /health
│   └── package.json
├── frontend-owner/         # Pet Owner React App (Port 3000)
│   ├── src/
│   │   ├── components/
│   │   │   ├── BengaluruMap.jsx # Interactive Leaflet heat map (Color-coded pins)
│   │   │   ├── BookingModal.jsx # OPD appointment booking form
│   │   │   └── AuthModal.jsx    # Owner login & registration
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css       # Soft teal/emerald light theme
│   ├── index.html
│   └── package.json
└── frontend-staff/         # Hospital Staff React App (Port 3001)
    ├── src/
    │   ├── App.jsx         # Queue table & manual crowd override panel
    │   ├── main.jsx
    │   └── index.css       # Clean blue light theme
    ├── index.html
    └── package.json
```

---

## ⚡ Quick Start Guide (Local Development)

### 1. Install Dependencies Across Monorepo
```bash
npm run setup
```

### 2. Seed Bengaluru Hospitals & Demo Accounts
```bash
npm run seed
```

This seeds **12 veterinary hospitals** across Bengaluru with exact coordinates, creates **1 Staff user per clinic**, and generates a **Demo Pet Owner** account (`owner@vetnest.app` / `owner12345`).

### 3. Run Monorepo Services
```bash
# Run backend, owner app, and staff app concurrently:
npm run dev
```

- **Backend API**: `http://localhost:5000`
- **Pet Owner App**: `http://localhost:3000`
- **Hospital Staff App**: `http://localhost:3001`
- **API Health Check**: `http://localhost:5000/health`

---

## 🔑 Demo Login Credentials

### Pet Owner Portal (`http://localhost:3000`)
- **Email**: `owner@vetnest.app`
- **Password**: `owner12345`

### Hospital Staff Portal (`http://localhost:3001`)
- **Indiranagar Branch**: `staff.indiranagar@vetnest.app` / `staff12345`
- **Koramangala Branch**: `staff.koramangala@vetnest.app` / `staff12345`
- **Whitefield Branch**: `staff.whitefield@vetnest.app` / `staff12345`
- **Jayanagar Branch**: `staff.jayanagar@vetnest.app` / `staff12345`

---

## 📡 Key REST API Endpoints & Health Probe

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Deployment health check probe (`{ status: "ok", uptime: ... }`) |
| `POST` | `/api/auth/owner/register` | Public | Register Pet Owner account |
| `POST` | `/api/auth/owner/login` | Public | Login Pet Owner account |
| `POST` | `/api/auth/staff/login` | Public | Login Hospital Staff & verify `hospitalId` binding |
| `GET` | `/api/hospitals` | Public | Get GeoJSON list of Bengaluru hospitals & live crowd state |
| `PUT` | `/api/hospitals/:id/crowd` | Staff Only | Manual crowd level override (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) |
| `POST` | `/api/appointments` | Owner Only | Book OPD appointment slot |
| `GET` | `/api/appointments/my-appointments` | Owner Only | Get booked visits for current owner |
| `GET` | `/api/appointments/hospital-queue` | Staff Only | Get queue strictly for staff's `hospitalId` |
| `PUT` | `/api/appointments/:id/status` | Staff Only | Advance visit status (`BOOKED` ➔ `CHECKED_IN` ➔ `IN_CONSULTATION` ➔ `COMPLETED`) |

---

## 🔄 Socket.io Live Events

- `hospitalsUpdated`: Broadcasts live crowd density fluctuations and manual staff overrides to all connected Pet Owner map clients in real-time.
- `appointmentCreated`: Broadcasts new walk-in / online bookings to staff dashboards.
- `appointmentStatusUpdated`: Broadcasts visit state changes to owners and clinic receptionists.
