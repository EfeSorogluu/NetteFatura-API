import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { generateGoLivePackage } from '../src/tools/go-live.tool.js';

vi.mock('axios');

describe('generateGoLivePackage Tool', () => {
  it('should generate request, response, ubl XML, and email template', async () => {
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
    expect(result.invoiceNumber).toBe('YEK2026999006516');
    expect(result.ettn).toBe('a89ecc2c-318c-4398-92b9-c35a7b69280f');
    expect(result.requestXml).toContain('<tem:SendArchiveInvoice>');
    expect(result.responseXml).toContain('<a:Result>Success</a:Result>');
    expect(result.ublXml).toContain('<cbc:ProfileID>TEMELFATURA</cbc:ProfileID>');
    expect(result.emailTemplate).toContain('TEST FİRMA A.Ş.');
    expect(result.emailTemplate).toContain('185.100.100.100');
  });
});
