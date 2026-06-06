/**
 * Wrapper de fetch que inyecta automáticamente el JWT de Supabase
 * en el header Authorization de cada request al backend.
 */
import { supabase } from './supabase';

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const apiBase = import.meta.env.VITE_API_URL || '';
  const targetUrl = apiBase
    ? `${apiBase.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
    : url;

  return fetch(targetUrl, { ...init, headers });
}
