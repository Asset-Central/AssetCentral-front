import { createContext } from '@lit-labs/context';
import type { Asset } from '@/types/asset';
import type { LinkedAccount } from '@/types/account';
import type { Portfolio } from '@/types/portfolio';

export interface AppState {
  assets: Asset[];
  accounts: LinkedAccount[];
  portfolios: Portfolio[];
  isLoading: boolean;
  error: string | null;
  /** Valor total consolidado en ARS */
  totalArs: number;
  /** Valor total consolidado en USD */
  totalUsd: number;
}

export const initialState: AppState = {
  assets: [],
  accounts: [],
  portfolios: [],
  isLoading: false,
  error: null,
  totalArs: 0,
  totalUsd: 0,
};

export const appContext = createContext<AppState>('app-context');
