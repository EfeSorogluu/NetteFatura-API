import {
  Currency,
  InvoiceDirection,
  InvoiceDocumentType,
  InvoiceStatus,
  InvoiceType,
  MeasureUnit,
  ScenarioType,
} from '../constants/enums.js';
import { PagingRequest, PagingResponse } from './common.types.js';

export interface Product {
  ProductCode?: string;
  ProductName: string;
  UnitPrice: number;
  MeasureUnit?: MeasureUnit | string;
  ExternalProductCode?: string;
  ReceiverProductCode?: string;
}

export interface Tax {
  TaxAmount: number;
  TaxCode: string;
  TaxName?: string;
  TaxPercent?: number;
  TaxExemptionReason?: string;
  TaxExemptionReasonCode?: string;
}

export interface InvoiceDetail {
  Product: Product;
  Quantity: number;
  LineExtensionAmount: number;
  VATRate: number;
  VATAmount: number;
  CurrencyCode?: Currency | string;
  DiscountRate?: number;
  DiscountAmount?: number;
  StockDescription?: string;
  Note?: string;
  TaxExemptionReason?: string;
  TaxExemptionReasonCode?: string;
  Taxes?: Tax[];
  SpecialBasisAmount?: number;
  SpecialBasisPercent?: number;
  SpecialBasisTaxAmount?: number;
  Mensei?: string;
}

export interface InvoiceAddress {
  AddressLine1?: string;
  AddressLine2?: string;
  BoulevardAveneuStreetName?: string;
  BuildingName?: string;
  BuildingNumber?: string;
  CityCode?: string | number;
  CityName?: string;
  CountryCode?: string;
  CountryName?: string;
  DoorNumber?: string;
  EMail?: string;
  FaxNumber?: string;
  PhoneNumber?: string;
  PostalCode?: string;
  Region?: string;
  SubdivisionName?: string;
  TaxOfficeCode?: string;
  TaxOfficeName?: string;
  TownCode?: string | number;
  TownName?: string;
  WebAddress?: string;
}

export interface ReceiverParty {
  ReceiverName: string;
  ReceiverTaxCode: string;
  Address?: InvoiceAddress;
  RecipientType?: string;
  SendingType?: string;
  TaxOfficeCode?: string;
  TaxOfficeName?: string;
  EMail?: string;
  AccountAlias?: string;
}

export interface FinancialAccount {
  Iban: string;
  BankName?: string;
  BranchName?: string;
  CurrencyCode?: Currency | string;
  PaymentNote?: string;
}

export interface DocumentReference {
  Id?: string;
  IssueDate?: string;
  DocumentType?: string;
  DocumentTypeCode?: string;
  DocumentDescription?: string;
}

export interface Invoice {
  /**
   * Benzersiz Evrensel Tanımlayıcı (UUID v4 formatında)
   */
  ETTN?: string;

  /**
   * Fatura Numarası (GİB standart 16 haneli, örn: GIB2026000000001 veya sistem tarafından otomatik üretilir)
   */
  InvoiceNumber?: string;

  /**
   * Dış Entegratör / ERP Sistemindeki Fatura Kodu
   */
  ExternalInvoiceCode?: string;

  /**
   * Fatura Tarihi (YYYY-MM-DD veya ISO DateTime formatında)
   */
  InvoiceDate: string;

  /**
   * Fatura Oluşturulma Tarihi (Opsiyonel)
   */
  InvoiceCreationDate?: string;

  /**
   * Para Birimi (TRY, USD, EUR vb.)
   */
  CurrencyCode: Currency | string;

  /**
   * Fatura Senaryosu (TEMEL, TICARI, IHRACAT vb.)
   */
  ScenarioType: ScenarioType | string;

  /**
   * Fatura Tipi (SATIS, IADE, TEVKIFAT, ISTISNA vb.)
   */
  InvoiceType: InvoiceType | string;

  /**
   * Alıcı Bilgileri
   */
  Receiver: ReceiverParty;

  /**
   * Fatura Kalemleri
   */
  InvoiceDetails: InvoiceDetail[];

  /**
   * Satır Toplam Tutarı (İndirim ve KDV hariç matrah toplamı)
   */
  TotalLineExtensionAmount: number;

  /**
   * Toplam İndirim Tutarı
   */
  TotalDiscountAmount?: number;

  /**
   * Toplam KDV Tutarı
   */
  TotalVATAmount: number;

  /**
   * Vergi Dahil Toplam Tutar
   */
  TotalTaxInclusiveAmount: number;

  /**
   * Ödenecek Nihai Toplam Tutar
   */
  TotalPayableAmount: number;

  /**
   * Toplam Vergi Listesi (KDV, ÖTV, Stopaj vb.)
   */
  InvoiceTotalTaxList?: Tax[];

  /**
   * Fatura Notları
   */
  Notes?: string[];

  /**
   * Banka Hesap Bilgileri
   */
  FinancialAccount?: FinancialAccount[];

  /**
   * Sipariş Numarası
   */
  OrderNumber?: string;

  /**
   * Sipariş Tarihi
   */
  OrderDate?: string;

  /**
   * Son Ödeme Tarihi
   */
  LastPaymentDate?: string;

  /**
   * İade faturası ise referans fatura bilgileri
   */
  ReturnInvoiceNumber?: string;
  ReturnInvoiceDate?: string;
  ReturnInvoiceETTN?: string;
  ReturnNote?: string;

  /**
   * İstisna/Muafiyet Açıklaması
   */
  TaxExemptionReason?: string;

  /**
   * Alıcı GİB Posta Kutusu Etiketi (örn. defaultpk@isnet.net.tr)
   */
  ReceiverInboxTag?: string;

  /**
   * Özel XSLT Şablonu (Base64)
   */
  XsltTemplate?: string;

  /**
   * Ek Belge Referansları
   */
  AdditionalDocumentReferences?: DocumentReference[];

  /**
   * Fatura Durumu (Sorgulamalarda döner)
   */
  Status?: InvoiceStatus | string;
  DetailStatus?: string;
  InvoiceXml?: string;
  InvoicePdf?: string;
  InvoiceHtml?: string;
}

export interface SendInvoiceRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  Invoices: Invoice[];
}

export interface InvoiceResultItem {
  ETTN?: string;
  InvoiceNumber?: string;
  IsSucceded: boolean;
  Message?: string;
  ErrorCode?: string;
}

export interface SendInvoiceResponse {
  IsSucceded: boolean;
  Message?: string;
  InvoiceResults?: InvoiceResultItem[];
  Result?: {
    IsSuccess: boolean;
    ErrorMessage?: string;
  };
}

export interface SendInvoiceXmlItem {
  InvoiceContent: string; // Base64 encoded UBL-TR XML
  ETTN?: string;
  InvoiceNumber?: string;
}

export interface SendInvoiceXmlRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  Invoices: SendInvoiceXmlItem[];
}

export interface SendInvoiceXmlResponse {
  IsSucceded: boolean;
  Message?: string;
  InvoiceResults?: InvoiceResultItem[];
}

export interface SearchInvoiceResultSet {
  IsAdditionalTaxIncluded?: boolean;
  IsArchiveIncluded?: boolean;
  IsInvoiceDetailIncluded?: boolean;
  IsXMLIncluded?: boolean;
}

export interface SearchInvoiceRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  InvoiceDirection: InvoiceDirection | string;
  MinInvoiceDate?: string;
  MaxInvoiceDate?: string;
  InvoiceNumber?: string;
  ETTN?: string;
  ReceiverTaxCode?: string;
  PagingRequest?: PagingRequest;
  ResultSet?: SearchInvoiceResultSet;
}

export interface SearchInvoiceResponse {
  IsSucceded: boolean;
  Message?: string;
  PagingResponse?: PagingResponse;
  Invoices?: Invoice[];
}

export interface DocumentViewerLinkRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  Ettn: string;
  InvoiceDirection?: InvoiceDirection | string;
  InvoiceDocumentType?: InvoiceDocumentType | string;
  InvoiceNumber?: string;
}

export interface DocumentViewerLinkResponse {
  IsSucceded: boolean;
  Message?: string;
  HtmlUrl?: string;
  PdfUrl?: string;
  Result?: {
    IsSuccess: boolean;
    ErrorMessage?: string;
  };
}

export interface GetBalanceRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
}

export interface GetBalanceResponse {
  IsSucceded: boolean;
  Message?: string;
  TotalCredit?: number;
  RemainingCredit?: number;
  UsedCredit?: number;
  Balance?: number;
}
