import {
  NetteFaturaClient,
  Currency,
  InvoiceType,
  ScenarioType,
  InvoiceDirection,
  InvoiceDocumentType,
  buildUblTrInvoiceXml,
} from '../src/index.js';

interface TestResult {
  endpoint: string;
  success: boolean;
  durationMs: number;
  data?: unknown;
  error?: string;
}

async function runLiveEndpointTests() {
  console.log('===============================================================');
  console.log('   İŞNET NETTEFATURA WEB SERVİSLERİ CANLI ENDPOINT TESTLERİ   ');
  console.log('===============================================================\n');

  const client = new NetteFaturaClient({
    companyTaxCode: '4810173324', // isnet test VKN
    environment: 'test',
    debug: false,
  });

  const results: TestResult[] = [];

  async function executeTest(name: string, fn: () => Promise<unknown>) {
    process.stdout.write(`⏳ [${name}] çalıştırılıyor... `);
    const start = Date.now();
    try {
      const res = await fn();
      const duration = Date.now() - start;
      console.log(`✅ BAŞARILI (${duration}ms)`);
      results.push({ endpoint: name, success: true, durationMs: duration, data: res });
    } catch (err: any) {
      const duration = Date.now() - start;
      console.log(`❌ HATA (${duration}ms):`, err.message || err);
      results.push({ endpoint: name, success: false, durationMs: duration, error: err.message || String(err) });
    }
  }

  // 1. HealthCheck
  await executeTest('InvoiceService.HealthCheck', async () => {
    return client.healthCheck();
  });

  // 2. GetCompanyBalance
  await executeTest('InvoiceService.GetCompanyBalance', async () => {
    return client.getBalance();
  });

  // 3. GetCompany
  await executeTest('InvoiceService.GetCompany', async () => {
    return client.invoice.getCompany();
  });

  // 4. GetCompanyVendor
  await executeTest('InvoiceService.GetCompanyVendor', async () => {
    return client.invoice.getCompanyVendor();
  });

  // 5. GetTaxPayer (VKN ile Mükellefiyet)
  await executeTest('AddressBookService.GetTaxPayer', async () => {
    return client.getTaxPayer('4810173324');
  });

  // 6. GetDespatchTaxPayer (e-İrsaliye Mükellefiyet)
  await executeTest('AddressBookService.GetDespatchTaxPayer', async () => {
    return client.addressBook.getDespatchTaxPayer('4810173324');
  });

  // 7. GetTaxOfficeList (Vergi Daireleri)
  await executeTest('AddressBookService.GetTaxOfficeList', async () => {
    return client.addressBook.getTaxOfficeList({ CityCode: 6 });
  });

  // 8. GetCityList (İl Listesi)
  await executeTest('AddressBookService.GetCityList', async () => {
    return client.addressBook.getCityList();
  });

  // 9. GetTownList (İlçe Listesi)
  await executeTest('AddressBookService.GetTownList', async () => {
    return client.addressBook.getTownList(6);
  });

  // 10. GetReceiverInboxTags
  await executeTest('AddressBookService.GetReceiverInboxTags', async () => {
    return client.addressBook.getReceiverInboxTags();
  });

  // 11. GetSenderUnitTags
  await executeTest('AddressBookService.GetSenderUnitTags', async () => {
    return client.addressBook.getSenderUnitTags();
  });

  // 12. GetAddressBook (Unit test ile test edildi)
  // await executeTest('AddressBookService.GetAddressBook', async () => {
  //   return client.addressBook.getAddressBook({ SearchKeyword: 'Test' });
  // });

  // 13. SendArchiveInvoice (e-Arşiv Fatura Gönderme)
  let sentArchiveEttn = '';
  let sentArchiveNumber = '';
  await executeTest('InvoiceService.SendArchiveInvoice', async () => {
    const archive = client
      .createArchiveInvoice()
      .setCurrency(Currency.TRY)
      .setType(InvoiceType.SATIS)
      .setExternalCode(`TEST-${Date.now()}`)
      .setReceiver('Ahmet Yılmaz', '11111111111', 'ahmet@example.com')
      .addLine({ name: 'Danışmanlık', unitPrice: 100, quantity: 1, vatRate: 20 })
      .build();

    const res = await client.invoice.sendArchiveInvoice(archive);
    if (res.ArchiveInvoices && res.ArchiveInvoices.length > 0) {
      sentArchiveEttn = (res.ArchiveInvoices[0] as any).Ettn || (res.ArchiveInvoices[0] as any).ETTN;
      sentArchiveNumber = (res.ArchiveInvoices[0] as any).ArchiveInvoiceNumber;
    }
    return res;
  });

  // 14. GetDocumentViewerLink (Fatura PDF/HTML Linki)
  if (sentArchiveEttn) {
    await executeTest('InvoiceService.GetDocumentViewerLink', async () => {
      return client.invoice.getDocumentViewerLink({
        Ettn: sentArchiveEttn,
        InvoiceNumber: sentArchiveNumber,
        InvoiceDirection: InvoiceDirection.Outgoing,
        InvoiceDocumentType: InvoiceDocumentType.EArchiveInvoice,
      });
    });
  }

  // 15. CancelArchiveInvoice
  if (sentArchiveEttn) {
    await executeTest('InvoiceService.CancelArchiveInvoice', async () => {
      return client.invoice.cancelArchiveInvoice({
        ETTN: sentArchiveEttn,
        CancellationReason: 'Test Otomasyon İptali',
      });
    });
  }

  console.log('\n===============================================================');
  console.log('                   TEST SONUÇLARI ÖZETİ                        ');
  console.log('===============================================================');

  const passedCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  console.log(`Toplam Çalıştırılan: ${results.length}`);
  console.log(`✅ Başarılı: ${passedCount}`);
  console.log(`❌ Başarısız: ${failedCount}\n`);

  for (const r of results) {
    const status = r.success ? '✅ OK  ' : '❌ FAIL';
    console.log(`[${status}] ${r.endpoint.padEnd(40)} (${r.durationMs}ms)`);
  }
}

runLiveEndpointTests();
