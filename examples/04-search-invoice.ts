import { NetteFaturaClient, InvoiceDirection, InvoiceDocumentType } from '../src/index.js';

async function main() {
  console.log('=== İşNet NetteFatura Fatura Arama & Görüntüleme Linki Testi ===\n');

  const client = new NetteFaturaClient({
    companyTaxCode: '4810173324',
    environment: 'test',
    debug: false,
  });

  try {
    console.log('1. e-Arşiv Faturaları Aranıyor (SearchArchiveInvoice)...');
    const searchResult = await client.invoice.searchArchiveInvoice({
      MinInvoiceDate: '2026-01-01',
      PagingRequest: { PageNumber: 1, RecordsPerPage: 5 },
    });

    console.log('✅ Arama Yanıtı:', JSON.stringify(searchResult, null, 2));

    const invoiceList = searchResult.ArchiveInvoices || [];
    if (invoiceList.length > 0) {
      const firstInvoice = invoiceList[0];
      const ettn = firstInvoice.ETTN || (firstInvoice as any).Ettn;
      const invoiceNumber = firstInvoice.InvoiceNumber;

      console.log(`\n2. Bulunan Fatura (${invoiceNumber}, ETTN: ${ettn}) için Görüntüleme Linki Alınıyor...`);
      const linkResult = await client.invoice.getDocumentViewerLink({
        Ettn: ettn,
        InvoiceNumber: invoiceNumber,
        InvoiceDirection: InvoiceDirection.Outgoing,
        InvoiceDocumentType: InvoiceDocumentType.EArchiveInvoice,
      });

      console.log('✅ Görüntüleme Linki Yanıtı:\n', JSON.stringify(linkResult, null, 2));
    }
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  }
}

main();
