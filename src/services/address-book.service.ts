import { BaseService } from './base.service.js';
import {
  AddressBookEntry,
  DeleteAddressBookEntryRequest,
  DeleteAddressBookEntryResponse,
  GetAddressBookRequest,
  GetAddressBookResponse,
  GetTaxOfficeListRequest,
  GetTaxOfficeListResponse,
  GetTaxPayerRequest,
  GetTaxPayerResponse,
  GetTaxPayerWithPagingRequest,
  GetTaxPayerWithPagingResponse,
  SaveAddressBookEntryRequest,
  SaveAddressBookEntryResponse,
  TaxPayer,
} from '../types/address-book.types.js';

export class AddressBookService extends BaseService {
  private readonly serviceInterface = 'IAddressBookService';

  /**
   * VKN veya TCKN ile GİB e-Fatura mükellefiyetini sorgular.
   *
   * @param taxCodeOrRequest 10 haneli VKN, 11 haneli TCKN veya GetTaxPayerRequest nesnesi
   */
  public async getTaxPayer(taxCodeOrRequest: string | GetTaxPayerRequest): Promise<GetTaxPayerResponse> {
    const request: GetTaxPayerRequest =
      typeof taxCodeOrRequest === 'string'
        ? { TaxPayerTaxCode: taxCodeOrRequest }
        : taxCodeOrRequest;

    const response = await this.soapClient.call<GetTaxPayerResponse>(
      this.config.endpoints.addressBookService,
      'GetTaxPayer',
      this.serviceInterface,
      request
    );

    // Mükellef listesini ve alias'ları normalize edelim
    this.normalizeTaxPayerResponse(response);
    return response;
  }

  /**
   * e-Fatura mükellef listesini sayfalı ve filtrelenmiş olarak çeker.
   */
  public async getTaxPayerWithPaging(
    request: GetTaxPayerWithPagingRequest
  ): Promise<GetTaxPayerWithPagingResponse> {
    const response = await this.soapClient.call<GetTaxPayerWithPagingResponse>(
      this.config.endpoints.addressBookService,
      'GetTaxPayerWithPaging',
      this.serviceInterface,
      request
    );

    if (response.TaxPayerList) {
      for (const tp of response.TaxPayerList) {
        this.enrichTaxPayerAliases(tp);
      }
    }

    return response;
  }

  /**
   * Türkiye Vergi Daireleri listesini sorgular (Şehir kodu veya isim filtresiyle).
   */
  public async getTaxOfficeList(
    request?: GetTaxOfficeListRequest
  ): Promise<GetTaxOfficeListResponse> {
    const payload = request || {};
    return this.soapClient.call<GetTaxOfficeListResponse>(
      this.config.endpoints.addressBookService,
      'GetTaxOfficeList',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Firmanın kayıtlı adres defterini listeler.
   */
  public async getAddressBook(
    request?: GetAddressBookRequest
  ): Promise<GetAddressBookResponse> {
    const payload: GetAddressBookRequest = {
      CompanyTaxCode: request?.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request?.CompanyVendorNumber || this.config.companyVendorNumber,
      SearchKeyword: request?.SearchKeyword,
    };

    return this.soapClient.call<GetAddressBookResponse>(
      this.config.endpoints.addressBookService,
      'GetAddressBook',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Adres defterine yeni cari/alıcı kaydeder veya günceller.
   */
  public async saveAddressBookEntry(
    entryOrRequest: AddressBookEntry | SaveAddressBookEntryRequest
  ): Promise<SaveAddressBookEntryResponse> {
    const payload: SaveAddressBookEntryRequest =
      'Entry' in entryOrRequest
        ? {
            CompanyTaxCode: entryOrRequest.CompanyTaxCode || this.config.companyTaxCode,
            CompanyVendorNumber: entryOrRequest.CompanyVendorNumber || this.config.companyVendorNumber,
            Entry: entryOrRequest.Entry,
          }
        : {
            CompanyTaxCode: this.config.companyTaxCode,
            CompanyVendorNumber: this.config.companyVendorNumber,
            Entry: entryOrRequest,
          };

    return this.soapClient.call<SaveAddressBookEntryResponse>(
      this.config.endpoints.addressBookService,
      'SaveAddressBookEntry',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-İrsaliye mükellefiyetini sorgular.
   */
  public async getDespatchTaxPayer(
    taxCodeOrRequest: string | GetTaxPayerRequest
  ): Promise<GetTaxPayerResponse> {
    const request: GetTaxPayerRequest =
      typeof taxCodeOrRequest === 'string'
        ? { TaxPayerTaxCode: taxCodeOrRequest }
        : taxCodeOrRequest;

    const response = await this.soapClient.call<GetTaxPayerResponse>(
      this.config.endpoints.addressBookService,
      'GetDespatchTaxPayer',
      this.serviceInterface,
      request
    );

    this.normalizeTaxPayerResponse(response);
    return response;
  }

  /**
   * Türkiye İl Listesini sorgular.
   */
  public async getCityList() {
    return this.soapClient.call<{ CityList?: any[]; Result?: string; IsSucceded?: boolean }>(
      this.config.endpoints.addressBookService,
      'GetCityList',
      this.serviceInterface
    );
  }

  /**
   * Belirtilen İl Kodu'na (CityCode) ait İlçe Listesini sorgular.
   */
  public async getTownList(cityCode: number) {
    return this.soapClient.call<{ TownList?: any[]; Result?: string; IsSucceded?: boolean }>(
      this.config.endpoints.addressBookService,
      'GetTownList',
      this.serviceInterface,
      { CityCode: cityCode }
    );
  }

  /**
   * Sistemdeki Alıcı Posta Kutusu Etiketlerini (Inbox Tags) getirir.
   */
  public async getReceiverInboxTags() {
    return this.soapClient.call<any>(
      this.config.endpoints.addressBookService,
      'GetReceiverInboxTags',
      this.serviceInterface
    );
  }

  /**
   * Sistemdeki Gönderici Birim Etiketlerini (Sender Unit Tags) getirir.
   */
  public async getSenderUnitTags() {
    return this.soapClient.call<any>(
      this.config.endpoints.addressBookService,
      'GetSenderUnitTags',
      this.serviceInterface
    );
  }

  /**
   * Adres defterinden kayıt siler.
   */
  public async deleteAddressBookEntry(
    idOrRequest: number | DeleteAddressBookEntryRequest
  ): Promise<DeleteAddressBookEntryResponse> {
    const payload: DeleteAddressBookEntryRequest =
      typeof idOrRequest === 'number'
        ? {
            CompanyTaxCode: this.config.companyTaxCode,
            CompanyVendorNumber: this.config.companyVendorNumber,
            Id: idOrRequest,
          }
        : {
            CompanyTaxCode: idOrRequest.CompanyTaxCode || this.config.companyTaxCode,
            CompanyVendorNumber: idOrRequest.CompanyVendorNumber || this.config.companyVendorNumber,
            Id: idOrRequest.Id,
          };

    return this.soapClient.call<DeleteAddressBookEntryResponse>(
      this.config.endpoints.addressBookService,
      'DeleteAddressBookEntry',
      this.serviceInterface,
      payload
    );
  }

  /**
   * TaxPayer aliaslarını (pk/gb) kolay kullanım için objeye ekler.
   */
  private enrichTaxPayerAliases(taxPayer: TaxPayer): void {
    if (taxPayer.InboxTagList && Array.isArray(taxPayer.InboxTagList)) {
      for (const tag of taxPayer.InboxTagList) {
        if (tag.includes('pk') || tag.includes('defaultpk')) {
          taxPayer.defaultPkAlias = tag;
          break;
        }
      }
    }

    if (taxPayer.OutboxTagList && Array.isArray(taxPayer.OutboxTagList)) {
      for (const tag of taxPayer.OutboxTagList) {
        if (tag.includes('gb') || tag.includes('defaultgb')) {
          taxPayer.defaultGbAlias = tag;
          break;
        }
      }
    }

    if (taxPayer.Documents && Array.isArray(taxPayer.Documents)) {
      for (const doc of taxPayer.Documents) {
        if (doc.Aliases && Array.isArray(doc.Aliases)) {
          for (const alias of doc.Aliases) {
            const aliasName = alias.Name || '';
            if (!taxPayer.defaultPkAlias && (aliasName.includes('pk') || aliasName.includes('defaultpk'))) {
              taxPayer.defaultPkAlias = aliasName;
            } else if (!taxPayer.defaultGbAlias && (aliasName.includes('gb') || aliasName.includes('defaultgb'))) {
              taxPayer.defaultGbAlias = aliasName;
            }
          }
        }
      }
    }
  }

  private normalizeTaxPayerResponse(response: GetTaxPayerResponse): void {
    const list = response.TaxPayers || response.TaxPayerList;
    if (list && Array.isArray(list)) {
      for (const tp of list) {
        this.enrichTaxPayerAliases(tp);
      }
      if (list.length > 0 && !response.TaxPayer) {
        response.TaxPayer = list[0];
      }
    } else if (response.TaxPayer) {
      this.enrichTaxPayerAliases(response.TaxPayer);
    }
  }
}
