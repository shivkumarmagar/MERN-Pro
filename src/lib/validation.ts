import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const userIdSchema = z.string().min(3, 'User ID must be at least 3 characters').max(20, 'User ID must be at most 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'User ID can only contain letters, numbers, and underscores');

// Auth schemas
export const registerSchema = z.object({
  userId: userIdSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  userIdOrEmail: z.string().min(1, 'User ID or email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Doctor profile schemas
export const createDoctorProfileSchema = z.object({
  bio: z.string().optional(),
  specialties: z.array(z.string()).min(1, 'At least one specialty is required'),
  clinicAddress: z.string().min(10, 'Clinic address must be at least 10 characters'),
  clinicLat: z.number().min(-90).max(90),
  clinicLng: z.number().min(-180).max(180),
  consultationFee: z.number().min(0, 'Consultation fee must be positive'),
  timezone: z.string().optional().default('UTC'),
});

export const updateDoctorProfileSchema = createDoctorProfileSchema.partial();

// Availability schemas
export const createAvailabilitySchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  slotDurationMins: z.number().min(15).max(120).default(30),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    const start = new Date(`2000-01-01T${data.startTime}:00`);
    const end = new Date(`2000-01-01T${data.endTime}:00`);
    return start < end;
  }
  return true;
}, 'End time must be after start time');

// Search schemas
export const searchDoctorsSchema = z.object({
  specialty: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(1).max(100).default(50),
  q: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Booking schemas
export const lockSlotSchema = z.object({
  doctorId: z.string().cuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().cuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

// Appointment management schemas
export const cancelAppointmentSchema = z.object({
  reason: z.string().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Utility functions
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateDataSafe<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
