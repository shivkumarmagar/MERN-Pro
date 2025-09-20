import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake_secret';
process.env.TWILIO_ACCOUNT_SID = 'fake_account_sid';
process.env.TWILIO_AUTH_TOKEN = 'fake_auth_token';
process.env.TWILIO_PHONE_NUMBER = '+1234567890';
process.env.SENDGRID_API_KEY = 'fake_sendgrid_key';
process.env.GOOGLE_MAPS_API_KEY = 'fake_google_maps_key';
process.env.REDIS_URL = 'redis://localhost:6379';
