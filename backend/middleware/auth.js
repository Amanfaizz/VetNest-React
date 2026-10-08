import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vetnest_super_secret_jwt_key_bengaluru_2026');
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    // Attach hospitalId directly to req for quick access
    req.hospitalId = decoded.hospitalId || req.user.hospitalId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized, token validation failed' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user?.role}' is not authorized. Required: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

export const requireHospitalStaff = (req, res, next) => {
  if (!req.user || req.user.role !== 'HOSPITAL_STAFF') {
    return res.status(403).json({ success: false, error: 'Access restricted to hospital staff only.' });
  }

  const staffHospitalId = req.hospitalId || req.user.hospitalId;
  if (!staffHospitalId) {
    return res.status(403).json({ success: false, error: 'Staff user is not associated with any hospital.' });
  }

  req.staffHospitalId = staffHospitalId.toString();
  next();
};
