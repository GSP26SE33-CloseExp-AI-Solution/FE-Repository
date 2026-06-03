import { useEffect } from "react"
import { PackageCheck, X } from "lucide-react"

import type { PackagingOrderDetail } from "@/types/packaging.type"

import PackagingLabelPrintSection from "./PackagingLabelPrintSection"

type PackagingLabelPrintModalProps = {
    open: boolean
    order: PackagingOrderDetail | null
    onClose: () => void
}

const PackagingLabelPrintModal = ({
    open,
    order,
    onClose,
}: PackagingLabelPrintModalProps) => {
    useEffect(() => {
        if (!open) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [open, onClose])

    if (!open || !order) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="packaging-print-modal-title"
            >
                <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-white px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <PackageCheck className="h-3.5 w-3.5" />
                                Đóng gói xong
                            </div>
                            <h2
                                id="packaging-print-modal-title"
                                className="mt-3 text-xl font-bold text-slate-900"
                            >
                                In tem đơn {order.orderCode}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Đơn đã hoàn tất. In tem trước khi chuyển sang đơn tiếp theo.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100"
                            aria-label="Đóng"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
                    <PackagingLabelPrintSection
                        order={order}
                        variant="embedded"
                    />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                        In sau
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PackagingLabelPrintModal
