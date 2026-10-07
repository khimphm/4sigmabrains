// Đọc tên trình duyệt / hệ điều hành / loại thiết bị từ user agent (đủ dùng cho danh sách phiên)
export interface ParsedAgent {
  browser: string
  os: string
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown'
}

export function parseUserAgent(ua: string | null | undefined): ParsedAgent {
  if (!ua) return { browser: 'Không rõ trình duyệt', os: 'Không rõ thiết bị', device: 'unknown' }
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /CocoaCoc/.test(ua)
        ? 'Cốc Cốc'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Chrome\/|CriOS\//.test(ua)
            ? /HeadlessChrome/.test(ua)
              ? 'Chrome (tự động)'
              : 'Chrome'
            : /Safari\//.test(ua)
              ? 'Safari'
              : /curl|node|axios|python/i.test(ua)
                ? 'Ứng dụng / script'
                : 'Trình duyệt khác'
  const os = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Mac OS X|Macintosh/.test(ua)
            ? 'macOS'
            : /CrOS/.test(ua)
              ? 'ChromeOS'
              : /Linux/.test(ua)
                ? 'Linux'
                : 'Không rõ hệ điều hành'
  const device = /iPad|Tablet/.test(ua)
    ? 'tablet'
    : /Mobi|iPhone|Android/.test(ua)
      ? 'mobile'
      : /Windows|Macintosh|Linux|CrOS/.test(ua)
        ? 'desktop'
        : 'unknown'
  return { browser, os, device }
}

export const METHOD_LABEL: Record<string, string> = {
  password: 'Mật khẩu',
  google: 'Google',
  microsoft: 'Microsoft',
  github: 'GitHub',
}
