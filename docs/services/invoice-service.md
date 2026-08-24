# 🧾 InvoiceService API Referansı

`InvoiceService`, e-Fatura, e-Arşiv, e-İrsaliye, e-SMM, e-Döviz, Sigorta belgeleri ve bakiye sorgulama işlemlerini yöneten ana servistir.

İstemci üzerinden erişim: `client.invoice.<metot>`

---

## 📑 Metot Listesi

### 1. `healthCheck()`
Servisin ayakta olup olmadığını kontrol eder.
```typescript
const status = await client.invoice.healthCheck();
// Dönüş: 'OK' | 'true'
```

---

### 2. `getCompanyBalance(taxCode?)`
Firmanın kalan kontör / bakiye miktarını sorgular.
```typescript
const balanceRes = await client.invoice.getCompanyBalance();
console.log('Kalan Bakiye:', balanceRes.Balance);
```

---

### 3. `sendArchiveInvoice(invoices)`
e-Arşiv faturalarını İşNet sistemine gönderir.

**Parametre:** `ArchiveInvoice` veya `ArchiveInvoice[]`
```typescript
const archiveInvoice = client
  .createArchiveInvoice()
  .setCurrency(Currency.TRY)
  .setReceiver('Alıcı Adı', '11111111111', 'alici@example.com')
  .addLine({ name: 'Hizmet Bedeli', unitPrice: 1000, vatRate: 20 })
  .build();

const response = await client.invoice.sendArchiveInvoice(archiveInvoice);
console.log(response.ArchiveInvoices?.[0].ArchiveInvoiceNumber);
```

---

### 4. `sendArchiveInvoiceXml(xmlOrRequest)`
Ham UBL-TR XML formatında e-Arşiv faturası gönderir.
```typescript
const response = await client.invoice.sendArchiveInvoiceXml(xmlString);
```

---

### 5. `sendInvoice(invoices)`
GİB kayıtlı mükellefe Ticari veya Temel e-Fatura gönderir.

**Parametre:** `Invoice` veya `Invoice[]`
```typescript
const invoice = client
  .createInvoice()
  .setScenario(ScenarioType.TICARIFATURA)
  .setReceiverInboxTag('urn:mail:defaultpk@isnet.com')
  .setReceiver({
    ReceiverName: 'Alıcı A.Ş.',
    ReceiverTaxCode: '4810173324',
  })
  .addLine({ name: 'Ürün', unitPrice: 500, vatRate: 20 })
  .build();

const response = await client.invoice.sendInvoice(invoice);
```

---

### 6. `sendInvoiceXml(xmlOrRequest)`
UBL-TR 1.2 XML formatında e-Fatura gönderir.
```typescript
await client.invoice.sendInvoiceXml(ublXmlString);
```

---

### 7. `getDocumentViewerLink(ettnOrRequest)`
Faturanın HTML veya PDF formatında web üzerinden görüntülenebileceği linkleri üretir.
```typescript
const viewer = await client.invoice.getDocumentViewerLink({
  Ettn: '353b842d-036d-4a5e-9431-968fe4594f44',
  InvoiceNumber: 'YEK2026999006503',
  InvoiceDirection: InvoiceDirection.Outgoing,
  InvoiceDocumentType: InvoiceDocumentType.EArchiveInvoice,
});

console.log('PDF Linki:', viewer.PdfUrl);
console.log('HTML Linki:', viewer.HtmlUrl);
```

---

### 8. `cancelArchiveInvoice(request)`
Kesilen e-Arşiv faturasını iptal eder.
```typescript
await client.invoice.cancelArchiveInvoice({
  ETTN: '353b842d-036d-4a5e-9431-968fe4594f44',
  CancellationReason: 'Müşteri sipariş iptali',
});
```

---

### 9. `contestArchiveInvoice(request)`
e-Arşiv faturasına itiraz kaydı oluşturur.
```typescript
await client.invoice.contestArchiveInvoice({
  ArchiveInvoiceList: [
    {
      ETTN: '353b842d-036d-4a5e-9431-968fe4594f44',
      ContestReason: 'Fiyat uyumsuzluğu',
      ContestType: 'Kayıtlı Elektronik Posta (KEP)',
    },
  ],
});
```

---

### 10. `sendInvoiceReply(request)`
Gelen ticari e-faturaya KABUL veya RED uygulama yanıtı döner.
```typescript
await client.invoice.sendInvoiceReply({
  InvoiceReply: {
    ETTN: 'fatura-ettn-uuid',
    ResponseType: 'KABUL', // veya 'RED'
    Reason: 'Mallar eksiksiz teslim alındı.',
  },
});
```

---

### 11. `searchInvoice(request)` & `searchArchiveInvoice(request)`
Gelen ve giden faturaları tarih, VKN, fatura numarası ve ETTN bazında sorgular.
```typescript
const res = await client.invoice.searchArchiveInvoice({
  MinInvoiceDate: '2026-01-01',
  MaxInvoiceDate: '2026-12-31',
  PagingRequest: { PageNumber: 1, RecordsPerPage: 20 },
});
```

---

### 12. `sendDespatchAdvice(request)` & `sendReceiptAdvice(request)`
e-İrsaliye ve İrsaliye Teslim / Kabul Yanıtı (Receipt Advice) gönderir.
```typescript
await client.invoice.sendDespatchAdvice({
  DespatchAdvices: [ ... ],
});
```

---

### 13. `sendESMM(request)` & `cancelESMM(request)`
Serbest Meslek Makbuzu (e-SMM) oluşturma ve iptal işlemleri.
```typescript
await client.invoice.sendESMM({
  ESMMList: [ ... ],
});
```

---

### 14. `sendCurrencyInvoice(request)`
Döviz Alım / Satım Belgesi (e-Döviz) gönderir.

---

### 15. `sendInsurance(request)` & `cancelInsurance(request)`
Sigorta Komisyon Gider Belgesi oluşturma ve iptal işlemleri.
