import { validateData, validateDataSafe, registerSchema, loginSchema } from '@/lib/validation';

describe('Validation', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        mobile: '+1234567890',
      };
      
      const result = validateData(registerSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        mobile: '+1234567890',
      };
      
      expect(() => validateData(registerSchema, invalidData)).toThrow();
    });

    it('should throw error for invalid mobile', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        mobile: '1234567890', // Missing country code
      };
      
      expect(() => validateData(registerSchema, invalidData)).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        emailOrMobile: 'john@example.com',
        password: 'password123',
      };
      
      const result = validateData(loginSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for missing password', () => {
      const invalidData = {
        emailOrMobile: 'john@example.com',
        password: '',
      };
      
      expect(() => validateData(loginSchema, invalidData)).toThrow();
    });
  });

  describe('validateDataSafe', () => {
    it('should return success for valid data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        mobile: '+1234567890',
      };
      
      const result = validateDataSafe(registerSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should return error for invalid data', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        mobile: '+1234567890',
      };
      
      const result = validateDataSafe(registerSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
    });
  });
});
