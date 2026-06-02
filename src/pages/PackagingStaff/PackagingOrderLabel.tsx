import { useEffect, useId, useRef } from "react"
import JsBarcode from "jsbarcode"

import type { PackagingLabelData } from "@/utils/packagingLabelPrint"

type PackagingOrderLabelProps = {
    data: PackagingLabelData
    className?: string
}

const PackagingOrderLabel = ({ data, className }: PackagingOrderLabelProps) => {
    const svgId = useId().replace(/:/g, "")
    const svgRef = useRef<SVGSVGElement | null>(null)

    useEffect(() => {
        if (!svgRef.current || !data.barcodeValue) return

        try {
            JsBarcode(svgRef.current, data.barcodeValue, {
                format: "CODE128",
                width: 1.8,
                height: 52,
                displayValue: true,
                fontSize: 12,
                margin: 4,
                background: "#ffffff",
                lineColor: "#0f172a",
            })
        } catch {
            svgRef.current.innerHTML = ""
        }
    }, [data.barcodeValue])

    return (
        <article className={className} data-packaging-label>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                CloseExp · Tem đơn đóng gói
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">{data.orderCode}</p>

            <div className="mt-3 flex justify-center rounded-lg bg-white py-2">
                <svg ref={svgRef} id={svgId} role="img" aria-label={`Mã vạch ${data.orderCode}`} />
            </div>

            <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div>
                    <dt>Khách: </dt>
                    <dd>{data.customerName}</dd>
                </div>
                <div>
                    <dt>Khung giờ: </dt>
                    <dd>{data.timeSlotDisplay}</dd>
                </div>
                <div>
                    <dt>Giao nhận: </dt>
                    <dd>{data.deliveryTypeLabel}</dd>
                </div>
                <div>
                    <dt>Số món: </dt>
                    <dd>{data.itemCount}</dd>
                </div>
                <div>
                    <dt>Đóng gói: </dt>
                    <dd>{data.packagedAtLabel}</dd>
                </div>
            </dl>
        </article>
    )
}

export default PackagingOrderLabel
