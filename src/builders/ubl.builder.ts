import { Invoice } from '../types/invoice.types.js';
import { escapeXml } from '../core/xml-parser.js';

export interface SupplierPartyInfo {
  vkn: string;
  name: string;
  taxOffice?: string;
  address?: {
    street?: string;
    buildingName?: string;
    buildingNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  email?: string;
  phone?: string;
  web?: string;
}

/**
 * Builds a standard GİB UBL-TR 1.2 compliant Invoice XML string
 */
export function buildUblTrInvoiceXml(invoice: Invoice, supplier: SupplierPartyInfo): string {
  const issueDate = invoice.InvoiceDate || new Date().toISOString().split('T')[0];
  const now = new Date();
  const issueTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const profileId = invoice.ScenarioType || 'TEMELFAUTRA';
  const invoiceTypeCode = invoice.InvoiceType || 'SATIS';
  const currencyCode = invoice.CurrencyCode || 'TRY';

  let linesXml = '';
  invoice.InvoiceDetails.forEach((line, index) => {
    const lineId = index + 1;
    const qty = line.Quantity;
    const unitPrice = line.Product.UnitPrice;
    const lineExtension = line.LineExtensionAmount;
    const vatRate = line.VATRate;
    const vatAmount = line.VATAmount;
    const unitCode = line.Product.MeasureUnit || 'NIU';

    linesXml += `
  <cac:InvoiceLine>
    <cbc:ID>${lineId}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${unitCode}">${qty}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currencyCode}">${lineExtension.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currencyCode}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${currencyCode}">${lineExtension.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${currencyCode}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
        <cbc:Percent>${vatRate}</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>KDV</cbc:Name>
            <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${escapeXml(line.Product.ProductName)}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currencyCode}">${unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  });

  let notesXml = '';
  if (invoice.Notes && invoice.Notes.length > 0) {
    notesXml = invoice.Notes.map((n) => `  <cbc:Note>${escapeXml(n)}</cbc:Note>`).join('\n');
  }

  const receiver = invoice.Receiver;
  const isIndividual = (receiver.ReceiverTaxCode || '').length === 11;

  return `<?xml version="1.0" encoding="utf-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent />
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${profileId}</cbc:ProfileID>
  ${invoice.InvoiceNumber ? `<cbc:ID>${invoice.InvoiceNumber}</cbc:ID>` : ''}
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${invoice.ETTN}</cbc:UUID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${invoiceTypeCode}</cbc:InvoiceTypeCode>
${notesXml}
  <cbc:DocumentCurrencyCode>${currencyCode}</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${invoice.InvoiceDetails.length}</cbc:LineCountNumeric>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${supplier.vkn.length === 11 ? 'TCKN' : 'VKN'}">${supplier.vkn}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(supplier.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(supplier.address?.street || 'Merkez')}</cbc:StreetName>
        <cbc:CityName>${escapeXml(supplier.address?.city || 'İSTANBUL')}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${escapeXml(supplier.address?.country || 'TÜRKİYE')}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${escapeXml(supplier.taxOffice || 'Vergi Dairesi')}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${isIndividual ? 'TCKN' : 'VKN'}">${receiver.ReceiverTaxCode}</cbc:ID>
      </cac:PartyIdentification>
      ${
        isIndividual
          ? `<cac:Person>
              <cbc:FirstName>${escapeXml(receiver.ReceiverName.split(' ')[0] || receiver.ReceiverName)}</cbc:FirstName>
              <cbc:FamilyName>${escapeXml(receiver.ReceiverName.split(' ').slice(1).join(' ') || '')}</cbc:FamilyName>
            </cac:Person>`
          : `<cac:PartyName>
              <cbc:Name>${escapeXml(receiver.ReceiverName)}</cbc:Name>
            </cac:PartyName>`
      }
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(receiver.Address?.BoulevardAveneuStreetName || receiver.Address?.AddressLine1 || 'Merkez')}</cbc:StreetName>
        <cbc:CityName>${escapeXml(receiver.Address?.CityName || 'İSTANBUL')}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${escapeXml(receiver.Address?.CountryName || 'TÜRKİYE')}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${escapeXml(receiver.TaxOfficeName || receiver.Address?.TaxOfficeName || 'Vergi Dairesi')}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currencyCode}">${invoice.TotalVATAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currencyCode}">${invoice.TotalLineExtensionAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currencyCode}">${invoice.TotalVATAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currencyCode}">${invoice.TotalLineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currencyCode}">${invoice.TotalLineExtensionAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currencyCode}">${invoice.TotalTaxInclusiveAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currencyCode}">${invoice.TotalPayableAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${linesXml}
</Invoice>`.trim();
}
