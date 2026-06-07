import { apiFetch } from '@/lib/fetch';
import type { Account, PlatformConfig } from '@/types/account';

const BASE = '/api/accounts';

export async function fetchAccounts(): Promise<Account[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error(`Error fetching accounts: ${res.status}`);
  return res.json();
}

export async function linkAccount(
  platform: string,
  nombre: string,
  credentials: Record<string, string>
): Promise<Account> {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify({ platform, nombre, credentials }),
  });
  if (res.status === 422) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? 'Credenciales inválidas');
  }
  if (!res.ok) throw new Error(`Error al vincular cuenta (${res.status})`);
  return res.json();
}

export async function unlinkAccount(accountId: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${accountId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Error unlinking account: ${res.status}`);
}

export async function fetchPlatformConfigs(): Promise<PlatformConfig[]> {
  const res = await apiFetch(`${BASE}/platforms`);
  if (!res.ok) throw new Error(`Error fetching platform configs: ${res.status}`);
  return res.json();
}
