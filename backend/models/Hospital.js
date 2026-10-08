import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '+91 80 4123 9999',
    },
    crowdLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    activeQueueCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgWaitTimeMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },
    totalBeds: {
      type: Number,
      default: 20,
    },
    isEmergencyReady: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create 2dsphere spatial index for GeoJSON spatial queries
hospitalSchema.index({ location: '2dsphere' });

export default mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
