# 🛠️ Builders & UBL-TR Kılavuzu

`nettefatura-api`, karmaşık XML ve veri yapıları ile uğraşmadan akıcı (fluent) bir arayüz ile e-Fatura ve e-Arşiv faturaları oluşturmanızı sağlayan builder sınıfları içerir.

---

## 1. `InvoiceBuilder` (e-Fatura Oluşturucu)

GİB e-Fatura standartlarına uygun `Invoice` nesnesi üretir. Matrah, KDV, iskonto ve genel toplamları satır satır otomatik hesaplar.

```typescript
import { NetteFaturaClient, Currency, InvoiceType, ScenarioType } from 'nettefatura-api';

const client = new NetteFaturaClient({ companyTaxCode: '4810173324' });

const invoice = client
  .createInvoice()
  .setCurrency(Currency.TRY)
  .setScenario(ScenarioType.TICARIFATURA)
  .setType(InvoiceType.SATIS)
  .setInvoiceDate('2026-08-24')
  .setReceiverInboxTag('urn:mail:defaultpk@isnet.com')
  .setReceiver({
    ReceiverName: 'Alıcı Firma A.Ş.',
    ReceiverTaxCode: '4810173324',
    TaxOfficeName: 'Büyük Mükellefler VD',
    Address: {
      BoulevardAveneuStreetName: 'Atatürk Bulvarı No:1',
      CityName: 'ANKARA',
      CountryName: 'TÜRKİYE',
    },
  })
  .addLine({
    name: 'Yazılım Lisans Bedeli',
    unitPrice: 2000,
    quantity: 1,
    vatRate: 20, // %20 KDV
    productCode: 'LIC-001',
  })
  .addLine({
    name: 'Kurulum ve Entegrasyon',
    unitPrice: 1000,
    quantity: 1,
    vatRate: 20,
    discountRate: 10, // %10 İskonto
  })
  .addNote('Ödeme vadesi faturadan itibaren 15 gündür.')
  .setOrder('SIP-2026-001', '2026-08-24')
  .build();
```

---

## 2. `ArchiveInvoiceBuilder` (e-Arşiv Fatura Oluşturucu)

e-Arşiv gönderimleri için gerekli olan alıcı e-posta adresi, elektronik gönderim tipi ve `ArchiveInvoice` nesnesini üretir.

```typescript
const archiveInvoice = client
  .createArchiveInvoice()
  .setCurrency(Currency.TRY)
  .setType(InvoiceType.SATIS)
  .setExternalCode(`EXT-${Date.now()}`)
  .setReceiver('Bireysel Müşteri', '11111111111', 'musteri@gmail.com', {
    CityCode: '34',
    CityName: 'İSTANBUL',
    TownName: 'Kadıköy',
  })
  .addLine({
    name: 'E-Ticaret Ürünü',
    unitPrice: 250,
    quantity: 2,
    vatRate: 20,
  })
  .build();
```

---

## 3. `buildUblTrInvoiceXml` (Standart UBL-TR 1.2 XML Üretimi)

Oluşturulan `Invoice` nesnesini doğrudan resmi UBL-TR 1.2 XML şablonuna dönüştürür.

```typescript
import { buildUblTrInvoiceXml } from 'nettefatura-api';

const ublXml = buildUblTrInvoiceXml(invoice, {
  vkn: '4810173324',
  name: 'Satıcı Firma Unvanı',
  taxOffice: 'Büyük Mükellefler VD',
  address: {
    street: 'Merkez Cad. No:10',
    city: 'İSTANBUL',
    country: 'TÜRKİYE',
  },
});

console.log(ublXml);
```
