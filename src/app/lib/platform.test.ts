import { describe, it, expect, beforeEach } from 'vitest';
import { getPlatform, isMac, resetPlatformCache } from './platform';

describe('platform utilities', () => {
  beforeEach(() => {
    resetPlatformCache();
  });

  describe('getPlatform', () => {
    it('returns mac for macOS platform string', () => {
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
      expect(getPlatform()).toBe('mac');
    });

    it('returns other for Windows platform string', () => {
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
      expect(getPlatform()).toBe('other');
    });

    it('returns other for Linux platform string', () => {
      Object.defineProperty(navigator, 'platform', { value: 'Linux x86_64', configurable: true });
      expect(getPlatform()).toBe('other');
    });

    it('caches the result after first call', () => {
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
      expect(getPlatform()).toBe('mac');

      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
      expect(getPlatform()).toBe('mac');
    });

    it('cache can be reset', () => {
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
      expect(getPlatform()).toBe('mac');

      resetPlatformCache();
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
      expect(getPlatform()).toBe('other');
    });
  });

  describe('isMac', () => {
    it('returns true on macOS', () => {
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
      expect(isMac()).toBe(true);
    });

    it('returns false on Windows', () => {
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
      expect(isMac()).toBe(false);
    });
  });
});
