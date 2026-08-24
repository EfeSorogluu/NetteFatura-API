import * as fs from 'fs';
import * as path from 'path';
import {
  NetteFaturaClient,
  Currency,
  InvoiceType,
  ScenarioType,
  buildUblTrInvoiceXml,
} from '../src/index.js';

async function main() {
  console.log('=== İşNet NetteFatura Canlıya Geçiş İçin e-Fatura XML Testi ===\n');

  const client = new NetteFaturaClient({
    companyTaxCode: '4810173324', // isnet test VKN
    environment: 'test',
    debug: true,
  });

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const targetVkn = '1234567805'; // Test Firma 05
  const inboxTag = 'urn:mail:test05defaultpk@isnet.com';

  // 2. Fatura Nesnesini Oluştur
  const invoice = client
    .createInvoice()
    .setCurrency(Currency.TRY)
    .setScenario(ScenarioType.TEMELFATURA)
    .setType(InvoiceType.SATIS)
    .setInvoiceDate(dateStr)
    .setReceiverInboxTag(inboxTag)
    .setReceiver({
      ReceiverName: 'Test Firma 05 A.Ş.',
      ReceiverTaxCode: targetVkn,
      TaxOfficeName: 'Ulus VD',
      Address: {
        BoulevardAveneuStreetName: 'Kordon Cad. No:42 Marmaris',
        CityCode: '48',
        CityName: 'MUĞLA',
        CountryName: 'TÜRKİYE',
        CountryCode: 'TR',
      },
    })
    .addLine({
      name: 'Yazılım ve Web Servis Entegrasyon Hizmeti',
      unitPrice: 2000,
      quantity: 1,
      vatRate: 20,
      productCode: 'SRV-001',
    })
    .addLine({
      name: 'API Destek ve Danışmanlık',
      unitPrice: 1000,
      quantity: 1,
      vatRate: 20,
      productCode: 'SRV-002',
    })
    .addNote('İşNet NetteFatura Resmi SOAP API Canlıya Geçiş Test Faturasıdır.')
    .setOrder(`ORD-${Date.now()}`, dateStr)
    .build();

  console.log('2. UBL-TR 1.2 Standart XML Oluşturuluyor...');
  const ublXml = buildUblTrInvoiceXml(invoice, {
    vkn: '4810173324',
    name: 'İş Net Test Firma',
    taxOffice: 'Büyük Mükellefler',
    address: {
      street: 'Merkez Mahallesi',
      city: 'İSTANBUL',
      country: 'TÜRKİYE',
    },
  });

  const scratchDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  // XML Dosyasını dışa aktar (İşNet ekibine iletilecek XML)
  const xmlExportPath = path.join(scratchDir, `ubl_invoice_${invoice.ETTN}.xml`);
  fs.writeFileSync(xmlExportPath, ublXml, 'utf-8');
  console.log(`✅ UBL-TR XML Kaydedildi: ${xmlExportPath}`);

  // 3. Faturayı SOAP Servisine İlet
  console.log('\n3. e-Fatura SOAP Servisi ile Gönderiliyor (SendInvoice)...');
  try {
    const sendResponse = await client.invoice.sendInvoice(invoice);
    console.log('\n✅ SendInvoice Yanıtı:\n', JSON.stringify(sendResponse, null, 2));

    const responseExportPath = path.join(scratchDir, `send_invoice_response_${invoice.ETTN}.json`);
    fs.writeFileSync(
      responseExportPath,
      JSON.stringify(
        {
          ettn: invoice.ETTN,
          invoice,
          sendResponse,
          sentAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf-8'
    );
    console.log(`\n📁 Fatura ve Yanıt Özeti Kaydedildi: ${responseExportPath}`);
  } catch (err) {
    console.error('❌ SendInvoice Hatası:', err);
  }
}

main();
