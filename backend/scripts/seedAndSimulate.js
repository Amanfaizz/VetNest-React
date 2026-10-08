import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

dotenv.config();

export const SEEDED_HOSPITALS = [
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000001'),
    hospitalName: 'Bangalore Pet Hospital - Indiranagar',
    location: { type: 'Point', coordinates: [77.6412, 12.9784] },
    address: '100 Feet Rd, 12th Main, Indiranagar, Bengaluru, 560038',
    area: 'Indiranagar',
    contactPhone: '+91 80 2520 1122',
    crowdLevel: 'LOW',
    activeQueueCount: 4,
    avgWaitTimeMinutes: 10,
    totalBeds: 25,
    isEmergencyReady: true,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000002'),
    hospitalName: 'Green Cross Veterinary Clinic - Koramangala',
    location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    address: '5th Block, 80 Feet Rd, Koramangala, Bengaluru, 560095',
    area: 'Koramangala',
    contactPhone: '+91 80 4110 3344',
    crowdLevel: 'MODERATE',
    activeQueueCount: 14,
    avgWaitTimeMinutes: 25,
    totalBeds: 20,
    isEmergencyReady: true,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000003'),
    hospitalName: 'South Bengaluru Pet Care & OPD - Jayanagar',
    location: { type: 'Point', coordinates: [77.5834, 12.9250] },
    address: '4th T Block, 11th Main, Jayanagar, Bengaluru, 560041',
    area: 'Jayanagar',
    contactPhone: '+91 80 2663 5566',
    crowdLevel: 'HIGH',
    activeQueueCount: 28,
    avgWaitTimeMinutes: 45,
    totalBeds: 30,
    isEmergencyReady: true,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000004'),
    hospitalName: 'Whitefield Emergency Pet Hospital',
    location: { type: 'Point', coordinates: [77.7499, 12.9698] },
    address: 'ITPL Main Rd, Whitefield, Bengaluru, 560066',
    area: 'Whitefield',
    contactPhone: '+91 80 6712 8899',
    crowdLevel: 'CRITICAL',
    activeQueueCount: 38,
    avgWaitTimeMinutes: 65,
    totalBeds: 35,
    isEmergencyReady: true,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000005'),
    hospitalName: 'North City Avian & Pet Clinic - Hebbal',
    location: { type: 'Point', coordinates: [77.5920, 13.0358] },
    address: 'Bellary Rd, Near Hebbal Flyover, Hebbal, Bengaluru, 560024',
    area: 'Hebbal',
    contactPhone: '+91 80 2341 4455',
    crowdLevel: 'LOW',
    activeQueueCount: 3,
    avgWaitTimeMinutes: 8,
    totalBeds: 15,
    isEmergencyReady: false,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000006'),
    hospitalName: 'Central Vet Emergency Care - Malleshwaram',
    location: { type: 'Point', coordinates: [77.5704, 13.0031] },
    address: 'Sampige Rd, 8th Cross, Malleshwaram, Bengaluru, 560003',
    area: 'Malleshwaram',
    contactPhone: '+91 80 2334 7788',
    crowdLevel: 'MODERATE',
    activeQueueCount: 11,
    avgWaitTimeMinutes: 20,
    totalBeds: 22,
    isEmergencyReady: true,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000007'),
    hospitalName: 'HSR Specialty Animal Hospital',
    location: { type: 'Point', coordinates: [77.6519, 12.9121] },
    address: 'Sector 1, 27th Main Rd, HSR Layout, Bengaluru, 560102',
    area: 'HSR Layout',
    contactPhone: '+91 80 4200 9900',
    crowdLevel: 'HIGH',
    activeQueueCount: 22,
    avgWaitTimeMinutes: 38,
    totalBeds: 25,
    isEmergencyReady: true,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000008'),
    hospitalName: 'Prestige Veterinary Clinic - Sadashivanagar',
    location: { type: 'Point', coordinates: [77.5810, 13.0068] },
    address: 'Armane Nagar, Sadashivanagar, Bengaluru, 560080',
    area: 'Sadashivanagar',
    contactPhone: '+91 80 2361 2233',
    crowdLevel: 'LOW',
    activeQueueCount: 5,
    avgWaitTimeMinutes: 12,
    totalBeds: 18,
    isEmergencyReady: true,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000009'),
    hospitalName: 'MG Road 24/7 Animal Trauma Center',
    location: { type: 'Point', coordinates: [77.6093, 12.9756] },
    address: 'MG Road, Trinity Circle, Bengaluru, 560001',
    area: 'MG Road',
    contactPhone: '+91 80 2558 1100',
    crowdLevel: 'CRITICAL',
    activeQueueCount: 42,
    avgWaitTimeMinutes: 70,
    totalBeds: 40,
    isEmergencyReady: true,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000010'),
    hospitalName: 'South Cyber City Pet Care - Electronic City',
    location: { type: 'Point', coordinates: [77.6648, 12.8452] },
    address: 'Phase 1, Hosur Rd, Electronic City, Bengaluru, 560100',
    area: 'Electronic City',
    contactPhone: '+91 80 6789 2211',
    crowdLevel: 'MODERATE',
    activeQueueCount: 16,
    avgWaitTimeMinutes: 22,
    totalBeds: 20,
    isEmergencyReady: true,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000011'),
    hospitalName: 'Yelahanka Veterinary OPD - Yelahanka',
    location: { type: 'Point', coordinates: [77.5963, 13.1007] },
    address: 'New Town, Major Sandeep Unnikrishnan Rd, Yelahanka, Bengaluru, 560064',
    area: 'Yelahanka',
    contactPhone: '+91 80 2856 3344',
    crowdLevel: 'LOW',
    activeQueueCount: 2,
    avgWaitTimeMinutes: 5,
    totalBeds: 15,
    isEmergencyReady: false,
  },
  {
    _id: new mongoose.Types.ObjectId('65f100000000000000000012'),
    hospitalName: 'Metro Animal Health Clinic - Rajajinagar',
    location: { type: 'Point', coordinates: [77.5560, 12.9982] },
    address: 'Dr Rajkumar Rd, Rajajinagar, Bengaluru, 560010',
    area: 'Rajajinagar',
    contactPhone: '+91 80 2315 6677',
    crowdLevel: 'MODERATE',
    activeQueueCount: 12,
    avgWaitTimeMinutes: 18,
    totalBeds: 20,
    isEmergencyReady: true,
  },
];

let memoryHospitals = [...SEEDED_HOSPITALS];

export function getMemoryHospitals() {
  return memoryHospitals;
}

export function updateMemoryCrowdLevel(hospitalId, crowdLevel, queueCount, waitMins) {
  const h = memoryHospitals.find((item) => item._id.toString() === hospitalId.toString());
  if (h) {
    if (crowdLevel) h.crowdLevel = crowdLevel;
    if (typeof queueCount === 'number') h.activeQueueCount = queueCount;
    if (typeof waitMins === 'number') h.avgWaitTimeMinutes = waitMins;
  }
  return h;
}

export async function seedDatabase() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vetnest';

  console.log(`[Seed] Connecting to MongoDB at ${mongoURI}...`);
  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] Database connected. Wiping old collections...');

    await Hospital.deleteMany({});
    await User.deleteMany({});
    await Appointment.deleteMany({});

    // 1. Insert Hospitals
    const createdHospitals = await Hospital.insertMany(SEEDED_HOSPITALS);
    console.log(`[Seed] Created ${createdHospitals.length} Veterinary Hospitals across Bengaluru.`);

    // 2. Create 1 Staff User per Hospital
    const staffUsers = [];
    for (const h of createdHospitals) {
      const areaSlug = h.area.toLowerCase().replace(/\s+/g, '');
      staffUsers.push({
        name: `Staff - ${h.hospitalName}`,
        email: `staff.${areaSlug}@vetnest.app`,
        password: 'staff12345',
        role: 'HOSPITAL_STAFF',
        hospitalId: h._id,
      });
    }
    await User.create(staffUsers);
    console.log(`[Seed] Created ${staffUsers.length} Staff accounts bound strictly to their hospitalId.`);

    // 3. Create Default Pet Owner User
    const ownerUser = await User.create({
      name: 'Demo Pet Owner (Rahul Sharma)',
      email: 'owner@vetnest.app',
      password: 'owner12345',
      role: 'PET_OWNER',
      pets: [
        { petName: 'Bruno', species: 'Dog', breed: 'Golden Retriever', age: 3, weight: 28 },
        { petName: 'Misty', species: 'Cat', breed: 'Persian Cat', age: 2, weight: 4.5 },
      ],
    });
    console.log(`[Seed] Created Demo Pet Owner account (${ownerUser.email}).`);

    // 4. Seed Initial Appointments for each hospital
    const initialAppointments = [];
    for (let i = 0; i < createdHospitals.length; i++) {
      const h = createdHospitals[i];
      const petNames = ['Coco', 'Rocky', 'Simba', 'Luna', 'Max', 'Daisy', 'Pepper', 'Kiwi'];
      const speciesList = ['Dog', 'Dog', 'Cat', 'Cat', 'Bird', 'Rabbit'];

      for (let j = 0; j < 3; j++) {
        const petName = petNames[(i * 3 + j) % petNames.length];
        const species = speciesList[j % speciesList.length];
        const statusList = ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED'];
        const status = statusList[j % statusList.length];

        initialAppointments.push({
          hospitalId: h._id,
          ownerId: ownerUser._id,
          petName,
          species,
          triageLevel: j === 0 ? 'EMERGENCY' : j === 1 ? 'PRIORITY' : 'ROUTINE',
          status,
          tokenNumber: `VET-${100 + i * 10 + j}`,
          timeSlot: new Date(Date.now() - j * 1800000),
          chiefComplaint: j === 0 ? 'Acute dyspnea / trauma' : 'High fever & vomiting',
        });
      }
    }

    await Appointment.insertMany(initialAppointments);
    console.log(`[Seed] Created ${initialAppointments.length} initial appointments across hospitals.`);

    console.log(`\n======================================================`);
    console.log(`🐾 VetNest Bengaluru Monorepo Database Seeded Successfully!`);
    console.log(`🔑 Demo Credentials:`);
    console.log(`- Pet Owner: owner@vetnest.app / owner12345`);
    console.log(`- Indiranagar Staff: staff.indiranagar@vetnest.app / staff12345`);
    console.log(`- Koramangala Staff: staff.koramangala@vetnest.app / staff12345`);
    console.log(`======================================================\n`);

    if (process.argv[1]?.includes('seedAndSimulate.js')) {
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed Error]', err.message);
    if (process.argv[1]?.includes('seedAndSimulate.js')) {
      process.exit(1);
    }
  }
}

// Live Background Simulator Process (Triggers every 20 seconds)
export function startCrowdSimulator(io, intervalMs = 20000) {
  console.log(`[Live Simulator] Starting Bengaluru real-time OPD crowd heat-map background worker (Interval: ${intervalMs / 1000}s)...`);

  const CROWD_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

  setInterval(async () => {
    try {
      // Pick a random hospital from seeded list to fluctuate
      const randIdx = Math.floor(Math.random() * memoryHospitals.length);
      const target = memoryHospitals[randIdx];

      const newLevel = CROWD_LEVELS[Math.floor(Math.random() * CROWD_LEVELS.length)];
      const queueDelta = Math.floor(Math.random() * 7) - 3; // -3 to +3
      const newQueueCount = Math.max(1, (target.activeQueueCount || 10) + queueDelta);

      let newWait = 15;
      if (newLevel === 'LOW') newWait = Math.floor(Math.random() * 10) + 5;
      else if (newLevel === 'MODERATE') newWait = Math.floor(Math.random() * 15) + 15;
      else if (newLevel === 'HIGH') newWait = Math.floor(Math.random() * 25) + 30;
      else newWait = Math.floor(Math.random() * 30) + 55;

      target.crowdLevel = newLevel;
      target.activeQueueCount = newQueueCount;
      target.avgWaitTimeMinutes = newWait;

      // Update in MongoDB if connected
      if (mongoose.connection.readyState === 1) {
        try {
          await Hospital.findByIdAndUpdate(target._id, {
            crowdLevel: newLevel,
            activeQueueCount: newQueueCount,
            avgWaitTimeMinutes: newWait,
          });
        } catch (e) {
          // Ignore
        }
      }

      // Broadcast Socket.io event to all connected Pet Owner clients
      if (io) {
        io.emit('hospitalsUpdated', {
          updatedHospital: target,
          hospitals: memoryHospitals,
          message: `⚡ Live Crowd Fluctuation: ${target.hospitalName} is now ${newLevel} (${newQueueCount} waiting)`,
        });
      }

      console.log(`[Live Simulator] 🏥 ${target.area}: Crowd set to ${newLevel} | Waiting: ${newQueueCount} | Wait Time: ${newWait}m`);
    } catch (err) {
      console.error('[Live Simulator Error]', err.message);
    }
  }, intervalMs);
}

// Run seed if called directly via CLI
if (process.argv[1]?.includes('seedAndSimulate.js')) {
  seedDatabase();
}
