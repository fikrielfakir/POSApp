import { QRPayload, QRInvalidError } from './qrDecoder';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateQRPayload(payload: QRPayload): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Version check
  if (payload.v !== 1) {
    errors.push(`Unsupported payload version: ${payload.v}`);
  }

  // Type check
  if (payload.type !== 'pos_init') {
    errors.push(`Unknown payload type: ${payload.type}`);
  }

  // Company validation
  if (payload.company) {
    const c = payload.company;
    if (!c.name || c.name.trim().length === 0) {
      errors.push('Company name is required');
    }
    if (c.tax_rate !== undefined && (c.tax_rate < 0 || c.tax_rate > 100)) {
      errors.push('Tax rate must be between 0 and 100');
    }
  } else if (!payload.chunk) {
    warnings.push('No company info in payload');
  }

  // Products validation
  if (payload.products && Array.isArray(payload.products)) {
    payload.products.forEach((p, i) => {
      if (!p.id) errors.push(`Product[${i}] missing id`);
      if (!p.name) errors.push(`Product[${i}] missing name`);
      if (p.price === undefined || p.price === null) warnings.push(`Product[${i}] missing price`);
    });
  }

  // Contacts validation
  if (payload.contacts && Array.isArray(payload.contacts)) {
    payload.contacts.forEach((c, i) => {
      if (!c.id) errors.push(`Contact[${i}] missing id`);
      if (!c.name) errors.push(`Contact[${i}] missing name`);
    });
  }

  // Categories validation
  if (payload.categories && Array.isArray(payload.categories)) {
    payload.categories.forEach((cat, i) => {
      if (!cat.id) errors.push(`Category[${i}] missing id`);
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function assertValidPayload(payload: QRPayload): void {
  const result = validateQRPayload(payload);
  if (!result.valid) {
    throw new QRInvalidError(`Invalid QR payload: ${result.errors.join(', ')}`);
  }
}
