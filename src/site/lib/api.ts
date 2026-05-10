import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function publicGet<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }

  return response.json();
}

export async function adminRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers = await getAuthHeaders();
  headers['Content-Type'] = 'application/json';

  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error ?? `Request failed: ${response.status}`);
  }

  return response.json();
}
