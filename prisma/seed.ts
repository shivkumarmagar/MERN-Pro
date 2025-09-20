import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      userId: 'admin',
      name: 'Admin User',
      email: 'admin@doctorapp.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create sample patients
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patients = await Promise.all([
    prisma.user.create({
      data: {
        userId: 'john_doe',
        name: 'John Doe',
        email: 'patient1@example.com',
        passwordHash: patientPassword,
        role: 'PATIENT',
      },
    }),
    prisma.user.create({
      data: {
        userId: 'jane_smith',
        name: 'Jane Smith',
        email: 'patient2@example.com',
        passwordHash: patientPassword,
        role: 'PATIENT',
      },
    }),
  ]);

  // Create sample doctors
  const doctorPassword = await bcrypt.hash('doctor123', 12);
  const doctors = await Promise.all([
    prisma.user.create({
      data: {
        userId: 'dr_smith',
        name: 'Dr. Sarah Smith',
        email: 'dr.smith@example.com',
        passwordHash: doctorPassword,
        role: 'DOCTOR',
      },
    }),
    prisma.user.create({
      data: {
        userId: 'dr_johnson',
        name: 'Dr. Michael Johnson',
        email: 'dr.johnson@example.com',
        passwordHash: doctorPassword,
        role: 'DOCTOR',
      },
    }),
    prisma.user.create({
      data: {
        userId: 'dr_wilson',
        name: 'Dr. Emily Wilson',
        email: 'dr.wilson@example.com',
        passwordHash: doctorPassword,
        role: 'DOCTOR',
      },
    }),
  ]);

  // Create doctor profiles
  const doctorProfiles = await Promise.all([
    prisma.doctorProfile.create({
      data: {
        userId: doctors[0].id,
        bio: 'Experienced cardiologist with over 10 years of practice. Specializing in preventive cardiology and interventional procedures.',
        specialties: JSON.stringify(['Cardiology', 'Internal Medicine']),
        clinicAddress: '123 Heart Street, Medical District, NY 10001',
        clinicLat: 40.7589,
        clinicLng: -73.9851,
        consultationFee: 200,
        timezone: 'America/New_York',
      },
    }),
    prisma.doctorProfile.create({
      data: {
        userId: doctors[1].id,
        bio: 'Board-certified dermatologist specializing in skin cancer detection and cosmetic dermatology.',
        specialties: JSON.stringify(['Dermatology', 'Cosmetic Surgery']),
        clinicAddress: '456 Skin Avenue, Beauty Plaza, NY 10002',
        clinicLat: 40.7614,
        clinicLng: -73.9776,
        consultationFee: 150,
        timezone: 'America/New_York',
      },
    }),
    prisma.doctorProfile.create({
      data: {
        userId: doctors[2].id,
        bio: 'Pediatrician with a focus on child development and preventive care. Passionate about helping children grow healthy and strong.',
        specialties: JSON.stringify(['Pediatrics', 'Child Development']),
        clinicAddress: '789 Kids Boulevard, Family Center, NY 10003',
        clinicLat: 40.7505,
        clinicLng: -73.9934,
        consultationFee: 120,
        timezone: 'America/New_York',
      },
    }),
  ]);

  // Create availability for doctors
  const availabilityData = [
    // Dr. Smith (Cardiologist) - Monday to Friday, 9 AM to 5 PM
    {
      doctorId: doctorProfiles[0].id,
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMins: 30,
    },
    {
      doctorId: doctorProfiles[0].id,
      dayOfWeek: 'TUESDAY',
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMins: 30,
    },
    {
      doctorId: doctorProfiles[0].id,
      dayOfWeek: 'WEDNESDAY',
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMins: 30,
    },
    {
      doctorId: doctorProfiles[0].id,
      dayOfWeek: 'THURSDAY',
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMins: 30,
    },
    {
      doctorId: doctorProfiles[0].id,
      dayOfWeek: 'FRIDAY',
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMins: 30,
    },
    // Dr. Johnson (Dermatologist) - Monday, Wednesday, Friday, 10 AM to 6 PM
    {
      doctorId: doctorProfiles[1].id,
      dayOfWeek: 'MONDAY',
      startTime: '10:00',
      endTime: '18:00',
      slotDurationMins: 45,
    },
    {
      doctorId: doctorProfiles[1].id,
      dayOfWeek: 'WEDNESDAY',
      startTime: '10:00',
      endTime: '18:00',
      slotDurationMins: 45,
    },
    {
      doctorId: doctorProfiles[1].id,
      dayOfWeek: 'FRIDAY',
      startTime: '10:00',
      endTime: '18:00',
      slotDurationMins: 45,
    },
    // Dr. Wilson (Pediatrician) - Tuesday, Thursday, Saturday, 8 AM to 4 PM
    {
      doctorId: doctorProfiles[2].id,
      dayOfWeek: 'TUESDAY',
      startTime: '08:00',
      endTime: '16:00',
      slotDurationMins: 30,
    },
    {
      doctorId: doctorProfiles[2].id,
      dayOfWeek: 'THURSDAY',
      startTime: '08:00',
      endTime: '16:00',
      slotDurationMins: 30,
    },
    {
      doctorId: doctorProfiles[2].id,
      dayOfWeek: 'SATURDAY',
      startTime: '08:00',
      endTime: '16:00',
      slotDurationMins: 30,
    },
  ];

  for (const availability of availabilityData) {
    await prisma.availability.create({
      data: availability,
    });
  }

  // Create sample appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(14, 0, 0, 0);

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctorProfiles[0].id,
        startAt: tomorrow,
        endAt: new Date(tomorrow.getTime() + 30 * 60 * 1000), // 30 minutes later
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        amount: 200,
        currency: 'USD',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctorProfiles[1].id,
        startAt: dayAfter,
        endAt: new Date(dayAfter.getTime() + 45 * 60 * 1000), // 45 minutes later
        status: 'PENDING',
        paymentStatus: 'PENDING',
        amount: 150,
        currency: 'USD',
      },
    }),
  ]);

  // Create sample payments
  await prisma.payment.create({
    data: {
      appointmentId: appointments[0].id,
      paymentProvider: 'STRIPE',
      providerPaymentId: 'pi_sample_payment_intent_1',
      status: 'succeeded',
      amount: 200,
      currency: 'USD',
    },
  });

  await prisma.payment.create({
    data: {
      appointmentId: appointments[1].id,
      paymentProvider: 'STRIPE',
      providerPaymentId: 'pi_sample_payment_intent_2',
      status: 'pending',
      amount: 150,
      currency: 'USD',
    },
  });

  console.log('✅ Database seeding completed!');
  console.log('📊 Created:');
  console.log(`  - 1 admin user (admin@doctorapp.com / admin123, userId: admin)`);
  console.log(`  - 2 patients (patient1@example.com / patient123, patient2@example.com / patient123)`);
  console.log(`  - 3 doctors with profiles (userId: dr_smith, dr_johnson, dr_wilson)`);
  console.log(`  - ${availabilityData.length} availability slots`);
  console.log(`  - 2 sample appointments`);
  console.log(`  - 2 sample payments`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
