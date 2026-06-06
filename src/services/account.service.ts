import type { LinkedAccount, PlatformConfig } from '@/types/account';

const BASE = '/api/accounts';

export async function fetchAccounts(): Promise<LinkedAccount[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Error fetching accounts: ${res.status}`);
  return res.json();
}

export async function linkAccount(
  platform: string,
  credentials: Record<string, string>
): Promise<LinkedAccount> {
  const res = await fetch(`${BASE}/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, credentials }),
  });
  if (!res.ok) throw new Error(`Error linking account: ${res.status}`);
  return res.json();
}

export async function unlinkAccount(accountId: string): Promise<void> {
  const res = await fetch(`${BASE}/${accountId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Error unlinking account: ${res.status}`);
}

export async function fetchPlatformConfigs(): Promise<PlatformConfig[]> {
  const res = await fetch(`${BASE}/platforms`);
  if (!res.ok) throw new Error(`Error fetching platform configs: ${res.status}`);
  return res.json();
}
