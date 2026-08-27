export const NETTEFATURA_ENDPOINTS = {
  test: {
    invoiceService: 'https://einvoiceservicetest.isnet.net.tr/InvoiceService/ServiceContract/InvoiceService.svc',
    invoiceServiceWsdl: 'https://einvoiceservicetest.isnet.net.tr/InvoiceService/ServiceContract/InvoiceService.svc?singleWsdl',
    addressBookService: 'https://einvoiceservicetest.isnet.net.tr/AddressBookService/ServiceContract/AddressBookService.svc',
    addressBookServiceWsdl: 'https://einvoiceservicetest.isnet.net.tr/AddressBookService/ServiceContract/AddressBookService.svc?singleWsdl',
    invoiceApi: 'https://einvoiceapitest.isnet.net.tr/api',
    portalUrl: 'https://efatura.isnet.net.tr',
  },
  production: {
    invoiceService: 'https://einvoiceservice.isnet.net.tr/InvoiceService/ServiceContract/InvoiceService.svc',
    invoiceServiceWsdl: 'https://einvoiceservice.isnet.net.tr/InvoiceService/ServiceContract/InvoiceService.svc?singleWsdl',
    addressBookService: 'https://einvoiceservice.isnet.net.tr/AddressBookService/ServiceContract/AddressBookService.svc',
    addressBookServiceWsdl: 'https://einvoiceservice.isnet.net.tr/AddressBookService/ServiceContract/AddressBookService.svc?singleWsdl',
    invoiceApi: 'https://einvoiceapi.isnet.net.tr/api',
    portalUrl: 'https://nettefatura.isnet.net.tr',
  },
} as const;

export type Environment = 'test' | 'production';
