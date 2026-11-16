// Разбор полезной нагрузки JWT без DOM и без Buffer — чистый код для web и RN

export interface JwtClaims {
  sub?: string
  email?: string
  role?: string
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const BASE64_INDEXES = new Map<string, number>(
  [...BASE64_ALPHABET].map((char, index) => [char, index]),
)

// base64url → байты. Размер буфера считаем по длине данных без символов паддинга,
// иначе для неполных групп последние байты теряются.
function base64UrlToBytes(value: string): Uint8Array | null {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')

  let contentLength = normalized.length
  while (contentLength > 0 && normalized[contentLength - 1] === '=') {
    contentLength -= 1
  }

  const bytes = new Uint8Array(Math.floor((contentLength * 6) / 8))
  let bitBuffer = 0
  let bitsInBuffer = 0
  let outIndex = 0

  for (let i = 0; i < contentLength; i += 1) {
    const index = BASE64_INDEXES.get(normalized[i])
    if (index === undefined) return null

    bitBuffer = (bitBuffer << 6) | index
    bitsInBuffer += 6

    while (bitsInBuffer >= 8 && outIndex < bytes.length) {
      bitsInBuffer -= 8
      bytes[outIndex] = (bitBuffer >> bitsInBuffer) & 255
      outIndex += 1
    }
  }

  return outIndex === bytes.length ? bytes : null
}

function bytesToString(bytes: Uint8Array): string {
  let result = ''
  for (const byte of bytes) {
    result += String.fromCharCode(byte)
  }
  return result
}

// Возвращает claims токена или null, если токен не читается.
export function parseJwtPayload(token: string): JwtClaims | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const bytes = base64UrlToBytes(parts[1])
    if (!bytes) return null
    return JSON.parse(bytesToString(bytes)) as JwtClaims
  } catch {
    return null
  }
}
