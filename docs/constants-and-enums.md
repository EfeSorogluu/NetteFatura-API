# 📚 Sabitler ve Enum Değerleri (Constants & Enums)

`nettefatura-api` paketi içerisindeki tüm sabit değerler ve TypeScript enumları aşağıda listelenmiştir.

---

## 1. Senaryo Tipleri (`ScenarioType`)

| Enum Değeri | Açıklama |
|---|---|
| `ScenarioType.TEMELFATURA` | Temel Fatura Senaryosu (Alıcı sistem tarafından otomatik kabul edilir) |
| `ScenarioType.TICARIFATURA` | Ticari Fatura Senaryosu (Alıcı 7 gün içinde KABUL / RED verebilir) |
| `ScenarioType.IHRACAT` | İhracat Fatura Senaryosu (Gümrük ve Ticaret Bakanlığı GTB üzerinden geçer) |
| `ScenarioType.KAMU` | Kamu Faturası Senaryosu |
| `ScenarioType.HKS` | Hal Kayıt Sistemi Faturası |
| `ScenarioType.IDIS` | İlaç Takip Sistemi Faturası |
| `ScenarioType.YATIRIMTESVIK` | Yatırım Teşvik Belgesi Kapsamındaki Fatura |

---

## 2. Fatura Tipleri (`InvoiceType`)

| Enum Değeri | Açıklama |
|---|---|
| `InvoiceType.SATIS` | Satış Faturası (Standart fatura) |
| `InvoiceType.IADE` | İade Faturası |
| `InvoiceType.TEVKIFAT` | KDV Tevkifatlı Fatura |
| `InvoiceType.ISTISNA` | KDV İstisna Faturası |
| `InvoiceType.OZELMATRAH` | Özel Matrah Faturası (Örn: Altın, Gümüş, 2. El Araç) |
| `InvoiceType.IHRACKAYITLI` | İhraç Kayıtlı Satış Faturası |
| `InvoiceType.SGK` | Sosyal Güvenlik Kurumu Faturası |
| `InvoiceType.KOMISYONCU` | Komisyoncu Faturası |
| `InvoiceType.KONSIYE` | Konsinye Faturası |

---

## 3. Para Birimleri (`Currency`)

| Enum Değeri | Kod | Açıklama |
|---|---|---|
| `Currency.TRY` | `TRY` | Türk Lirası |
| `Currency.USD` | `USD` | Amerikan Doları |
| `Currency.EUR` | `EUR` | Euro |
| `Currency.GBP` | `GBP` | İngiliz Sterlini |
| `Currency.CHF` | `CHF` | İsviçre Frangı |
| `Currency.RUB` | `RUB` | Rus Rublesi |
| `Currency.AED` | `AED` | BAE Dirhemi |
| `Currency.SAR` | `SAR` | Suudi Arabistan Riyali |

---

## 4. Ölçü Birimleri (`MeasureUnit`)

GİB ve UN/ECE standartlarına uygun birim kodları:

| Enum Değeri | Birim Kodu | Açıklama |
|---|---|---|
| `MeasureUnit.ADET_C62` | `C62` | Adet (One / Unit) |
| `MeasureUnit.ADET_NIU` | `NIU` | Adet (Number of International Units) - **En sık kullanılan** |
| `MeasureUnit.KILOGRAM` | `KGM` | Kilogram |
| `MeasureUnit.GRAM` | `GRM` | Gram |
| `MeasureUnit.METRE` | `MTR` | Metre |
| `MeasureUnit.METREKARE` | `MTK` | Metrekare |
| `MeasureUnit.METREKUP` | `MTQ` | Metreküp |
| `MeasureUnit.LITRE` | `LTR` | Litre |
| `MeasureUnit.PAKET` | `PA` | Paket |
| `MeasureUnit.KUTU` | `BX` | Kutu |
| `MeasureUnit.KOLI` | `CT` | Koli / Karton |
| `MeasureUnit.GUN` | `DAY` | Gün |
| `MeasureUnit.SAAT` | `HUR` | Saat |
| `MeasureUnit.AY` | `MON` | Ay |
| `MeasureUnit.YIL` | `ANN` | Yıl |
| `MeasureUnit.TON` | `TNE` | Ton |
| `MeasureUnit.SET` | `SET` | Set |

---

## 5. Gönderim & Alıcı Tipleri

### Gönderim Şekli (`SendingType`)
- `SendingType.ELEKTRONIK`: E-posta veya elektronik ortamda alıcıya iletim.
- `SendingType.KAGIT`: Yazdırılıp kağıt olarak teslim.

### Alıcı Tipi (`RecipientType`)
- `RecipientType.EARSIV`: e-Arşiv faturası alıcısı.
- `RecipientType.VUK507`: Güvenli mobil ödeme ve e-Belge alıcısı.

---

## 6. Fatura Durumları (`InvoiceStatus`)

| Enum Değeri | Açıklama |
|---|---|
| `InvoiceStatus.DRAFT` | Taslak durumunda |
| `InvoiceStatus.QUEUED` | Kuyrukta (İşNet veya GİB kuyruğunda) |
| `InvoiceStatus.PROCESSING` | İşleniyor |
| `InvoiceStatus.SUCCESS` | Başarıyla tamamlandı ve GİB'e iletildi |
| `InvoiceStatus.FAILED` | Hata aldı |
| `InvoiceStatus.WAITING_RESPONSE` | Ticari fatura yanıtı bekleniyor |
| `InvoiceStatus.ACCEPTED` | Alıcı tarafından KABUL edildi |
| `InvoiceStatus.REJECTED` | Alıcı tarafından REDDEDİLDİ |
| `InvoiceStatus.CANCELLED` | İptal edildi |

---

## 7. Doküman & Yön Tipleri

### Doküman Tipi (`InvoiceDocumentType`)
- `InvoiceDocumentType.EInvoice`: e-Fatura
- `InvoiceDocumentType.EArchiveInvoice`: e-Arşiv Fatura
- `InvoiceDocumentType.Despatch`: e-İrsaliye
- `InvoiceDocumentType.ESMM`: Serbest Meslek Makbuzu
- `InvoiceDocumentType.EMM`: Müstahsil Makbuzu

### Fatura Yönü (`InvoiceDirection`)
- `InvoiceDirection.Incoming`: Gelen (Gelen Kutusu / Alınan Faturalar)
- `InvoiceDirection.Outgoing`: Giden (Giden Kutusu / Kesilen Faturalar)

---

## 8. Vergi Kodları (`TaxCode`)

| Kod | Açıklama |
|---|---|
| `TaxCode.KDV_0015` | Katma Değer Vergisi (Gerçek) |
| `TaxCode.KDV_TEVKIFAT_9015` | KDV Tevkifatı |
| `TaxCode.OTV_0071` | Özel Tüketim Vergisi (I Sayılı Liste) |
| `TaxCode.STOPAJ_0003` | Gelir Vergisi Stopajı |
| `TaxCode.DAMGA_0040` | Damga Vergisi |
| `TaxCode.KONAKLAMA_0059` | Konaklama Vergisi |

---

## 9. Web Servis Endpoint Sabitleri (`DEFAULT_ENDPOINTS`)

### Test Ortamı (`environment: 'test'`)
- **Fatura Servisi:** `https://einvoiceservicetest.isnet.net.tr/InvoiceService/ServiceContract/InvoiceService.svc`
- **Adres Defteri Servisi:** `https://einvoiceservicetest.isnet.net.tr/AddressBookService/ServiceContract/AddressBookService.svc`

### Canlı Ortam (`environment: 'production'`)
- **Fatura Servisi:** `https://einvoiceservice.isnet.net.tr/InvoiceService/ServiceContract/InvoiceService.svc`
- **Adres Defteri Servisi:** `https://einvoiceservice.isnet.net.tr/AddressBookService/ServiceContract/AddressBookService.svc`
