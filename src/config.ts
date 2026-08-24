import { Environment, NETTEFATURA_ENDPOINTS } from './constants/endpoints.js';

export interface ServiceEndpoints {
  invoiceService: string;
  invoiceServiceWsdl?: string;
  addressBookService: string;
  addressBookServiceWsdl?: string;
  portalUrl?: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LoggerFunction = (level: LogLevel, message: string, data?: unknown) => void;

export interface NetteFaturaConfig {
  /**
   * Firmanızın Vergi Kimlik Numarası (VKN) veya TCKN
   */
  companyTaxCode: string;

  /**
   * Firma Şube / Bayi / Vendor Numarası (Varsa)
   */
  companyVendorNumber?: string;

  /**
   * Çalışma ortamı ('test' veya 'production'). Varsayılan: 'test'
   */
  environment?: Environment;

  /**
   * Özel endpoint tanımları (Varsayılan URL'leri ezmek için)
   */
  customEndpoints?: Partial<ServiceEndpoints>;

  /**
   * İstek zaman aşımı süresi (milisaniye cinsinden). Varsayılan: 60000ms (60sn)
   */
  timeout?: number;

  /**
   * Debug modunu etkinleştirir (Giden/Gelen XML'leri loglar)
   */
  debug?: boolean;

  /**
   * Özel logger fonksiyonu
   */
  logger?: LoggerFunction;

  /**
   * HTTP Headers
   */
  headers?: Record<string, string>;
}

export interface ResolvedNetteFaturaConfig {
  companyTaxCode: string;
  companyVendorNumber?: string;
  environment: Environment;
  endpoints: ServiceEndpoints;
  timeout: number;
  debug: boolean;
  logger: LoggerFunction;
  headers: Record<string, string>;
}

const defaultLogger: LoggerFunction = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const prefix = `[NetteFatura ${timestamp}] [${level.toUpperCase()}]:`;
  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
};

export function resolveConfig(config: NetteFaturaConfig): ResolvedNetteFaturaConfig {
  const environment = config.environment ?? 'test';
  const defaultEndpoints = NETTEFATURA_ENDPOINTS[environment];

  const endpoints: ServiceEndpoints = {
    invoiceService: config.customEndpoints?.invoiceService ?? defaultEndpoints.invoiceService,
    invoiceServiceWsdl: config.customEndpoints?.invoiceServiceWsdl ?? defaultEndpoints.invoiceServiceWsdl,
    addressBookService: config.customEndpoints?.addressBookService ?? defaultEndpoints.addressBookService,
    addressBookServiceWsdl: config.customEndpoints?.addressBookServiceWsdl ?? defaultEndpoints.addressBookServiceWsdl,
    portalUrl: config.customEndpoints?.portalUrl ?? defaultEndpoints.portalUrl,
  };

  return {
    companyTaxCode: config.companyTaxCode,
    companyVendorNumber: config.companyVendorNumber,
    environment,
    endpoints,
    timeout: config.timeout ?? 60000,
    debug: config.debug ?? false,
    logger: config.logger ?? defaultLogger,
    headers: config.headers ?? {},
  };
}
