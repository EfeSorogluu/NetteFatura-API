import { describe, it, expect } from 'vitest';
import { NetteFaturaClient } from '../src/client.js';
import { InvoiceBuilder, ArchiveInvoiceBuilder } from '../src/builders/invoice.builder.js';
import { buildSoapEnvelope, parseSoapResponse, serializeToSoapXml } from '../src/core/xml-parser.js';
import { SoapFaultError } from '../src/core/soap-fault.js';
import { buildUblTrInvoiceXml } from '../src/builders/ubl.builder.js';
import { Currency, InvoiceType, ScenarioType } from '../src/constants/enums.js';

describe('NetteFaturaClient', () => {
  it('should initialize correctly with test configuration', () => {
    const client = new NetteFaturaClient({
      companyTaxCode: '4810173324',
      environment: 'test',
    });

    expect(client.config.companyTaxCode).toBe('4810173324');
    expect(client.config.environment).toBe('test');
    expect(client.config.endpoints.invoiceService).toContain('einvoiceservicetest.isnet.net.tr');
    expect(client.invoice).toBeDefined();
    expect(client.addressBook).toBeDefined();
  });

  it('should allow overriding custom endpoints', () => {
    const client = new NetteFaturaClient({
      companyTaxCode: '1234567805',
      customEndpoints: {
        invoiceService: 'https://custom-proxy.internal/invoice',
      },
    });

    expect(client.config.endpoints.invoiceService).toBe('https://custom-proxy.internal/invoice');
  });
});

describe('InvoiceBuilder & ArchiveInvoiceBuilder', () => {
  it('should build a valid Invoice object with correct mathematical totals', () => {
    const builder = new InvoiceBuilder();
    const invoice = builder
      .setCurrency(Currency.TRY)
      .setScenario(ScenarioType.TICARIFATURA)
      .setType(InvoiceType.SATIS)
      .setInvoiceDate('2026-08-24')
      .setReceiver({
        ReceiverName: 'Test Alıcı A.Ş.',
        ReceiverTaxCode: '1234567805',
      })
      .addLine({
        name: 'Yazılım Danışmanlığı',
        unitPrice: 1000,
        quantity: 2,
        vatRate: 20,
      })
      .addLine({
        name: 'Sunucu Bakım Hizmeti',
        unitPrice: 500,
        quantity: 1,
        vatRate: 20,
        discountRate: 10, // 500 - 50 = 450
      })
      .addNote('Test faturasıdır')
      .build();

    expect(invoice.ETTN).toBeDefined();
    expect(invoice.InvoiceDetails).toHaveLength(2);
    // Line 1: 2000 TL -> KDV %20 = 400 TL
    // Line 2: 450 TL -> KDV %20 = 90 TL
    // Total Line Extension: 2450 TL
    // Total VAT: 490 TL
    // Total Payable: 2940 TL
    expect(invoice.TotalLineExtensionAmount).toBe(2450);
    expect(invoice.TotalVATAmount).toBe(490);
    expect(invoice.TotalTaxInclusiveAmount).toBe(2940);
    expect(invoice.TotalPayableAmount).toBe(2940);
    expect(invoice.Notes).toContain('Test faturasıdır');
  });

  it('should throw error when required fields are missing', () => {
    const builder = new InvoiceBuilder();
    expect(() => builder.build()).toThrow();
  });

  it('should build valid ArchiveInvoice object', () => {
    const builder = new ArchiveInvoiceBuilder();
    const archive = builder
      .setReceiver('Efe Söroğlu', '11111111111', 'efe@example.com')
      .addLine({
        name: 'Eğitim Seti',
        unitPrice: 200,
        quantity: 3,
        vatRate: 20,
      })
      .build();

    expect(archive.Receiver.ReceiverName).toBe('Efe Söroğlu');
    expect(archive.Receiver.ReceiverTaxCode).toBe('11111111111');
    expect(archive.TotalLineExtensionAmount).toBe(600);
    expect(archive.TotalVATAmount).toBe(120);
    expect(archive.TotalPayableAmount).toBe(720);
  });
});

describe('XML & SOAP Serialization', () => {
  it('should serialize JavaScript objects to SOAP XML matching WCF structure', () => {
    const requestData = {
      CompanyTaxCode: '4810173324',
      Notes: ['Not 1', 'Not 2'],
    };

    const xml = serializeToSoapXml(requestData, 'ein');
    expect(xml).toContain('<ein:CompanyTaxCode>4810173324</ein:CompanyTaxCode>');
    expect(xml).toContain('<ein:Notes>');
    expect(xml).toContain('<ein:string>Not 1</ein:string>');
    expect(xml).toContain('<ein:string>Not 2</ein:string>');
  });

  it('should build full SOAP Envelope', () => {
    const envelope = buildSoapEnvelope('GetTaxPayer', { TaxPayerTaxCode: '4810173324' });
    expect(envelope).toContain('<soapenv:Envelope');
    expect(envelope).toContain('<tem:GetTaxPayer>');
    expect(envelope).toContain('<ein:TaxPayerTaxCode>4810173324</ein:TaxPayerTaxCode>');
  });

  it('should parse SOAP Response and extract result object', () => {
    const soapResponseXml = `
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
        <s:Body>
          <GetTaxPayerResponse xmlns="http://tempuri.org/">
            <GetTaxPayerResult xmlns:a="http://schemas.datacontract.org/2004/07/EInvoice.Service.Model">
              <a:IsSucceded>true</a:IsSucceded>
              <a:Message>Basarili</a:Message>
              <a:TaxPayerList>
                <a:TaxPayer>
                  <a:Identifier>4810173324</a:Identifier>
                  <a:Title>İŞ NET ELEKTRONİK BİLGİ ÜRETİM DAĞITIM TİC. VE İLETİŞİM HİZM. A.Ş.</a:Title>
                </a:TaxPayer>
              </a:TaxPayerList>
            </GetTaxPayerResult>
          </GetTaxPayerResponse>
        </s:Body>
      </s:Envelope>
    `;

    const result = parseSoapResponse<any>(soapResponseXml, 'GetTaxPayer');
    expect(result.IsSucceded).toBe(true);
    expect(result.Message).toBe('Basarili');
    expect(result.TaxPayerList[0].Identifier).toBe('4810173324');
  });

  it('should throw SoapFaultError when SOAP Fault is received', () => {
    const faultXml = `
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
        <s:Body>
          <s:Fault>
            <faultcode xmlns:a="http://schemas.microsoft.com/net/2005/12/windowscommunicationfoundation/dispatcher">a:InternalServiceFault</faultcode>
            <faultstring xml:lang="tr-TR">Veritabanı hatası oluştu</faultstring>
          </s:Fault>
        </s:Body>
      </s:Envelope>
    `;

    expect(() => parseSoapResponse(faultXml, 'SendInvoice')).toThrow(SoapFaultError);
  });

  it('should generate valid UBL-TR 1.2 XML', () => {
    const builder = new InvoiceBuilder();
    const invoice = builder
      .setReceiver({
        ReceiverName: 'Alıcı Test A.Ş.',
        ReceiverTaxCode: '4810173324',
      })
      .addLine({
        name: 'Ürün 1',
        unitPrice: 100,
        quantity: 1,
        vatRate: 20,
      })
      .build();

    const ublXml = buildUblTrInvoiceXml(invoice, {
      vkn: '1234567805',
      name: 'Satıcı Test Firma 05',
      taxOffice: 'Büyük Mükellefler',
    });

    expect(ublXml).toContain('<Invoice');
    expect(ublXml).toContain('<cbc:CustomizationID>TR1.2</cbc:CustomizationID>');
    expect(ublXml).toContain('<cbc:UUID>' + invoice.ETTN + '</cbc:UUID>');
    expect(ublXml).toContain('Satıcı Test Firma 05');
    expect(ublXml).toContain('Alıcı Test A.Ş.');
  });
});
