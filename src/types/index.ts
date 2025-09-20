import { User, DoctorProfile, Appointment, Availability, Payment, OTP, UserRole, AppointmentStatus, PaymentStatus, PaymentProvider, DayOfWeek } from '@prisma/client';

export type { User, DoctorProfile, Appointment, Availability, Payment, OTP, UserRole, AppointmentStatus, PaymentStatus, PaymentProvider, DayOfWeek };

// Extended types for API responses
export interface UserWithProfile extends User {
  doctorProfile?: DoctorProfile;
}

export interface DoctorWithProfile extends User {
  doctorProfile: DoctorProfile;
}

export interface AppointmentWithDetails extends Appointment {
  patient: User;
  doctor: DoctorProfile & { user: User };
  payments: Payment[];
}

export interface AvailabilityWithDoctor extends Availability {
  doctor: DoctorProfile & { user: User };
}

// API Request/Response types
export interface RegisterRequest {
  name: string;
  email: string;
  mobile: string;
}

export interface VerifyOTPRequest {
  mobile: string;
  code: string;
}

export interface LoginRequest {
  emailOrMobile: string;
  password: string;
}

export interface CreateDoctorProfileRequest {
  bio?: string;
  specialties: string[];
  clinicAddress: string;
  clinicLat: number;
  clinicLng: number;
  consultationFee: number;
  timezone?: string;
}

export interface CreateAvailabilityRequest {
  dayOfWeek?: DayOfWeek;
  date?: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  slotDurationMins?: number;
}

export interface SearchDoctorsRequest {
  specialty?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  q?: string; // search query
  page?: number;
  limit?: number;
}

export interface BookAppointmentRequest {
  doctorId: string;
  startAt: string; // ISO string
  endAt: string; // ISO string
  paymentMethod: string;
}

export interface LockSlotRequest {
  doctorId: string;
  startAt: string; // ISO string
  endAt: string; // ISO string
}

// Utility types
export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  available: boolean;
}

export interface AvailableSlots {
  date: string; // YYYY-MM-DD format
  slots: TimeSlot[];
}

export interface DistanceInfo {
  distance: number; // in kilometers
  duration?: number; // in minutes
}

export interface DoctorSearchResult extends DoctorProfile {
  user: User;
  distance?: DistanceInfo;
}

// Notification types
export interface NotificationData {
  type: 'booking_confirmation' | 'booking_reminder' | 'booking_cancellation' | 'payment_success' | 'payment_failed';
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentTime: string;
  patientName: string;
  doctorName: string;
  clinicAddress: string;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
