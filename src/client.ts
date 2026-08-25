import { NetteFaturaConfig, resolveConfig, ResolvedNetteFaturaConfig } from './config.js';
import { SoapClient } from './core/soap-client.js';
import { InvoiceService } from './services/invoice.service.js';
import { AddressBookService } from './services/address-book.service.js';
import { InvoiceBuilder, ArchiveInvoiceBuilder } from './builders/invoice.builder.js';

export class NetteFaturaClient {
  public readonly config: ResolvedNetteFaturaConfig;
  public readonly soapClient: SoapClient;

  /**
   * e-Fatura, e-Arşiv, Bakiye ve Fatura Sorgulama Servisleri
   */
  public readonly invoice: InvoiceService;

  /**
   * GİB e-Fatura Mükellefiyet, Vergi Daireleri ve Adres Defteri Servisleri
   */
  public readonly addressBook: AddressBookService;

  constructor(config: NetteFaturaConfig) {
    this.config = resolveConfig(config);
    this.soapClient = new SoapClient(this.config);

    this.invoice = new InvoiceService(this.config, this.soapClient);
    this.addressBook = new AddressBookService(this.config, this.soapClient);
  }

  /**
   * Hızlı Fatura Oluşturucu (Fluent Builder) başlatır
   */
  public createInvoice(): InvoiceBuilder {
    return new InvoiceBuilder();
  }

  /**
   * Hızlı e-Arşiv Fatura Oluşturucu (Fluent Builder) başlatır
   */
  public createArchiveInvoice(): ArchiveInvoiceBuilder {
    return new ArchiveInvoiceBuilder();
  }

  /**
   * Kısayol: Servis sağlık kontrolü
   */
  public async healthCheck(): Promise<string> {
    return this.invoice.healthCheck();
  }

  /**
   * İşNet NetteFatura canlıya geçiş için gerekli SOAP Request, Response ve UBL XML paketini üretir.
   */
  public async generateGoLivePackage(options?: {
    supplierName?: string;
    staticIp?: string;
    taxOffice?: string;
    city?: string;
    address?: string;
  }) {
    const { generateGoLivePackage } = await import('./tools/go-live.tool.js');
    return generateGoLivePackage({
      supplier: {
        vkn: this.config.companyTaxCode,
        name: options?.supplierName || 'Müşteri',
        taxOffice: options?.taxOffice,
        city: options?.city,
        address: options?.address,
      },
      staticIp: options?.staticIp,
    });
  }

  /**
   * Kısayol: Firma kontör / bakiye sorgulama
   */
  public async getBalance() {
    return this.invoice.getCompanyBalance();
  }

  /**
   * Kısayol: VKN / TCKN ile GİB e-Fatura mükellefiyet sorgulama
   */
  public async getTaxPayer(taxCode: string) {
    return this.addressBook.getTaxPayer(taxCode);
  }
}
