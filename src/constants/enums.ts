/**
 * Fatura Senaryosu (ProfileID)
 */
export enum ScenarioType {
  TEMELFATURA = 'TEMELFATURA',
  TICARIFATURA = 'TICARIFATURA',
  IHRACAT = 'IHRACAT',
  YOLCUBERABERFATURA = 'YOLCUBERABERFATURA',
  KAMU = 'KAMU',
  HKS = 'HKS',
  ENERJI = 'ENERJI',
  ILAC_TIBBICIHAZ = 'ILAC_TIBBICIHAZ',
  YATIRIMTESVIK = 'YATIRIMTESVIK',
  IDIS = 'IDIS',
}

/**
 * Fatura Tipi (InvoiceTypeCode)
 */
export enum InvoiceType {
  SATIS = 'SATIS',
  IADE = 'IADE',
  TEVKIFAT = 'TEVKIFAT',
  ISTISNA = 'ISTISNA',
  OZELMATRAH = 'OZELMATRAH',
  IHRACKAYITLI = 'IHRACKAYITLI',
  SGK = 'SGK',
  KOMISYONCU = 'KOMISYONCU',
  TEVKIFATIADE = 'TEVKIFATIADE',
  KONAKLAMAVERGISI = 'KONAKLAMAVERGISI',
  HKSSATIS = 'HKSSATIS',
  HKSKOMISYONCU = 'HKSKOMISYONCU',
  SARJ = 'SARJ',
  SARJANLIK = 'SARJANLIK',
  TEKNOLOJIDESTEK = 'TEKNOLOJIDESTEK',
  YTBSATIS = 'YTBSATIS',
  YTBISTISNA = 'YTBISTISNA',
  YTBIADE = 'YTBIADE',
  YTBTEVKIFAT = 'YTBTEVKIFAT',
  YTBTEVKIFATIADE = 'YTBTEVKIFATIADE',
}

/**
 * e-Belge / Fatura Durumları
 */
export enum InvoiceStatus {
  Onay_Bekliyor = 'Onay_Bekliyor',
  Onaylandi = 'Onaylandi',
  Reddedildi = 'Reddedildi',
  Onay_Akisinda = 'Onay_Akisinda',
  Iade_Edildi = 'Iade_Edildi',
  Gonderildi = 'Gonderildi',
  Ziplendi = 'Ziplendi',
  Gibe_Iletildi = 'Gibe_Iletildi',
  Imza_Bekliyor = 'Imza_Bekliyor',
  Gib_Tarafinda_Hata_Olustu = 'Gib_Tarafinda_Hata_Olustu',
  Sistem_Hatasi = 'Sistem_Hatasi',
  Alici_Kabul_Etti = 'Alici_Kabul_Etti',
  Alici_Reddetti = 'Alici_Reddetti',
  Alici_Iade_Etti = 'Alici_Iade_Etti',
  Otomatik_Onaylandi = 'Otomatik_Onaylandi',
  Otomatik_Alici_Kabul_Etti = 'Otomatik_Alici_Kabul_Etti',
  Uygulama_Yaniti_Yollaniyor = 'Uygulama_Yaniti_Yollaniyor',
  Uygulama_Yaniti_Hata_Aldi = 'Uygulama_Yaniti_Hata_Aldi',
  Irsaliye_Yaniti_Yollaniyor = 'Irsaliye_Yaniti_Yollaniyor',
  Irsaliye_Yaniti_Hata_Aldi = 'Irsaliye_Yaniti_Hata_Aldi',
}

/**
 * Fatura Yönü
 */
export enum InvoiceDirection {
  Incoming = 'Incoming',
  Outgoing = 'Outgoing',
}

/**
 * Doküman Tipi
 */
export enum InvoiceDocumentType {
  EInvoice = 'EInvoice',
  EArchiveInvoice = 'EArchiveInvoice',
  Despatch = 'Despatch',
  ESMM = 'ESMM',
  EMM = 'EMM',
}

/**
 * e-Arşiv Gönderim Şekli
 */
export enum SendingType {
  NONE = 'NONE',
  ELEKTRONIK = 'ELEKTRONIK',
  KAGIT = 'KAGIT',
}

/**
 * e-Arşiv Alıcı Tipi
 */
export enum RecipientType {
  NONE = 'NONE',
  EFATURA = 'EFATURA',
  EARSIV = 'EARSIV',
  EIRSALIYE = 'EIRSALIYE',
  EIRSALIYEMUKELLEFOLMAYAN = 'EIRSALIYEMUKELLEFOLMAYAN',
  EDOVIZ = 'EDOVIZ',
}

/**
 * Ölçü Birimleri (UBL-TR / UN/ECE Rec 20)
 */
export enum MeasureUnit {
  ADET = 'C62',
  ADET_NIU = 'NIU',
  KILOGRAM = 'KGM',
  GRAM = 'GRM',
  METRE = 'MTR',
  METREKARE = 'MTK',
  METREKUP = 'MTQ',
  LITRE = 'LTR',
  PAKET = 'PA',
  KUTU = 'BX',
  KOLI = 'CS',
  GUN = 'DAY',
  AY = 'MON',
  YIL = 'ANN',
  SAAT = 'HUR',
  DAKIKA = 'MIN',
  KILOWATT_SAAT = 'KWH',
}

/**
 * Para Birimleri (ISO 4217)
 */
export enum Currency {
  TRY = 'TRY',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CHF = 'CHF',
  CAD = 'CAD',
  RUB = 'RUB',
  AED = 'AED',
  SAR = 'SAR',
}

/**
 * Vergi Tür Kodları
 */
export enum TaxTypeCode {
  KDV = '0015',
  OTV = '0071',
  STOPAJ = '0003',
  DAMGA_VERGISI = '0104',
  KONAKLAMA_VERGISI = '0059',
  OZEL_ILETISIM = '4080',
  BSMV = '0021',
  SGK_PRIM = '4171',
}
