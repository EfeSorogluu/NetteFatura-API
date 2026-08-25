import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { NetteFaturaClient } from '../client.js';
import { Currency, InvoiceType, ScenarioType } from '../constants/enums.js';
import { buildSoapEnvelope } from '../core/xml-parser.js';
import { buildUblTrInvoiceXml, SupplierPartyInfo } from '../builders/ubl.builder.js';
import { NetteFaturaError } from '../core/soap-fault.js';

export interface GoLivePackageOptions {
  /**
   * Satıcı (Firmanızın) Bilgileri
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
   * Statik Dış IP Adresiniz (İşNet firewall whitelist için)
   */
  staticIp?: string;
  /**
   * Dosyaların kaydedileceği klasör yolu (Örn: './isnet-golive-package'). Belirtilirse dosyalar otomatik diske yazılır.
   */
  outputDir?: string;
  /**
   * Test ortamı SOAP InvoiceService endpoint'i (Varsayılan: İşNet Test)
   */
  endpoint?: string;
}

export interface DocumentSet {
  invoiceNumber: string;
  ettn: string;
  requestXml: string;
  responseXml: string;
  ublXml: string;
}

export interface GoLivePackageResult {
  success: boolean;
  eInvoice: DocumentSet;
  eArchive: DocumentSet;
  emailTemplate: string;
  savedFiles?: string[];
  errorMessage?: string;
}

/**
 * İşNet NetteFatura canlı ortama geçiş için talep edilen tüm gereksinimleri
 * (e-Fatura Request/Response/UBL ve e-Arşiv Request/Response/UBL) tek adımda
 * İşNet test sunucusunda canlı koşturarak üreten ve hazır e-posta şablonu oluşturan hepsi-bir-arada araç.
 */
export async function generateGoLivePackage(
  options: GoLivePackageOptions
): Promise<GoLivePackageResult> {
  const testVkn = '4810173324'; // İşNet resmi test VKN
  const client = new NetteFaturaClient({
    companyTaxCode: testVkn,
    environment: 'test',
  });

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const endpoint =
    options.endpoint ||
    'https://einvoiceservicetest.isnet.net.tr/InvoiceService/ServiceContract/InvoiceService.svc';

  // =========================================================================
  // 1. e-Fatura (SendInvoice) Test İşlemi (GİB Posta Kutusu Arası e-Belge)
  // =========================================================================
  const eInvoiceObj = client
    .createInvoice()
    .setCurrency(Currency.TRY)
    .setScenario(ScenarioType.TEMELFATURA)
    .setType(InvoiceType.SATIS)
    .setInvoiceDate(dateStr)
    .setExternalCode(`EXT-EFATURA-${Date.now()}`)
    .setReceiverInboxTag('urn:mail:test05defaultpk@isnet.com')
    .setReceiver({
      ReceiverName: 'Test Firma 05',
      ReceiverTaxCode: '1234567805',
      TaxOfficeName: 'ULUS VD',
      Address: {
        BoulevardAveneuStreetName: 'TEPE Mh. KORDON Cd. 42 Sk.',
        CityCode: '48',
        CityName: 'MUĞLA',
        TownCode: '1517',
        TownName: 'MARMARİS',
        CountryName: 'TÜRKİYE',
        CountryCode: 'TR',
      },
    })
    .addLine({
      name: 'Yazılım Entegrasyon ve Web Servis Hizmet Bedeli',
      unitPrice: 2000,
      quantity: 1,
      vatRate: 20,
      productCode: 'SRV-001',
    })
    .addLine({
      name: 'E-Fatura Modül Lisansı',
      unitPrice: 1000,
      quantity: 1,
      vatRate: 20,
      discountRate: 10,
      productCode: 'LIC-002',
    })
    .addNote('İşNet NetteFatura Canlıya Geçiş Test e-Faturasıdır.')
    .setOrder(`SIP-${Date.now()}`, dateStr)
    .build();

  const eInvoiceRequestXml = buildSoapEnvelope('SendInvoice', {
    CompanyTaxCode: testVkn,
    Invoices: [eInvoiceObj],
  });

  let eInvoiceResponseXml = '';
  let eInvoiceNumber = '';
  let eInvoiceEttn: string = eInvoiceObj.ETTN || '';

  try {
    const res = await axios.post(endpoint, eInvoiceRequestXml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IInvoiceService/SendInvoice',
      },
      responseType: 'text',
      timeout: 30000,
    });
    eInvoiceResponseXml = res.data;
    const numMatch = eInvoiceResponseXml.match(/<a:InvoiceNumber>([^<]+)<\/a:InvoiceNumber>/);
    if (numMatch) eInvoiceNumber = numMatch[1];
    const ettnMatch = eInvoiceResponseXml.match(/<a:Ettn>([^<]+)<\/a:Ettn>/);
    if (ettnMatch) eInvoiceEttn = ettnMatch[1];
  } catch (err: any) {
    throw new NetteFaturaError(`e-Fatura canlıya geçiş SOAP hatası: ${err?.response?.data || err.message}`);
  }

  eInvoiceObj.InvoiceNumber = eInvoiceNumber;
  eInvoiceObj.ETTN = eInvoiceEttn;

  const supplierParty: SupplierPartyInfo = {
    vkn: testVkn,
    name: 'İş Net Elektronik Bilgi Üretim Dağıtım Ticaret ve İletişim Hizm. A.Ş.',
    taxOffice: 'Büyük Mükellefler VD',
    address: {
      street: 'Turan Güneş Bulvarı No:63',
      city: 'ANKARA',
      country: 'TÜRKİYE',
    },
  };
  const eInvoiceUblXml = buildUblTrInvoiceXml(eInvoiceObj, supplierParty);

  // =========================================================================
  // 2. e-Arşiv Fatura (SendArchiveInvoice) Test İşlemi (Son Kullanıcı / Şahıs)
  // =========================================================================
  const eArchiveObj = client
    .createArchiveInvoice()
    .setCurrency(Currency.TRY)
    .setType(InvoiceType.SATIS)
    .setInvoiceDate(dateStr)
    .setExternalCode(`EXT-EARSIV-${Date.now()}`)
    .setReceiver(
      options.supplier.name || 'Alıcı Müşteri',
      options.supplier.vkn || '11111111111',
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
      name: 'Yazılım Entegrasyon ve Danışmanlık Hizmeti',
      unitPrice: 1500,
      quantity: 1,
      vatRate: 20,
      productCode: 'SRV-001',
    })
    .addNote('İşNet NetteFatura Canlıya Geçiş Test e-Arşiv Faturasıdır.')
    .setOrder(`SIP-${Date.now()}`, dateStr)
    .build();

  const eArchiveRequestXml = buildSoapEnvelope('SendArchiveInvoice', {
    CompanyTaxCode: testVkn,
    ArchiveInvoices: [eArchiveObj],
  });

  let eArchiveResponseXml = '';
  let eArchiveNumber = '';
  let eArchiveEttn: string = eArchiveObj.ETTN || '';

  try {
    const res = await axios.post(endpoint, eArchiveRequestXml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IInvoiceService/SendArchiveInvoice',
      },
      responseType: 'text',
      timeout: 30000,
    });
    eArchiveResponseXml = res.data;
    const numMatch = eArchiveResponseXml.match(/<a:ArchiveInvoiceNumber>([^<]+)<\/a:ArchiveInvoiceNumber>/);
    if (numMatch) eArchiveNumber = numMatch[1];
    const ettnMatch = eArchiveResponseXml.match(/<a:Ettn>([^<]+)<\/a:Ettn>/);
    if (ettnMatch) eArchiveEttn = ettnMatch[1];
  } catch (err: any) {
    throw new NetteFaturaError(`e-Arşiv canlıya geçiş SOAP hatası: ${err?.response?.data || err.message}`);
  }

  // e-Arşiv için UBL üretimi
  const dummyEInvoiceForArchive = client
    .createInvoice()
    .setInvoiceNumber(eArchiveNumber)
    .setEttn(eArchiveEttn)
    .setCurrency(Currency.TRY)
    .setScenario(ScenarioType.TEMELFATURA)
    .setType(InvoiceType.SATIS)
    .setInvoiceDate(dateStr)
    .setReceiver({
      ReceiverName: options.supplier.name || 'Alıcı Müşteri',
      ReceiverTaxCode: options.supplier.vkn || '11111111111',
      TaxOfficeName: 'Vergi Dairesi',
      Address: {
        CityName: options.supplier.city || 'İSTANBUL',
        CountryName: 'TÜRKİYE',
      },
    })
    .addLine({
      name: 'Yazılım Entegrasyon ve Danışmanlık Hizmeti',
      unitPrice: 1500,
      quantity: 1,
      vatRate: 20,
      productCode: 'SRV-001',
    })
    .addNote('İşNet NetteFatura Canlıya Geçiş Test e-Arşiv Faturasıdır.')
    .build();

  const eArchiveUblXml = buildUblTrInvoiceXml(dummyEInvoiceForArchive, supplierParty);

  // =========================================================================
  // 3. Resmi E-Posta Metni Şablonu
  // =========================================================================
  const staticIpText = options.staticIp || '[SUNUCUNUZUN STATİK DIŞ IP ADRESİ]';
  const emailTemplate = `Değerli İşNet Destek ve Yazılım Ekibi,

NetteFatura resmi Web Servis (SOAP) entegrasyon testlerimizi test ortamınızda hem e-Fatura hem de e-Arşiv Fatura süreçleri için başarıyla tamamladık.

1. e-FATURA TEST ÇIKTILARIMIZ (SendInvoice):
   - SOAP Request XML: 01_efatura_soap_request.xml
   - SOAP Response XML: 02_efatura_soap_response.xml (Onaylı Fatura No: ${eInvoiceNumber}, ETTN: ${eInvoiceEttn})
   - UBL-TR 1.2 XML: 03_efatura_ubl_tr.xml

2. e-ARŞİV FATURA TEST ÇIKTILARIMIZ (SendArchiveInvoice):
   - SOAP Request XML: 04_earsiv_soap_request.xml
   - SOAP Response XML: 05_earsiv_soap_response.xml (Onaylı Fatura No: ${eArchiveNumber}, ETTN: ${eArchiveEttn})
   - UBL-TR 1.2 XML: 06_earsiv_ubl_tr.xml

CANLI ORTAMA GEÇİŞ VE TANIMLAMA BİLGİLERİMİZ:
- Web Servis Kurulumu Yapılacak Firma VKN / TCKN: ${options.supplier.vkn}
- Firma Ticari Unvanı: ${options.supplier.name}
- Canlı Ortamda Bağlanacak Statik Dış IP Adresi: ${staticIpText}
- Yetkili İletişim: ${options.supplier.name}

Tanımlamalar tamamlandıktan sonra canlı ortam bağlantı onayının tarafımıza iletilmesini rica ederiz.

İyi çalışmalar dileriz,
${options.supplier.name}`;

  const savedFiles: string[] = [];

  // =========================================================================
  // 4. Dosyaları Diske Kaydetme (outputDir verildiyse)
  // =========================================================================
  if (options.outputDir) {
    const targetDir = path.resolve(options.outputDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filesToSave: Record<string, string> = {
      '00_ISNET_CANLIYA_GECIS_EPOSTASI.txt': emailTemplate,
      '01_efatura_soap_request.xml': eInvoiceRequestXml,
      '02_efatura_soap_response.xml': eInvoiceResponseXml,
      '03_efatura_ubl_tr.xml': eInvoiceUblXml,
      '04_earsiv_soap_request.xml': eArchiveRequestXml,
      '05_earsiv_soap_response.xml': eArchiveResponseXml,
      '06_earsiv_ubl_tr.xml': eArchiveUblXml,
    };

    for (const [fileName, fileContent] of Object.entries(filesToSave)) {
      const fullPath = path.join(targetDir, fileName);
      fs.writeFileSync(fullPath, fileContent, 'utf-8');
      savedFiles.push(fullPath);
    }
  }

  return {
    success: true,
    eInvoice: {
      invoiceNumber: eInvoiceNumber,
      ettn: eInvoiceEttn,
      requestXml: eInvoiceRequestXml,
      responseXml: eInvoiceResponseXml,
      ublXml: eInvoiceUblXml,
    },
    eArchive: {
      invoiceNumber: eArchiveNumber,
      ettn: eArchiveEttn,
      requestXml: eArchiveRequestXml,
      responseXml: eArchiveResponseXml,
      ublXml: eArchiveUblXml,
    },
    emailTemplate,
    savedFiles: savedFiles.length > 0 ? savedFiles : undefined,
  };
}
