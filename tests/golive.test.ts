import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { generateGoLivePackage } from '../src/tools/go-live.tool.js';

vi.mock('axios');

describe('generateGoLivePackage Tool', () => {
  it('should generate both e-Invoice and e-Archive sets with email template', async () => {
    // 1. SendInvoice mock
    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 200,
      data: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <SendInvoiceResponse xmlns="http://tempuri.org/">
      <SendInvoiceResult xmlns:a="http://schemas.datacontract.org/2004/07/EInvoice.Service.Model">
        <a:Result>Success</a:Result>
        <a:Invoices>
          <a:InvoiceReturn>
            <a:InvoiceNumber>UUU2026999463457</a:InvoiceNumber>
            <a:Ettn>8372ee39-9f0a-450f-95d8-213a9a2e173e</a:Ettn>
          </a:InvoiceReturn>
        </a:Invoices>
      </SendInvoiceResult>
    </SendInvoiceResponse>
  </s:Body>
</s:Envelope>`,
    });

    // 2. SendArchiveInvoice mock
    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 200,
      data: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <SendArchiveInvoiceResponse xmlns="http://tempuri.org/">
      <SendArchiveInvoiceResult xmlns:a="http://schemas.datacontract.org/2004/07/EInvoice.Service.Model">
        <a:Result>Success</a:Result>
        <a:ArchiveInvoices>
          <a:ArchiveInvoiceReturn>
            <a:ArchiveInvoiceNumber>YEK2026999006516</a:ArchiveInvoiceNumber>
            <a:Ettn>a89ecc2c-318c-4398-92b9-c35a7b69280f</a:Ettn>
          </a:ArchiveInvoiceReturn>
        </a:ArchiveInvoices>
      </SendArchiveInvoiceResult>
    </SendArchiveInvoiceResponse>
  </s:Body>
</s:Envelope>`,
    });

    const result = await generateGoLivePackage({
      supplier: {
        vkn: '11111111111',
        name: 'TEST FİRMA A.Ş.',
        city: 'İSTANBUL',
      },
      staticIp: '185.100.100.100',
    });

    expect(result.success).toBe(true);

    // e-Fatura kontrolleri
    expect(result.eInvoice.invoiceNumber).toBe('UUU2026999463457');
    expect(result.eInvoice.ettn).toBe('8372ee39-9f0a-450f-95d8-213a9a2e173e');
    expect(result.eInvoice.requestXml).toContain('<tem:SendInvoice>');
    expect(result.eInvoice.responseXml).toContain('<a:Result>Success</a:Result>');
    expect(result.eInvoice.ublXml).toContain('<cbc:ProfileID>TEMELFATURA</cbc:ProfileID>');

    // e-Arşiv kontrolleri
    expect(result.eArchive.invoiceNumber).toBe('YEK2026999006516');
    expect(result.eArchive.ettn).toBe('a89ecc2c-318c-4398-92b9-c35a7b69280f');
    expect(result.eArchive.requestXml).toContain('<tem:SendArchiveInvoice>');
    expect(result.eArchive.responseXml).toContain('<a:Result>Success</a:Result>');

    // E-posta şablonu kontrolleri
    expect(result.emailTemplate).toContain('01_efatura_soap_request.xml');
    expect(result.emailTemplate).toContain('04_earsiv_soap_request.xml');
    expect(result.emailTemplate).toContain('TEST FİRMA A.Ş.');
    expect(result.emailTemplate).toContain('185.100.100.100');
  });
});
