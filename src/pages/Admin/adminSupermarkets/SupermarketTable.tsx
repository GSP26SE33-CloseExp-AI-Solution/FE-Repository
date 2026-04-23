import { Building2, ChevronLeft, ChevronRight } from "lucide-react"

import type { AdminSupermarketItem } from "@/types/admin.type"

import {
    cn,
    formatCompactNumber,
    formatDate,
    getStatusClass,
    getStatusLabel,
} from "./adminSupermarkets.utils"

type SupermarketTableProps = {
    loading: boolean
    supermarkets: AdminSupermarketItem[]
    currentPageCount: number
    page: number
    totalPages: number
    onPrevPage: () => void
    onNextPage: () => void
    onOpenDetail: (item: AdminSupermarketItem) => void
}

const SupermarketTable = ({
    loading,
    supermarkets,
    currentPageCount,
    page,
    totalPages,
    onPrevPage,
    onNextPage,
    onOpenDetail,
}: SupermarketTableProps) => {
    return (
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <th className="px-5 py-4">Siêu thị</th>
                            <th className="px-5 py-4">Liên hệ</th>
                            <th className="px-5 py-4">Trạng thái</th>
                            <th className="px-5 py-4">Ngày tạo</th>
                            <th className="px-5 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                                    Đang tải danh sách siêu thị...
                                </td>
                            </tr>
                        ) : supermarkets.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                                    Chưa có siêu thị phù hợp với bộ lọc đang chọn.
                                </td>
                            </tr>
                        ) : (
                            supermarkets.map((item, index) => {
                                const code = item.supermarketId || "--"

                                return (
                                    <tr
                                        key={`${code}-${index}`}
                                        className="border-b border-slate-100 align-middle transition hover:bg-slate-50/50"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                                                    <Building2 className="h-5 w-5 text-slate-600" />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {item.name || "--"}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500">
                                                        {code}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-900">
                                                    {item.contactPhone || "--"}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {item.contactEmail || "--"}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={cn(
                                                    "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                                                    getStatusClass(item.status)
                                                )}
                                            >
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm text-slate-700">
                                                {formatDate(item.createdAt)}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenDetail(item)}
                                                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                    Hiển thị {formatCompactNumber(supermarkets.length)} /{" "}
                    {formatCompactNumber(currentPageCount)} siêu thị của trang hiện tại
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrevPage}
                        disabled={page === 1}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Trang trước
                    </button>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                        {page}/{totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={onNextPage}
                        disabled={page >= totalPages}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Trang sau
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default SupermarketTable
