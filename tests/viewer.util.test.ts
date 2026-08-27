import { describe, it, expect } from 'vitest';
import { extractViewerKey } from '../src/tools/viewer.util.js';

describe('extractViewerKey utility', () => {
  it('should extract key from DocumentViewerLink URL', () => {
    const url = 'http://efatura.isnet.net.tr:80/DocumentViewer/DocumentViewerLink?key=lchnBnCBZSSlXnm6Ad6ayBRakGHEFOJ6mJWIS%2f4qevETmRre%2b0dccpILIOJOr9Qnl64tvxg%2fkv6q9nfjt4WseROMz37CY2JrMIFvlhnFD9uYZiN%2f1MLswu0y5ZQcsIyV%2b528G6rDpm6vfHp9NmX1Kl6xR%2bHYVM8x';
    const key = extractViewerKey(url);
    expect(key).toContain('lchnBnCBZSSlXnm6Ad6ayBRakGHEFOJ6mJWIS/4qevETmRre+0dccpILIOJOr9Qnl64tvxg/kv6q9nfjt4WseROMz37CY2JrMIFvlhnFD9uYZiN/1MLswu0y5ZQcsIyV+528G6rDpm6vfHp9NmX1Kl6xR+HYVM8x');
  });

  it('should extract key from GetInvoicePdf URL', () => {
    const url = 'https://einvoiceapitest.isnet.net.tr/api/Invoice/GetInvoicePdf?key=lchnBnCBZSSlXnm6Ad6ayBRakGHEFOJ6mJWIS%2F4qevETmRre%2B0dccpILIOJOr9Qnl64tvxg%2Fkv6q9nfjt4WseROMz37CY2JrMIFvlhnFD9uYZiN%2F1MLswu0y5ZQcsIyV%2B528G6rDpm6vfHp9NmX1Kl6xR%2BHYVM8x';
    const key = extractViewerKey(url);
    expect(key).toContain('lchnBnCBZSSlXnm6Ad6ayBRakGHEFOJ6mJWIS/4qevETmRre+0dccpILIOJOr9Qnl64tvxg/kv6q9nfjt4WseROMz37CY2JrMIFvlhnFD9uYZiN/1MLswu0y5ZQcsIyV+528G6rDpm6vfHp9NmX1Kl6xR+HYVM8x');
  });

  it('should extract key from DownloadXml URL', () => {
    const url = 'https://efatura.isnet.net.tr/DocumentViewer/DownloadXml?key=mySampleKey123%2B456';
    const key = extractViewerKey(url);
    expect(key).toBe('mySampleKey123+456');
  });

  it('should decode when direct encoded key is passed', () => {
    const rawEncoded = 'mySampleKey123%2B456%2F789';
    const key = extractViewerKey(rawEncoded);
    expect(key).toBe('mySampleKey123+456/789');
  });

  it('should return empty string for empty input', () => {
    expect(extractViewerKey('')).toBe('');
    expect(extractViewerKey(null as any)).toBe('');
  });
});
