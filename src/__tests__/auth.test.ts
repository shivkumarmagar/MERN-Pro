import { hashPassword, verifyPassword, generateAccessToken, verifyAccessToken } from '@/lib/auth';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testpassword123';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);
      
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hashed);
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'PATIENT' as const,
      };
      
      const token = generateAccessToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'PATIENT' as const,
      };
      
      const token = generateAccessToken(payload);
      const verified = verifyAccessToken(token);
      
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe(payload.role);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const verified = verifyAccessToken(invalidToken);
      
      expect(verified).toBeNull();
    });
  });
});
