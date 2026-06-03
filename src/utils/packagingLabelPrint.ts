import JsBarcode from "jsbarcode"

import type { PackagingOrderDetail } from "@/types/packaging.type"

const getDeliveryTypeLabel = (type?: string) => {
  const key = String(type ?? "")
    .trim()
    .toLowerCase()

  if (key === "pickup") return "Nhận tại điểm tập kết"
  if (key === "delivery" || key === "shipping") return "Giao tận nơi"

  return type || "—"
}

export type PackagingLabelData = {
  barcodeValue: string
  orderCode: string
  customerName: string
  timeSlotDisplay: string
  deliveryTypeLabel: string
  itemCount: number
  packagedAtLabel: string
}

export const buildPackagingLabelData = (
  order: PackagingOrderDetail,
): PackagingLabelData => {
  const orderCode = order.orderCode?.trim() || order.orderId

  return {
    barcodeValue: orderCode,
    orderCode,
    customerName: order.customerName || "—",
    timeSlotDisplay: order.timeSlotDisplay || "—",
    deliveryTypeLabel: getDeliveryTypeLabel(order.deliveryType),
    itemCount: order.items?.length ?? 0,
    packagedAtLabel: order.lastPackagedAt
      ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(order.lastPackagedAt))
      : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
  }
}

export const PACKAGING_LABEL_PRINT_STYLES = `
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #0f172a;
  }
  .label-sheet { display: flex; flex-direction: column; gap: 6mm; }
  .label {
    width: 72mm;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 4mm;
    page-break-inside: avoid;
  }
  .brand {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #059669;
  }
  .order-code {
    margin-top: 2mm;
    font-size: 18px;
    font-weight: 800;
    line-height: 1.2;
  }
  .barcode-wrap {
    margin-top: 3mm;
    text-align: center;
  }
  .barcode-wrap svg {
    max-width: 100%;
    height: auto;
  }
  .meta {
    margin-top: 3mm;
    font-size: 10px;
    line-height: 1.45;
  }
  .meta dt {
    display: inline;
    font-weight: 600;
    color: #475569;
  }
  .meta dd {
    display: inline;
    margin: 0;
  }
  .meta div + div { margin-top: 1.5mm; }
`

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

/** Render barcode SVG in memory (for print window — not cloned from React DOM). */
export const buildBarcodeSvgHtml = (barcodeValue: string) => {
  if (!barcodeValue.trim()) return ""

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")

  try {
    JsBarcode(svg, barcodeValue, {
      format: "CODE128",
      width: 1.8,
      height: 52,
      displayValue: true,
      fontSize: 12,
      margin: 4,
      background: "#ffffff",
      lineColor: "#0f172a",
    })
    return svg.outerHTML
  } catch {
    return `<text x="0" y="14" font-size="12">${escapeHtml(barcodeValue)}</text>`
  }
}

const buildSingleLabelHtml = (data: PackagingLabelData) => {
  const barcodeSvg = buildBarcodeSvgHtml(data.barcodeValue)

  return `
    <p class="brand">CloseExp · Tem đơn đóng gói</p>
    <p class="order-code">${escapeHtml(data.orderCode)}</p>
    <div class="barcode-wrap">${barcodeSvg}</div>
    <dl class="meta">
      <div><dt>Khách: </dt><dd>${escapeHtml(data.customerName)}</dd></div>
      <div><dt>Khung giờ: </dt><dd>${escapeHtml(data.timeSlotDisplay)}</dd></div>
      <div><dt>Giao nhận: </dt><dd>${escapeHtml(data.deliveryTypeLabel)}</dd></div>
      <div><dt>Số món: </dt><dd>${data.itemCount}</dd></div>
      <div><dt>Đóng gói: </dt><dd>${escapeHtml(data.packagedAtLabel)}</dd></div>
    </dl>
  `
}

export const buildPackagingLabelPrintHtml = (
  data: PackagingLabelData,
  copies = 1,
) => {
  const count = Math.min(10, Math.max(1, copies))
  const labelsHtml = Array.from({ length: count })
    .map(() => `<div class="label">${buildSingleLabelHtml(data)}</div>`)
    .join("")

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Tem đơn ${escapeHtml(data.orderCode)}</title>
  <style>${PACKAGING_LABEL_PRINT_STYLES}</style>
</head>
<body>
  <div class="label-sheet">${labelsHtml}</div>
</body>
</html>`
}

/**
 * Opens print preview. Do not use noopener — it blocks document.write (blank window).
 */
export const openPackagingLabelPrintWindow = (
  data: PackagingLabelData,
  copies = 1,
): boolean => {
  const html = buildPackagingLabelPrintHtml(data, copies)

  const printWindow = window.open(
    "",
    "packagingLabelPrint",
    "width=520,height=760,menubar=no,toolbar=no,location=no,status=no",
  )

  if (!printWindow) {
    return false
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
  }

  if (printWindow.document.readyState === "complete") {
    window.setTimeout(triggerPrint, 250)
  } else {
    printWindow.onload = () => window.setTimeout(triggerPrint, 250)
  }

  return true
}
