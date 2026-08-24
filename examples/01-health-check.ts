import { NetteFaturaClient } from '../src/index.js';

async function main() {
  console.log('--- İşNet NetteFatura Health Check & Bakiye Sorgulama ---');

  const client = new NetteFaturaClient({
    companyTaxCode: '4810173324', // isnet test VKN
    environment: 'test',
    debug: true,
  });

  try {
    console.log('\n1. Servis Sağlık Durumu Kontrol Ediliyor (HealthCheck)...');
    const health = await client.healthCheck();
    console.log('✅ HealthCheck Sonucu:', health);

    console.log('\n2. Test Firma Bakiye Sorgulanıyor (GetCompanyBalance)...');
    const balance = await client.getBalance();
    console.log('✅ Bakiye Sonucu:', JSON.stringify(balance, null, 2));
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  }
}

main();
