export interface TenantBranding {
  displayName?: string;
  logoUrl?: string;
  accentColor?: string;
}

export interface TenantFeatures {
  mundialHome?: boolean;
  miDesempenoHomeTile?: boolean;
  commercialGeoCheckIn?: boolean;
}

export interface TenantSecurity {
  mfaRequired?: boolean;
}

export interface TenantConfig {
  tenantId: string;
  areas: string[];
  branding?: TenantBranding;
  features?: TenantFeatures;
  security?: TenantSecurity;
}

export const DEFAULT_TENANT_SECURITY: TenantSecurity = {
  mfaRequired: false,
};

export const DEFAULT_TENANT_BRANDING: TenantBranding = {
  displayName: 'Roma',
  logoUrl: '/assets/images/roma.jpeg',
  accentColor: '#FDD05B',
};

export const DEFAULT_TENANT_FEATURES: TenantFeatures = {
  mundialHome: false,
  miDesempenoHomeTile: true,
  commercialGeoCheckIn: false,
};

export const EMPTY_TENANT_CONFIG: Omit<TenantConfig, 'tenantId'> = {
  areas: [],
  branding: { ...DEFAULT_TENANT_BRANDING },
  features: { ...DEFAULT_TENANT_FEATURES },
  security: { ...DEFAULT_TENANT_SECURITY },
};
