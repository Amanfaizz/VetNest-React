import express from 'express';
import Appointment from '../models/Appointment.js';
import Hospital from '../models/Hospital.js';
import { protect, requireHospitalStaff } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate Token Numbers like VET-102
const generateTokenNumber = () => {
  return `VET-${Math.floor(100 + Math.random() * 900)}`;
};

// POST /api/appointments - Pet Owner Books Appointment
router.post('/', protect, async (req, res) => {
  try {
    const { hospitalId, petName, species, triageLevel, chiefComplaint, timeSlot } = req.body;

    if (!hospitalId || !petName) {
      return res.status(400).json({ success: false, error: 'Please provide hospitalId and petName.' });
    }

    const tokenNumber = generateTokenNumber();

    const appointment = await Appointment.create({
      hospitalId,
      ownerId: req.user._id,
      petName,
      species: species || 'Dog',
      triageLevel: triageLevel || 'ROUTINE',
      chiefComplaint: chiefComplaint || 'General OPD Examination',
      timeSlot: timeSlot ? new Date(timeSlot) : new Date(),
      tokenNumber,
      status: 'BOOKED',
    });

    // Increment active queue count for hospital
    try {
      await Hospital.findByIdAndUpdate(hospitalId, {
        $inc: { activeQueueCount: 1 },
      });
    } catch (err) {
      // Ignore if DB offline
    }

    // Broadcast Socket.io event to Staff and Owners
    const io = req.app.get('io');
    if (io) {
      io.emit('appointmentCreated', {
        appointment,
        hospitalId,
        message: `🆕 New Appointment Booked: ${petName} (${tokenNumber})`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: appointment,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/appointments/my-appointments - Pet Owner List Appointments
router.get('/my-appointments', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ ownerId: req.user._id })
      .populate('hospitalId', 'hospitalName address area contactPhone crowdLevel')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/appointments/hospital-queue - Staff List Appointments FOR THEIR SPECIFIC HOSPITAL
router.get('/hospital-queue', protect, requireHospitalStaff, async (req, res) => {
  try {
    const staffHospitalId = req.staffHospitalId;

    const queue = await Appointment.find({ hospitalId: staffHospitalId })
      .populate('ownerId', 'name email pets')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      hospitalId: staffHospitalId,
      count: queue.length,
      data: queue,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/appointments/:id/status - Staff Update Appointment Status
router.put('/:id/status', protect, requireHospitalStaff, async (req, res) => {
  try {
    const { status, assignedVet } = req.body;
    const allowedStatuses = ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid appointment status.' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found.' });
    }

    // Enforce isolation: Staff can only update appointments belonging to THEIR hospital
    if (appointment.hospitalId.toString() !== req.staffHospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot modify appointments for another hospital branch.',
      });
    }

    appointment.status = status;
    if (assignedVet) appointment.assignedVet = assignedVet;
    await appointment.save();

    // Adjust hospital active queue count if completed or cancelled
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      try {
        await Hospital.findByIdAndUpdate(appointment.hospitalId, {
          $inc: { activeQueueCount: -1 },
        });
      } catch (e) {
        // Ignore
      }
    }

    // Broadcast Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.emit('appointmentStatusUpdated', {
        appointment,
        hospitalId: req.staffHospitalId,
        message: `Status updated to ${status} for Token #${appointment.tokenNumber}`,
      });
    }

    res.json({
      success: true,
      message: `Appointment updated to ${status}`,
      data: appointment,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
