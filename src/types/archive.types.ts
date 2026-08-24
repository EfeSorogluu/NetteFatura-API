import {
  Currency,
  InvoiceType,
  MeasureUnit,
} from '../constants/enums.js';
import { PagingRequest, PagingResponse } from './common.types.js';
import { InvoiceAddress, InvoiceResultItem, ReceiverParty } from './invoice.types.js';

export interface ArchiveProduct {
  ProductCode?: string;
  ProductName: string;
  UnitPrice?: number;
  MeasureUnit?: MeasureUnit | string;
  ExternalProductCode?: string;
  ReceiverProductCode?: string;
}

export interface ArchiveInvoiceDetail {
  Product: ArchiveProduct;
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
  SpecialBasisAmount?: number;
  SpecialBasisPercent?: number;
  SpecialBasisTaxAmount?: number;
}

export interface ArchiveInvoiceReceiver extends ReceiverParty {
  Address?: InvoiceAddress;
}

export interface ArchiveInvoice {
  ETTN?: string;
  InvoiceNumber?: string;
  ExternalArchiveInvoiceCode?: string;
  InvoiceDate: string;
  InvoiceCreationDate?: string;
  CurrencyCode: Currency | string;
  InvoiceType: InvoiceType | string;
  Receiver: ArchiveInvoiceReceiver;
  InvoiceDetails: ArchiveInvoiceDetail[];
  TotalLineExtensionAmount: number;
  TotalDiscountAmount?: number;
  TotalVATAmount: number;
  TotalTaxInclusiveAmount: number;
  TotalPayableAmount: number;
  Notes?: string[];
  OrderNumber?: string;
  OrderDate?: string;
  TaxExemptionReason?: string;
  TaxExemptionReasonCode?: string;
  XsltTemplate?: string;
  InvoiceXml?: string;
  InvoicePdf?: string;
  InvoiceHtml?: string;
}

export interface SendArchiveInvoiceRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  ArchiveInvoices: ArchiveInvoice[];
}

export interface ArchiveInvoiceReturnItem {
  ArchiveInvoiceNumber?: string;
  Ettn?: string;
  ETTN?: string;
  ExternalArchiveInvoiceCode?: string;
  IsSucceded?: boolean;
  Message?: string;
}

export interface SendArchiveInvoiceResponse {
  IsSucceded?: boolean;
  Result?: string;
  ErrorMessage?: string;
  Message?: string;
  ArchiveInvoices?: ArchiveInvoiceReturnItem[];
  ArchiveInvoiceResults?: InvoiceResultItem[];
  SendArchiveInvoiceResult?: {
    IsSucceded?: boolean;
    Result?: string;
    Message?: string;
    ArchiveInvoices?: ArchiveInvoiceReturnItem[];
    ArchiveInvoiceResults?: InvoiceResultItem[];
  };
}

export interface ArchiveInvoiceCancellation {
  ETTN: string;
  CancellationReason: string;
}

export interface CancelArchiveInvoiceRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  ArchiveInvoiceList: ArchiveInvoiceCancellation[];
}

export interface CancelArchiveInvoiceResponse {
  IsSucceded: boolean;
  Message?: string;
}

export interface ArchiveResultSet {
  IsAdditionalTaxIncluded?: boolean;
  IsArchiveIncluded?: boolean;
  IsAttachmentIncluded?: boolean;
  IsExternalUrlIncluded?: boolean;
  IsHtmlIncluded?: boolean;
  IsInvoiceDetailIncluded?: boolean;
  IsPdfIncluded?: boolean;
  IsXMLIncluded?: boolean;
}

export interface SearchArchiveInvoiceRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  MinInvoiceDate?: string;
  MaxInvoiceDate?: string;
  InvoiceNumber?: string;
  ETTN?: string;
  ReceiverTaxCode?: string;
  PagingRequest?: PagingRequest;
  ResultSet?: ArchiveResultSet;
}

export interface SearchArchiveInvoiceResponse {
  IsSucceded: boolean;
  Message?: string;
  PagingResponse?: PagingResponse;
  ArchiveInvoices?: ArchiveInvoice[];
}
