"use client"

import type { Sale } from '@/types/sale'
import { createSaleReference, formatCurrency, getSalePaymentConditionLabel, getSalePaymentMethodLabel, SALE_PAYMENT_STATUS_LABELS } from '@/lib/sales'

const SALE_RECEIPT_COMPANY_NAME = 'SOUZA CONSTRUÇÕES'

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date)
}

function SaleReceiptTotals({ sale }: { sale: Sale }) {
  return (
    <div className="space-y-1 border-t border-dashed border-slate-400 pt-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span>Subtotal</span>
        <span>{formatCurrency(sale.subtotal)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>Desconto</span>
        <span>- {formatCurrency(sale.discount)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>Frete</span>
        <span>{formatCurrency(sale.shipping)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>Outras despesas</span>
        <span>{formatCurrency(sale.otherCosts)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-dashed border-slate-400 pt-2 text-base font-bold">
        <span>Total</span>
        <span>{formatCurrency(sale.total)}</span>
      </div>
    </div>
  )
}

export function SaleReceipt({ sale }: { sale: Sale }) {
  const reference = createSaleReference(sale.id)
  const paymentConditionLabel = getSalePaymentConditionLabel(sale.paymentCondition)
  const paymentMethodLabel = getSalePaymentMethodLabel(sale.paymentCondition, sale.paymentMethod, sale.payments)
  const paymentList = sale.payments.length > 0 ? sale.payments : (sale.paymentCondition.installments ?? []).map((installment) => ({
    id: installment.id,
    amount: installment.amount,
    date: installment.dueDate ?? sale.saleDate,
    paymentMethod: installment.paymentMethod,
    notes: installment.status === 'PAGO' ? 'Pagamento legado' : 'Parcela legada',
  }))

  return (
    <section className="mx-auto w-full max-w-[420px] rounded-[28px] border border-slate-300 bg-white p-5 font-mono text-[12px] leading-5 text-slate-900 shadow-sm">
      <div className="space-y-4">
        <header className="space-y-2 border-b border-dashed border-slate-400 pb-4 text-center">
          <div className="space-y-1">
            <p className="text-[15px] font-bold uppercase tracking-[0.24em]">{SALE_RECEIPT_COMPANY_NAME}</p>
            <p className="text-[11px] text-slate-600">Sistema de gestão</p>
          </div>
          <div className="space-y-1 text-[11px] text-slate-700">
            <p>Comprovante de venda</p>
            <p className="font-bold">Venda {reference}</p>
            <p>ID: {sale.id}</p>
          </div>
        </header>

        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">Data da venda</span>
            <span className="text-right">{formatDate(sale.saleDate)}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">Registrada em</span>
            <span className="text-right">{formatDateTime(sale.createdAt)}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">Cliente</span>
            <span className="max-w-[60%] text-right">{sale.customerName || '-'}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">Vendedor</span>
            <span className="max-w-[60%] text-right">{sale.sellerName || '-'}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">Entrega</span>
            <span className="text-right">{sale.isDelivery ? 'Entrega' : 'Retirada'}</span>
          </div>
          {sale.deliveryDate ? (
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-600">Previsão</span>
              <span className="text-right">{formatDate(sale.deliveryDate)}</span>
            </div>
          ) : null}
        </div>

        <div className="space-y-2 border-y border-dashed border-slate-400 py-4">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">Condição</span>
            <span className="max-w-[60%] text-right">{paymentConditionLabel}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">Forma</span>
            <span className="max-w-[60%] text-right">{paymentMethodLabel}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">Status</span>
            <span className="max-w-[60%] text-right">{SALE_PAYMENT_STATUS_LABELS[sale.paymentStatus]}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">Pago / Saldo</span>
            <span className="max-w-[60%] text-right">
              {formatCurrency(sale.paidAmount)} / {formatCurrency(sale.remainingAmount)}
            </span>
          </div>
          {sale.notes ? (
            <div className="space-y-1">
              <p className="text-slate-600">Observações</p>
              <p className="whitespace-pre-wrap break-words text-[11px] leading-5">{sale.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-dashed border-slate-400 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
            <span>Item</span>
            <span className="text-right">Qtd</span>
            <span className="text-right">Unit.</span>
            <span className="text-right">Total</span>
          </div>

          <div className="space-y-2">
            {sale.items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[11px]">
                <div className="space-y-0.5 pr-2">
                  <p className="break-words font-bold">{item.productName}</p>
                  <p className="text-[10px] text-slate-600">
                    {item.sku}
                    {item.brand ? ` • ${item.brand}` : ''}
                    {item.unit ? ` • ${item.unit}` : ''}
                  </p>
                </div>
                <span className="text-right">{item.quantity}</span>
                <span className="text-right">{formatCurrency(item.unitPrice)}</span>
                <span className="text-right">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <SaleReceiptTotals sale={sale} />

        {paymentList.length > 0 ? (
          <div className="space-y-2 border-t border-dashed border-slate-400 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">Pagamentos</p>
            <div className="space-y-2">
              {paymentList.map((payment, index) => (
                <div key={payment.id ?? `${sale.id}-${index}`} className="flex items-start justify-between gap-3 text-[11px]">
                  <div className="space-y-0.5">
                    <p className="font-bold">{payment.paymentMethod || 'Forma não informada'}</p>
                    <p className="text-slate-600">{payment.notes || formatDate(payment.date)}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatCurrency(payment.amount)}</p>
                    <p className="text-slate-600">Registrado</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <footer className="border-t border-dashed border-slate-400 pt-3 text-center text-[10px] text-slate-600">
          Gerado em {formatDateTime(sale.createdAt)}
        </footer>
      </div>
    </section>
  )
}

function buildSaleItemsHtml(sale: Sale) {
  return sale.items
    .map((item) => {
      const meta = [item.sku, item.brand, item.unit].filter(Boolean).join(' • ')
      return `
        <div class="item">
          <div>
            <p class="item-name">${escapeHtml(item.productName)}</p>
            <p class="item-meta">${escapeHtml(meta)}</p>
          </div>
          <span class="right">${escapeHtml(String(item.quantity))}</span>
          <span class="right">${escapeHtml(formatCurrency(item.unitPrice))}</span>
          <span class="right">${escapeHtml(formatCurrency(item.subtotal))}</span>
        </div>
      `
    })
    .join('')
}

function buildInstallmentsHtml(sale: Sale) {
  const payments = sale.payments.length > 0 ? sale.payments : (sale.paymentCondition.installments ?? []).map((installment) => ({
    id: installment.id,
    amount: installment.amount,
    date: installment.dueDate ?? sale.saleDate,
    paymentMethod: installment.paymentMethod,
    notes: installment.status === 'PAGO' ? 'Pagamento legado' : 'Parcela legada',
  }))

  if (payments.length === 0) {
    return ''
  }

  return `
    <div class="section">
      <div class="section-title">Pagamentos</div>
      <div class="installments">
        ${payments
          .map((payment) => {
            return `
              <div class="installment">
                <div>
                  <div class="installment-title">${escapeHtml(payment.paymentMethod || 'Forma não informada')}</div>
                  <div class="installment-meta">${escapeHtml(payment.notes || formatDate(payment.date))}</div>
                </div>
                <div class="installment-value">
                  <div>${escapeHtml(formatCurrency(payment.amount))}</div>
                  <div class="muted">Registrado</div>
                </div>
              </div>
            `
          })
          .join('')}
      </div>
    </div>
  `
}

export function buildPrintableSaleReceiptHtml(sale: Sale) {
  const reference = createSaleReference(sale.id)
  const paymentConditionLabel = getSalePaymentConditionLabel(sale.paymentCondition)
  const paymentMethodLabel = getSalePaymentMethodLabel(sale.paymentCondition, sale.paymentMethod, sale.payments)

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Venda ${escapeHtml(reference)}</title>
        <style>
          @page { size: 80mm auto; margin: 6mm; }
          html, body { margin: 0; padding: 0; background: #fff; color: #0f172a; font-family: "Courier New", Courier, monospace; }
          .receipt { width: 68mm; margin: 0 auto; padding: 0; box-sizing: border-box; font-size: 11px; line-height: 1.5; }
          .center { text-align: center; }
          .header { border-bottom: 1px dashed #64748b; padding-bottom: 10px; margin-bottom: 10px; }
          .brand { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
          .subbrand, .muted, .meta, .item-meta, .section-title { color: #475569; }
          .subbrand, .muted { font-size: 10px; }
          .title { margin: 8px 0 0; font-size: 11px; font-weight: 700; }
          .section { border-top: 1px dashed #64748b; padding-top: 10px; margin-top: 10px; }
          .row { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
          .row + .row { margin-top: 2px; }
          .items-head, .item { display: grid; grid-template-columns: 1fr 14mm 18mm 18mm; gap: 4px; }
          .items-head { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding-bottom: 6px; border-bottom: 1px dashed #64748b; }
          .item { padding: 8px 0; border-bottom: 1px dotted #cbd5e1; }
          .item:last-child { border-bottom: 0; }
          .item-name { margin: 0; font-weight: 700; }
          .item-meta { margin: 2px 0 0; font-size: 9px; line-height: 1.4; }
          .right { text-align: right; }
          .totals { border-top: 1px dashed #64748b; padding-top: 8px; margin-top: 10px; }
          .total-row { display: flex; justify-content: space-between; gap: 10px; }
          .total-row strong { font-size: 12px; }
          .installments { margin-top: 8px; }
          .installment { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px dotted #cbd5e1; }
          .installment:last-child { border-bottom: 0; }
          .installment-title { font-weight: 700; }
          .installment-meta { font-size: 9px; color: #475569; }
          .installment-value { text-align: right; }
          .footer { margin-top: 12px; padding-top: 8px; border-top: 1px dashed #64748b; text-align: center; font-size: 9px; color: #475569; }
          .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
          .notes { white-space: pre-wrap; word-break: break-word; font-size: 10px; line-height: 1.5; }
          .spaced { margin-top: 6px; }
          @media print {
            html, body { background: #fff; }
            .receipt { width: 68mm; }
          }
        </style>
      </head>
      <body>
        <main class="receipt">
          <header class="header center">
            <p class="brand">${escapeHtml(SALE_RECEIPT_COMPANY_NAME)}</p>
            <p class="subbrand">Sistema de gestão</p>
            <p class="title">Comprovante de venda</p>
            <p class="title">Venda ${escapeHtml(reference)}</p>
            <p class="meta">ID: ${escapeHtml(sale.id)}</p>
          </header>

          <section class="section">
            <div class="row"><span class="muted">Data da venda</span><span>${escapeHtml(formatDate(sale.saleDate))}</span></div>
            <div class="row"><span class="muted">Registrada em</span><span>${escapeHtml(formatDateTime(sale.createdAt))}</span></div>
            <div class="row"><span class="muted">Cliente</span><span>${escapeHtml(sale.customerName || '-')}</span></div>
            <div class="row"><span class="muted">Vendedor</span><span>${escapeHtml(sale.sellerName || '-')}</span></div>
            <div class="row"><span class="muted">Entrega</span><span>${escapeHtml(sale.isDelivery ? 'Entrega' : 'Retirada')}</span></div>
            ${sale.deliveryDate ? `<div class="row"><span class="muted">Previsão</span><span>${escapeHtml(formatDate(sale.deliveryDate))}</span></div>` : ''}
          </section>

          <section class="section">
            <div class="row"><span class="muted">Condição</span><span>${escapeHtml(paymentConditionLabel)}</span></div>
            <div class="row"><span class="muted">Forma</span><span>${escapeHtml(paymentMethodLabel)}</span></div>
            <div class="row"><span class="muted">Status</span><span>${escapeHtml(SALE_PAYMENT_STATUS_LABELS[sale.paymentStatus])}</span></div>
            <div class="row"><span class="muted">Pago / Saldo</span><span>${escapeHtml(formatCurrency(sale.paidAmount))} / ${escapeHtml(formatCurrency(sale.remainingAmount))}</span></div>
            ${sale.notes ? `<div class="spaced"><div class="muted">Observações</div><div class="notes">${escapeHtml(sale.notes)}</div></div>` : ''}
          </section>

          <section class="section">
            <div class="items-head">
              <span>Item</span>
              <span class="right">Qtd</span>
              <span class="right">Unit.</span>
              <span class="right">Total</span>
            </div>
            ${buildSaleItemsHtml(sale)}
          </section>

          <section class="totals">
            <div class="total-row"><span>Subtotal</span><span>${escapeHtml(formatCurrency(sale.subtotal))}</span></div>
            <div class="total-row"><span>Desconto</span><span>- ${escapeHtml(formatCurrency(sale.discount))}</span></div>
            <div class="total-row"><span>Frete</span><span>${escapeHtml(formatCurrency(sale.shipping))}</span></div>
            <div class="total-row"><span>Outras despesas</span><span>${escapeHtml(formatCurrency(sale.otherCosts))}</span></div>
            <div class="total-row"><strong>Total</strong><strong>${escapeHtml(formatCurrency(sale.total))}</strong></div>
          </section>

          ${buildInstallmentsHtml(sale)}

          <footer class="footer">Gerado em ${escapeHtml(formatDateTime(sale.createdAt))}</footer>
        </main>
      </body>
    </html>
  `
}

function removeIframe(iframe: HTMLIFrameElement) {
  if (iframe.parentNode) {
    iframe.parentNode.removeChild(iframe)
  }
}

export function printSaleReceiptDocument(sale: Sale) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.tabIndex = -1
  iframe.style.position = 'fixed'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.opacity = '0'

  iframe.srcdoc = buildPrintableSaleReceiptHtml(sale)

  const cleanup = () => {
    window.setTimeout(() => removeIframe(iframe), 1000)
  }

  iframe.addEventListener('load', () => {
    const contentWindow = iframe.contentWindow
    if (!contentWindow) {
      cleanup()
      return
    }

    contentWindow.focus()
    contentWindow.print()
    contentWindow.onafterprint = cleanup
    window.setTimeout(cleanup, 3000)
  })

  document.body.appendChild(iframe)
}
