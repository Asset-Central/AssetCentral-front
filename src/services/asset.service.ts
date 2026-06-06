import type { Asset, AssetGroup, AssetType } from '@/types/asset';

const BASE = '/api/assets';

export async function fetchAssets(): Promise<Asset[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Error fetching assets: ${res.status}`);
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
