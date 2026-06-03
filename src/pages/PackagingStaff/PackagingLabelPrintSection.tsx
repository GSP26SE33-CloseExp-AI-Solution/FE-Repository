import { useMemo, useRef, useState } from "react"
import { Printer, X } from "lucide-react"

import type { PackagingOrderDetail } from "@/types/packaging.type"
import { showError } from "@/utils/toast"
import {
    buildPackagingLabelData,
    openPackagingLabelPrintWindow,
} from "@/utils/packagingLabelPrint"

import PackagingOrderLabel from "./PackagingOrderLabel"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type PackagingLabelPrintSectionProps = {
    order: PackagingOrderDetail
    variant?: "card" | "embedded"
    onDismiss?: () => void
    className?: string
}

const PackagingLabelPrintSection = ({
    order,
    variant = "card",
    onDismiss,
    className,
}: PackagingLabelPrintSectionProps) => {
    const labelData = useMemo(() => buildPackagingLabelData(order), [order])
    const printRootRef = useRef<HTMLDivElement>(null)
    const [bagCount, setBagCount] = useState(1)
    const [printing, setPrinting] = useState(false)

    const handlePrint = () => {
        setPrinting(true)

        const copies = Math.min(10, Math.max(1, bagCount))
        const opened = openPackagingLabelPrintWindow(labelData, copies)

        if (!opened) {
            showError(
                "Trình duyệt chặn cửa sổ in. Hãy cho phép popup cho trang này rồi thử lại.",
            )
        }

        window.setTimeout(() => setPrinting(false), 800)
    }

    const body = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        In tem đơn (mã vạch)
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        Dán tem lên túi/kiện hàng. Delivery quét mã{" "}
                        <span className="font-semibold text-slate-700">
                            {labelData.orderCode}
                        </span>{" "}
                        khi bàn giao.
                    </p>
                </div>

                {onDismiss ? (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Đóng gợi ý in tem"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            <div
                ref={printRootRef}
                className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4"
            >
                <PackagingOrderLabel data={labelData} />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 space-y-1">
                    <span className="text-xs font-semibold text-slate-600">
                        Số túi / tem cần in
                    </span>
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={bagCount}
                        onChange={(event) =>
                            setBagCount(
                                Math.min(
                                    10,
                                    Math.max(1, Number(event.target.value) || 1),
                                ),
                            )
                        }
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-400"
                    />
                </label>

                <button
                    type="button"
                    onClick={handlePrint}
                    disabled={printing}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:min-w-[160px]"
                >
                    <Printer className="h-4 w-4" />
                    {printing ? "Đang mở in..." : "In tem đơn"}
                </button>
            </div>
        </>
    )

    if (variant === "embedded") {
        return <div className={className}>{body}</div>
    }

    return (
        <div
            className={cn(
                "rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm",
                className,
            )}
        >
            {body}
        </div>
    )
}

export default PackagingLabelPrintSection
