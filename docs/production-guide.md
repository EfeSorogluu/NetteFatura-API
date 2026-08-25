# 🚀 Canlı Ortama Geçiş Kılavuzu (Production Guide)

İşNet NetteFatura e-Belge ve e-Fatura sistemlerinde test sürecinden canlı (production) ortama geçiş adımları aşağıda açıklanmıştır.

---

## 📋 Canlıya Geçiş İçin Gerekli Şartlar

İşNet resmi prosedürüne göre canlı ortama geçiş için 2 temel bilgi gereklidir:

1. **Test Ortamında Başarıyla Gönderilmiş Örnek e-Belge XML Dosyası**
2. **Canlı Ortama Bağlanacak Sunucunun Statik Dış IP Adresi (IP Whitelisting)**

---

## 🛠️ Adım Adım Canlıya Geçiş Prosedürü

### Adım 1: Canlıya Geçiş Paketini Otomatik Üretme (Tek Komutla)

İşNet entegrasyon ekibinin canlıya geçiş için talep ettiği **tüm dosyaları** (e-Fatura SOAP Request/Response/UBL, e-Arşiv SOAP Request/Response/UBL ve hazır e-posta metnini) tek komutla üretebilirsiniz:

```typescript
import { generateGoLivePackage } from 'nettefatura-api';

const packageResult = await generateGoLivePackage({
  supplier: {
    vkn: '11111111111',                 // Firmanızın TCKN veya VKN Numarası
    name: 'FİRMA TİCARİ UNVANI A.Ş.',    // Firmanızın Resmi Unvanı
    city: 'İSTANBUL',
    taxOffice: 'Kadıköy VD',
  },
  staticIp: '185.xxx.xxx.xxx',          // Sunucunuzun Statik Dış IP Adresi
  outputDir: './isnet-golive-package',   // Dosyaların kaydedileceği klasör
});

console.log('e-Fatura No:', packageResult.eInvoice.invoiceNumber);
console.log('e-Arşiv No :', packageResult.eArchive.invoiceNumber);
console.log('Hazır E-Posta Şablonu:\n', packageResult.emailTemplate);
```

Veya hazır terminal scriptini çalıştırabilirsiniz:
```bash
npm run example:golive
```

Bu komut `isnet-golive-package/` klasörü altına şu 7 dosyayı otomatik oluşturur:
1. `00_ISNET_CANLIYA_GECIS_EPOSTASI.txt` *(İşNet'e atılacak hazır e-posta metni)*
2. `01_efatura_soap_request.xml` *(e-Fatura SOAP İstek XML'i)*
3. `02_efatura_soap_response.xml` *(e-Fatura Onaylı Yanıt XML'i)*
4. `03_efatura_ubl_tr.xml` *(e-Fatura GİB UBL-TR 1.2 XML'i)*
5. `04_earsiv_soap_request.xml` *(e-Arşiv SOAP İstek XML'i)*
6. `05_earsiv_soap_response.xml` *(e-Arşiv Onaylı Yanıt XML'i)*
7. `06_earsiv_ubl_tr.xml` *(e-Arşiv GİB UBL-TR 1.2 XML'i)*

### Adım 2: İşNet Entegrasyon Ekibine E-Posta İletimi
Oluşturulan `00_ISNET_CANLIYA_GECIS_EPOSTASI.txt` metnini ve XML dosyalarını ekleyerek aşağıdaki adreslere iletin:
- **Kime:** `efaturadestek@nettefatura.com.tr`, `servisyazilim@is.net.tr`
- **Konu:** `[FİRMA UNVANINIZ] - [VKN NUMARANIZ] - NetteFatura Canlı Ortam Tanımlama ve IP Whitelist Talebi`
- **İçerik Şablonu:**
  > Merhaba,
  > 
  > Firmanız bünyesinde e-Fatura / e-Arşiv entegrasyon testlerimizi `[Firmanızın VKN'si]` ile başarıyla tamamladık.
  > 
  > Ekte başarılı olarak üretilen test e-belge XML dosyamızı iletiyoruz.
  > 
  > Canlı ortamda servislerinize bağlanacağımız Statik IP Adresimiz: `[Sunucunuzun Statik IP Adresi]`
  > 
  > Canlı ortama erişim tanımlamalarımızın yapılmasını ve canlı ortam bağlantı onayının tarafımıza iletilmesini rica ederiz.
  > 
  > İyi çalışmalar.

### Adım 3: SDK Konfigürasyonunu Canlıya Alma
İşNet ekibinden IP tanımlaması ve VKN onay e-postası geldikten sonra, uygulamanızdaki `NetteFaturaClient` konfigürasyonunu `environment: 'production'` olarak güncelleyin:

```typescript
import { NetteFaturaClient } from 'nettefatura-api';

const client = new NetteFaturaClient({
  companyTaxCode: 'FIRMA_GERCEK_VKN', // Firmanızın 10 haneli VKN veya 11 haneli TCKN'si
  environment: 'production',          // Canlı ortam endpoint'lerini kullanır
  debug: false,
});
```

---

## 🔒 Güvenlik & En İyi Uygulamalar

1. **IP Güvenliği:** İşNet güvenlik duvarı yalnızca tanımlı IP adreslerinden gelen SOAP isteklerine yanıt verir. Dinamik IP kullanıyorsanız VPN veya statik proxy arkasından istek atınız.
2. **ETTN Tekilliği:** Her fatura için ETTN (UUID v4) değeri benzersiz olmalıdır. SDK (`InvoiceBuilder`), ETTN belirtilmediğinde otomatik tekil UUID v4 üretir.
3. **Fatura Numarası:** Fatura numarasını (`InvoiceNumber`) boş bıraktığınızda, İşNet sistemde tanımlı seriye göre bir sonraki numarayı otomatik atar.
