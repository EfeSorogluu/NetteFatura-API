import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddressBookService } from '../src/services/address-book.service.js';
import { SoapClient } from '../src/core/soap-client.js';
import { resolveConfig } from '../src/config.js';

describe('AddressBookService Unit Tests', () => {
  let addressBookService: AddressBookService;
  let mockSoapClient: SoapClient;

  beforeEach(() => {
    const config = resolveConfig({
      companyTaxCode: '4810173324',
      environment: 'test',
    });
    mockSoapClient = new SoapClient(config);
    vi.spyOn(mockSoapClient, 'call').mockImplementation(async (_endpoint, action, _iface, requestData) => {
      if (action === 'GetTaxPayer') {
        return {
          IsSucceded: true,
          Result: 'Success',
          TaxPayers: [
            {
              TaxPayerTaxCode: (requestData as any)?.TaxPayerTaxCode,
              TaxPayerName: 'İş Net Test Firma',
              InboxTagList: ['urn:mail:defaultpk@isnet.com'],
              OutboxTagList: ['urn:mail:defaultgb@isnet.com'],
            },
          ],
        };
      }
      if (action === 'GetTaxPayerWithPaging') {
        return {
          IsSucceded: true,
          TotalCount: 1,
          TaxPayerList: [
            {
              Identifier: '4810173324',
              Title: 'İş Net',
            },
          ],
        };
      }
      if (action === 'GetDespatchTaxPayer') {
        return {
          IsSucceded: true,
          TaxPayers: [{ TaxPayerTaxCode: '4810173324', TaxPayerName: 'İrsaliye Mükellefi' }],
        };
      }
      if (action === 'GetTaxOfficeList') {
        return {
          IsSucceded: true,
          TaxOfficeList: [
            { Code: '006260', Name: 'Ulus VD', CityCode: 6, CityName: 'ANKARA' },
          ],
        };
      }
      if (action === 'GetCityList') {
        return {
          IsSucceded: true,
          CityList: [{ Code: 34, Name: 'İSTANBUL' }, { Code: 6, Name: 'ANKARA' }],
        };
      }
      if (action === 'GetTownList') {
        return {
          IsSucceded: true,
          TownList: [{ Code: 1231, Name: 'Çankaya', CityCode: 6 }],
        };
      }
      if (action === 'GetAddressBook') {
        return {
          IsSucceded: true,
          AddressBookEntries: [
            { ReceiverName: 'Test Cari', ReceiverTaxCode: '1234567805' },
          ],
        };
      }
      if (action === 'SaveAddressBookEntry') {
        return {
          IsSucceded: true,
          Id: 101,
        };
      }
      if (action === 'DeleteAddressBookEntry') {
        return {
          IsSucceded: true,
        };
      }
      if (action === 'GetReceiverInboxTags') {
        return {
          InboxTags: ['urn:mail:defaultpk@isnet.com'],
        };
      }
      if (action === 'GetSenderUnitTags') {
        return {
          SenderUnitTags: ['urn:mail:defaultgb@isnet.com'],
        };
      }
      return { IsSucceded: true };
    });

    addressBookService = new AddressBookService(config, mockSoapClient);
  });

  it('should query GetTaxPayer by string VKN', async () => {
    const res = await addressBookService.getTaxPayer('4810173324');
    expect(res.Result).toBe('Success');
    expect(res.TaxPayers?.[0].TaxPayerTaxCode).toBe('4810173324');
    expect(res.TaxPayer?.defaultPkAlias).toBe('urn:mail:defaultpk@isnet.com');
  });

  it('should query GetTaxPayerWithPaging', async () => {
    const res = await addressBookService.getTaxPayerWithPaging({
      PageNumber: 1,
      PageSize: 20,
    });
    expect(res.IsSucceded).toBe(true);
    expect(res.TotalCount).toBe(1);
  });

  it('should query GetDespatchTaxPayer', async () => {
    const res = await addressBookService.getDespatchTaxPayer('4810173324');
    expect(res.IsSucceded).toBe(true);
    expect(res.TaxPayers?.[0].TaxPayerName).toBe('İrsaliye Mükellefi');
  });

  it('should fetch TaxOfficeList', async () => {
    const res = await addressBookService.getTaxOfficeList({ CityCode: 6 });
    expect(res.TaxOfficeList?.[0].Name).toBe('Ulus VD');
  });

  it('should fetch CityList and TownList', async () => {
    const cities = await addressBookService.getCityList();
    expect(cities.CityList).toHaveLength(2);

    const towns = await addressBookService.getTownList(6);
    expect(towns.TownList?.[0].Name).toBe('Çankaya');
  });

  it('should manage AddressBook entries (Get, Save, Delete)', async () => {
    const list = await addressBookService.getAddressBook();
    expect(list.AddressBookEntries).toHaveLength(1);

    const saveRes = await addressBookService.saveAddressBookEntry({
      ReceiverName: 'Yeni Müşteri A.Ş.',
      ReceiverTaxCode: '9999999999',
    });
    expect(saveRes.Id).toBe(101);

    const delRes = await addressBookService.deleteAddressBookEntry(101);
    expect(delRes.IsSucceded).toBe(true);
  });

  it('should get receiver and sender tags', async () => {
    const inbox = await addressBookService.getReceiverInboxTags();
    expect(inbox.InboxTags).toContain('urn:mail:defaultpk@isnet.com');

    const sender = await addressBookService.getSenderUnitTags();
    expect(sender.SenderUnitTags).toContain('urn:mail:defaultgb@isnet.com');
  });
});
