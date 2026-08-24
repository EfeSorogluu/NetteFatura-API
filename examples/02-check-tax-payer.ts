import { NetteFaturaClient } from '../src/index.js';

async function main() {
  console.log('--- GİB e-Fatura Mükellefiyet & Vergi Dairesi Sorgulama ---');

  const client = new NetteFaturaClient({
    companyTaxCode: '4810173324',
    environment: 'test',
    debug: false,
  });

  try {
    const vknToQuery = '4810173324'; // İş Net A.Ş. VKN
    console.log(`\n1. VKN Sorgulanıyor (${vknToQuery})...`);
    const result = await client.getTaxPayer(vknToQuery);
    console.log('✅ Mükellef Bilgisi:\n', JSON.stringify(result, null, 2));

    console.log('\n2. Vergi Daireleri Listesi Çekiliyor (İstanbul)...');
    const taxOffices = await client.addressBook.getTaxOfficeList({ CityCode: 34 });
    console.log(`✅ İstanbul'da ${taxOffices.TaxOfficeList?.length || 0} Vergi Dairesi Bulundu:`);
    if (taxOffices.TaxOfficeList) {
      console.log('Örnek ilk 3 vergi dairesi:', taxOffices.TaxOfficeList.slice(0, 3));
    }
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  }
}

main();
