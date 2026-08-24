# 🚀 nettefatura-api

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**İşNet NetteFatura** resmi SOAP Web Servisleri için modern, tam tiplendirilmiş (fully-typed) ve esnek **Node.js & TypeScript SDK**'sı.

e-Fatura, e-Arşiv, GİB Mükellefiyet Sorgulama, Bakiye/Kontör Kontrolü, UBL-TR 1.2 XML Üretimi ve Fatura Arama/İptal işlemlerini en hızlı ve tip güvenli şekilde gerçekleştirmenizi sağlar.

---

## 📦 Kurulum

```bash
npm install nettefatura-api axios fast-xml-parser
```

---

## 🔑 Kimlik Doğrulama & Mimari

İşNet NetteFatura resmi SOAP servislerinde kimlik doğrulama **IP-VKN** eşleştirmesi ile sağlanmaktadır. İsteklerde kullanıcı adı ve şifreye gerek kalmadan, doğrudan firmanızın `CompanyTaxCode` (VKN/TCKN) değeri kullanılır.

> [!IMPORTANT]
> **Canlı Ortama Geçiş Notu:**
> Canlı ortama geçmeden önce sunucunuzun statik IP adresini ve test ortamında başarılı olarak üretilmiş örnek e-belge XML dosyasını **[efaturadestek@nettefatura.com.tr](mailto:efaturadestek@nettefatura.com.tr)** veya **[servisyazilim@is.net.tr](mailto:servisyazilim@is.net.tr)** adresine ileterek firewall ve VKN tanımlaması yaptırmanız gerekmektedir.

---

## 💡 Alternatif Çözüm: `nettefatura-portal`

Eğer **statik IP adresiniz yoksa** veya İşNet ile resmi Web Servis / API sözleşmeniz bulunmuyorsa, web portalı (kullanıcı adı ve şifre ile giriş) üzerinden işlem yapan kardeş paketimizi inceleyebilirsiniz:

- **📦 [`nettefatura-portal`](https://github.com/EfeSorogluu/NetteFatura-Portal):** Web portalı arayüzü üzerinden kullanıcı adı & şifre ile fatura kesme, indirme ve sorgulama otomasyonu sağlar. *(Resmi SOAP API değildir, web portal otomasyonudur).*
- **📦 `nettefatura-api` (Bu Paket):** İşNet'in resmi kurumsal SOAP Web Servisleri ile doğrudan entegrasyon sağlar (IP-VKN tabanlı, yüksek hacimli ve kurumsal ERP sistemleri için önerilen yöntem).

---

## ⚡ Hızlı Başlangıç

### 1. İstemciyi Başlatma

```typescript
import { NetteFaturaClient } from 'nettefatura-api';

const client = new NetteFaturaClient({
  companyTaxCode: '4810173324', // Firmanızın VKN veya TCKN numarası
  environment: 'test',          // 'test' veya 'production' (Varsayılan: 'test')
  debug: false,                 // Giden/gelen SOAP XML loglarını görmek için true yapabilirsiniz
});
```

---

## 🏢 1. GİB e-Fatura Mükellefiyet & Adres Defteri Servisi (`AddressBookService`)

### 1.1. VKN / TCKN ile Mükellefiyet Sorgulama
Bir alıcının e-Fatura mükellefi olup olmadığını, unvanını ve GİB posta kutusu etiketlerini (GB / PK) sorgular:

```typescript
const taxPayer = await client.getTaxPayer('4810173324');

console.log('Sonuç:', taxPayer.Result); // 'Success'
console.log('Firma Unvanı:', taxPayer.TaxPayers?.[0]?.TaxPayerName);
console.log('GİB Posta Kutuları:', taxPayer.TaxPayers?.[0]?.InboxTagList);
// ['urn:mail:defaultpk@isnet.com', ...]
```

### 1.2. Vergi Daireleri Listesi
```typescript
// İstanbul (İl Kodu: 34) vergi dairelerini listele
const offices = await client.addressBook.getTaxOfficeList({ CityCode: 34 });
console.log(offices.TaxOfficeList);
```

---

## 🧾 2. e-Arşiv Fatura Gönderimi (`sendArchiveInvoice`)

Fluent `ArchiveInvoiceBuilder` ile e-Arşiv faturalarını kolayca ve otomatik matrah/KDV hesaplamasıyla oluşturup gönderebilirsiniz:

```typescript
import { Currency, InvoiceType } from 'nettefatura-api';

const archiveInvoice = client
  .createArchiveInvoice()
  .setCurrency(Currency.TRY)
  .setType(InvoiceType.SATIS)
  .setInvoiceDate('2026-08-24')
  .setExternalCode(`EXT-${Date.now()}`)
  .setReceiver('Arif Ekmekçi', '23425026004', 'musteri@example.com', {
    CityCode: '6',
    CityName: 'ANKARA',
    TownCode: '1231',
    TownName: 'Çankaya',
    CountryName: 'TÜRKİYE',
  })
  .addLine({
    name: 'Yazılım Entegrasyon Hizmeti',
    unitPrice: 1500,
    quantity: 1,
    vatRate: 20,
  })
  .addLine({
    name: 'Bulut Sunucu Lisansı',
    unitPrice: 500,
    quantity: 1,
    vatRate: 20,
    discountRate: 10, // %10 İskonto
  })
  .addNote('Ödeme vadesi 15 gündür.')
  .build();

const response = await client.invoice.sendArchiveInvoice(archiveInvoice);
console.log('e-Arşiv Sonucu:', response);
// { Result: 'Success', ArchiveInvoices: [{ ArchiveInvoiceNumber: 'YEK2026999006503', Ettn: '...' }] }
```

---

## 📑 3. Ticari / Temel e-Fatura Gönderimi (`sendInvoice`)

```typescript
import { Currency, InvoiceType, ScenarioType } from 'nettefatura-api';

const invoice = client
  .createInvoice()
  .setCurrency(Currency.TRY)
  .setScenario(ScenarioType.TICARIFATURA)
  .setType(InvoiceType.SATIS)
  .setInvoiceDate('2026-08-24')
  .setReceiverInboxTag('urn:mail:defaultpk@alici.com.tr')
  .setReceiver({
    ReceiverName: 'Alıcı Firma A.Ş.',
    ReceiverTaxCode: '1234567805',
    TaxOfficeName: 'Ulus VD',
    Address: {
      BoulevardAveneuStreetName: 'Kordon Cad. No:42',
      CityCode: '48',
      CityName: 'MUĞLA',
      CountryName: 'TÜRKİYE',
    },
  })
  .addLine({
    name: 'Danışmanlık Hizmet Bedeli',
    unitPrice: 3000,
    quantity: 1,
    vatRate: 20,
  })
  .addNote('e-Fatura Açıklaması')
  .build();

const result = await client.invoice.sendInvoice(invoice);
console.log('e-Fatura Sonucu:', result);
```

---

## 🔗 4. Fatura Görüntüleme Bağlantısı (PDF / HTML)

```typescript
import { InvoiceDirection, InvoiceDocumentType } from 'nettefatura-api';

const viewerLink = await client.invoice.getDocumentViewerLink({
  Ettn: '353b842d-036d-4a5e-9431-968fe4594f44',
  InvoiceNumber: 'YEK2026999006503',
  InvoiceDirection: InvoiceDirection.Outgoing,
  InvoiceDocumentType: InvoiceDocumentType.EArchiveInvoice,
});

console.log('PDF / HTML Link:', viewerLink);
```

---

## 💰 5. Bakiye & Sağlık Kontrolü

```typescript
// Servis ayakta mı?
const isHealthy = await client.healthCheck(); // 'OK'

// Kalan kontör bilgisi
const balance = await client.getBalance();
console.log('Kalan Bakiye:', balance.Balance);
```

---

## 🛠️ 6. UBL-TR 1.2 Standart XML Üretimi

İşNet veya GİB gereksinimlerine uygun ham UBL-TR XML oluşturmak için:

```typescript
import { buildUblTrInvoiceXml } from 'nettefatura-api';

const xmlString = buildUblTrInvoiceXml(invoice, {
  vkn: '4810173324',
  name: 'Firma Unvanınız A.Ş.',
  taxOffice: 'Büyük Mükellefler',
});

// Doğrudan XML olarak göndermek için:
await client.invoice.sendInvoiceXml(xmlString);
```

---

## 📂 Örnek Test Betikleri

Depo içerisinde çalıştırılabilir hazır örnekler yer almaktadır:

```bash
# Servis sağlık ve bakiye sorgusu
npm run example:health

# GİB e-Fatura mükellefiyet ve vergi dairesi sorgusu
npm run example:taxpayer

# e-Arşiv fatura oluşturma ve gönderme
npm run example:archive

# Fatura sorgulama ve görüntüleme linki alma
npm run example:search
```

---

## 📁 Resmi Dökümanlar ve İstek Şablonları

Proje içerisindeki `docs/` klasöründe İşNet NetteFatura'nın tüm resmi PDF arayüz dökümanları ve örnek SOAP istek XML'leri mevcuttur:

- `docs/official-docs/`: İşNet e-Fatura, e-Arşiv, e-İrsaliye, e-SMM vb. resmi PDF kılavuzları
- `docs/request-samples/`: Resmi SOAP request ve response XML/TXT örnekleri

---

## 📜 Lisans

MIT © [Mert Efe SOROĞLU](https://github.com/EfeSorogluu)
