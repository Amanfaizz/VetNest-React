import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import { startCrowdSimulator, getMemoryHospitals } from './scripts/seedAndSimulate.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_OWNER_URL = process.env.CLIENT_OWNER_URL || 'http://localhost:3000';
const CLIENT_STAFF_URL = process.env.CLIENT_STAFF_URL || 'http://localhost:3001';

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS Policy Configuration for Dual Frontends
const allowedOrigins = [
  CLIENT_OWNER_URL,
  CLIENT_STAFF_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, configurable for production
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT'],
  },
});

app.set('io', io);

// API Health Check Endpoint (Required for Render/Railway probes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'VetNest Monorepo Backend API',
    city: 'Bengaluru, India',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/appointments', appointmentRoutes);

// Socket.io Client Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Emit current hospital heat map data immediately upon client connection
  socket.emit('hospitalsUpdated', {
    hospitals: getMemoryHospitals(),
    message: 'Initial Bengaluru hospital crowd state loaded.',
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Bootstrap Server & DB
async function bootstrap() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🐾 VetNest Backend Server Listening on Port ${PORT}`);
    console.log(`🏥 Health Check Route: http://localhost:${PORT}/health`);
    console.log(`🌐 Allowed Owner App Origin: ${CLIENT_OWNER_URL}`);
    console.log(`🌐 Allowed Staff App Origin: ${CLIENT_STAFF_URL}`);
    console.log(`==================================================\n`);

    // Start background crowd simulator interval
    const interval = Number(process.env.SIMULATION_INTERVAL_MS) || 20000;
    startCrowdSimulator(io, interval);
  });
}

bootstrap();
