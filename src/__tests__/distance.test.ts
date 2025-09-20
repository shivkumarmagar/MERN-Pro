import { calculateDistance, isWithinRadius, formatDistance } from '@/lib/distance';

describe('Distance Utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // New York to Los Angeles (approximately 3944 km)
      const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      
      expect(distance).toBeCloseTo(3944, -2); // Within 100km accuracy
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-40.7128, -74.0060, 40.7128, 74.0060);
      
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true for points within radius', () => {
      const withinRadius = isWithinRadius(40.7128, -74.0060, 40.7138, -74.0070, 1);
      
      expect(withinRadius).toBe(true);
    });

    it('should return false for points outside radius', () => {
      const outsideRadius = isWithinRadius(40.7128, -74.0060, 40.7228, -74.0160, 1);
      
      expect(outsideRadius).toBe(false);
    });

    it('should handle edge case at exact radius', () => {
      const atRadius = isWithinRadius(40.7128, -74.0060, 40.7128, -74.0060, 0);
      
      expect(atRadius).toBe(true);
    });
  });

  describe('formatDistance', () => {
    it('should format distance less than 1km in meters', () => {
      const formatted = formatDistance(0.5);
      
      expect(formatted).toBe('500m');
    });

    it('should format distance greater than 1km in kilometers', () => {
      const formatted = formatDistance(5.5);
      
      expect(formatted).toBe('5.5km');
    });

    it('should handle zero distance', () => {
      const formatted = formatDistance(0);
      
      expect(formatted).toBe('0m');
    });
  });
});
