import { apiFetch } from '@/lib/fetch';
import type { Asset, AssetGroup, AssetType, InflationPoint, PerformancePoint, PricePoint, ValuePoint } from '@/types/asset';

const BASE = '/api/assets';

export async function fetchAssets(): Promise<Asset[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error(`Error fetching assets: ${res.status}`);
  return res.json();
}

export async function fetchAssetHistory(ticker: string, range = '30d'): Promise<PricePoint[]> {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(ticker)}/history?range=${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error(`Error fetching history: ${res.status}`);
  return res.json();
}

export async function fetchValueHistory(range = '30d'): Promise<ValuePoint[]> {
  const res = await apiFetch(`${BASE}/value-history?range=${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error(`Error fetching value history: ${res.status}`);
  return res.json();
}

export async function fetchPerformance(range = '30d'): Promise<PerformancePoint[]> {
  const res = await apiFetch(`${BASE}/performance?range=${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error(`Error fetching performance: ${res.status}`);
  return res.json();
}

export async function fetchInflation(currency: string): Promise<InflationPoint[]> {
  const res = await apiFetch(`${BASE}/inflation?currency=${encodeURIComponent(currency)}`);
  if (!res.ok) throw new Error(`Error fetching inflation: ${res.status}`);
  return res.json();
}

export function groupByType(assets: Asset[]): AssetGroup[] {
  const totalAll = assets.reduce((sum, a) => sum + (a.total_valuation ?? 0), 0);

  const map = new Map<AssetType, Asset[]>();
  for (const asset of assets) {
    const type: AssetType = asset.asset_type ?? 'stock';
    const group = map.get(type) ?? [];
    group.push(asset);
    map.set(type, group);
  }

  return Array.from(map.entries()).map(([type, items]) => {
    const groupTotal = items.reduce((sum, a) => sum + (a.total_valuation ?? 0), 0);
    return {
      type,
      total_valuation: groupTotal,
      percentage: totalAll > 0 ? (groupTotal / totalAll) * 100 : 0,
      assets: items,
    };
  });
}
