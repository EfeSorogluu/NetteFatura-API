import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceService } from '../src/services/invoice.service.js';
import { SoapClient } from '../src/core/soap-client.js';
import { resolveConfig } from '../src/config.js';
import { InvoiceBuilder, ArchiveInvoiceBuilder } from '../src/builders/invoice.builder.js';
import { Currency, InvoiceDirection, InvoiceDocumentType, InvoiceType, ScenarioType } from '../src/constants/enums.js';

describe('InvoiceService Unit Tests', () => {
  let invoiceService: InvoiceService;
  let mockSoapClient: SoapClient;

  beforeEach(() => {
    const config = resolveConfig({
      companyTaxCode: '4810173324',
      environment: 'test',
    });
    mockSoapClient = new SoapClient(config);
    vi.spyOn(mockSoapClient, 'call').mockImplementation(async (_endpoint, action, _iface, requestData) => {
      if (action === 'HealthCheck') {
        return { HealthCheckResult: 'true' };
      }
      if (action === 'GetCompanyBalance') {
        return { Result: 'Success', Balance: 1000 };
      }
      if (action === 'GetCompany') {
        return { Result: 'Success', Company: { TaxCode: '4810173324', Name: 'İş Net' } };
      }
      if (action === 'GetCompanyVendor') {
        return { Result: 'Success', Vendors: [{ VendorNumber: '001' }] };
      }
      if (action === 'SendInvoice') {
        return {
          IsSucceded: true,
          InvoiceResults: [{ InvoiceNumber: 'GIB2026000000001', IsSucceded: true, ETTN: 'uuid-1' }],
        };
      }
      if (action === 'SendInvoiceXml') {
        return {
          IsSucceded: true,
          InvoiceResults: [{ InvoiceNumber: 'GIB2026000000002', IsSucceded: true }],
        };
      }
      if (action === 'SendArchiveInvoice') {
        return {
          Result: 'Success',
          ArchiveInvoices: [{ ArchiveInvoiceNumber: 'YEK2026000000001', Ettn: 'uuid-archive-1' }],
        };
      }
      if (action === 'SearchInvoice') {
        return {
          IsSucceded: true,
          Invoices: [{ InvoiceNumber: 'GIB2026000000001' }],
        };
      }
      if (action === 'SearchArchiveInvoice') {
        return {
          IsSucceded: true,
          ArchiveInvoices: [{ InvoiceNumber: 'YEK2026000000001' }],
        };
      }
      if (action === 'GetDocumentViewerLink') {
        return {
          IsSucceded: true,
          HtmlUrl: 'https://portal.isnet.net.tr/view/html/1',
          PdfUrl: 'https://portal.isnet.net.tr/view/pdf/1',
        };
      }
      if (action === 'CancelArchiveInvoice') {
        return { IsSucceded: true };
      }
      if (action === 'ContestArchiveInvoice') {
        return { IsSucceded: true, Result: 'Success' };
      }
      if (action === 'SendInvoiceReply') {
        return { Result: 'Success' };
      }
      if (action === 'SendDespatchAdvice') {
        return { Result: 'Success', DespatchAdviceResults: [{ DespatchAdviceNumber: 'IRS2026000000001' }] };
      }
      if (action === 'SendDespatchAdviceXml') {
        return { Result: 'Success' };
      }
      if (action === 'SearchDespatchAdvice') {
        return { Result: 'Success', DespatchAdvices: [{ DespatchAdviceNumber: 'IRS2026000000001' }] };
      }
      if (action === 'SendReceiptAdvice') {
        return { Result: 'Success' };
      }
      if (action === 'SendESMM') {
        return { Result: 'Success', ESMMResults: [{ ESMMNumber: 'SMM2026000000001' }] };
      }
      if (action === 'SearchESMM') {
        return { Result: 'Success', ESMMList: [{ ESMMNumber: 'SMM2026000000001' }] };
      }
      if (action === 'CancelESMM') {
        return { Result: 'Success' };
      }
      if (action === 'SendCurrencyInvoice') {
        return { Result: 'Success' };
      }
      if (action === 'SendInsurance') {
        return { Result: 'Success' };
      }
      if (action === 'CancelInsurance') {
        return { Result: 'Success' };
      }
      if (action === 'SendArchiveInvoiceMail') {
        return { Result: 'Success' };
      }
      return { Result: 'Success' };
    });

    invoiceService = new InvoiceService(config, mockSoapClient);
  });

  it('should check healthCheck and getCompanyBalance', async () => {
    const health = await invoiceService.healthCheck();
    expect(health).toBe('true');

    const balance = await invoiceService.getCompanyBalance();
    expect(balance.Balance).toBe(1000);
  });

  it('should get company and vendor information', async () => {
    const company = await invoiceService.getCompany();
    expect(company.Company.TaxCode).toBe('4810173324');

    const vendor = await invoiceService.getCompanyVendor();
    expect(vendor.Vendors).toHaveLength(1);
  });

  it('should send e-Invoice (SendInvoice & SendInvoiceXml)', async () => {
    const invoice = new InvoiceBuilder()
      .setReceiver({ ReceiverName: 'Alıcı', ReceiverTaxCode: '1234567805' })
      .addLine({ name: 'Ürün', unitPrice: 100, quantity: 1, vatRate: 20 })
      .build();

    const res = await invoiceService.sendInvoice(invoice);
    expect(res.InvoiceResults?.[0].InvoiceNumber).toBe('GIB2026000000001');

    const xmlRes = await invoiceService.sendInvoiceXml('<Invoice>test</Invoice>');
    expect(xmlRes.InvoiceResults?.[0].InvoiceNumber).toBe('GIB2026000000002');
  });

  it('should send e-Archive Invoice (SendArchiveInvoice)', async () => {
    const archive = new ArchiveInvoiceBuilder()
      .setReceiver('Alıcı', '11111111111')
      .addLine({ name: 'Hizmet', unitPrice: 500, quantity: 1, vatRate: 20 })
      .build();

    const res = await invoiceService.sendArchiveInvoice(archive);
    expect(res.ArchiveInvoices?.[0].ArchiveInvoiceNumber).toBe('YEK2026000000001');
  });

  it('should search invoices and archive invoices', async () => {
    const invoices = await invoiceService.searchInvoice({
      InvoiceDirection: InvoiceDirection.Outgoing,
    });
    expect(invoices.Invoices).toHaveLength(1);

    const archives = await invoiceService.searchArchiveInvoice({});
    expect(archives.ArchiveInvoices).toHaveLength(1);
  });

  it('should get document viewer link', async () => {
    const link = await invoiceService.getDocumentViewerLink('uuid-1');
    expect(link.HtmlUrl).toContain('html');
    expect(link.PdfUrl).toContain('pdf');
  });

  it('should cancel and contest archive invoices', async () => {
    const cancel = await invoiceService.cancelArchiveInvoice({
      ETTN: 'uuid-archive-1',
      CancellationReason: 'Hatalı fatura',
    });
    expect(cancel.IsSucceded).toBe(true);

    const contest = await invoiceService.contestArchiveInvoice({
      ArchiveInvoiceList: [{ ETTN: 'uuid-archive-1', ContestReason: 'İtiraz' }],
    });
    expect(contest.Result).toBe('Success');
  });

  it('should send invoice reply (SendInvoiceReply)', async () => {
    const reply = await invoiceService.sendInvoiceReply({
      InvoiceReply: {
        ETTN: 'uuid-1',
        ResponseType: 'KABUL',
      },
    });
    expect(reply.Result).toBe('Success');
  });

  it('should handle Despatch Advice (e-İrsaliye) operations', async () => {
    const sendRes = await invoiceService.sendDespatchAdvice({ DespatchAdvices: [{}] });
    expect(sendRes.DespatchAdviceResults?.[0].DespatchAdviceNumber).toBe('IRS2026000000001');

    const xmlRes = await invoiceService.sendDespatchAdviceXml('<DespatchAdvice/>');
    expect(xmlRes.Result).toBe('Success');

    const searchRes = await invoiceService.searchDespatchAdvice({});
    expect(searchRes.DespatchAdvices).toHaveLength(1);

    const receiptRes = await invoiceService.sendReceiptAdvice({});
    expect(receiptRes.Result).toBe('Success');
  });

  it('should handle e-SMM (Serbest Meslek Makbuzu) operations', async () => {
    const sendRes = await invoiceService.sendESMM({ ESMMList: [{}] });
    expect(sendRes.ESMMResults?.[0].ESMMNumber).toBe('SMM2026000000001');

    const searchRes = await invoiceService.searchESMM({});
    expect(searchRes.ESMMList).toHaveLength(1);

    const cancelRes = await invoiceService.cancelESMM({ ESMMCancellationList: [{}] });
    expect(cancelRes.Result).toBe('Success');
  });

  it('should handle e-Döviz and Insurance operations', async () => {
    const doviz = await invoiceService.sendCurrencyInvoice({});
    expect(doviz.Result).toBe('Success');

    const ins = await invoiceService.sendInsurance({});
    expect(ins.Result).toBe('Success');

    const insCancel = await invoiceService.cancelInsurance({ Insurances: [{}] });
    expect(insCancel.Result).toBe('Success');
  });

  it('should resend archive invoice mail', async () => {
    const res = await invoiceService.sendArchiveInvoiceMail({
      ETTN: 'uuid-archive-1',
      Email: 'test@example.com',
    });
    expect(res.Result).toBe('Success');
  });
});
