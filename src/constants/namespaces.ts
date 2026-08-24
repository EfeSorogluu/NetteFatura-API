export const SOAP_NAMESPACES = {
  soapenv: 'http://schemas.xmlsoap.org/soap/envelope/',
  tem: 'http://tempuri.org/',
  ein: 'http://schemas.datacontract.org/2004/07/EInvoice.Service.Model',
  arr: 'http://schemas.microsoft.com/2003/10/Serialization/Arrays',
  addr: 'http://schemas.datacontract.org/2004/07/EInvoice.Service.Model.DataContract.AddressBook',
  i: 'http://www.w3.org/2001/XMLSchema-instance',
} as const;

export const UBL_NAMESPACES = {
  cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  ext: 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
  ds: 'http://www.w3.org/2000/09/xmldsig#',
  xsi: 'http://www.w3.org/2001/XMLSchema-instance',
  xades: 'http://uri.etsi.org/01903/v1.3.2#',
  ublInvoice: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
} as const;
