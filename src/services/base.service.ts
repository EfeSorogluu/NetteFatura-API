import { ResolvedNetteFaturaConfig } from '../config.js';
import { SoapClient } from '../core/soap-client.js';

export abstract class BaseService {
  protected readonly config: ResolvedNetteFaturaConfig;
  protected readonly soapClient: SoapClient;

  constructor(config: ResolvedNetteFaturaConfig, soapClient: SoapClient) {
    this.config = config;
    this.soapClient = soapClient;
  }
}
