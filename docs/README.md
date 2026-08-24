# 📖 nettefatura-api Dokümantasyonu

İşNet NetteFatura resmi SOAP Web Servisleri SDK'sı için kapsamlı API referansı ve geliştirici kılavuzu.

---

## 📑 Dokümantasyon İçindekiler

1. [**Constants & Enums (Sabitler ve Enum Değerleri)**](./constants-and-enums.md)
   - Senaryo Tipleri (`ScenarioType`), Fatura Tipleri (`InvoiceType`), Para Birimleri (`Currency`)
   - Ölçü Birimleri (`MeasureUnit`), Gönderim Tipleri (`SendingType`), Alıcı Tipleri (`RecipientType`)
   - Vergi Kodları (`TaxCode`), Doküman Tipleri (`InvoiceDocumentType`), Endpoint'ler
2. [**InvoiceService API Referansı**](./services/invoice-service.md)
   - e-Fatura (`SendInvoice`, `SendInvoiceXml`, `SendInvoiceReply`)
   - e-Arşiv (`SendArchiveInvoice`, `SendArchiveInvoiceXml`, `CancelArchiveInvoice`, `ContestArchiveInvoice`)
   - e-İrsaliye (`SendDespatchAdvice`, `SendReceiptAdvice`, `SearchDespatchAdvice`)
   - e-SMM & e-Döviz & Sigorta (`SendESMM`, `SendCurrencyInvoice`, `SendInsurance`)
   - Fatura Arama & Görüntüleme Linki (`SearchInvoice`, `SearchArchiveInvoice`, `GetDocumentViewerLink`)
   - Firma & Bakiye (`HealthCheck`, `GetCompanyBalance`, `GetCompany`, `GetCompanyVendor`)
3. [**AddressBookService API Referansı**](./services/address-book-service.md)
   - GİB e-Fatura Mükellefiyet Sorgulama (`GetTaxPayer`, `GetTaxPayerWithPaging`)
   - e-İrsaliye Mükellefiyet Sorgulama (`GetDespatchTaxPayer`)
   - Vergi Daireleri, İl ve İlçe Listeleri (`GetTaxOfficeList`, `GetCityList`, `GetTownList`)
   - Adres Defteri Yönetimi (`GetAddressBook`, `SaveAddressBookEntry`, `DeleteAddressBookEntry`)
   - Posta Kutusu ve Gönderici Birim Etiketleri (`GetReceiverInboxTags`, `GetSenderUnitTags`)
4. [**Builders & UBL-TR Kılavuzu**](./builders/invoice-builder.md)
   - `InvoiceBuilder` ile e-Fatura oluşturma
   - `ArchiveInvoiceBuilder` ile e-Arşiv fatura oluşturma
   - Otomatik matrah, iskonto, KDV ve toplam tutar hesaplama
   - `buildUblTrInvoiceXml` ile GİB UBL-TR 1.2 XML üretimi
5. [**Hata Yönetimi (Error Handling)**](./error-handling.md)
   - `NetteFaturaError`, `SoapFaultError`, `ServiceExecutionError` sınıfları
6. [**Canlı Ortama Geçiş Rehberi (Production Guide)**](./production-guide.md)
   - IP-VKN firewall tanımlamaları, İşNet başvuru adımları ve test XML iletimi

---

## 🏛️ Mimari ve Kimlik Doğrulama
İşNet NetteFatura resmi SOAP servislerinde kimlik doğrulama **IP-VKN** eşleştirmesi ile yapılır:
- Kullanıcı adı ve şifreye gerek **yoktur**.
- İstek gövdesinde `CompanyTaxCode` (firmanızın 10 haneli VKN veya 11 haneli TCKN'si) iletilir.
- Sunucunuzun dış IP adresi İşNet sistemine tanımlı olmalıdır.

> [!TIP]
> **Statik IP veya Resmi API Yetkisi Olmayanlar İçin Alternatif:**
> Resmi SOAP API kullanamıyorsanız, web portalı üzerinden kullanıcı adı/şifre ile otomasyon sağlayan [`nettefatura-portal`](https://github.com/EfeSorogluu/NetteFatura-Portal) paketini kullanabilirsiniz. *(Not: `nettefatura-portal` resmi API olmayıp web arayüzü otomasyonudur).*
