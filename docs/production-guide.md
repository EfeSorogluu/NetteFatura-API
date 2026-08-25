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

`nettefatura-api` içerisinde yer alan `generateGoLivePackage` aracı ile tüm Request XML, Response XML, UBL-TR XML ve e-posta şablonunu tek adımda üretebilirsiniz:

```typescript
import { generateGoLivePackage } from 'nettefatura-api';

const packageResult = await generateGoLivePackage({
  supplier: {
    vkn: '11111111111',               // Firmanızın TCKN veya VKN Numarası
    name: 'FİRMA TİCARİ UNVANI A.Ş.',  // Firmanızın Resmi Unvanı
    city: 'İSTANBUL',
    taxOffice: 'Kadıköy VD',
  },
  staticIp: '185.xxx.xxx.xxx',        // Sunucunuzun Statik Dış IP Adresi
});

console.log('İşNet Onaylı Fatura No:', packageResult.invoiceNumber);
console.log('SOAP Request XML:', packageResult.requestXml);
console.log('SOAP Response XML:', packageResult.responseXml);
console.log('GİB UBL-TR XML:', packageResult.ublXml);
console.log('Hazır E-Posta Şablonu:', packageResult.emailTemplate);
```

Veya hazır terminal scriptini çalıştırabilirsiniz:
```bash
npm run example:golive
```
Bu komut `isnet-golive-package/` klasörü altına İşNet'e ileteceğiniz tüm XML dosyalarını ve hazır e-posta metnini otomatik olarak kaydeder.

### Adım 2: İşNet Entegrasyon Ekibine E-Posta İletimi
Oluşturulan XML dosyasını ve sunucunuzun statik IP adresini aşağıdaki e-posta adreslerine iletin:

- **E-Posta:** `efaturadestek@nettefatura.com.tr` / `servisyazilim@is.net.tr`
- **Konu:** `[VKN / Firma Adı] - Canlı Ortama Geçiş ve IP Tanımlama Talebi`
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
