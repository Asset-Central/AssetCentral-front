export type AssetType = 'CEDEAR' | 'BONO' | 'FCI' | 'USD' | 'ACCION' | 'CRYPTO' | 'OTRO';

export type Platform = 'COCOS' | 'IOL' | 'MERCADO_PAGO' | 'PROMETEO';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: AssetType;
  platform: Platform;
  quantity: number;
  priceArs: number;
  priceUsd?: number;
  totalArs: number;
  totalUsd?: number;
  /** Variación porcentual del día */
  dailyChangePercent: number;
}

export interface AssetGroup {
  type: AssetType;
  totalArs: number;
  totalUsd?: number;
  percentage: number;
  assets: Asset[];
}
