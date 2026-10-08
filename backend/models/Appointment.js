import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    petName: {
      type: String,
      required: true,
    },
    species: {
      type: String,
      default: 'Dog',
    },
    triageLevel: {
      type: String,
      enum: ['ROUTINE', 'PRIORITY', 'EMERGENCY'],
      default: 'ROUTINE',
    },
    status: {
      type: String,
      enum: ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'],
      default: 'BOOKED',
    },
    tokenNumber: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: Date,
      default: Date.now,
    },
    chiefComplaint: {
      type: String,
      default: 'General Health Checkup & OPD Consultation',
    },
    assignedVet: {
      type: String,
      default: 'Duty Veterinarian',
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup by hospital and owner
appointmentSchema.index({ hospitalId: 1, status: 1, createdAt: -1 });
appointmentSchema.index({ ownerId: 1, createdAt: -1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
