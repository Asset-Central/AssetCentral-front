export type Platform = 'cocos' | 'iol' | 'mercadopago' | 'nacion' | 'binance';

export type ConnectionStatus = 'active' | 'requires_reauthentication' | 'error';

export interface Account {
  id: string;
  platform: Platform;
  label?: string;
  connection_status: ConnectionStatus;
  last_sync: string | null;
  error_message?: string;
}

export interface CredentialField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'email';
  placeholder?: string;
}

export interface PlatformConfig {
  platform: Platform;
  display_name: string;
  logo_url: string;
  fields: CredentialField[];
}
