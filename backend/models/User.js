import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const petSchema = new mongoose.Schema({
  petName: { type: String, required: true },
  species: { type: String, enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Reptile', 'Other'], default: 'Dog' },
  breed: { type: String, default: 'Crossbreed' },
  age: { type: Number },
  weight: { type: Number },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['PET_OWNER', 'HOSPITAL_STAFF', 'ADMIN'],
      default: 'PET_OWNER',
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: function () {
        return this.role === 'HOSPITAL_STAFF';
      },
    },
    pets: [petSchema],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
