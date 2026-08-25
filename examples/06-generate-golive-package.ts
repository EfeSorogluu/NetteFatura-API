import { generateGoLivePackage } from '../src/index.js';

async function main() {
  console.log('=== İşNet NetteFatura Hepsi-Bir-Arada Canlıya Geçiş Paketi Üretici ===\n');

  // Bilgilerinizi buraya girin:
  const result = await generateGoLivePackage({
    supplier: {
      vkn: '11111111111',              // Firmanızın TCKN veya VKN Numarası
      name: 'Örnek Firma Yazılım A.Ş.', // Firma Ticari Unvanı
      email: 'info@example.com',
      taxOffice: 'Kadıköy VD',
      city: 'İSTANBUL',
      address: 'Merkez Mahallesi No:1',
    },
    staticIp: '185.100.100.100',        // Sunucunuzun Statik Dış IP Adresi
    outputDir: './isnet-golive-package', // Tüm dosyaların kaydedileceği klasör
  });

  if (result.success) {
    console.log('✅ İşNet Test Sunucusunda Hem e-Fatura Hem e-Arşiv Başarıyla Koşturuldu!\n');
    console.log(`📄 e-Fatura Onay No : ${result.eInvoice.invoiceNumber} (ETTN: ${result.eInvoice.ettn})`);
    console.log(`📄 e-Arşiv Onay No  : ${result.eArchive.invoiceNumber} (ETTN: ${result.eArchive.ettn})\n`);

    console.log('📁 Üretilen ve Klasöre Kaydedilen Dosyalar:');
    result.savedFiles?.forEach((filePath, index) => {
      console.log(` ${index + 1}. ${filePath}`);
    });

    console.log('\n✉️ İşNet\'e Gönderilecek Hazır E-Posta Şablonu:\n');
    console.log(result.emailTemplate);
  }
}

main();
