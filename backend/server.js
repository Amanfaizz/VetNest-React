
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { connectDB } from './config/db.js';
import User from './models/User.js';

import authRoutes from './routes/authRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';

import {
  startCrowdSimulator,
  getMemoryHospitals,
} from './scripts/seedAndSimulate.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const CLIENT_OWNER_URL =
  process.env.CLIENT_OWNER_URL || 'http://localhost:5173';

const CLIENT_STAFF_URL =
  process.env.CLIENT_STAFF_URL || 'http://localhost:5174';

const allowedOrigins = [
  CLIENT_OWNER_URL,
  CLIENT_STAFF_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT'],
    credentials: true,
  },
});

app.set('io', io);

// Socket.IO authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    // Public connections can connect without a token
    if (!token) {
      socket.data.user = null;
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        'vetnest_super_secret_jwt_key_bengaluru_2026'
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.data.user = user;

    next();
  } catch (error) {
    console.error('[Socket.io] Authentication error:', error.message);
    next(new Error('Socket authentication failed'));
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'VetNest Monorepo Backend API',
    city: 'Bengaluru, India',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/appointments', appointmentRoutes);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Connected: ${socket.id}`);

  const user = socket.data.user;

  // Hospital staff join their own hospital room
  if (user && user.role === 'HOSPITAL_STAFF') {
    const hospital = user.hospitalId;

    const hospitalId =
      hospital && typeof hospital === 'object'
        ? hospital._id
        : hospital;

    if (hospitalId) {
      const room = `hospital:${hospitalId.toString()}`;

      socket.join(room);

      console.log(
        `[Socket.io] ${user.email} joined room ${room}`
      );
    } else {
      console.warn(
        `[Socket.io] Staff user ${user.email} has no hospital ID`
      );
    }
  }

  // Send initial hospital crowd information
  socket.emit('hospitalsUpdated', {
    hospitals: getMemoryHospitals(),
    message: 'Initial Bengaluru hospital crowd state loaded.',
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Disconnected: ${socket.id}`);
  });
});

// Start server
async function bootstrap() {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log('==========================================');
      console.log('VetNest Backend Server Started');
      console.log(`Port: ${PORT}`);
      console.log(`Owner URL: ${CLIENT_OWNER_URL}`);
      console.log(`Staff URL: ${CLIENT_STAFF_URL}`);
      console.log('Socket.IO: Enabled');
      console.log('==========================================');

      const interval =
        Number(process.env.SIMULATION_INTERVAL_MS) || 20000;

      startCrowdSimulator(io, interval);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

bootstrap();
