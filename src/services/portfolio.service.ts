import { apiFetch } from '@/lib/fetch';
import type { Portfolio, PortfolioSummary } from '@/types/portfolio';

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
  data: Pick<Portfolio, 'name' | 'description' | 'asset_tickers'>
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
  data: Partial<Pick<Portfolio, 'name' | 'description' | 'asset_tickers'>>
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
