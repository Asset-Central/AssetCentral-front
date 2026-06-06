import type { Asset, AssetGroup, AssetType } from '@/types/asset';

const BASE = '/api/assets';

export async function fetchAssets(): Promise<Asset[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Error fetching assets: ${res.status}`);
  return res.json();
}

export function groupByType(assets: Asset[]): AssetGroup[] {
  const totalArs = assets.reduce((sum, a) => sum + a.totalArs, 0);

  const map = new Map<AssetType, Asset[]>();
  for (const asset of assets) {
    const group = map.get(asset.type) ?? [];
    group.push(asset);
    map.set(asset.type, group);
  }

  return Array.from(map.entries()).map(([type, items]) => {
    const groupTotal = items.reduce((sum, a) => sum + a.totalArs, 0);
    return {
      type,
      totalArs: groupTotal,
      percentage: totalArs > 0 ? (groupTotal / totalArs) * 100 : 0,
      assets: items,
    };
  });
}
