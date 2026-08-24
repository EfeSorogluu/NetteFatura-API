export interface GetTaxPayerRequest {
  TaxPayerTaxCode?: string;
  TaxPayerName?: string;
}

export interface TaxPayerAlias {
  Name: string;
  CreationTime?: string;
  DeletionTime?: string;
}

export interface TaxPayerDocument {
  DocumentType: string;
  Aliases?: TaxPayerAlias[];
}

export interface TaxPayer {
  TaxPayerTaxCode?: string;
  TaxPayerName?: string;
  Identifier?: string;
  Title?: string;
  Type?: string;
  AccountType?: string;
  FirstCreationTime?: string;
  RegistrationDate?: string;
  InboxTagList?: string[];
  OutboxTagList?: string[];
  Documents?: TaxPayerDocument[];
  /** Kolay erişim için standart GİB posta kutusu etiketi (pk/gb) */
  defaultPkAlias?: string;
  defaultGbAlias?: string;
}

export interface GetTaxPayerResponse {
  IsSucceded?: boolean;
  Result?: string;
  ErrorMessage?: string;
  Message?: string;
  TaxPayers?: TaxPayer[];
  TaxPayerList?: TaxPayer[];
  TaxPayer?: TaxPayer;
}

export interface GetTaxPayerWithPagingRequest {
  PageNumber: number;
  PageSize: number;
  FilterDate?: string;
  TaxPayerType?: string;
  AccountType?: string;
}

export interface GetTaxPayerWithPagingResponse {
  IsSucceded: boolean;
  Message?: string;
  TotalCount?: number;
  TaxPayerList?: TaxPayer[];
}

export interface TaxOffice {
  CityCode: number;
  CityName?: string;
  Code: string;
  Name: string;
}

export interface GetTaxOfficeListRequest {
  CityCode?: number;
  TaxOfficeName?: string;
}

export interface GetTaxOfficeListResponse {
  IsSucceded: boolean;
  Message?: string;
  TaxOfficeList?: TaxOffice[];
}

export interface AddressBookAddress {
  AddressLine1?: string;
  AddressLine2?: string;
  BoulevardAveneuStreetName?: string;
  BuildingName?: string;
  BuildingNumber?: string;
  CityCode?: string | number;
  CityName?: string;
  CountryCode?: string;
  CountryName?: string;
  DoorNumber?: string;
  EMail?: string;
  FaxNumber?: string;
  PhoneNumber?: string;
  PostalCode?: string;
  Region?: string;
  SubdivisionName?: string;
  TownCode?: string | number;
  TownName?: string;
  WebAddress?: string;
}

export interface AddressBookEntry {
  Id?: number;
  CompanyTaxCode?: string;
  ReceiverName: string;
  ReceiverTaxCode: string;
  TaxOfficeCode?: string;
  TaxOfficeName?: string;
  Address?: AddressBookAddress;
  Alias?: string;
  IsEInvoiceUser?: boolean;
  RecipientType?: string;
  SendingType?: string;
}

export interface SaveAddressBookEntryRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  Entry: AddressBookEntry;
}

export interface SaveAddressBookEntryResponse {
  IsSucceded: boolean;
  Message?: string;
  Id?: number;
}

export interface DeleteAddressBookEntryRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  Id: number;
}

export interface DeleteAddressBookEntryResponse {
  IsSucceded: boolean;
  Message?: string;
}

export interface GetAddressBookRequest {
  CompanyTaxCode?: string;
  CompanyVendorNumber?: string;
  SearchKeyword?: string;
}

export interface City {
  Code: number;
  Name: string;
}

export interface Town {
  Code: number;
  Name: string;
  CityCode: number;
}

export interface GetCityListResponse {
  IsSucceded: boolean;
  Message?: string;
  CityList?: City[];
}

export interface GetTownListRequest {
  CityCode: number;
}

export interface GetTownListResponse {
  IsSucceded: boolean;
  Message?: string;
  TownList?: Town[];
}

export interface GetAddressBookResponse {
  IsSucceded: boolean;
  Message?: string;
  AddressBookEntries?: AddressBookEntry[];
}
