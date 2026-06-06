import type { Platform } from './asset';

export type AccountStatus = 'CONNECTED' | 'ERROR' | 'PENDING' | 'DISCONNECTED';

export interface LinkedAccount {
  id: string;
  platform: Platform;
  label: string;
  status: AccountStatus;
  lastSyncAt: string | null;
  errorMessage?: string;
}

export interface CredentialField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'email';
  placeholder?: string;
}

export interface PlatformConfig {
  platform: Platform;
  displayName: string;
  logoUrl: string;
  fields: CredentialField[];
}
