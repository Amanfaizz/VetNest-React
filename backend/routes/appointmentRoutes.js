
import express from 'express';

import Appointment from '../models/Appointment.js';
import Hospital from '../models/Hospital.js';
import {
  notifyOwnerOfStatus,
  hasEmailTemplate,
  isEmailConfigured,
} from '../utils/mailer.js';

import {
  protect,
  requireHospitalStaff,
} from '../middleware/auth.js';

const router = express.Router();

// Generate appointment token
const generateTokenNumber = () => {
  return `VET-${Math.floor(100 + Math.random() * 900)}`;
};

// POST /api/appointments
// Pet owner books an appointment
router.post('/', protect, async (req, res) => {
  try {
    const {
      hospitalId,
      petName,
      species,
      triageLevel,
      chiefComplaint,
      timeSlot,
    } = req.body;

    if (!hospitalId || !petName) {
      return res.status(400).json({
        success: false,
        error: 'Please provide hospitalId and petName.',
      });
    }

    const hospitalExists = await Hospital.findById(hospitalId);

    if (!hospitalExists) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found.',
      });
    }

    const tokenNumber = generateTokenNumber();

    // Save appointment
    const appointment = await Appointment.create({
      hospitalId,
      ownerId: req.user._id,
      petName,
      species: species || 'Dog',
      triageLevel: triageLevel || 'ROUTINE',
      chiefComplaint:
        chiefComplaint || 'General OPD Examination',
      timeSlot: timeSlot ? new Date(timeSlot) : new Date(),
      tokenNumber,
      status: 'BOOKED',
    });

    // Update hospital active queue count
    await Hospital.findByIdAndUpdate(hospitalId, {
      $inc: { activeQueueCount: 1 },
    });

    // Notify the staff of this particular hospital
    const io = req.app.get('io');

    if (io) {
      const room = `hospital:${appointment.hospitalId.toString()}`;

      io.to(room).emit('appointmentCreated', {
        appointment,
        hospitalId: appointment.hospitalId.toString(),
        message: `New Appointment Booked: ${petName} (${tokenNumber})`,
      });

      console.log(
        `[Socket.io] appointmentCreated emitted to ${room}`
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: appointment,
    });
  } catch (err) {
    console.error('Appointment booking error:', err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// GET /api/appointments/my-appointments
// Owner retrieves their appointments
router.get('/my-appointments', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      ownerId: req.user._id,
    })
      .populate(
        'hospitalId',
        'hospitalName address area contactPhone crowdLevel'
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// GET /api/appointments/hospital-queue
// Staff retrieves appointments for their hospital
router.get(
  '/hospital-queue',
  protect,
  requireHospitalStaff,
  async (req, res) => {
    try {
      const staffHospitalId = req.staffHospitalId;

      const queue = await Appointment.find({
        hospitalId: staffHospitalId,
      })
        .populate('ownerId', 'name email pets')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        hospitalId: staffHospitalId,
        count: queue.length,
        data: queue,
      });
    } catch (err) {
      console.error('Hospital queue error:', err);

      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// PUT /api/appointments/:id/status
// Staff updates appointment status
router.put(
  '/:id/status',
  protect,
  requireHospitalStaff,
  async (req, res) => {
    try {
      const { status, assignedVet } = req.body;

      const allowedStatuses = [
        'BOOKED',
        'CHECKED_IN',
        'IN_CONSULTATION',
        'COMPLETED',
        'CANCELLED',
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid appointment status.',
        });
      }

      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found.',
        });
      }

      // Ensure staff can only update their own hospital's appointments
      if (
        appointment.hospitalId.toString() !== req.staffHospitalId
      ) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You cannot modify appointments for another hospital branch.',
        });
      }

      const previousStatus = appointment.status;

      appointment.status = status;

      if (assignedVet) {
        appointment.assignedVet = assignedVet;
      }

      await appointment.save();

      // Update active queue count only when an appointment
      // first enters a terminal status
      const wasActive = [
        'BOOKED',
        'CHECKED_IN',
        'IN_CONSULTATION',
      ].includes(previousStatus);

      const isNowInactive = [
        'COMPLETED',
        'CANCELLED',
      ].includes(status);

      if (wasActive && isNowInactive) {
        await Hospital.findByIdAndUpdate(
          appointment.hospitalId,
          { $inc: { activeQueueCount: -1 } }
        );
      }

      // Notify staff connected to this hospital
      const io = req.app.get('io');

      if (io) {
        const room = `hospital:${appointment.hospitalId.toString()}`;

        io.to(room).emit('appointmentStatusUpdated', {
          appointment,
          hospitalId: appointment.hospitalId.toString(),
          message: `Status updated to ${status} for Token #${appointment.tokenNumber}`,
        });

        console.log(
          `[Socket.io] appointmentStatusUpdated emitted to ${room}`
        );
      }

      // E-mail the pet owner (their registered address) when the status actually CHANGED
      // to one we have an e-mail template for (CHECKED_IN, IN_CONSULTATION).
      // Fire-and-forget: we do NOT await it, so a slow or failing e-mail provider can never
      // delay or break the staff member's click. notifyOwnerOfStatus() never throws.
      const willEmail =
        previousStatus !== status &&
        hasEmailTemplate(status) &&
        isEmailConfigured();

      if (previousStatus !== status && hasEmailTemplate(status)) {
        notifyOwnerOfStatus(appointment, status).catch((e) =>
          console.error('[Email] unexpected error:', e.message)
        );
      }

      return res.json({
        success: true,
        message: `Appointment updated to ${status}`,
        emailNotification: willEmail ? 'queued' : 'none',
        data: appointment,
      });
    } catch (err) {
      console.error('Appointment status update error:', err);

      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

export default router;
