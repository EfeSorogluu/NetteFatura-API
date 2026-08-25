import axios from 'axios';
import { NetteFaturaClient } from '../client.js';
import { Currency, InvoiceType, ScenarioType } from '../constants/enums.js';
import { buildSoapEnvelope } from '../core/xml-parser.js';
import { buildUblTrInvoiceXml, SupplierPartyInfo } from '../builders/ubl.builder.js';
import { NetteFaturaError } from '../core/soap-fault.js';

export interface GoLivePackageOptions {
  /**
   * Satıcı (Sizin) Firma Bilgileri
   */
  supplier: {
    vkn: string;
    name: string;
    email?: string;
    taxOffice?: string;
    city?: string;
    town?: string;
    address?: string;
  };
  /**
   * Statik Dış IP Adresiniz (İşNet'e bildirilecek IP)
   */
  staticIp?: string;
  /**
   * Test ortamı SOAP InvoiceService endpoint'i (Varsayılan: İşNet Test)
   */
  endpoint?: string;
}

export interface GoLivePackageResult {
  success: boolean;
  invoiceNumber?: string;
  ettn?: string;
  requestXml: string;
  responseXml: string;
  ublXml: string;
  emailTemplate: string;
  errorMessage?: string;
}

/**
 * İşNet NetteFatura canlı ortama geçiş için gerekli SOAP Request, SOAP Response,
 * UBL-TR 1.2 XML dosyalarını ve hazır e-posta şablonunu otomatik üreten yardımcı araç.
 */
export async function generateGoLivePackage(
  options: GoLivePackageOptions
): Promise<GoLivePackageResult> {
  const testVkn = '4810173324'; // İşNet test VKN
  const client = new NetteFaturaClient({
    companyTaxCode: testVkn,
    environment: 'test',
  });

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // 1. Canlıya Geçiş İçin Geçerli Test e-Arşiv Faturasını Oluştur
  const archiveInvoice = client
    .createArchiveInvoice()
    .setCurrency(Currency.TRY)
    .setType(InvoiceType.SATIS)
    .setInvoiceDate(dateStr)
    .setExternalCode(`EXT-${Date.now()}`)
    .setReceiver(
      options.supplier.name || 'Müşteri',
      options.supplier.vkn,
      options.supplier.email || 'efatura@isnet.net.tr',
      {
        CityCode: '34',
        CityName: options.supplier.city || 'İSTANBUL',
        TownCode: '1231',
        TownName: options.supplier.town || 'Merkez',
        CountryName: 'TÜRKİYE',
      }
    )
    .addLine({
      name: 'Yazılım Entegrasyon ve Web Servis Hizmet Bedeli',
      unitPrice: 1500,
      quantity: 1,
      vatRate: 20,
      productCode: 'SRV-001',
    })
    .addLine({
      name: 'Bulut API Lisansı',
      unitPrice: 500,
      quantity: 1,
      vatRate: 20,
      discountRate: 10,
      productCode: 'LIC-002',
    })
    .addNote('İşNet NetteFatura Canlıya Geçiş Test Faturasıdır.')
    .setOrder(`SIP-${Date.now()}`, dateStr)
    .build();

  // 2. SOAP Request XML Zarfını Hazırla
  const innerPayload = {
    CompanyTaxCode: testVkn,
    ArchiveInvoices: [archiveInvoice],
  };
  const requestXml = buildSoapEnvelope('SendArchiveInvoice', innerPayload);

  // 3. SOAP Servisine İlet
  const endpoint =
    options.endpoint ||
    'https://einvoiceservicetest.isnet.net.tr/InvoiceService/ServiceContract/InvoiceService.svc';
  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    SOAPAction: 'http://tempuri.org/IInvoiceService/SendArchiveInvoice',
  };

  let responseXml = '';
  let invoiceNumber = '';
  let ettn = archiveInvoice.ETTN;
  let success = false;
  let errorMessage: string | undefined;

  try {
    const res = await axios.post(endpoint, requestXml, {
      headers,
      responseType: 'text',
      timeout: 30000,
    });
    responseXml = res.data;

    // Response içinden Fatura Numarası ve ETTN çek
    const numberMatch = responseXml.match(/<a:ArchiveInvoiceNumber>([^<]+)<\/a:ArchiveInvoiceNumber>/);
    if (numberMatch) {
      invoiceNumber = numberMatch[1];
    }
    const ettnMatch = responseXml.match(/<a:Ettn>([^<]+)<\/a:Ettn>/);
    if (ettnMatch) {
      ettn = ettnMatch[1];
    }

    const resultMatch = responseXml.match(/<a:Result>([^<]+)<\/a:Result>/);
    success = resultMatch ? resultMatch[1] === 'Success' : true;
  } catch (err: any) {
    errorMessage = err?.response?.data || err.message;
    throw new NetteFaturaError(`Canlıya geçiş paketi üretilirken SOAP servisi hatası: ${errorMessage}`);
  }

  // 4. Standart UBL-TR 1.2 XML Üretimi
  const ublInvoice = client
    .createInvoice()
    .setCurrency(Currency.TRY)
    .setScenario(ScenarioType.TEMELFATURA)
    .setType(InvoiceType.SATIS)
    .setInvoiceDate(dateStr)
    .setReceiverInboxTag('urn:mail:defaultpk@isnet.com')
    .setReceiver({
      ReceiverName: 'İş Net Elektronik Bilgi Üretim Dağıtım Ticaret ve İletişim Hizm. A.Ş.',
      ReceiverTaxCode: '4810173324',
      TaxOfficeName: 'Büyük Mükellefler VD',
      Address: {
        BoulevardAveneuStreetName: 'Turan Güneş Bulvarı No:63',
        CityCode: '6',
        CityName: 'ANKARA',
        CountryName: 'TÜRKİYE',
        CountryCode: 'TR',
      },
    })
    .addLine({
      name: 'Yazılım Entegrasyon ve Web Servis Hizmet Bedeli',
      unitPrice: 1500,
      quantity: 1,
      vatRate: 20,
      productCode: 'SRV-001',
    })
    .addNote('İşNet NetteFatura Canlıya Geçiş Test Faturasıdır.')
    .setOrder(`SIP-${Date.now()}`, dateStr)
    .build();

  const sellerInfo: SupplierPartyInfo = {
    vkn: options.supplier.vkn,
    name: options.supplier.name,
    taxOffice: options.supplier.taxOffice || 'Vergi Dairesi',
    address: {
      street: options.supplier.address || 'Merkez Mahallesi',
      city: options.supplier.city || 'İSTANBUL',
      country: 'TÜRKİYE',
    },
  };

  const ublXml = buildUblTrInvoiceXml(ublInvoice, sellerInfo);

  // 5. Hazır E-Posta Metni Şablonu
  const staticIpText = options.staticIp || '[SUNUCUNUZUN STATIK IP ADRESI]';
  const emailTemplate = `Değerli İşNet Destek ve Yazılım Ekibi,

NetteFatura e-Fatura / e-Arşiv resmi Web Servis (SOAP) entegrasyon testlerimizi test ortamınızda başarıyla tamamladık.

Test ortamında başarıyla gerçekleştirilen işleme ait:
1. SOAP Request XML dosyamız (isnet_soap_request.xml)
2. SOAP Response XML dosyamız (isnet_soap_response.xml${invoiceNumber ? ` - Fatura No: ${invoiceNumber}, ETTN: ${ettn}` : ''})
3. UBL-TR 1.2 Standart Fatura XML dosyamız (isnet_ubl_invoice.xml)

eklerde bilgilerinize sunulmuştur.

Canlı ortama geçiş için VKN/TCKN ve Statik IP tanımlamalarımızın yapılmasını rica ederiz:

- Ticari Unvan: ${options.supplier.name}
- VKN / TCKN: ${options.supplier.vkn}
- Canlı Ortamda Bağlanacak Statik Dış IP Adresi: ${staticIpText}
- Yetkili İletişim: ${options.supplier.name}

Gerekli tanımlamalar yapıldıktan sonra canlı ortam bağlantı onayının tarafımıza iletilmesini rica ederiz.

İyi çalışmalar dileriz.`;

  return {
    success,
    invoiceNumber,
    ettn,
    requestXml,
    responseXml,
    ublXml,
    emailTemplate,
    errorMessage,
  };
}
