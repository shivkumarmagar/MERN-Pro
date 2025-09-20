# Doctor Appointment Application

A production-ready full-stack doctor appointment booking system built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

### Core Functionality
- **Patient Registration & Mobile Verification**: SMS OTP verification using Twilio
- **Doctor Registration & Profile Management**: Complete doctor profiles with specialties and availability
- **Advanced Search**: Find doctors by specialty, location, and distance
- **Real-time Booking**: Calendar-based slot selection with timezone handling
- **Concurrency-Safe Booking**: Prevents double-bookings with slot locking
- **Secure Payments**: Stripe integration with Payment Intents
- **Location Services**: Google Maps integration for address autocomplete and distance calculation
- **Notifications**: SMS and email notifications for bookings, reminders, and cancellations
- **Admin Dashboard**: Complete admin panel for managing appointments and refunds

### Technical Features
- **TypeScript**: Full type safety across the stack
- **Prisma ORM**: Type-safe database operations with migrations
- **JWT Authentication**: Secure authentication with refresh tokens
- **Rate Limiting**: API rate limiting for security
- **Comprehensive Testing**: Unit and integration tests with Jest
- **Docker Support**: Complete containerization setup
- **CI/CD**: GitHub Actions for automated testing and deployment

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Hook Form** for form management

### Backend
- **Next.js API Routes** for backend logic
- **Prisma ORM** for database operations
- **PostgreSQL** as the primary database
- **Redis** for slot locking (optional)

### External Services
- **Stripe** for payment processing
- **Twilio** for SMS notifications
- **SendGrid** for email notifications
- **Google Maps API** for location services

### Development & Testing
- **Jest** for testing
- **React Testing Library** for component testing
- **Docker** for containerization
- **GitHub Actions** for CI/CD

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis (optional, for slot locking)
- Docker (optional)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd doctor-appointment-app
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp env.example .env.local
```

4. Update `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/doctor_appointments?schema=public"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Twilio SMS
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"

# SendGrid Email
SENDGRID_API_KEY="SG..."

# Google Maps
GOOGLE_MAPS_API_KEY="AIza..."
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."

# Server Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SERVER_URL="http://localhost:3000"
NODE_ENV="development"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### Database Setup

1. Create the database:
```bash
createdb doctor_appointments
```

2. Run migrations:
```bash
npm run db:migrate
```

3. Seed the database:
```bash
npm run db:seed
```

### Development

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Development

1. Start all services:
```bash
docker-compose up
```

2. The application will be available at [http://localhost:3000](http://localhost:3000)

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+1234567890"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "+1234567890",
  "code": "123456"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "emailOrMobile": "john@example.com",
  "password": "password123"
}
```

### Doctor Endpoints

#### Search Doctors
```http
GET /api/doctors/search?specialty=Cardiology&lat=40.7589&lng=-73.9851&radiusKm=50&page=1&limit=20
```

#### Get Doctor Profile
```http
GET /api/doctors/{doctorId}
```

#### Get Doctor Availability
```http
GET /api/doctors/{doctorId}/availability?date=2024-01-15
```

### Appointment Endpoints

#### Lock Slot
```http
POST /api/appointments/lock-slot
Authorization: Bearer {token}
Content-Type: application/json

{
  "doctorId": "doctor_id",
  "startAt": "2024-01-15T10:00:00Z",
  "endAt": "2024-01-15T10:30:00Z"
}
```

#### Book Appointment
```http
POST /api/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "doctorId": "doctor_id",
  "startAt": "2024-01-15T10:00:00Z",
  "endAt": "2024-01-15T10:30:00Z",
  "paymentMethod": "card"
}
```

#### Cancel Appointment
```http
POST /api/appointments/{appointmentId}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Schedule conflict"
}
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
The project maintains 70%+ test coverage across all modules.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker Production

1. Build the production image:
```bash
docker build -t doctor-appointment-app .
```

2. Run with docker-compose:
```bash
docker-compose -f docker-compose.prod.yml up
```

### Environment Variables for Production

Ensure all environment variables are set in your production environment:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET` & `JWT_REFRESH_SECRET`: Secure random strings
- `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`: Stripe credentials
- `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`: Twilio credentials
- `SENDGRID_API_KEY`: SendGrid API key
- `GOOGLE_MAPS_API_KEY`: Google Maps API key

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Zod schema validation for all inputs
- **CORS Protection**: Proper CORS configuration
- **SQL Injection Prevention**: Prisma ORM prevents SQL injection
- **XSS Protection**: React's built-in XSS protection

## Database Schema

### Core Tables
- `users`: User accounts (patients, doctors, admins)
- `doctor_profiles`: Doctor-specific information
- `availability`: Doctor availability schedules
- `appointments`: Appointment bookings
- `payments`: Payment records
- `otps`: OTP verification codes
- `appointment_locks`: Slot locking for concurrency

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@doctorapp.com or create an issue in the repository.

## Changelog

### v1.0.0
- Initial release
- Complete doctor appointment booking system
- Stripe payment integration
- SMS and email notifications
- Admin dashboard
- Comprehensive testing suite
