import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ResolvedNetteFaturaConfig } from '../config.js';
import { buildSoapEnvelope, parseSoapResponse } from './xml-parser.js';
import { NetteFaturaError, SoapFaultError } from './soap-fault.js';

export class SoapClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly config: ResolvedNetteFaturaConfig;

  constructor(config: ResolvedNetteFaturaConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      timeout: config.timeout,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        Accept: 'text/xml, application/soap+xml, application/xml, text/plain',
        ...config.headers,
      },
    });
  }

  /**
   * SOAP Web Servisine istek atar ve sonucu döner
   */
  public async call<T = unknown>(
    endpointUrl: string,
    actionName: string,
    serviceInterface: string, // örn: 'IInvoiceService' veya 'IAddressBookService'
    requestData?: unknown
  ): Promise<T> {
    const soapAction = `http://tempuri.org/${serviceInterface}/${actionName}`;
    const envelopeXml = buildSoapEnvelope(actionName, requestData);

    if (this.config.debug) {
      this.config.logger('debug', `[SOAP REQUEST] Action: ${actionName} -> ${endpointUrl}`);
      this.config.logger('debug', `[SOAP REQUEST XML]\n${envelopeXml}`);
    }

    try {
      const response: AxiosResponse<string> = await this.axiosInstance.post(
        endpointUrl,
        envelopeXml,
        {
          headers: {
            SOAPAction: `"${soapAction}"`,
          },
          responseType: 'text',
        }
      );

      if (this.config.debug) {
        this.config.logger('debug', `[SOAP RESPONSE] HTTP ${response.status} for ${actionName}`);
        this.config.logger('debug', `[SOAP RESPONSE XML]\n${response.data}`);
      }

      const result = parseSoapResponse<T>(response.data, actionName);
      return result;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data) {
          const responseData = typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);

          if (this.config.debug) {
            this.config.logger('error', `[SOAP ERROR RESPONSE] HTTP ${error.response.status}`);
            this.config.logger('error', responseData);
          }

          // Try parsing SOAP Fault from error response
          try {
            parseSoapResponse(responseData, actionName);
          } catch (soapFault) {
            if (soapFault instanceof SoapFaultError) {
              throw soapFault;
            }
          }

          throw new NetteFaturaError(
            `HTTP ${error.response.status} Hatası: ${error.message}`,
            `HTTP_${error.response.status}`,
            responseData
          );
        }

        throw new NetteFaturaError(
          `Ağ / Bağlantı Hatası: ${error.message}`,
          error.code || 'NETWORK_ERROR',
          error
        );
      }

      if (error instanceof NetteFaturaError) {
        throw error;
      }

      throw new NetteFaturaError(
        (error as Error)?.message || 'Bilinmeyen bir hata oluştu',
        'UNKNOWN_ERROR',
        error
      );
    }
  }
}
