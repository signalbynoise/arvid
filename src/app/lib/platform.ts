type Platform = 'mac' | 'other';

let cachedPlatform: Platform | null = null;

export function getPlatform(): Platform {
  if (cachedPlatform) return cachedPlatform;
  if (typeof navigator === 'undefined') return 'other';

  const ua = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const platform = ua?.platform ?? navigator.platform ?? '';
  cachedPlatform = /mac/i.test(platform) ? 'mac' : 'other';
  return cachedPlatform;
}

export function isMac(): boolean {
  return getPlatform() === 'mac';
}

export function resetPlatformCache(): void {
  cachedPlatform = null;
}
