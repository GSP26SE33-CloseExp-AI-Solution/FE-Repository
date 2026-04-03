import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Loader2,
    Package2,
    Plus,
    Rocket,
    Search,
    Sparkles,
    Tag,
} from "lucide-react"
import toast from "react-hot-toast"

import axiosClient from "@/utils/axiosClient"
import { authStorage } from "@/utils/authStorage"
import type { ApiResponse } from "@/types/api.types"

type LotStatusFilter = "ALL" | "DRAFT" | "PRICED" | "PUBLISHED"
type ExpiryFilter =
    | "Tất cả"
    | "Còn dài hạn"
    | "Còn ngắn hạn"
    | "Sắp hết hạn"
    | "Trong ngày"
    | "Hết hạn"

type ProductLotItem = {
    lotId: string
    productId: string
    expiryDate: string
    manufactureDate?: string
    quantity?: number
    weight?: number
    status?: string
    unitId?: string
    unitName?: string
    unitType?: string
    originalUnitPrice?: number
    suggestedUnitPrice?: number
    finalUnitPrice?: number
    productName?: string
    brand?: string
    category?: string
    barcode?: string
    isFreshFood?: boolean
    supermarketId?: string
    supermarketName?: string
    mainImageUrl?: string
    totalImages?: number
    productImages?: Array<{
        productImageId?: string
        productId?: string
        imageUrl: string
        createdAt?: string
    }>
    expiryStatus?: number
    daysRemaining?: number
    hoursRemaining?: number
    expiryStatusText?: string
    ingredients?: string[]
    nutritionFacts?: Record<string, string>
    createdAt?: string
    publishedBy?: string
    publishedAt?: string
    sellingUnitPrice?: number
}

type PagedLotsResult = {
    items: ProductLotItem[]
    totalResult: number
    page: number
    pageSize: number
}

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

const unwrap = <T,>(response: ApiResponse<T>): T => {
    if (!response.success) {
        const message =
            response.errors?.filter(Boolean).join(", ") || response.message || "Request failed"
        throw new Error(message)
    }
    return response.data
}

const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleDateString("vi-VN")
}

const formatPrice = (price?: number | null) => {
    if (typeof price !== "number" || Number.isNaN(price)) return "—"
    return price.toLocaleString("vi-VN") + " đ"
}

const calcDiscount = (original?: number, sale?: number) => {
    if (!original || original <= 0 || !sale || sale <= 0) return 0
    return Math.max(0, Math.round(((original - sale) / original) * 100))
}

const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) {
        return {
            label: "Không rõ",
            color: "bg-slate-100 text-slate-600",
        }
    }

    const today = new Date()
    const exp = new Date(expiryDate)

    today.setHours(0, 0, 0, 0)
    exp.setHours(0, 0, 0, 0)

    const diffTime = exp.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays >= 8) {
        return { label: "Còn dài hạn", color: "bg-green-100 text-green-700" }
    }
    if (diffDays >= 3 && diffDays <= 7) {
        return { label: "Còn ngắn hạn", color: "bg-blue-100 text-blue-700" }
    }
    if (diffDays >= 1 && diffDays <= 2) {
        return { label: "Sắp hết hạn", color: "bg-yellow-100 text-yellow-700" }
    }
    if (diffDays === 0) {
        return { label: "Trong ngày", color: "bg-orange-100 text-orange-700" }
    }

    return { label: "Hết hạn", color: "bg-red-100 text-red-700" }
}

const getDaysLeft = (expiryDate?: string) => {
    if (!expiryDate) return null

    const today = new Date()
    const expiry = new Date(expiryDate)

    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)

    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const normalizeLotStatus = (status?: string | null): LotStatusFilter => {
    const normalized = (status || "").trim().toLowerCase()

    if (normalized === "draft") return "DRAFT"
    if (normalized === "priced" || normalized === "priceconfirmed") return "PRICED"
    if (normalized === "published") return "PUBLISHED"

    return "ALL"
}

const getLotStatusMeta = (status?: string | null) => {
    const normalized = normalizeLotStatus(status)

    if (normalized === "DRAFT") {
        return {
            label: "Nháp",
            color: "bg-slate-100 text-slate-700 border-slate-200",
        }
    }

    if (normalized === "PRICED") {
        return {
            label: "Đã chốt giá",
            color: "bg-violet-100 text-violet-700 border-violet-200",
        }
    }

    if (normalized === "PUBLISHED") {
        return {
            label: "Đang bán",
            color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        }
    }

    return {
        label: status || "Không rõ",
        color: "bg-slate-100 text-slate-700 border-slate-200",
    }
}

const fetchMySupermarketLots = async (params: {
    pageNumber: number
    pageSize: number
    searchTerm?: string
    expiryStatus?: number
    category?: string
}) => {
    const response = await axiosClient.get<ApiResponse<PagedLotsResult>>(
        "/Products/my-supermarket/lots",
        { params },
    )

    return unwrap(response.data)
}

const ProductsLotsPage: React.FC = () => {
    const navigate = useNavigate()

    const session = authStorage.get()
    const supermarketId = session?.user?.marketStaffInfo?.supermarket?.supermarketId ?? ""
    const userId = session?.user?.userId ?? ""

    const [lots, setLots] = useState<ProductLotItem[]>([])
    const [loading, setLoading] = useState(false)

    const [keyword, setKeyword] = useState("")
    const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("Tất cả")
    const [statusFilter, setStatusFilter] = useState<LotStatusFilter>("ALL")

    const [page, setPage] = useState(1)
    const pageSize = 10
    const [totalPages, setTotalPages] = useState(1)

    const handleAddProduct = () => {
        navigate("/supermarketStaff/products/add")
    }

    const mapExpiryFilterToApi = (value: ExpiryFilter): number | undefined => {
        switch (value) {
            case "Còn dài hạn":
                return 1
            case "Còn ngắn hạn":
                return 2
            case "Sắp hết hạn":
                return 3
            case "Trong ngày":
                return 4
            case "Hết hạn":
                return 5
            default:
                return undefined
        }
    }

    const loadLots = async () => {
        if (!supermarketId || !userId) {
            setLots([])
            setTotalPages(1)
            return
        }

        setLoading(true)

        try {
            const data = await fetchMySupermarketLots({
                pageNumber: page,
                pageSize,
                searchTerm: keyword.trim() || undefined,
                expiryStatus: mapExpiryFilterToApi(expiryFilter),
            })

            const rawItems = Array.isArray(data.items) ? data.items : []

            const filteredByStatus =
                statusFilter === "ALL"
                    ? rawItems
                    : rawItems.filter((item) => normalizeLotStatus(item.status) === statusFilter)

            setLots(filteredByStatus)

            const baseTotal =
                typeof data.totalResult === "number" && data.totalResult > 0
                    ? data.totalResult
                    : rawItems.length

            setTotalPages(Math.max(1, Math.ceil(baseTotal / pageSize)))
        } catch (error) {
            console.error("ProductsLotsPage.loadLots -> error:", error)
            toast.error("Không tải được danh sách lô hàng")
            setLots([])
            setTotalPages(1)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadLots()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, keyword, expiryFilter, statusFilter, supermarketId, userId])

    useEffect(() => {
        setPage(1)
    }, [keyword, expiryFilter, statusFilter])

    const summary = useMemo(() => {
        const draftCount = lots.filter((item) => normalizeLotStatus(item.status) === "DRAFT").length
        const pricedCount = lots.filter((item) => normalizeLotStatus(item.status) === "PRICED").length
        const publishedCount = lots.filter((item) => normalizeLotStatus(item.status) === "PUBLISHED").length

        return {
            draftCount,
            pricedCount,
            publishedCount,
            total: lots.length,
        }
    }, [lots])

    const handleOpenDraft = (lot: ProductLotItem) => {
        navigate(`/supermarketStaff/products/${lot.productId}/confirm`)
    }

    const handleOpenPublish = (lot: ProductLotItem) => {
        navigate(`/supermarketStaff/products/${lot.productId}/publish`)
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-[1440px] px-6 pb-12 pt-28">
                <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/60 p-6 shadow-[0_16px_50px_rgba(16,185,129,0.08)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                Product Lots
                            </div>

                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Quản lý lô hàng trên hệ thống
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Theo dõi các lô hàng của siêu thị theo đúng trạng thái lot:
                                nháp, đã chốt giá và đang bán.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddProduct}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <Plus className="h-4.5 w-4.5" />
                            Thêm sản phẩm
                        </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard title="Tổng lot đang xem" value={summary.total} />
                        <SummaryCard title="Lot nháp" value={summary.draftCount} tone="slate" />
                        <SummaryCard title="Lot đã chốt giá" value={summary.pricedCount} tone="violet" />
                        <SummaryCard title="Lot đang bán" value={summary.publishedCount} tone="emerald" />
                    </div>
                </div>

                <div className="mb-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-1 items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:ring-4 focus-within:ring-emerald-100">
                            <div className="flex items-center gap-2 border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                                <Search className="h-4 w-4 text-emerald-600" />
                                Tìm kiếm
                            </div>
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Nhập tên sản phẩm hoặc barcode..."
                                className="h-full w-full px-4 py-3 text-sm text-slate-700 outline-none"
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:flex">
                            <SelectBox
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value as LotStatusFilter)}
                                options={[
                                    { label: "Tất cả trạng thái", value: "ALL" },
                                    { label: "Nháp", value: "DRAFT" },
                                    { label: "Đã chốt giá", value: "PRICED" },
                                    { label: "Đang bán", value: "PUBLISHED" },
                                ]}
                            />

                            <SelectBox
                                value={expiryFilter}
                                onChange={(value) => setExpiryFilter(value as ExpiryFilter)}
                                options={[
                                    { label: "Tất cả hạn dùng", value: "Tất cả" },
                                    { label: "Còn dài hạn", value: "Còn dài hạn" },
                                    { label: "Còn ngắn hạn", value: "Còn ngắn hạn" },
                                    { label: "Sắp hết hạn", value: "Sắp hết hạn" },
                                    { label: "Trong ngày", value: "Trong ngày" },
                                    { label: "Hết hạn", value: "Hết hạn" },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                        <LegendChip label="Còn dài hạn" value="≥ 8 ngày" color="bg-green-100 text-green-700" />
                        <LegendChip label="Còn ngắn hạn" value="3 – 7 ngày" color="bg-blue-100 text-blue-700" />
                        <LegendChip label="Sắp hết hạn" value="1 – 2 ngày" color="bg-yellow-100 text-yellow-700" />
                        <LegendChip label="Trong ngày" value="Hôm nay" color="bg-orange-100 text-orange-700" />
                        <LegendChip label="Hết hạn" value="Đã quá hạn" color="bg-red-100 text-red-700" />
                    </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-[90px_2.2fr_110px_150px_140px_120px_150px_160px_170px] items-center border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700">
                        <div>Hình ảnh</div>
                        <div>Thông tin sản phẩm</div>
                        <div className="text-center">Số lượng</div>
                        <div className="text-center">Hạn dùng</div>
                        <div className="text-center">Giá gốc</div>
                        <div className="text-center">Giảm giá</div>
                        <div className="text-center">Giá bán</div>
                        <div className="text-center">Trạng thái lot</div>
                        <div className="text-center">Thao tác</div>
                    </div>

                    {loading ? (
                        <div className="flex h-[300px] items-center justify-center text-slate-500">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Đang tải danh sách lô hàng...
                        </div>
                    ) : lots.length === 0 ? (
                        <div className="flex h-[300px] flex-col items-center justify-center px-6 text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                <Package2 className="h-7 w-7 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">
                                Chưa có lô hàng phù hợp
                            </h3>
                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Bạn thử đổi bộ lọc trạng thái hoặc thêm sản phẩm mới để tạo lô hàng.
                            </p>
                        </div>
                    ) : (
                        lots.map((lot) => {
                            const expiryMeta = getExpiryStatus(lot.expiryDate)
                            const statusMeta = getLotStatusMeta(lot.status)
                            const daysLeft = getDaysLeft(lot.expiryDate)
                            const originalPrice = lot.originalUnitPrice ?? 0
                            const salePrice =
                                lot.finalUnitPrice ??
                                lot.sellingUnitPrice ??
                                lot.suggestedUnitPrice ??
                                0
                            const discount = calcDiscount(originalPrice, salePrice)
                            const normalizedStatus = normalizeLotStatus(lot.status)

                            return (
                                <div
                                    key={lot.lotId}
                                    className="grid grid-cols-[90px_2.2fr_110px_150px_140px_120px_150px_160px_170px] items-center border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-slate-50"
                                >
                                    <div>
                                        <img
                                            src={
                                                lot.mainImageUrl ||
                                                lot.productImages?.[0]?.imageUrl ||
                                                "/placeholder.png"
                                            }
                                            alt={lot.productName || "product"}
                                            className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
                                        />
                                    </div>

                                    <div className="pr-4">
                                        <div className="font-semibold text-slate-900">
                                            {lot.productName || "Sản phẩm chưa có tên"}
                                        </div>
                                        <div className="mt-1 text-sm text-slate-500">
                                            {lot.brand || "—"} • {lot.category || "—"}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-400">
                                            Lô: {lot.lotId} • {lot.unitName || "—"}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-400">
                                            Barcode: {lot.barcode || "—"}
                                        </div>
                                    </div>

                                    <div className="text-center font-medium text-slate-800">
                                        {typeof lot.quantity === "number" ? lot.quantity : "—"}
                                    </div>

                                    <div className="text-center">
                                        <div className="font-medium text-slate-800">
                                            {formatDate(lot.expiryDate)}
                                        </div>
                                        <div className="mt-1">
                                            <span
                                                className={cn(
                                                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                                                    expiryMeta.color,
                                                )}
                                            >
                                                {daysLeft === null
                                                    ? expiryMeta.label
                                                    : daysLeft >= 0
                                                        ? `Còn ${daysLeft} ngày`
                                                        : `Quá hạn ${Math.abs(daysLeft)} ngày`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-center text-slate-400 line-through">
                                        {formatPrice(originalPrice)}
                                    </div>

                                    <div className="text-center font-semibold text-rose-600">
                                        {discount > 0 ? `-${discount}%` : "—"}
                                    </div>

                                    <div className="text-center font-semibold text-emerald-700">
                                        {formatPrice(salePrice)}
                                    </div>

                                    <div className="text-center">
                                        <span
                                            className={cn(
                                                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                                                statusMeta.color,
                                            )}
                                        >
                                            {statusMeta.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(`/supermarketStaff/products/${lot.productId}`)
                                            }
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>

                                        {normalizedStatus === "DRAFT" ? (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDraft(lot)}
                                                className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700"
                                                title="Xác nhận thông tin và đi tiếp"
                                            >
                                                <Tag className="h-3.5 w-3.5" />
                                                Xác nhận
                                            </button>
                                        ) : null}

                                        {normalizedStatus === "PRICED" ? (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenPublish(lot)}
                                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                                title="Đi đến bước đăng bán"
                                            >
                                                <Rocket className="h-3.5 w-3.5" />
                                                Publish
                                            </button>
                                        ) : null}

                                        {normalizedStatus === "PUBLISHED" ? (
                                            <span className="inline-flex items-center rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                                Đang bán
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="mt-4 flex items-center justify-center rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-8">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4.5 w-4.5" />
                        </button>

                        <span className="text-sm font-semibold text-slate-700">
                            Trang {page} / {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page === totalPages}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight className="h-4.5 w-4.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const SelectBox = ({
    value,
    onChange,
    options,
}: {
    value: string
    onChange: (value: string) => void
    options: Array<{ label: string; value: string }>
}) => {
    return (
        <div className="relative min-w-[220px]">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-[48px] w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-11 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
    )
}

const SummaryCard = ({
    title,
    value,
    tone = "default",
}: {
    title: string
    value: number
    tone?: "default" | "slate" | "violet" | "emerald"
}) => {
    const toneClass =
        tone === "slate"
            ? "border-slate-200 bg-slate-50 text-slate-700"
            : tone === "violet"
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : tone === "emerald"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700"

    return (
        <div className={cn("rounded-2xl border px-4 py-4", toneClass)}>
            <div className="text-sm font-medium">{title}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
    )
}

const LegendChip = ({
    label,
    value,
    color,
}: {
    label: string
    value: string
    color: string
}) => {
    return (
        <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", color)}>
                {label}
            </span>
            <span className="text-xs text-slate-500">{value}</span>
        </div>
    )
}

export default ProductsLotsPage
