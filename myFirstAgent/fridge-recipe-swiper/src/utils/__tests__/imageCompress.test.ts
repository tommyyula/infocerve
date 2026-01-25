import { describe, it, expect } from 'vitest';
import { shouldCompress, compressImage } from '../imageCompress';

describe('imageCompress', () => {
  describe('shouldCompress', () => {
    it('should return true for files > 5MB', () => {
      expect(shouldCompress(6 * 1024 * 1024)).toBe(true);
      expect(shouldCompress(10 * 1024 * 1024)).toBe(true);
    });

    it('should return false for files <= 5MB', () => {
      expect(shouldCompress(5 * 1024 * 1024)).toBe(false);
      expect(shouldCompress(1 * 1024 * 1024)).toBe(false);
      expect(shouldCompress(0)).toBe(false);
    });

    it('should return false for files exactly at threshold', () => {
      expect(shouldCompress(5 * 1024 * 1024)).toBe(false);
    });

    it('should return true for files just over threshold', () => {
      expect(shouldCompress(5 * 1024 * 1024 + 1)).toBe(true);
    });
  });

  describe('compressImage', () => {
    it('should return original file if no compression needed', async () => {
      const smallFile = new File(['x'.repeat(1000)], 'small.jpg', {
        type: 'image/jpeg',
      });

      const result = await compressImage(smallFile);
      expect(result).toBe(smallFile);
    });

    // Note: Full compression test requires canvas mock which is complex
    // In a real scenario, we would use a proper image testing library
    // or mock the canvas API
  });
});
