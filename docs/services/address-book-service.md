# 🏢 AddressBookService API Referansı

`AddressBookService`, GİB e-Fatura ve e-İrsaliye mükellefiyet sorgulama, vergi daireleri, il/ilçe ve adres defteri yönetimini sağlayan servistir.

İstemci üzerinden erişim: `client.addressBook.<metot>`

---

## 📑 Metot Listesi

### 1. `getTaxPayer(taxCodeOrRequest)`
Bir VKN veya TCKN numarasının e-Fatura mükellefi olup olmadığını, unvanını ve GİB posta kutusu etiketlerini (GB / PK) sorgular.
```typescript
const taxPayer = await client.addressBook.getTaxPayer('4810173324');

console.log('Firma Unvanı:', taxPayer.TaxPayers?.[0]?.TaxPayerName);
console.log('Kayıt Tarihi:', taxPayer.TaxPayers?.[0]?.RegistrationDate);
console.log('Posta Kutusu Etiketleri (PK):', taxPayer.TaxPayers?.[0]?.InboxTagList);
console.log('Gönderici Birim Etiketleri (GB):', taxPayer.TaxPayers?.[0]?.OutboxTagList);
```

---

### 2. `getTaxPayerWithPaging(request)`
GİB e-Fatura mükelleflerini sayfalı ve filtrelenmiş olarak listeler.
```typescript
const response = await client.addressBook.getTaxPayerWithPaging({
  PageNumber: 1,
  PageSize: 50,
});

console.log('Toplam Mükellef Sayısı:', response.TotalCount);
```

---

### 3. `getDespatchTaxPayer(taxCodeOrRequest)`
Belirtilen VKN/TCKN numarasının **e-İrsaliye** mükellefi olup olmadığını sorgular.
```typescript
const despatchPayer = await client.addressBook.getDespatchTaxPayer('4810173324');
console.log(despatchPayer.TaxPayers?.[0]?.TaxPayerName);
```

---

### 4. `getTaxOfficeList(request?)`
Türkiye'deki resmi vergi dairelerini listeler. İl koduna (`CityCode`) göre filtrelenebilir.
```typescript
// Ankara (İl Kodu: 6) vergi daireleri
const offices = await client.addressBook.getTaxOfficeList({ CityCode: 6 });
console.log(offices.TaxOfficeList);
// [{ Code: '006260', Name: 'Ulus VD', CityCode: 6, CityName: 'ANKARA' }, ...]
```

---

### 5. `getCityList()` & `getTownList(cityCode)`
Türkiye İl ve İlçe listelerini getirir.
```typescript
const cities = await client.addressBook.getCityList();

// İstanbul (34) ilçeleri
const towns = await client.addressBook.getTownList(34);
```

---

### 6. `getAddressBook(request?)`
Firmanıza ait kayıtlı müşteri ve cari adres defterini listeler.
```typescript
const addressBook = await client.addressBook.getAddressBook({
  SearchKeyword: 'İş Net',
});
```

---

### 7. `saveAddressBookEntry(request)`
Adres defterine yeni bir cari kaydı ekler veya mevcut olanı günceller.
```typescript
const saveRes = await client.addressBook.saveAddressBookEntry({
  ReceiverName: 'Örnek Müşteri Ltd. Şti.',
  ReceiverTaxCode: '1234567890',
  TaxOfficeName: 'Kadıköy VD',
  Address: {
    CityName: 'İSTANBUL',
    TownName: 'Kadıköy',
    CountryName: 'TÜRKİYE',
  },
});

console.log('Kayıt ID:', saveRes.Id);
```

---

### 8. `deleteAddressBookEntry(idOrRequest)`
Adres defterinden belirtilen ID'ye sahip kaydı siler.
```typescript
await client.addressBook.deleteAddressBookEntry(101);
```

---

### 9. `getReceiverInboxTags()` & `getSenderUnitTags()`
Sistemde kayıtlı genel Alıcı Posta Kutusu ve Gönderici Birim etiketlerini listeler.
```typescript
const inboxTags = await client.addressBook.getReceiverInboxTags();
const senderTags = await client.addressBook.getSenderUnitTags();
```
