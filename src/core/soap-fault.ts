export class NetteFaturaError extends Error {
  public code?: string;
  public details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'NetteFaturaError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SoapFaultError extends NetteFaturaError {
  public faultCode?: string;
  public faultString?: string;
  public faultActor?: string;
  public detail?: unknown;

  constructor(faultCode?: string, faultString?: string, faultActor?: string, detail?: unknown) {
    super(faultString || faultCode || 'SOAP Fault Error', faultCode, detail);
    this.name = 'SoapFaultError';
    this.faultCode = faultCode;
    this.faultString = faultString;
    this.faultActor = faultActor;
    this.detail = detail;
  }
}

export class ServiceExecutionError extends NetteFaturaError {
  public errorCode?: string;
  public errorMessage?: string;

  constructor(message: string, errorCode?: string, rawResponse?: unknown) {
    super(message, errorCode, rawResponse);
    this.name = 'ServiceExecutionError';
    this.errorCode = errorCode;
    this.errorMessage = message;
  }
}
