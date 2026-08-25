import * as fs from 'fs';
import * as path from 'path';
import { generateGoLivePackage } from '../src/index.js';

async function main() {
  console.log('=== İşNet NetteFatura Canlıya Geçiş Paketi Oluşturucu ===\n');

  // Bilgilerinizi buraya girin:
  const result = await generateGoLivePackage({
    supplier: {
      vkn: '11111111111',
      name: 'Örnek Firma Yazılım A.Ş.',
      email: 'info@example.com',
      taxOffice: 'Büyük Mükellefler VD',
      city: 'İSTANBUL',
      address: 'Merkez Mahallesi No:1',
    },
    staticIp: '185.100.100.100', // Sunucunuzun Statik Dış IP Adresi
  });

  if (result.success) {
    console.log('✅ İşNet Test SOAP Çağrısı Başarılı!');
    console.log(` - Onaylı Fatura No : ${result.invoiceNumber}`);
    console.log(` - Kayıtlı ETTN     : ${result.ettn}\n`);

    // Dosyaları kaydet
    const outputDir = path.join(process.cwd(), 'isnet-golive-package');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outputDir, 'isnet_soap_request.xml'), result.requestXml, 'utf-8');
    fs.writeFileSync(path.join(outputDir, 'isnet_soap_response.xml'), result.responseXml, 'utf-8');
    fs.writeFileSync(path.join(outputDir, 'isnet_ubl_invoice.xml'), result.ublXml, 'utf-8');
    fs.writeFileSync(path.join(outputDir, 'EPOSTA_SABLONU.txt'), result.emailTemplate, 'utf-8');

    console.log(`📁 Tüm dosyalar "${outputDir}" klasörüne kaydedildi:`);
    console.log(' 1. isnet_soap_request.xml  (İstek SOAP XML)');
    console.log(' 2. isnet_soap_response.xml (Onaylı Yanıt SOAP XML)');
    console.log(' 3. isnet_ubl_invoice.xml   (GİB UBL-TR 1.2 XML)');
    console.log(' 4. EPOSTA_SABLONU.txt      (İşNet e iletilecek hazır e-posta metni)\n');

    console.log('✉️ Hazırlanan E-Posta Metni:\n');
    console.log(result.emailTemplate);
  } else {
    console.error('❌ Hata oluştu:', result.errorMessage);
  }
}

main();
