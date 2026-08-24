# ⚠️ Hata Yönetimi (Error Handling)

`nettefatura-api`, tüm hata durumlarını tiplendirilmiş ve yakalanabilir hata sınıfları ile yönetir.

---

## 1. Hata Sınıfları

### `NetteFaturaError`
Tüm SDK hatalarının temel sınıfıdır (`extends Error`). Ağ bağlantısı, zaman aşımı (timeout) veya genel parametre hatalarında fırlatılır.

### `SoapFaultError`
İşNet SOAP sunucusundan dönen `<faultcode>` ve `<faultstring>` durumlarını yakalar.
- `error.faultCode`: SOAP Fault kodu (Örn: `s:Client`, `s:Server`)
- `error.faultString`: İşNet'in döndürdüğü hata açıklaması
- `error.detail`: SOAP hata detayı

### `ServiceExecutionError`
HTTP 200 dönmesine rağmen İşNet WCF yanıtı içerisindeki `Result === "Failed"` veya `ErrorMessage` alanlarını yakalar.
- `error.errorMessage`: İşNet iş mantığı hata mesajı (Örn: *"Alıcı posta kutusu etiketi bulunamadı"*, *"Ürün kaynak kodu boş"*)
- `error.resultData`: Servisin döndürdüğü ham nesne

---

## 2. Hata Yakalama Örneği

```typescript
import {
  NetteFaturaClient,
  NetteFaturaError,
  SoapFaultError,
  ServiceExecutionError,
} from 'nettefatura-api';

const client = new NetteFaturaClient({ companyTaxCode: '4810173324' });

try {
  const res = await client.invoice.sendArchiveInvoice(archiveInvoice);
  console.log('Başarılı:', res);
} catch (error) {
  if (error instanceof SoapFaultError) {
    console.error('SOAP Protokol Hatası:', error.faultString, error.faultCode);
  } else if (error instanceof ServiceExecutionError) {
    console.error('İşNet Servis Mantık Hatası:', error.errorMessage);
  } else if (error instanceof NetteFaturaError) {
    console.error('Ağ / SDK Hatası:', error.message, error.code);
  } else {
    console.error('Bilinmeyen Hata:', error);
  }
}
```
