import { apiFetch } from '@/lib/fetch';
import type { MarketPricePoint, MarketQuote } from '@/types/market';

const BASE = '/api/market';

export async function searchMarket(query: string): Promise<MarketQuote[]> {
  const res = await apiFetch(`${BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Error searching market: ${res.status}`);
  return res.json();
}

export async function fetchMarketQuote(ticker: string): Promise<MarketQuote> {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(ticker)}/quote`);
  if (!res.ok) throw new Error(`Error fetching quote: ${res.status}`);
  return res.json();
}

export async function fetchMarketHistory(ticker: string, range = '30d'): Promise<MarketPricePoint[]> {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(ticker)}/history?range=${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error(`Error fetching market history: ${res.status}`);
  return res.json();
}
