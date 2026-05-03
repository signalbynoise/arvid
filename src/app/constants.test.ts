import { describe, it, expect } from 'vitest';
import { API_BASE } from './constants';

describe('constants', () => {
  it('API_BASE is a valid path string', () => {
    expect(API_BASE).toBe('/api');
  });
});
