import '@testing-library/jest-dom/vitest';

if (!import.meta.env.VITE_SUPABASE_URL) {
  (import.meta.env as Record<string, string>).VITE_SUPABASE_URL = 'https://test.supabase.co';
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  (import.meta.env as Record<string, string>).VITE_SUPABASE_ANON_KEY = 'eyJ0ZXN0IjoidGVzdCJ9.eyJ0ZXN0IjoidGVzdCJ9.test';
}
