/**
 * pdfGenerator.ts
 * Generates HTML-based invoice/report documents for sharing via the Share API.
 * In production, use expo-print or react-native-pdf-lib to convert HTML → PDF.
 */

import { getMeta } from '@core/database/dbHelpers';
import { Sale, SaleItem } from '@features/sales/saleRepository';

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface InvoiceData {
  sale: Sale;
  items: SaleItem[];
  currencySymbol?: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const { sale, items } = data;
  const currency = data.currencySymbol ?? getMeta('currency_symbol') ?? '$';
  const companyName = getMeta('company_name') ?? 'My Company';
  const companyAddress = getMeta('company_address') ?? '';
  const companyPhone = getMeta('company_phone') ?? '';
  const taxName = getMeta('tax_name') ?? 'Tax';
  const footer = getMeta('receipt_footer') ?? 'Thank you for your business!';
  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;
  const change = Math.max(0, sale.paid_amount - sale.total);

  const itemRows = items.map(i => `
    <tr>
      <td>${esc(i.product_name)}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">${fmt(i.unit_price)}</td>
      <td style="text-align:right">${fmt(i.line_total)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${esc(sale.invoice_number)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 20px; max-width: 400px; margin: auto; }
  h1 { font-size: 22px; font-weight: 900; color: #2563EB; text-align: center; margin-bottom: 2px; }
  .company-info { text-align: center; color: #666; font-size: 12px; margin-bottom: 14px; }
  .meta { display: flex; justify-content: space-between; background: #F1F5F9; padding: 10px; border-radius: 6px; margin-bottom: 14px; }
  .meta span { font-size: 11px; color: #888; display: block; }
  .meta strong { font-size: 13px; color: #111; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th { background: #2563EB; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
  td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-size: 12px; }
  .totals { margin-left: auto; width: 220px; }
  .totals tr td { border: none; padding: 3px 0; }
  .totals tr td:last-child { text-align: right; font-weight: 600; }
  .total-final td { font-weight: 900 !important; font-size: 15px; color: #2563EB; border-top: 2px solid #E2E8F0; padding-top: 6px !important; }
  .footer { text-align: center; color: #888; font-size: 11px; margin-top: 20px; font-style: italic; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
  .badge-completed { background: #16A34A; color: #fff; }
  .badge-voided { background: #DC2626; color: #fff; }
</style>
</head>
<body>
  <h1>${esc(companyName)}</h1>
  <div class="company-info">
    ${companyAddress ? `<p>${esc(companyAddress)}</p>` : ''}
    ${companyPhone ? `<p>${esc(companyPhone)}</p>` : ''}
  </div>
  
  <div class="meta">
    <div><span>INVOICE</span><strong>${esc(sale.invoice_number)}</strong></div>
    <div style="text-align:right"><span>DATE</span><strong>${sale.created_at.slice(0, 10)}</strong></div>
  </div>

  <table>
    <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td>${fmt(sale.subtotal)}</td></tr>
    ${sale.discount_amount > 0 ? `<tr><td>Discount</td><td>-${fmt(sale.discount_amount)}</td></tr>` : ''}
    ${sale.tax_amount > 0 ? `<tr><td>${esc(taxName)}</td><td>${fmt(sale.tax_amount)}</td></tr>` : ''}
    <tr class="total-final"><td>TOTAL</td><td>${fmt(sale.total)}</td></tr>
    <tr><td>Paid (${esc(sale.payment_method)})</td><td>${fmt(sale.paid_amount)}</td></tr>
    ${change > 0 ? `<tr><td>Change</td><td style="color:#16A34A">${fmt(change)}</td></tr>` : ''}
  </table>

  <div style="text-align:center;margin-top:10px">
    <span class="badge badge-${sale.status}">${sale.status.toUpperCase()}</span>
  </div>

  <div class="footer">${esc(footer)}</div>
</body>
</html>`;
}

export function generateStockReportHTML(rows: { name: string; sku: string | null; stock_qty: number; cost_price: number; sale_price: number }[], currency = '$'): string {
  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;
  const totalVal = rows.reduce((s, r) => s + r.stock_qty * r.cost_price, 0);
  const rowsHTML = rows.map(r => `
    <tr ${r.stock_qty <= 0 ? 'style="background:#FEF2F2"' : ''}>
      <td>${esc(r.name)}</td>
      <td>${esc(r.sku)}</td>
      <td style="text-align:center;font-weight:700;color:${r.stock_qty <= 0 ? '#DC2626' : '#111'}">${r.stock_qty}</td>
      <td style="text-align:right">${fmt(r.cost_price)}</td>
      <td style="text-align:right;font-weight:600">${fmt(r.stock_qty * r.cost_price)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    body{font-family:Arial,sans-serif;font-size:12px;padding:16px}
    h2{color:#2563EB;margin-bottom:12px}
    table{width:100%;border-collapse:collapse}
    th{background:#2563EB;color:#fff;padding:6px;text-align:left;font-size:11px}
    td{padding:5px 6px;border-bottom:1px solid #E2E8F0}
    .total{font-weight:900;font-size:14px;color:#2563EB;margin-top:12px;text-align:right}
  </style></head><body>
  <h2>📦 Stock Report — ${new Date().toLocaleDateString()}</h2>
  <table><thead><tr><th>Product</th><th>SKU</th><th style="text-align:center">Stock</th><th style="text-align:right">Cost</th><th style="text-align:right">Value</th></tr></thead>
  <tbody>${rowsHTML}</tbody></table>
  <p class="total">Total Stock Value: ${fmt(totalVal)}</p>
  </body></html>`;
}
