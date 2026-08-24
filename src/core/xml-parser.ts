import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { SOAP_NAMESPACES } from '../constants/namespaces.js';
import { SoapFaultError } from './soap-fault.js';

export const xmlParserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false, // Keep tag values as strings to prevent VKN/TCKN/InvoiceNumbers from losing leading zeros
  parseAttributeValue: false,
  trimValues: true,
  removeNSPrefix: true, // Namespaces are stripped so responses can be read with clean JS properties
  tagValueProcessor: (_tagName: string, tagValue: string) => {
    if (tagValue === 'true') return true;
    if (tagValue === 'false') return false;
    return tagValue;
  },
  isArray: (name: string) => {
    // Force array for common list items
    return [
      'TaxPayer',
      'TaxOffice',
      'Invoice',
      'ArchiveInvoice',
      'InvoiceDetail',
      'ArchiveInvoiceDetail',
      'InvoiceResult',
      'ArchiveInvoiceResult',
      'Tax',
      'string',
      'Document',
      'Alias',
      'AddressBookEntry',
    ].includes(name);
  },
};

export const defaultXmlParser = new XMLParser(xmlParserOptions);
export const rawXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  removeNSPrefix: false,
});

/**
 * Array element singularization mappings for WCF DataContract arrays
 */
const ARRAY_ITEM_NAME_MAP: Record<string, string> = {
  Invoices: 'Invoice',
  ArchiveInvoices: 'ArchiveInvoice',
  InvoiceDetails: 'InvoiceDetail',
  ArchiveInvoiceDetails: 'ArchiveInvoiceDetail',
  InvoiceTotalTaxList: 'Tax',
  Taxes: 'Tax',
  Notes: 'ein:string',
  FinancialAccount: 'FinancialAccount',
  AdditionalDocumentReferences: 'DocumentReference',
  ArchiveInvoiceList: 'ArchiveInvoiceCancellation',
  TaxPayers: 'TaxPayer',
  TaxOfficeList: 'TaxOffice',
  AddressBookEntries: 'AddressBookEntry',
  DispatchList: 'Dispatch',
  Exemptions: 'Exemption',
  InvoiceAttachments: 'InvoiceAttachment',
  InvoiceExpenses: 'InvoiceExpense',
  BankAccountList: 'arr:decimal',
};

/**
 * Converts a JS object into SOAP XML body string matching WCF conventions
 */
export function serializeToSoapXml(
  obj: unknown,
  defaultNamespacePrefix = 'ein',
  parentTagName?: string
): string {
  if (obj === null || obj === undefined) {
    return '';
  }

  if (typeof obj !== 'object') {
    return escapeXml(String(obj));
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item) => serializeToSoapXml(item, defaultNamespacePrefix, parentTagName))
      .join('');
  }

  // Sort keys alphabetically as required by .NET WCF DataContractSerializer
  const entries = Object.entries(obj as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  let xml = '';

  for (const [key, value] of entries) {
    if (value === undefined || value === null) {
      continue;
    }

    // Determine namespace prefix
    let prefix = defaultNamespacePrefix;
    let tagName = key;

    if (key.includes(':')) {
      const parts = key.split(':');
      prefix = parts[0];
      tagName = parts[1];
    }

    if (Array.isArray(value)) {
      if (value.length === 0) continue; // Skip empty arrays

      let itemName = ARRAY_ITEM_NAME_MAP[tagName] || 'item';
      if (parentTagName === 'ArchiveInvoice' && tagName === 'InvoiceDetails') {
        itemName = 'ArchiveInvoiceDetail';
      }

      let itemPrefix = prefix;
      let actualItemName = itemName;

      if (itemName.includes(':')) {
        const parts = itemName.split(':');
        itemPrefix = parts[0];
        actualItemName = parts[1];
      }

      xml += `<${prefix}:${tagName}>`;
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          xml += `<${itemPrefix}:${actualItemName}>`;
          xml += serializeToSoapXml(item, defaultNamespacePrefix, actualItemName);
          xml += `</${itemPrefix}:${actualItemName}>`;
        } else {
          xml += `<${itemPrefix}:${actualItemName}>${escapeXml(String(item))}</${itemPrefix}:${actualItemName}>`;
        }
      }
      xml += `</${prefix}:${tagName}>`;
    } else if (typeof value === 'object') {
      const innerXml = serializeToSoapXml(value, defaultNamespacePrefix, tagName);
      if (innerXml.length > 0) {
        xml += `<${prefix}:${tagName}>${innerXml}</${prefix}:${tagName}>`;
      }
    } else if (typeof value === 'boolean') {
      xml += `<${prefix}:${tagName}>${value ? 'true' : 'false'}</${prefix}:${tagName}>`;
    } else {
      xml += `<${prefix}:${tagName}>${escapeXml(String(value))}</${prefix}:${tagName}>`;
    }
  }

  return xml;
}

/**
 * Builds a full SOAP 1.1 Envelope with tempuri and WCF namespaces
 */
export function buildSoapEnvelope(actionName: string, requestData: unknown): string {
  const innerXml = serializeToSoapXml(requestData, 'ein');

  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="${SOAP_NAMESPACES.soapenv}" xmlns:tem="${SOAP_NAMESPACES.tem}" xmlns:ein="${SOAP_NAMESPACES.ein}" xmlns:arr="${SOAP_NAMESPACES.arr}" xmlns:addr="${SOAP_NAMESPACES.addr}">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:${actionName}>
      ${requestData ? `<tem:request>${innerXml}</tem:request>` : ''}
    </tem:${actionName}>
  </soapenv:Body>
</soapenv:Envelope>`.trim();
}

/**
 * Recursively unwraps WCF array wrappers like { TaxPayerList: { TaxPayer: [...] } } => { TaxPayerList: [...] }
 */
export function normalizeWcfResponse(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeWcfResponse(item));
  }

  const result: Record<string, unknown> = {};
  const entries = Object.entries(obj as Record<string, unknown>);

  for (const [key, val] of entries) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const innerKeys = Object.keys(val);
      // If the object has only one key which is an array or matches child name
      if (innerKeys.length === 1) {
        const childKey = innerKeys[0];
        const childVal = (val as Record<string, unknown>)[childKey];
        if (
          Array.isArray(childVal) ||
          key.endsWith('List') ||
          key.endsWith('s') ||
          childKey === 'string' ||
          childKey === 'decimal'
        ) {
          result[key] = Array.isArray(childVal)
            ? childVal.map((item) => normalizeWcfResponse(item))
            : [normalizeWcfResponse(childVal)];
          continue;
        }
      }
      result[key] = normalizeWcfResponse(val);
    } else {
      result[key] = normalizeWcfResponse(val);
    }
  }

  return result;
}

/**
 * Parses a SOAP Response XML string and returns the unwrapped data
 */
export function parseSoapResponse<T = unknown>(xmlString: string, operationName: string): T {
  const parsed = defaultXmlParser.parse(xmlString);

  // Check for SOAP Fault
  const envelope = parsed.Envelope || parsed;
  const body = envelope.Body || envelope;

  if (body.Fault) {
    const fault = body.Fault;
    throw new SoapFaultError(
      fault.faultcode || fault.Code?.Value,
      fault.faultstring || fault.Reason?.Text || fault.faultcode,
      fault.faultactor,
      fault.detail
    );
  }

  // Look for operation response tag: e.g. SendInvoiceResponse, GetTaxPayerResponse
  const responseKey = `${operationName}Response`;
  const resultKey = `${operationName}Result`;

  const operationResponse = body[responseKey];
  if (operationResponse) {
    if (resultKey in operationResponse) {
      return normalizeWcfResponse(operationResponse[resultKey]) as T;
    }
    return normalizeWcfResponse(operationResponse) as T;
  }

  // Fallback: return the first non-header object inside Body
  return normalizeWcfResponse(body) as T;
}

/**
 * Escapes XML special characters
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
