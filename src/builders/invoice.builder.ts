import { randomUUID } from 'crypto';
import {
  Currency,
  InvoiceType,
  MeasureUnit,
  RecipientType,
  ScenarioType,
  SendingType,
} from '../constants/enums.js';
import {
  FinancialAccount,
  Invoice,
  InvoiceAddress,
  InvoiceDetail,
  Product,
  ReceiverParty,
  Tax,
} from '../types/invoice.types.js';
import {
  ArchiveInvoice,
  ArchiveInvoiceDetail,
  ArchiveInvoiceReceiver,
  ArchiveProduct,
} from '../types/archive.types.js';

export interface AddLineItemOptions {
  name: string;
  unitPrice: number;
  quantity: number;
  vatRate: number;
  productCode?: string;
  measureUnit?: MeasureUnit | string;
  discountRate?: number;
  discountAmount?: number;
  taxExemptionReason?: string;
  taxExemptionReasonCode?: string;
  note?: string;
  mensei?: string;
}

/**
 * Modern Fluent Builder for creating valid e-Invoice (e-Fatura) objects
 */
export class InvoiceBuilder {
  private invoice: Partial<Invoice> = {
    ETTN: randomUUID(),
    CurrencyCode: Currency.TRY,
    ScenarioType: ScenarioType.TEMELFATURA,
    InvoiceType: InvoiceType.SATIS,
    InvoiceDate: new Date().toISOString().split('T')[0],
    InvoiceCreationDate: new Date().toISOString().split('T')[0],
    InvoiceDetails: [],
    Notes: [],
    FinancialAccount: [],
  };

  public setEttn(ettn: string): this {
    this.invoice.ETTN = ettn;
    return this;
  }

  public setInvoiceNumber(invoiceNumber: string): this {
    this.invoice.InvoiceNumber = invoiceNumber;
    return this;
  }

  public setExternalCode(code: string): this {
    this.invoice.ExternalInvoiceCode = code;
    return this;
  }

  public setInvoiceDate(date: Date | string): this {
    this.invoice.InvoiceDate =
      date instanceof Date ? date.toISOString().split('T')[0] : date;
    return this;
  }

  public setCurrency(currency: Currency | string): this {
    this.invoice.CurrencyCode = currency;
    return this;
  }

  public setScenario(scenario: ScenarioType | string): this {
    this.invoice.ScenarioType = scenario;
    return this;
  }

  public setType(type: InvoiceType | string): this {
    this.invoice.InvoiceType = type;
    return this;
  }

  public setReceiver(receiver: ReceiverParty): this {
    this.invoice.Receiver = receiver;
    return this;
  }

  public setReceiverInboxTag(tag: string): this {
    this.invoice.ReceiverInboxTag = tag;
    return this;
  }

  public addLine(options: AddLineItemOptions): this {
    const code = options.productCode || 'PRD-' + ((this.invoice.InvoiceDetails?.length || 0) + 1);
    const product: Product = {
      ProductName: options.name,
      UnitPrice: options.unitPrice,
      ProductCode: code,
      ExternalProductCode: code,
      MeasureUnit: options.measureUnit || MeasureUnit.ADET_NIU,
    };

    const grossAmount = options.unitPrice * options.quantity;
    let discountAmount = options.discountAmount || 0;
    if (options.discountRate && !options.discountAmount) {
      discountAmount = (grossAmount * options.discountRate) / 100;
    }

    const lineExtensionAmount = round2(grossAmount - discountAmount);
    const vatAmount = round2((lineExtensionAmount * options.vatRate) / 100);

    const detail: InvoiceDetail = {
      Product: product,
      Quantity: options.quantity,
      LineExtensionAmount: lineExtensionAmount,
      VATRate: options.vatRate,
      VATAmount: vatAmount,
      CurrencyCode: this.invoice.CurrencyCode || Currency.TRY,
      DiscountRate: options.discountRate,
      DiscountAmount: discountAmount > 0 ? discountAmount : undefined,
      TaxExemptionReason: options.taxExemptionReason,
      TaxExemptionReasonCode: options.taxExemptionReasonCode,
      Note: options.note,
      Mensei: options.mensei || 'TR',
    };

    if (!this.invoice.InvoiceDetails) {
      this.invoice.InvoiceDetails = [];
    }
    this.invoice.InvoiceDetails.push(detail);

    return this;
  }

  public addNote(note: string): this {
    if (!this.invoice.Notes) {
      this.invoice.Notes = [];
    }
    this.invoice.Notes.push(note);
    return this;
  }

  public addBankAccount(account: FinancialAccount): this {
    if (!this.invoice.FinancialAccount) {
      this.invoice.FinancialAccount = [];
    }
    this.invoice.FinancialAccount.push(account);
    return this;
  }

  public setOrder(orderNumber: string, orderDate?: Date | string): this {
    this.invoice.OrderNumber = orderNumber;
    if (orderDate) {
      this.invoice.OrderDate =
        orderDate instanceof Date ? orderDate.toISOString().split('T')[0] : orderDate;
    }
    return this;
  }

  public build(): Invoice {
    if (!this.invoice.Receiver) {
      throw new Error('Alıcı bilgisi (Receiver) zorunludur!');
    }
    if (!this.invoice.InvoiceDetails || this.invoice.InvoiceDetails.length === 0) {
      throw new Error('Faturada en az 1 satır (InvoiceDetail) olmalıdır!');
    }

    let totalLineExtension = 0;
    let totalDiscount = 0;
    let totalVat = 0;

    for (const detail of this.invoice.InvoiceDetails) {
      totalLineExtension += detail.LineExtensionAmount;
      if (detail.DiscountAmount) {
        totalDiscount += detail.DiscountAmount;
      }
      totalVat += detail.VATAmount;
    }

    totalLineExtension = round2(totalLineExtension);
    totalDiscount = round2(totalDiscount);
    totalVat = round2(totalVat);

    const totalTaxInclusive = round2(totalLineExtension + totalVat);
    const totalPayable = totalTaxInclusive;

    const invoice: Invoice = {
      ETTN: this.invoice.ETTN || randomUUID(),
      InvoiceNumber: this.invoice.InvoiceNumber,
      ExternalInvoiceCode: this.invoice.ExternalInvoiceCode || `EXT-${Date.now()}`,
      InvoiceDate: this.invoice.InvoiceDate || new Date().toISOString().split('T')[0],
      InvoiceCreationDate: this.invoice.InvoiceCreationDate,
      CurrencyCode: this.invoice.CurrencyCode || Currency.TRY,
      ScenarioType: this.invoice.ScenarioType || ScenarioType.TEMELFATURA,
      InvoiceType: this.invoice.InvoiceType || InvoiceType.SATIS,
      Receiver: this.invoice.Receiver,
      ReceiverInboxTag: this.invoice.ReceiverInboxTag,
      InvoiceDetails: this.invoice.InvoiceDetails,
      TotalLineExtensionAmount: totalLineExtension,
      TotalDiscountAmount: totalDiscount > 0 ? totalDiscount : 0,
      TotalVATAmount: totalVat,
      TotalTaxInclusiveAmount: totalTaxInclusive,
      TotalPayableAmount: totalPayable,
      Notes: this.invoice.Notes,
      FinancialAccount: this.invoice.FinancialAccount,
      OrderNumber: this.invoice.OrderNumber,
      OrderDate: this.invoice.OrderDate,
    };

    return invoice;
  }
}

/**
 * Modern Fluent Builder for creating valid e-Archive Invoice (e-Arşiv Fatura) objects
 */
export class ArchiveInvoiceBuilder {
  private invoice: Partial<ArchiveInvoice> = {
    ETTN: randomUUID(),
    CurrencyCode: Currency.TRY,
    InvoiceType: InvoiceType.SATIS,
    InvoiceDate: new Date().toISOString().split('T')[0],
    InvoiceCreationDate: new Date().toISOString().split('T')[0],
    InvoiceDetails: [],
    Notes: [],
  };

  public setEttn(ettn: string): this {
    this.invoice.ETTN = ettn;
    return this;
  }

  public setInvoiceNumber(invoiceNumber: string): this {
    this.invoice.InvoiceNumber = invoiceNumber;
    return this;
  }

  public setExternalCode(code: string): this {
    this.invoice.ExternalArchiveInvoiceCode = code;
    return this;
  }

  public setInvoiceDate(date: Date | string): this {
    this.invoice.InvoiceDate =
      date instanceof Date ? date.toISOString().split('T')[0] : date;
    return this;
  }

  public setCurrency(currency: Currency | string): this {
    this.invoice.CurrencyCode = currency;
    return this;
  }

  public setType(type: InvoiceType | string): this {
    this.invoice.InvoiceType = type;
    return this;
  }

  public setReceiver(
    name: string,
    taxCode: string,
    email?: string,
    address?: InvoiceAddress
  ): this {
    const receiverAddress: InvoiceAddress = {
      CityCode: '34',
      CityName: 'İSTANBUL',
      CountryName: 'TÜRKİYE',
      CountryCode: 'TR',
      EMail: email,
      ...address,
    };
    if (email && !receiverAddress.EMail) {
      receiverAddress.EMail = email;
    }

    this.invoice.Receiver = {
      ReceiverName: name,
      ReceiverTaxCode: taxCode,
      RecipientType: RecipientType.EARSIV,
      SendingType: SendingType.ELEKTRONIK,
      Address: receiverAddress,
    };
    return this;
  }

  public setFullReceiver(receiver: ArchiveInvoiceReceiver): this {
    this.invoice.Receiver = receiver;
    return this;
  }

  public addLine(options: AddLineItemOptions): this {
    const code = options.productCode || 'PRD-' + ((this.invoice.InvoiceDetails?.length || 0) + 1);
    const product: ArchiveProduct = {
      ProductName: options.name,
      UnitPrice: options.unitPrice,
      ProductCode: code,
      ExternalProductCode: code,
      MeasureUnit: options.measureUnit || MeasureUnit.ADET_NIU,
    };

    const grossAmount = options.unitPrice * options.quantity;
    let discountAmount = options.discountAmount || 0;
    if (options.discountRate && !options.discountAmount) {
      discountAmount = (grossAmount * options.discountRate) / 100;
    }

    const lineExtensionAmount = round2(grossAmount - discountAmount);
    const vatAmount = round2((lineExtensionAmount * options.vatRate) / 100);

    const detail: ArchiveInvoiceDetail = {
      Product: product,
      Quantity: options.quantity,
      LineExtensionAmount: lineExtensionAmount,
      VATRate: options.vatRate,
      VATAmount: vatAmount,
      CurrencyCode: this.invoice.CurrencyCode || Currency.TRY,
      DiscountRate: options.discountRate,
      DiscountAmount: discountAmount > 0 ? discountAmount : undefined,
      TaxExemptionReason: options.taxExemptionReason,
      TaxExemptionReasonCode: options.taxExemptionReasonCode,
      Note: options.note,
    };

    if (!this.invoice.InvoiceDetails) {
      this.invoice.InvoiceDetails = [];
    }
    this.invoice.InvoiceDetails.push(detail);

    return this;
  }

  public addNote(note: string): this {
    if (!this.invoice.Notes) {
      this.invoice.Notes = [];
    }
    this.invoice.Notes.push(note);
    return this;
  }

  public setOrder(orderNumber: string, orderDate?: Date | string): this {
    this.invoice.OrderNumber = orderNumber;
    if (orderDate) {
      this.invoice.OrderDate =
        orderDate instanceof Date ? orderDate.toISOString().split('T')[0] : orderDate;
    }
    return this;
  }

  public build(): ArchiveInvoice {
    if (!this.invoice.Receiver) {
      throw new Error('Alıcı bilgisi (Receiver) zorunludur!');
    }
    if (!this.invoice.InvoiceDetails || this.invoice.InvoiceDetails.length === 0) {
      throw new Error('Faturada en az 1 satır (InvoiceDetail) olmalıdır!');
    }

    let totalLineExtension = 0;
    let totalDiscount = 0;
    let totalVat = 0;

    for (const detail of this.invoice.InvoiceDetails) {
      totalLineExtension += detail.LineExtensionAmount;
      if (detail.DiscountAmount) {
        totalDiscount += detail.DiscountAmount;
      }
      totalVat += detail.VATAmount;
    }

    totalLineExtension = round2(totalLineExtension);
    totalDiscount = round2(totalDiscount);
    totalVat = round2(totalVat);

    const totalTaxInclusive = round2(totalLineExtension + totalVat);
    const totalPayable = totalTaxInclusive;

    const invoice: ArchiveInvoice = {
      ETTN: this.invoice.ETTN || randomUUID(),
      InvoiceNumber: this.invoice.InvoiceNumber,
      ExternalArchiveInvoiceCode: this.invoice.ExternalArchiveInvoiceCode,
      InvoiceDate: this.invoice.InvoiceDate || new Date().toISOString().split('T')[0],
      InvoiceCreationDate: this.invoice.InvoiceCreationDate,
      CurrencyCode: this.invoice.CurrencyCode || Currency.TRY,
      InvoiceType: this.invoice.InvoiceType || InvoiceType.SATIS,
      Receiver: this.invoice.Receiver,
      InvoiceDetails: this.invoice.InvoiceDetails,
      TotalLineExtensionAmount: totalLineExtension,
      TotalDiscountAmount: totalDiscount > 0 ? totalDiscount : 0,
      TotalVATAmount: totalVat,
      TotalTaxInclusiveAmount: totalTaxInclusive,
      TotalPayableAmount: totalPayable,
      Notes: this.invoice.Notes,
      OrderNumber: this.invoice.OrderNumber,
      OrderDate: this.invoice.OrderDate,
    };

    return invoice;
  }
}

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
