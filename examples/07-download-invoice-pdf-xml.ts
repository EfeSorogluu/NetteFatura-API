import { NetteFaturaClient } from '../src/index.js';

async function main() {
  console.log('--- İşNet NetteFatura PDF & XML İndirme Örneği ---');

  const client = new NetteFaturaClient({
    companyTaxCode: '4810173324', // Test VKN
    environment: 'test',
    debug: true,
  });

  // Örnek DocumentViewerLink URL'si veya doğrudan key parametresi
  const sampleViewerUrl =
    'http://efatura.isnet.net.tr:80/DocumentViewer/DocumentViewerLink?key=lchnBnCBZSSlXnm6Ad6ayBRakGHEFOJ6mJWIS%2f4qevETmRre%2b0dccpILIOJOr9Qnl64tvxg%2fkv6q9nfjt4WseROMz37CY2JrMIFvlhnFD9uYZiN%2f1MLswu0y5ZQcsIyV%2b528G6rDpm6vfHp9NmX1Kl6xR%2bHYVM8x';

  try {
    console.log('\n1. PDF İndiriliyor (Base64 formatında)...');
    const pdfBase64 = await client.getInvoicePdf(sampleViewerUrl);
    console.log('✅ PDF Base64 Uzunluğu:', pdfBase64.length);
    console.log('   PDF Base64 Önizleme:', pdfBase64.substring(0, 50) + '...');

    console.log('\n2. XML İndiriliyor (Metin formatında)...');
    const xmlText = await client.getInvoiceXml(sampleViewerUrl);
    console.log('✅ XML Karakter Uzunluğu:', xmlText.length);
    console.log('   XML Önizleme:', xmlText.substring(0, 80) + '...');

    console.log('\n3. XML İndiriliyor (Base64 formatında)...');
    const xmlBase64 = await client.getInvoiceXmlBase64(sampleViewerUrl);
    console.log('✅ XML Base64 Uzunluğu:', xmlBase64.length);

    console.log('\n💡 İpucu: Dilerseniz doğrudan ETTN vererek de indirebilirsiniz:');
    console.log('   const pdf = await client.getInvoicePdfByEttn("fatura-uuid");');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

main();
