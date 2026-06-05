import React, { useState } from "react"
import { Info, X } from "lucide-react"

const DEFAULT_STORAGE_KEY = "sale-unit-customer-guide-dismissed"

type Props = {
    storageKey?: string
}

export const SaleUnitCustomerGuide: React.FC<Props> = ({
    storageKey = DEFAULT_STORAGE_KEY,
}) => {
    const [visible, setVisible] = useState(() => {
        try {
            return sessionStorage.getItem(storageKey) !== "1"
        } catch {
            return true
        }
    })

    const dismiss = () => {
        setVisible(false)
        try {
            sessionStorage.setItem(storageKey, "1")
        } catch {
            // ignore storage errors
        }
    }

    if (!visible) return null

    return (
        <div
            role="note"
            className="relative rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-amber-50/95 to-orange-50 px-4 py-3.5 pr-11 shadow-sm ring-1 ring-amber-200/70"
        >
            <button
                type="button"
                onClick={dismiss}
                aria-label="Ẩn chú thích đơn vị bán"
                className="absolute top-2.5 right-2.5 rounded-lg p-1 text-amber-700/70 transition hover:bg-amber-100 hover:text-amber-900"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-950">
                        Đơn vị bán lô hàng và lựa chọn của khách hàng
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-5 text-amber-950/90">
                        <li>
                            Khi bạn chọn <span className="font-medium">đơn vị bán</span> cho
                            lô hàng, đơn vị đó sẽ xuất hiện trong danh sách đơn vị khách có thể
                            chọn khi mua sản phẩm (cùng loại với đơn vị chuẩn của sản phẩm).
                        </li>
                        <li>
                            Nếu sản phẩm chỉ có <span className="font-medium">một lô đang bán</span>{" "}
                            → khách chỉ thấy <span className="font-medium">một đơn vị</span> tương
                            ứng với lô đó.
                        </li>
                        <li>
                            Nếu có <span className="font-medium">hai lô (hoặc hơn) đang bán</span>{" "}
                            với <span className="font-medium">đơn vị khác nhau</span> → khách có thể{" "}
                            <span className="font-medium">chọn mua theo đơn vị</span> của từng lô
                            (ví dụ: lô A bán theo lốc, lô B bán theo chai → khách chọn lốc hoặc
                            chai).
                        </li>
                        <li>
                            Muốn mở thêm đơn vị cho khách: tạo và đăng bán thêm lô với đơn vị
                            mong muốn.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
