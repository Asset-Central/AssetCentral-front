import { apiFetch } from '@/lib/fetch';
import type { Portfolio, PortfolioSummary } from '@/types/portfolio';
import type { ValuePoint } from '@/types/asset';

const BASE = '/api/portfolios';

export async function fetchPortfolios(): Promise<Portfolio[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error(`Error fetching portfolios: ${res.status}`);
  return res.json();
}

export async function fetchPortfolioSummary(id: string): Promise<PortfolioSummary> {
  const res = await apiFetch(`${BASE}/${id}/summary`);
  if (!res.ok) throw new Error(`Error fetching portfolio summary: ${res.status}`);
  return res.json();
}

export async function createPortfolio(
  data: { name: string; description?: string; assets: { ticker: string; platform: string }[] }
): Promise<Portfolio> {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Error creating portfolio: ${res.status}`);
  return res.json();
}

export async function updatePortfolio(
  id: string,
  data: { name?: string; description?: string; assets?: { ticker: string; platform: string }[] }
): Promise<Portfolio> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Error updating portfolio: ${res.status}`);
  return res.json();
}

export async function deletePortfolio(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Error deleting portfolio: ${res.status}`);
}

export async function fetchPortfolioValueHistory(id: string, range = '30d'): Promise<ValuePoint[]> {
  const res = await apiFetch(`${BASE}/${id}/value-history?range=${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error(`Error fetching portfolio value history: ${res.status}`);
  return res.json();
}
