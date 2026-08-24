import * as fs from 'fs';
import * as path from 'path';
import { NetteFaturaClient, Currency, InvoiceType } from '../src/index.js';

async function main() {
  console.log('=== İşNet NetteFatura e-Arşiv Fatura Gönderme Testi ===\n');

  const client = new NetteFaturaClient({
    companyTaxCode: '4810173324', // isnet test VKN
    environment: 'test',
    debug: true,
  });

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Modern Fluent Builder ile e-Arşiv Fatura Nesnesi Oluşturma
  const archiveInvoice = client
    .createArchiveInvoice()
    .setCurrency(Currency.TRY)
    .setType(InvoiceType.SATIS)
    .setInvoiceDate(dateStr)
    .setExternalCode(`EXT-${Date.now()}`)
    .setReceiver('Arif Ekmekçi', '23425026004', 'sys@sys-r.com.tr', {
      CityCode: '6',
      CityName: 'ANKARA',
      TownCode: '1231',
      TownName: 'Çankaya',
      CountryName: 'TÜRKİYE',
    })
    .addLine({
      name: 'Yazılım Entegrasyon ve Danışmanlık Hizmeti',
      unitPrice: 1500,
      quantity: 1,
      vatRate: 20,
      note: 'NetteFatura API Entegrasyon Test Bedeli',
    })
    .addLine({
      name: 'Bulut Sunucu ve API Lisansı',
      unitPrice: 500,
      quantity: 1,
      vatRate: 20,
      discountRate: 10, // 500 - 50 = 450 TL Matrah
    })
    .addNote('İşNet NetteFatura API ile otomatik oluşturulmuştur.')
    .addNote('TRY / TR480006400000143790226080 / İş Bankası / Çukurambar Şubesi')
    .setOrder(`SIP-${Date.now()}`, dateStr)
    .build();

  console.log('Oluşturulan Fatura Detayları:');
  console.log(' - ETTN:', archiveInvoice.ETTN);
  console.log(' - Matrah:', archiveInvoice.TotalLineExtensionAmount, 'TL');
  console.log(' - KDV Toplamı:', archiveInvoice.TotalVATAmount, 'TL');
  console.log(' - Genel Toplam:', archiveInvoice.TotalPayableAmount, 'TL\n');

  try {
    console.log('Fatura İşNet Test SOAP Servisine İletiliyor (SendArchiveInvoice)...');
    const response = await client.invoice.sendArchiveInvoice(archiveInvoice);

    console.log('\n✅ Servis Yanıtı:\n', JSON.stringify(response, null, 2));

    // Çıktıyı dosyaya kaydedelim
    const outputDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, `archive_invoice_${archiveInvoice.ETTN}.json`);
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(
        {
          ettn: archiveInvoice.ETTN,
          invoiceRequest: archiveInvoice,
          serviceResponse: response,
          sentAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf-8'
    );

    console.log(`\n📁 Fatura ve Yanıt Detayı Kaydedildi: ${outputFilePath}`);

    // Görüntüleme linkini de sorgulayalım
    if (archiveInvoice.ETTN) {
      console.log('\nFatura Görüntüleme Linki Alınıyor...');
      const viewerLink = await client.invoice.getDocumentViewerLink(archiveInvoice.ETTN);
      console.log('✅ Görüntüleme Linki:', viewerLink);
    }
  } catch (error) {
    console.error('❌ Fatura Gönderimi Başarısız:', error);
  }
}

main();
