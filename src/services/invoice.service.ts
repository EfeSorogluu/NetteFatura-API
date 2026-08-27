import axios from 'axios';
import { BaseService } from './base.service.js';
import { extractViewerKey, isUuid } from '../tools/viewer.util.js';
import {
  DocumentViewerLinkRequest,
  DocumentViewerLinkResponse,
  GetBalanceRequest,
  GetBalanceResponse,
  Invoice,
  SearchInvoiceRequest,
  SearchInvoiceResponse,
  SendInvoiceRequest,
  SendInvoiceResponse,
  SendInvoiceXmlItem,
  SendInvoiceXmlRequest,
  SendInvoiceXmlResponse,
} from '../types/invoice.types.js';
import {
  ArchiveInvoice,
  ArchiveInvoiceCancellation,
  CancelArchiveInvoiceRequest,
  CancelArchiveInvoiceResponse,
  SearchArchiveInvoiceRequest,
  SearchArchiveInvoiceResponse,
  SendArchiveInvoiceRequest,
  SendArchiveInvoiceResponse,
} from '../types/archive.types.js';
import { InvoiceDirection, InvoiceDocumentType } from '../constants/enums.js';

export class InvoiceService extends BaseService {
  private readonly serviceInterface = 'IInvoiceService';

  /**
   * İşNet NetteFatura web servisinin ayakta olup olmadığını kontrol eder.
   */
  public async healthCheck(): Promise<string> {
    const response = await this.soapClient.call<{ HealthCheckResult?: string } | string>(
      this.config.endpoints.invoiceService,
      'HealthCheck',
      this.serviceInterface
    );

    if (typeof response === 'string') return response;
    return response?.HealthCheckResult || 'OK';
  }

  /**
   * Firmanın kalan kontör / bakiye bilgisini sorgular.
   *
   * @param taxCode İsteğe bağlı özel VKN. Boş bırakılırsa config'deki VKN kullanılır.
   */
  public async getCompanyBalance(taxCode?: string): Promise<GetBalanceResponse> {
    const payload: GetBalanceRequest = {
      CompanyTaxCode: taxCode || this.config.companyTaxCode,
      CompanyVendorNumber: this.config.companyVendorNumber,
    };

    return this.soapClient.call<GetBalanceResponse>(
      this.config.endpoints.invoiceService,
      'GetCompanyBalance',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-Fatura oluşturur ve GİB posta kutusuna iletilmek üzere İşNet'e gönderir.
   *
   * @param invoicesOrRequest Tek bir Fatura, Fatura dizisi veya SendInvoiceRequest
   */
  public async sendInvoice(
    invoicesOrRequest: Invoice | Invoice[] | SendInvoiceRequest
  ): Promise<SendInvoiceResponse> {
    let payload: SendInvoiceRequest;

    if ('Invoices' in invoicesOrRequest) {
      payload = {
        CompanyTaxCode: invoicesOrRequest.CompanyTaxCode || this.config.companyTaxCode,
        CompanyVendorNumber: invoicesOrRequest.CompanyVendorNumber || this.config.companyVendorNumber,
        Invoices: invoicesOrRequest.Invoices,
      };
    } else if (Array.isArray(invoicesOrRequest)) {
      payload = {
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
        Invoices: invoicesOrRequest,
      };
    } else {
      payload = {
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
        Invoices: [invoicesOrRequest],
      };
    }

    return this.soapClient.call<SendInvoiceResponse>(
      this.config.endpoints.invoiceService,
      'SendInvoice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Doğrudan UBL-TR XML (Base64 kodlanmış veya ham XML string) formatındaki e-Faturayı gönderir.
   */
  public async sendInvoiceXml(
    xmlOrItemsOrRequest: string | SendInvoiceXmlItem | SendInvoiceXmlItem[] | SendInvoiceXmlRequest
  ): Promise<SendInvoiceXmlResponse> {
    let payload: SendInvoiceXmlRequest;

    if (typeof xmlOrItemsOrRequest === 'string') {
      const base64Content = this.ensureBase64(xmlOrItemsOrRequest);
      payload = {
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
        Invoices: [{ InvoiceContent: base64Content }],
      };
    } else if ('Invoices' in xmlOrItemsOrRequest) {
      payload = {
        CompanyTaxCode: xmlOrItemsOrRequest.CompanyTaxCode || this.config.companyTaxCode,
        CompanyVendorNumber: xmlOrItemsOrRequest.CompanyVendorNumber || this.config.companyVendorNumber,
        Invoices: xmlOrItemsOrRequest.Invoices.map((inv) => ({
          ...inv,
          InvoiceContent: this.ensureBase64(inv.InvoiceContent),
        })),
      };
    } else if (Array.isArray(xmlOrItemsOrRequest)) {
      payload = {
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
        Invoices: xmlOrItemsOrRequest.map((inv) => ({
          ...inv,
          InvoiceContent: this.ensureBase64(inv.InvoiceContent),
        })),
      };
    } else {
      payload = {
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
        Invoices: [{
          ...xmlOrItemsOrRequest,
          InvoiceContent: this.ensureBase64(xmlOrItemsOrRequest.InvoiceContent),
        }],
      };
    }

    return this.soapClient.call<SendInvoiceXmlResponse>(
      this.config.endpoints.invoiceService,
      'SendInvoiceXml',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-Arşiv Fatura oluşturur ve alıcıya iletilmek üzere İşNet'e gönderir.
   *
   * @param invoicesOrRequest Tek bir e-Arşiv faturası, dizi veya SendArchiveInvoiceRequest
   */
  public async sendArchiveInvoice(
    invoicesOrRequest: ArchiveInvoice | ArchiveInvoice[] | SendArchiveInvoiceRequest
  ): Promise<SendArchiveInvoiceResponse> {
    let payload: SendArchiveInvoiceRequest;

    if ('ArchiveInvoices' in invoicesOrRequest) {
      payload = {
        ArchiveInvoices: invoicesOrRequest.ArchiveInvoices,
        CompanyTaxCode: invoicesOrRequest.CompanyTaxCode || this.config.companyTaxCode,
        CompanyVendorNumber: invoicesOrRequest.CompanyVendorNumber || this.config.companyVendorNumber,
      };
    } else if (Array.isArray(invoicesOrRequest)) {
      payload = {
        ArchiveInvoices: invoicesOrRequest,
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
      };
    } else {
      payload = {
        ArchiveInvoices: [invoicesOrRequest],
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
      };
    }

    return this.soapClient.call<SendArchiveInvoiceResponse>(
      this.config.endpoints.invoiceService,
      'SendArchiveInvoice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Gelen veya Giden e-Faturaları arar / listeler.
   */
  public async searchInvoice(request: SearchInvoiceRequest): Promise<SearchInvoiceResponse> {
    const payload: SearchInvoiceRequest = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      InvoiceDirection: request.InvoiceDirection || InvoiceDirection.Outgoing,
      MinInvoiceDate: request.MinInvoiceDate,
      MaxInvoiceDate: request.MaxInvoiceDate,
      InvoiceNumber: request.InvoiceNumber,
      ETTN: request.ETTN,
      ReceiverTaxCode: request.ReceiverTaxCode,
      PagingRequest: request.PagingRequest || { PageNumber: 1, RecordsPerPage: 20 },
      ResultSet: request.ResultSet || {
        IsAdditionalTaxIncluded: true,
        IsArchiveIncluded: true,
        IsInvoiceDetailIncluded: true,
        IsXMLIncluded: false,
      },
    };

    return this.soapClient.call<SearchInvoiceResponse>(
      this.config.endpoints.invoiceService,
      'SearchInvoice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-Arşiv Faturaları arar / listeler.
   */
  public async searchArchiveInvoice(
    request: SearchArchiveInvoiceRequest
  ): Promise<SearchArchiveInvoiceResponse> {
    const payload: SearchArchiveInvoiceRequest = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      MinInvoiceDate: request.MinInvoiceDate,
      MaxInvoiceDate: request.MaxInvoiceDate,
      InvoiceNumber: request.InvoiceNumber,
      ETTN: request.ETTN,
      ReceiverTaxCode: request.ReceiverTaxCode,
      PagingRequest: request.PagingRequest || { PageNumber: 1, RecordsPerPage: 20 },
      ResultSet: request.ResultSet || {
        IsAdditionalTaxIncluded: true,
        IsArchiveIncluded: true,
        IsInvoiceDetailIncluded: true,
        IsHtmlIncluded: true,
        IsPdfIncluded: true,
        IsXMLIncluded: false,
      },
    };

    return this.soapClient.call<SearchArchiveInvoiceResponse>(
      this.config.endpoints.invoiceService,
      'SearchArchiveInvoice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Fatura görüntüleme linkini (PDF / HTML URL) oluşturur.
   */
  public async getDocumentViewerLink(
    ettnOrRequest: string | DocumentViewerLinkRequest,
    direction: InvoiceDirection = InvoiceDirection.Outgoing,
    docType: InvoiceDocumentType = InvoiceDocumentType.EArchiveInvoice
  ): Promise<DocumentViewerLinkResponse> {
    let payload: DocumentViewerLinkRequest;

    if (typeof ettnOrRequest === 'string') {
      payload = {
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
        Ettn: ettnOrRequest,
        InvoiceDirection: direction,
        InvoiceDocumentType: docType,
      };
    } else {
      payload = {
        CompanyTaxCode: ettnOrRequest.CompanyTaxCode || this.config.companyTaxCode,
        CompanyVendorNumber: ettnOrRequest.CompanyVendorNumber || this.config.companyVendorNumber,
        Ettn: ettnOrRequest.Ettn,
        InvoiceDirection: ettnOrRequest.InvoiceDirection || direction,
        InvoiceDocumentType: ettnOrRequest.InvoiceDocumentType || docType,
        InvoiceNumber: ettnOrRequest.InvoiceNumber,
      };
    }

    return this.soapClient.call<DocumentViewerLinkResponse>(
      this.config.endpoints.invoiceService,
      'GetDocumentViewerLink',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Fatura görüntüleme linki (DocumentViewerLink), indirme URL'si, doğrudan key parametresi VEYA
   * faturanın ETTN/UUID değeri ile İşNet sunucusundan faturanın PDF dosyasını indirir ve Base64 formatında string olarak döndürür.
   * ETTN verildiğinde DocumentViewerLink sorgusu otomatik olarak yapılır.
   *
   * @param ettnOrKeyOrUrl Fatura ETTN (UUID), görüntüleme linki (DocumentViewerLink), indirme URL'si veya key
   * @param direction Fatura yönü (Opsiyonel, yalnızca ETTN verildiğinde kullanılır)
   * @param docType Belge tipi (Opsiyonel, yalnızca ETTN verildiğinde kullanılır)
   * @returns Base64 formatında PDF string'i
   */
  public async getInvoicePdf(
    ettnOrKeyOrUrl: string,
    direction: InvoiceDirection = InvoiceDirection.Outgoing,
    docType: InvoiceDocumentType = InvoiceDocumentType.EArchiveInvoice
  ): Promise<string> {
    const buffer = await this.getInvoicePdfBuffer(ettnOrKeyOrUrl, direction, docType);
    return buffer.toString('base64');
  }

  /**
   * Fatura görüntüleme linki (DocumentViewerLink), indirme URL'si, doğrudan key parametresi VEYA
   * faturanın ETTN/UUID değeri ile İşNet sunucusundan faturanın PDF dosyasını indirir ve Node.js Buffer formatında döndürür.
   * ETTN verildiğinde DocumentViewerLink sorgusu otomatik olarak yapılır.
   *
   * @param ettnOrKeyOrUrl Fatura ETTN (UUID), görüntüleme linki (DocumentViewerLink), indirme URL'si veya key
   * @param direction Fatura yönü (Opsiyonel, yalnızca ETTN verildiğinde kullanılır)
   * @param docType Belge tipi (Opsiyonel, yalnızca ETTN verildiğinde kullanılır)
   * @returns PDF dosyasının Node.js Buffer hali
   */
  public async getInvoicePdfBuffer(
    ettnOrKeyOrUrl: string,
    direction: InvoiceDirection = InvoiceDirection.Outgoing,
    docType: InvoiceDocumentType = InvoiceDocumentType.EArchiveInvoice
  ): Promise<Buffer> {
    let keyOrUrl = ettnOrKeyOrUrl;

    // Eğer doğrudan UUID/ETTN girildiyse veya key/url formatında değilse linki otomatik sorgula
    if (isUuid(ettnOrKeyOrUrl) || (!ettnOrKeyOrUrl.includes('key=') && ettnOrKeyOrUrl.length < 60)) {
      const viewerRes = await this.getDocumentViewerLink(ettnOrKeyOrUrl, direction, docType);
      keyOrUrl = viewerRes.HtmlUrl || viewerRes.PdfUrl || '';
      if (!keyOrUrl) {
        throw new Error(`ETTN (${ettnOrKeyOrUrl}) için fatura görüntüleme linki bulunamadı.`);
      }
    }

    const key = extractViewerKey(keyOrUrl);
    if (!key) {
      throw new Error('Geçersiz veya boş fatura anahtarı (key/ETTN) sağlandı.');
    }

    const apiBase = this.config.endpoints.invoiceApi || 'https://einvoiceapitest.isnet.net.tr/api';
    const cleanBase = apiBase.replace(/\/+$/, '');
    const url = `${cleanBase}/Invoice/GetInvoicePdf?key=${encodeURIComponent(key)}`;

    this.config.logger('debug', `[InvoiceService.getInvoicePdf] GET ${url}`);

    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/pdf, application/octet-stream, */*',
        'User-Agent': 'NetteFatura-API-Client',
        ...this.config.headers,
      },
    });

    if (response.status !== 200) {
      throw new Error(`PDF indirme başarısız oldu. HTTP Status: ${response.status}`);
    }

    return Buffer.from(response.data);
  }

  /**
   * Fatura görüntüleme linki (DocumentViewerLink), indirme URL'si, doğrudan key parametresi VEYA
   * faturanın ETTN/UUID değeri ile İşNet sunucusundan faturanın UBL-TR XML içeriğini indirir ve ham XML string olarak döndürür.
   * ETTN verildiğinde DocumentViewerLink sorgusu otomatik olarak yapılır.
   *
   * @param ettnOrKeyOrUrl Fatura ETTN (UUID), görüntüleme linki (DocumentViewerLink), indirme URL'si veya key
   * @param direction Fatura yönü (Opsiyonel, yalnızca ETTN verildiğinde kullanılır)
   * @param docType Belge tipi (Opsiyonel, yalnızca ETTN verildiğinde kullanılır)
   * @returns UBL-TR XML metin içeriği (string)
   */
  public async getInvoiceXml(
    ettnOrKeyOrUrl: string,
    direction: InvoiceDirection = InvoiceDirection.Outgoing,
    docType: InvoiceDocumentType = InvoiceDocumentType.EArchiveInvoice
  ): Promise<string> {
    let keyOrUrl = ettnOrKeyOrUrl;

    // Eğer doğrudan UUID/ETTN girildiyse veya key/url formatında değilse linki otomatik sorgula
    if (isUuid(ettnOrKeyOrUrl) || (!ettnOrKeyOrUrl.includes('key=') && ettnOrKeyOrUrl.length < 60)) {
      const viewerRes = await this.getDocumentViewerLink(ettnOrKeyOrUrl, direction, docType);
      keyOrUrl = viewerRes.HtmlUrl || viewerRes.PdfUrl || '';
      if (!keyOrUrl) {
        throw new Error(`ETTN (${ettnOrKeyOrUrl}) için fatura görüntüleme linki bulunamadı.`);
      }
    }

    const key = extractViewerKey(keyOrUrl);
    if (!key) {
      throw new Error('Geçersiz veya boş fatura anahtarı (key/ETTN) sağlandı.');
    }

    const portalBase = this.config.endpoints.portalUrl || 'https://efatura.isnet.net.tr';
    const cleanBase = portalBase.startsWith('http') ? portalBase.replace(/\/+$/, '') : `https://${portalBase.replace(/\/+$/, '')}`;
    const url = `${cleanBase}/DocumentViewer/DownloadXml?key=${encodeURIComponent(key)}`;

    this.config.logger('debug', `[InvoiceService.getInvoiceXml] GET ${url}`);

    const response = await axios.get<string | ArrayBuffer>(url, {
      responseType: 'text',
      timeout: this.config.timeout,
      headers: {
        'Accept': 'text/xml, application/xml, application/octet-stream, */*',
        'User-Agent': 'NetteFatura-API-Client',
        ...this.config.headers,
      },
    });

    if (response.status !== 200) {
      throw new Error(`XML indirme başarısız oldu. HTTP Status: ${response.status}`);
    }

    const xml = typeof response.data === 'string' ? response.data : Buffer.from(response.data).toString('utf-8');
    return xml;
  }

  /**
   * Fatura görüntüleme linki (DocumentViewerLink), indirme URL'si, doğrudan key parametresi VEYA
   * faturanın ETTN/UUID değeri ile İşNet sunucusundan faturanın UBL-TR XML içeriğini indirir ve Base64 formatında string olarak döndürür.
   * ETTN verildiğinde DocumentViewerLink sorgusu otomatik olarak yapılır.
   *
   * @param ettnOrKeyOrUrl Fatura ETTN (UUID), görüntüleme linki (DocumentViewerLink), indirme URL'si veya key
   * @param direction Fatura yönü (Opsiyonel, yalnızca ETTN verildiğinde kullanılır)
   * @param docType Belge tipi (Opsiyonel, yalnızca ETTN verildiğinde kullanılır)
   * @returns Base64 formatında kodlanmış UBL-TR XML string
   */
  public async getInvoiceXmlBase64(
    ettnOrKeyOrUrl: string,
    direction: InvoiceDirection = InvoiceDirection.Outgoing,
    docType: InvoiceDocumentType = InvoiceDocumentType.EArchiveInvoice
  ): Promise<string> {
    const xml = await this.getInvoiceXml(ettnOrKeyOrUrl, direction, docType);
    return Buffer.from(xml, 'utf-8').toString('base64');
  }

  /**
   * ETTN numarası ile faturanın görüntüleme linkini (DocumentViewerLink) sorgular ve
   * doğrudan PDF dosyasını Base64 formatında string olarak döndürür.
   *
   * @param ettn Faturanın UUID/ETTN değeri
   * @param direction Fatura yönü (Giden: Outgoing / Gelen: Incoming)
   * @param docType Belge tipi (e-Arşiv, e-Fatura vb.)
   * @returns Base64 formatında PDF string
   */
  public async getInvoicePdfByEttn(
    ettn: string,
    direction: InvoiceDirection = InvoiceDirection.Outgoing,
    docType: InvoiceDocumentType = InvoiceDocumentType.EArchiveInvoice
  ): Promise<string> {
    const viewerLink = await this.getDocumentViewerLink(ettn, direction, docType);
    const targetUrl = viewerLink.HtmlUrl || viewerLink.PdfUrl;
    if (!targetUrl) {
      throw new Error(`ETTN (${ettn}) için fatura görüntüleme linki bulunamadı.`);
    }
    return this.getInvoicePdf(targetUrl);
  }

  /**
   * ETTN numarası ile faturanın görüntüleme linkini (DocumentViewerLink) sorgular ve
   * doğrudan UBL-TR XML içeriğini string olarak döndürür.
   *
   * @param ettn Faturanın UUID/ETTN değeri
   * @param direction Fatura yönü (Giden: Outgoing / Gelen: Incoming)
   * @param docType Belge tipi (e-Arşiv, e-Fatura vb.)
   * @returns UBL-TR XML string
   */
  public async getInvoiceXmlByEttn(
    ettn: string,
    direction: InvoiceDirection = InvoiceDirection.Outgoing,
    docType: InvoiceDocumentType = InvoiceDocumentType.EArchiveInvoice
  ): Promise<string> {
    const viewerLink = await this.getDocumentViewerLink(ettn, direction, docType);
    const targetUrl = viewerLink.HtmlUrl || viewerLink.PdfUrl;
    if (!targetUrl) {
      throw new Error(`ETTN (${ettn}) için fatura görüntüleme linki bulunamadı.`);
    }
    return this.getInvoiceXml(targetUrl);
  }

  /**
   * Gönderilmiş e-Arşiv faturasını iptal eder.
   */
  public async cancelArchiveInvoice(
    cancellationOrRequest:
      | ArchiveInvoiceCancellation
      | ArchiveInvoiceCancellation[]
      | CancelArchiveInvoiceRequest
  ): Promise<CancelArchiveInvoiceResponse> {
    let payload: CancelArchiveInvoiceRequest;

    if ('ArchiveInvoiceList' in cancellationOrRequest) {
      payload = {
        CompanyTaxCode: cancellationOrRequest.CompanyTaxCode || this.config.companyTaxCode,
        CompanyVendorNumber: cancellationOrRequest.CompanyVendorNumber || this.config.companyVendorNumber,
        ArchiveInvoiceList: cancellationOrRequest.ArchiveInvoiceList,
      };
    } else if (Array.isArray(cancellationOrRequest)) {
      payload = {
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
        ArchiveInvoiceList: cancellationOrRequest,
      };
    } else {
      payload = {
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
        ArchiveInvoiceList: [cancellationOrRequest],
      };
    }

    return this.soapClient.call<CancelArchiveInvoiceResponse>(
      this.config.endpoints.invoiceService,
      'CancelArchiveInvoice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Gönderilmiş e-Arşiv faturasına itiraz kaydı oluşturur.
   */
  public async contestArchiveInvoice(request: {
    CompanyTaxCode?: string;
    CompanyVendorNumber?: string;
    ArchiveInvoiceList: {
      ETTN: string;
      ContestReason: string;
      ContestType?: string;
    }[];
  }) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      ArchiveInvoiceList: request.ArchiveInvoiceList,
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'ContestArchiveInvoice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Ticari e-Faturaya KABUL veya RED uygulama yanıtı (SendInvoiceReply) döner.
   */
  public async sendInvoiceReply(request: {
    CompanyTaxCode?: string;
    CompanyVendorNumber?: string;
    InvoiceReply: {
      ETTN: string;
      InvoiceNumber?: string;
      ResponseType: 'KABUL' | 'RED';
      Reason?: string;
    };
  }) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      InvoiceReply: request.InvoiceReply,
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SendInvoiceReply',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-İrsaliye (Despatch Advice) oluşturup gönderir.
   */
  public async sendDespatchAdvice(request: any) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      DespatchAdvices: request.DespatchAdvices || (Array.isArray(request) ? request : [request]),
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SendDespatchAdvice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * UBL-TR XML formatında e-İrsaliye gönderir.
   */
  public async sendDespatchAdviceXml(xmlOrRequest: string | any) {
    let payload: any;
    if (typeof xmlOrRequest === 'string') {
      payload = {
        CompanyTaxCode: this.config.companyTaxCode,
        CompanyVendorNumber: this.config.companyVendorNumber,
        DespatchAdvices: [{ DespatchAdviceContent: this.ensureBase64(xmlOrRequest) }],
      };
    } else {
      payload = {
        CompanyTaxCode: xmlOrRequest.CompanyTaxCode || this.config.companyTaxCode,
        CompanyVendorNumber: xmlOrRequest.CompanyVendorNumber || this.config.companyVendorNumber,
        DespatchAdvices: xmlOrRequest.DespatchAdvices,
      };
    }
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SendDespatchAdviceXml',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-İrsaliyeleri arar / listeler.
   */
  public async searchDespatchAdvice(request: any) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      ...request,
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SearchDespatchAdvice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-İrsaliye Teslim / Yanıt Makbuzu (Receipt Advice) gönderir.
   */
  public async sendReceiptAdvice(request: any) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      ReceiptAdvices: request.ReceiptAdvices || (Array.isArray(request) ? request : [request]),
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SendReceiptAdvice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-SMM (Serbest Meslek Makbuzu) oluşturup gönderir.
   */
  public async sendESMM(request: any) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      ESMMList: request.ESMMList || (Array.isArray(request) ? request : [request]),
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SendESMM',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-SMM (Serbest Meslek Makbuzu) arar / listeler.
   */
  public async searchESMM(request: any) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      ...request,
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SearchESMM',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-SMM İptal işlemi yapar.
   */
  public async cancelESMM(request: any) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      ESMMCancellationList: request.ESMMCancellationList || (Array.isArray(request) ? request : [request]),
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'CancelESMM',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-Döviz: Döviz Alım / Satım Belgesi gönderir.
   */
  public async sendCurrencyInvoice(request: any) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      CurrencyInvoices: request.CurrencyInvoices || (Array.isArray(request) ? request : [request]),
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SendCurrencyInvoice',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Sigorta Komisyon Gider Belgesi gönderir.
   */
  public async sendInsurance(request: any) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      Insurances: request.Insurances || (Array.isArray(request) ? request : [request]),
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SendInsurance',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Sigorta Komisyon Gider Belgesi iptal eder.
   */
  public async cancelInsurance(request: any) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      ...request,
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'CancelInsurance',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Firma bilgilerini getirir.
   */
  public async getCompany(taxCode?: string) {
    const payload = {
      CompanyTaxCode: taxCode || this.config.companyTaxCode,
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'GetCompany',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Firma şube/vendor listesini getirir.
   */
  public async getCompanyVendor(taxCode?: string) {
    const payload = {
      CompanyTaxCode: taxCode || this.config.companyTaxCode,
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'GetCompanyVendor',
      this.serviceInterface,
      payload
    );
  }

  /**
   * e-Arşiv faturasını alıcının e-posta adresine tekrar gönderir.
   */
  public async sendArchiveInvoiceMail(request: {
    CompanyTaxCode?: string;
    CompanyVendorNumber?: string;
    ETTN: string;
    Email: string;
  }) {
    const payload = {
      CompanyTaxCode: request.CompanyTaxCode || this.config.companyTaxCode,
      CompanyVendorNumber: request.CompanyVendorNumber || this.config.companyVendorNumber,
      ETTN: request.ETTN,
      Email: request.Email,
    };
    return this.soapClient.call<any>(
      this.config.endpoints.invoiceService,
      'SendArchiveInvoiceMail',
      this.serviceInterface,
      payload
    );
  }

  /**
   * Helper: String xml ise base64'e çevirir, zaten base64 ise olduğu gibi bırakır.
   */
  private ensureBase64(str: string): string {
    const trimmed = str.trim();
    if (trimmed.startsWith('<') || trimmed.includes('<?xml')) {
      return Buffer.from(trimmed, 'utf-8').toString('base64');
    }
    return trimmed;
  }
}
