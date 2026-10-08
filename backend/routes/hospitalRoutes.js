import express from 'express';
import Hospital from '../models/Hospital.js';
import Appointment from '../models/Appointment.js';
import { protect, requireHospitalStaff } from '../middleware/auth.js';
import { getMemoryHospitals, updateMemoryCrowdLevel } from '../scripts/seedAndSimulate.js';

const router = express.Router();

// GET /api/hospitals - List all hospitals with GeoJSON & crowd status
router.get('/', async (req, res) => {
  try {
    let hospitals = [];
    try {
      hospitals = await Hospital.find().sort({ area: 1 });
    } catch (dbErr) {
      hospitals = getMemoryHospitals();
    }

    if (!hospitals || hospitals.length === 0) {
      hospitals = getMemoryHospitals();
    }

    res.json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/hospitals/:id - Get single hospital details
router.get('/:id', async (req, res) => {
  try {
    let hospital = null;
    try {
      hospital = await Hospital.findById(req.params.id);
    } catch (err) {
      // Fallback memory lookup
    }

    if (!hospital) {
      hospital = getMemoryHospitals().find((h) => h._id.toString() === req.params.id);
    }

    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }

    // Fetch active queue count for this hospital
    let activeQueueCount = 0;
    try {
      activeQueueCount = await Appointment.countDocuments({
        hospitalId: hospital._id,
        status: { $in: ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION'] },
      });
    } catch (e) {
      activeQueueCount = hospital.activeQueueCount || 0;
    }

    res.json({
      success: true,
      data: {
        ...hospital._doc || hospital,
        activeQueueCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/hospitals/:id/crowd - Staff Manual Crowd Override Toggle
router.put('/:id/crowd', protect, requireHospitalStaff, async (req, res) => {
  try {
    const hospitalId = req.params.id;

    // Strict staff isolation check: Staff from Hospital A cannot alter Hospital B
    if (req.staffHospitalId !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only update the crowd level for your assigned hospital branch.',
      });
    }

    const { crowdLevel, activeQueueCount, avgWaitTimeMinutes } = req.body;
    const validLevels = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

    if (crowdLevel && !validLevels.includes(crowdLevel)) {
      return res.status(400).json({ success: false, error: 'Invalid crowd level value.' });
    }

    let updatedHospital = null;
    try {
      const updateData = {};
      if (crowdLevel) updateData.crowdLevel = crowdLevel;
      if (typeof activeQueueCount === 'number') updateData.activeQueueCount = activeQueueCount;
      if (typeof avgWaitTimeMinutes === 'number') updateData.avgWaitTimeMinutes = avgWaitTimeMinutes;

      updatedHospital = await Hospital.findByIdAndUpdate(hospitalId, updateData, { new: true });
    } catch (err) {
      // Memory fallback
    }

    if (!updatedHospital) {
      updatedHospital = updateMemoryCrowdLevel(hospitalId, crowdLevel, activeQueueCount, avgWaitTimeMinutes);
    }

    // Broadcast updated hospital status via Socket.io
    const io = req.app.get('io');
    if (io) {
      let allHospitals = [];
      try {
        allHospitals = await Hospital.find();
      } catch (e) {
        allHospitals = getMemoryHospitals();
      }
      io.emit('hospitalsUpdated', {
        updatedHospital,
        hospitals: allHospitals,
        message: `📢 ${updatedHospital?.hospitalName || 'Hospital'} crowd status updated to ${crowdLevel}`,
      });
    }

    res.json({
      success: true,
      message: 'Hospital crowd level updated successfully.',
      data: updatedHospital,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
