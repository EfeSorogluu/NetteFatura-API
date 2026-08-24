# 🚀 Canlı Ortama Geçiş Kılavuzu (Production Guide)

İşNet NetteFatura e-Belge ve e-Fatura sistemlerinde test sürecinden canlı (production) ortama geçiş adımları aşağıda açıklanmıştır.

---

## 📋 Canlıya Geçiş İçin Gerekli Şartlar

İşNet resmi prosedürüne göre canlı ortama geçiş için 2 temel bilgi gereklidir:

1. **Test Ortamında Başarıyla Gönderilmiş Örnek e-Belge XML Dosyası**
2. **Canlı Ortama Bağlanacak Sunucunun Statik Dış IP Adresi (IP Whitelisting)**

---

## 🛠️ Adım Adım Canlıya Geçiş Prosedürü

### Adım 1: Test Ortamında e-Belge Gönderimi ve XML Alımı
`nettefatura-api` içerisinde yer alan `examples/05-send-ubl-invoice.ts` veya `examples/03-send-archive-invoice.ts` betiğini çalıştırın:

```bash
npm run example:archive
```

Bu işlem sonucunda `scratch/` dizininde başarılı bir UBL-TR XML dosyası ve ETTN kaydı oluşturulacaktır.

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
