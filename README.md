# VetNest 🐾

**Smart healthcare for every paw.**

VetNest is a veterinary hospital appointment and crowd-management platform for Bengaluru. It connects pet owners with veterinary hospitals and gives hospital staff a portal to manage appointments, patient queues, and hospital crowd levels.

## Project Overview

VetNest has three main parts:

1. **Pet Owner Portal** – lets pet owners browse hospitals, view hospital information, book appointments for their pets, and view their bookings.
2. **Hospital Staff Portal** – lets staff members access the queue for their assigned hospital, view appointment and pet details, update appointment statuses, and manage crowd levels.
3. **Backend API and real-time server** – handles authentication, appointment operations, MongoDB data, and Socket.IO events shared by the portals.

Both portals use the same deployed backend and MongoDB Atlas database. Staff accounts are associated with a specific hospital through `hospitalId`, which is used by the backend to scope staff queue access.

## Live Application

| Component | URL |
|---|---|
| Backend health check | https://vetnest-backend.onrender.com/health |
| Pet Owner Portal | https://vetnest-owner.onrender.com |
| Hospital Staff Portal | https://vetnest-staff.onrender.com |

Use the backend `/health` endpoint to check whether the API is responding.

## Demo Login Credentials

These are demonstration accounts. Do not reuse these passwords for real accounts.

### Pet Owner

| Role | Email | Password |
|---|---|---|
| Pet Owner | `owner@vetnest.app` | `owner12345` |

### Hospital Staff

| Hospital branch | Email | Password |
|---|---|---|
| Indiranagar | `staff.indiranagar@vetnest.app` | `staff12345` |
| Koramangala | `staff.koramangala@vetnest.app` | `staff12345` |
| Jayanagar | `staff.jayanagar@vetnest.app` | `staff12345` |
| Whitefield | `staff.whitefield@vetnest.app` | `staff12345` |
| Hebbal | `staff.hebbal@vetnest.app` | `staff12345` |
| Malleshwaram | `staff.malleshwaram@vetnest.app` | `staff12345` |

The staff accounts must exist in the deployed MongoDB database and each account must have the correct `HOSPITAL_STAFF` role and corresponding hospital `hospitalId`. Verify the demo logins before presenting.

## Main Features

### Pet Owner Portal
- Browse available veterinary hospitals and view their details.
- View hospital crowd information.
- Book an appointment for a pet at a selected hospital.
- View the owner's booked appointments.

### Hospital Staff Portal
- Staff login linked to an assigned hospital branch.
- View the appointment queue for that hospital.
- View appointment information such as pet name, species, triage level, complaint, token number, time slot, and status.
- Update appointment status:
  - `BOOKED`
  - `CHECKED_IN`
  - `IN_CONSULTATION`
  - `COMPLETED`
  - `CANCELLED`
- Update the hospital crowd level:
  - `LOW`
  - `MODERATE`
  - `HIGH`
  - `CRITICAL`

### Shared Data and Live Updates
- Both portals communicate with the same backend and MongoDB Atlas database.
- Appointment creation and status changes are saved by the backend.
- The backend emits Socket.IO events such as `appointmentCreated` and `appointmentStatusUpdated`.
- The staff portal uses the hospital ID associated with the logged-in staff account when working with its queue.
- The staff queue can also be fetched from the backend API; a Socket.IO connection alone does not replace the queue API request.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend build tool | Vite |
| Backend runtime | Node.js |
| Backend framework | Express.js |
| Real-time communication | Socket.IO |
| Database | MongoDB Atlas |
| Object modelling | Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Password hashing | bcryptjs |
| Security headers | Helmet |
| Cross-origin requests | CORS |
| Maps | OpenStreetMap |
| Hosting | Render |

## Application Architecture

```text
┌──────────────────────┐       ┌──────────────────────┐
│   Pet Owner Portal   │       │ Hospital Staff Portal│
│     React + Vite     │       │     React + Vite     │
└──────────┬───────────┘       └──────────┬───────────┘
           │                              │
           └──────── REST API / Socket.IO ┘
                          │
                ┌─────────▼─────────┐
                │  Node.js + Express│
                │   Backend API     │
                │    Socket.IO      │
                └─────────┬─────────┘
                          │
                ┌─────────▼─────────┐
                │   MongoDB Atlas   │
                │ Shared app data   │
                └───────────────────┘
```

Both frontends communicate with the same backend. The backend reads and writes the shared MongoDB database and emits real-time events to connected clients.

## API Routes

Base URL: `https://vetnest-backend.onrender.com`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Backend health check |
| GET | `/api/hospitals` | Retrieve hospitals |
| GET | `/api/hospitals/:id` | Retrieve hospital details |
| PUT | `/api/hospitals/:id/crowd` | Update hospital crowd information |
| POST | `/api/auth/owner/login` | Pet owner login |
| POST | `/api/auth/staff/login` | Hospital staff login |
| POST | `/api/appointments` | Book an appointment |
| GET | `/api/appointments/my-appointments` | Retrieve the logged-in owner's appointments |
| GET | `/api/appointments/hospital-queue` | Retrieve the logged-in staff member's hospital queue |
| PUT | `/api/appointments/:id/status` | Update an appointment's status |

Protected endpoints require a JWT in the request header:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Socket.IO Events

| Event | Purpose |
|---|---|
| `appointmentCreated` | Notifies connected clients that an appointment has been created. |
| `appointmentStatusUpdated` | Notifies connected clients that an appointment status has changed. |
| `hospitalsUpdated` | Sends updated hospital information, including crowd information, where emitted by the backend. |

The staff portal should use the event payload's `hospitalId` to ensure that updates are relevant to the currently selected or authenticated hospital. Confirm the deployed backend and frontend event handling together when testing live updates.

## Environment Variables

### Backend

Create a local `backend/.env` file. Use the variable names expected by the backend code:

```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_long_random_secret>
CLIENT_OWNER_URL=http://localhost:5173
CLIENT_STAFF_URL=http://localhost:5174
SIMULATION_INTERVAL_MS=20000
```

The values above are examples for local development. Use the actual frontend ports and variable names configured in the project. In Render, configure production environment variables in the backend service's Environment settings.

### Frontend applications

Configure the owner and staff frontend environment files with the deployed backend URL for production, or the local backend URL during development. The exact Vite variable names should match those referenced by the frontend source code. Common examples are:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Vite environment variables are read at build time. Rebuild or redeploy the relevant frontend after changing production frontend environment variables.

### Security

- Never commit `.env` files, MongoDB connection strings, JWT secrets, or private credentials to GitHub.
- Keep `.env` in `.gitignore`.
- Commit an `.env.example` containing placeholder values only.
- If a database password or secret is exposed, rotate it and update the local and Render environment variables.
- Do not put real credentials in screenshots, documentation, or public repositories.

## Local Development

1. Install Node.js and npm.
2. Clone the repository.
3. Install dependencies in the backend and frontend project folders, following the package scripts included in each `package.json`.
4. Create the backend and frontend environment files using placeholder templates as a guide.
5. Set the backend MongoDB connection string and JWT secret locally.
6. Configure both frontends to use the local backend API and Socket.IO URL.
7. Start the backend, owner frontend, and staff frontend using the scripts in their respective `package.json` files.

Use a development database for local testing where possible. Do not commit local environment files.

## Suggested Demonstration Flow

1. Open the Pet Owner Portal and log in using the demo owner account.
2. Open the Hospital Staff Portal in another browser tab or window and log in to a hospital branch.
3. In the Owner Portal, select the same hospital and book an appointment for a pet.
4. Check the corresponding Staff Portal queue for the new appointment.
5. In the Staff Portal, change the appointment status to `CHECKED_IN`.
6. Continue the status to `IN_CONSULTATION` and then `COMPLETED`.
7. Demonstrate the hospital crowd-level controls.
8. If demonstrating real-time updates, keep both portals open and check that the staff portal receives the update without a manual page refresh.

## Repository Structure

The project is organised as a monorepo. The main application areas include:

```text
VetNest-React/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── scripts/
├── frontend-owner/
├── frontend-staff/
├── .gitignore
└── README.md
```

The exact file names and scripts may vary as the project evolves.

## Notes and Limitations

- Each staff account must be linked to the correct hospital document through `hospitalId`.
- Staff queue access depends on the authenticated staff account and its hospital association.
- Real-time updates require the backend and the relevant frontend to be running and connected.
- If a Socket.IO update is not visible, check the browser console, Render backend logs, frontend environment variables, CORS configuration, and event payloads.
- The staff queue is fetched from the backend API; a successful Socket.IO connection alone does not guarantee that the queue API is working.
- Existing appointment records retain the booking details saved at the time of appointment creation unless the application explicitly updates them.

---

**VetNest — Smart healthcare for every paw.**
