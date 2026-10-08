import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId || null,
    },
    process.env.JWT_SECRET || 'vetnest_super_secret_jwt_key_bengaluru_2026',
    { expiresIn: '30d' }
  );
};

// POST /api/auth/owner/register - Pet Owner Registration
router.post('/owner/register', async (req, res) => {
  try {
    const { name, email, password, petName, species, breed } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const pets = petName ? [{ petName, species: species || 'Dog', breed: breed || 'Crossbreed' }] : [];

    const user = await User.create({
      name,
      email,
      password,
      role: 'PET_OWNER',
      pets,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        pets: user.pets,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/owner/login - Pet Owner Login
router.post('/owner/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please enter email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== 'PET_OWNER') {
      return res.status(401).json({ success: false, error: 'Invalid pet owner credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid pet owner credentials.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        pets: user.pets,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/staff/login - Hospital Staff Login (Strict Hospital Binding)
router.post('/staff/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please enter staff email and password.' });
    }

    const user = await User.findOne({ email }).populate('hospitalId');
    if (!user || user.role !== 'HOSPITAL_STAFF') {
      return res.status(401).json({ success: false, error: 'Invalid hospital staff credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid hospital staff credentials.' });
    }

    if (!user.hospitalId) {
      return res.status(403).json({ success: false, error: 'Account misconfiguration: Staff user is not bound to a Hospital ID.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId._id,
        hospitalName: user.hospitalId.hospitalName,
        hospitalArea: user.hospitalId.area,
        hospital: user.hospitalId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me - Get Current Profile
router.get('/me', protect, async (req, res) => {
  try {
    let hospital = null;
    if (req.user.role === 'HOSPITAL_STAFF' && req.user.hospitalId) {
      hospital = await Hospital.findById(req.user.hospitalId);
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        pets: req.user.pets,
        hospitalId: req.user.hospitalId,
        hospital,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
