import pako from 'pako';

export class QRInvalidError extends Error {
  constructor(msg = 'Invalid QR code format') { super(msg); this.name = 'QRInvalidError'; }
}
export class QRVersionError extends Error {
  constructor(msg = 'Unsupported QR payload version') { super(msg); this.name = 'QRVersionError'; }
}
export class QRCorruptError extends Error {
  constructor(msg = 'QR data is corrupted or incomplete') { super(msg); this.name = 'QRCorruptError'; }
}

export interface ChunkMeta {
  index: number;
  total: number;
  session: string;
  data: string;
}

export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
  logo_url?: string | null;
  currency?: string;
  currency_symbol?: string;
  tax_rate?: number;
  tax_name?: string;
  receipt_footer?: string;
}

export interface QRPayload {
  v: number;
  type: string;
  chunk: ChunkMeta | null;
  company?: CompanyInfo;
  warehouses?: any[];
  categories?: any[];
  brands?: any[];
  products?: any[];
  contacts?: any[];
  tax_rules?: any[];
}

export function decodeQRString(raw: string): QRPayload {
  let payload: QRPayload;

  // 1. Try plain JSON first
  try {
    payload = JSON.parse(raw) as QRPayload;
  } catch {
    // 2. Try base64 → gzip decompress
    try {
      const binaryStr = atob(raw);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const decompressed = pako.inflate(bytes, { to: 'string' });
      payload = JSON.parse(decompressed) as QRPayload;
    } catch {
      throw new QRCorruptError();
    }
  }

  if (!payload || typeof payload !== 'object') throw new QRInvalidError();
  if (payload.type !== 'pos_init') throw new QRInvalidError('QR code is not a POS setup code');
  if (payload.v !== 1) throw new QRVersionError();

  return payload;
}
