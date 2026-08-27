/**
 * Verilen fatura görüntüleme linkinden (DocumentViewerLink, GetInvoicePdf veya DownloadXml URL'si)
 * veya doğrudan verilen key string'inden 'key' parametresini ayıklar ve çözer (decode).
 *
 * @param keyOrUrl Fatura görüntüleme linki, indirme URL'si veya doğrudan key parametresi
 * @returns Çözülmüş (decoded) key string
 */
export function extractViewerKey(keyOrUrl: string): string {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') {
    return '';
  }

  const trimmed = keyOrUrl.trim();

  // URL içerisinde 'key=' geçiyorsa query param olarak ayıkla
  if (trimmed.includes('key=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `http://dummy.local/${trimmed.replace(/^\/+/, '')}`);
      const keyParam = url.searchParams.get('key');
      if (keyParam) {
        return keyParam;
      }
    } catch {
      const match = trimmed.match(/[?&]key=([^&]+)/);
      if (match && match[1]) {
        try {
          return decodeURIComponent(match[1]);
        } catch {
          return match[1];
        }
      }
    }
  }

  // Doğrudan key verilmişse, eğer URL-encoded ise decode et
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verilen metnin geçerli bir UUID / ETTN olup olmadığını kontrol eder.
 */
export function isUuid(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

