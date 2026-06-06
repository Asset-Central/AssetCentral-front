import { createContext } from '@lit-labs/context';
import type { Session, User } from '@supabase/supabase-js';
import type { Asset } from '@/types/asset';
import type { Account } from '@/types/account';
import type { Portfolio } from '@/types/portfolio';

export interface AppState {
  session: Session | null;
  user: User | null;
  assets: Asset[];
  accounts: Account[];
  portfolios: Portfolio[];
  isLoading: boolean;
  error: string | null;
  /** Valuación total en ARS (activos con currency === 'ARS') */
  totalArs: number;
  /** Valuación total en USD (activos con currency === 'USD') */
  totalUsd: number;
}

export const initialState: AppState = {
  session: null,
  user: null,
  assets: [],
  accounts: [],
  portfolios: [],
  isLoading: false,
  error: null,
  totalArs: 0,
  totalUsd: 0,
};

export const appContext = createContext<AppState>('app-context');
