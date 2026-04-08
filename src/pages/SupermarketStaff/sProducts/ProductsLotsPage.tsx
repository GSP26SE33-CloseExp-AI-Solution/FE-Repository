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
    Search,
    Sparkles,
} from "lucide-react"
import toast from "react-hot-toast"

import axiosClient from "@/utils/axiosClient"
import { authStorage } from "@/utils/authStorage"
import type { ApiResponse } from "@/types/api.types"

type LotStatusFilter = "ALL" | "DRAFT" | "PRICED" | "PUBLISHED"
type ExpiryFilter =
    | "Tất cả hạn dùng"
    | "Còn trên 7 ngày"
    | "Còn 3 - 7 ngày"
    | "Còn 1 - 2 ngày"
    | "Hết hạn hôm nay"
    | "Đã hết hạn"

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
            response.errors?.filter(Boolean).join(", ") ||
            response.message ||
            "Request failed"
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
        { params }
    )

    return unwrap(response.data)
}

const ProductsLotsPage: React.FC = () => {
    const navigate = useNavigate()

    const session = authStorage.get()
    const supermarketId =
        session?.user?.marketStaffInfo?.supermarket?.supermarketId ?? ""
    const supermarketName =
        session?.user?.marketStaffInfo?.supermarket?.name ?? "Siêu thị của bạn"
    const userId = session?.user?.userId ?? ""

    const [lots, setLots] = useState<ProductLotItem[]>([])
    const [loading, setLoading] = useState(false)

    const [keyword, setKeyword] = useState("")
    const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("Tất cả hạn dùng")
    const [statusFilter, setStatusFilter] = useState<LotStatusFilter>("ALL")

    const [page, setPage] = useState(1)
    const pageSize = 10
    const [totalPages, setTotalPages] = useState(1)
    const [serverTotal, setServerTotal] = useState(0)

    const [selectedLot, setSelectedLot] = useState<ProductLotItem | null>(null)
    const [openDetail, setOpenDetail] = useState(false)

    const handleAddProduct = () => {
        navigate("/supermarketStaff/products/add")
    }

    const mapExpiryFilterToApi = (value: ExpiryFilter): number | undefined => {
        switch (value) {
            case "Còn trên 7 ngày":
                return 1
            case "Còn 3 - 7 ngày":
                return 2
            case "Còn 1 - 2 ngày":
                return 3
            case "Hết hạn hôm nay":
                return 4
            case "Đã hết hạn":
                return 5
            default:
                return undefined
        }
    }

    const loadLots = async () => {
        if (!supermarketId || !userId) {
            setLots([])
            setServerTotal(0)
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
                    : rawItems.filter(
                        (item) => normalizeLotStatus(item.status) === statusFilter
                    )

            setLots(filteredByStatus)
            setServerTotal(
                typeof data.totalResult === "number" && data.totalResult >= 0
                    ? data.totalResult
                    : rawItems.length
            )
            setTotalPages(
                Math.max(
                    1,
                    Math.ceil(
                        (typeof data.totalResult === "number" && data.totalResult > 0
                            ? data.totalResult
                            : rawItems.length) / pageSize
                    )
                )
            )
        } catch (error) {
            console.error("ProductsLotsPage.loadLots -> error:", error)
            toast.error("Không tải được danh sách lô hàng")
            setLots([])
            setServerTotal(0)
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
        const draftCount = lots.filter(
            (item) => normalizeLotStatus(item.status) === "DRAFT"
        ).length
        const pricedCount = lots.filter(
            (item) => normalizeLotStatus(item.status) === "PRICED"
        ).length
        const publishedCount = lots.filter(
            (item) => normalizeLotStatus(item.status) === "PUBLISHED"
        ).length

        return {
            draftCount,
            pricedCount,
            publishedCount,
            currentPageCount: lots.length,
        }
    }, [lots])

    const handleOpenDetail = (lot: ProductLotItem) => {
        setSelectedLot(lot)
        setOpenDetail(true)
    }

    const handleCloseDetail = () => {
        setOpenDetail(false)
        setSelectedLot(null)
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-[1380px] px-4 pb-10 pt-4 md:px-5 md:pt-6">
                <div className="mb-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                <Sparkles className="h-3.5 w-3.5" />
                                Product Lots
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
                                Quản lý lô hàng của {supermarketName}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Theo dõi danh sách lot sản phẩm, tìm kiếm nhanh theo tên hoặc barcode
                                và lọc theo trạng thái, hạn dùng.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddProduct}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm sản phẩm
                        </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard title="Tổng lot" value={serverTotal} />
                        <SummaryCard title="Đang hiển thị" value={summary.currentPageCount} />
                        <SummaryCard title="Đã chốt giá" value={summary.pricedCount} />
                        <SummaryCard title="Đang bán" value={summary.publishedCount} />
                    </div>
                </div>

                <div className="mb-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
                        <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50">
                            <div className="flex items-center gap-2 border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600">
                                <Search className="h-4 w-4 text-emerald-600" />
                                Tìm kiếm
                            </div>

                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Nhập tên sản phẩm hoặc barcode..."
                                className="h-full w-full px-3.5 py-3 text-sm text-slate-700 outline-none"
                            />
                        </div>

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
                                { label: "Tất cả hạn dùng", value: "Tất cả hạn dùng" },
                                { label: "Còn trên 7 ngày", value: "Còn trên 7 ngày" },
                                { label: "Còn 3 - 7 ngày", value: "Còn 3 - 7 ngày" },
                                { label: "Còn 1 - 2 ngày", value: "Còn 1 - 2 ngày" },
                                { label: "Hết hạn hôm nay", value: "Hết hạn hôm nay" },
                                { label: "Đã hết hạn", value: "Đã hết hạn" },
                            ]}
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Danh sách lot sản phẩm</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {loading ? "Đang tải dữ liệu..." : `${lots.length} lot trên trang này`}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                            <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                            Đang tải danh sách lô hàng...
                        </div>
                    ) : lots.length === 0 ? (
                        <div className="flex h-[300px] flex-col items-center justify-center px-6 text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                <Package2 className="h-7 w-7 text-slate-400" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">
                                Chưa có lô hàng phù hợp
                            </h3>
                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Bạn thử đổi từ khóa tìm kiếm hoặc thay bộ lọc để xem thêm lot.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="min-w-[1200px]">
                                <div className="grid grid-cols-[72px_120px_72px_72px_64px_76px_58px_42px_42px_124px_86px_110px_84px_48px] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-600">
                                    <div>Ảnh</div>
                                    <div>Tên sản phẩm</div>
                                    <div>Thương hiệu</div>
                                    <div>Danh mục</div>
                                    <div>Tươi sống</div>
                                    <div>Trạng thái</div>
                                    <div>ĐV/loại</div>
                                    <div className="text-center">SL</div>
                                    <div className="text-center">Kg</div>
                                    <div className="text-center">SX / HD</div>
                                    <div className="text-center">Còn lại</div>
                                    <div className="text-center">Giá bán / gốc</div>
                                    <div className="text-center">Giá AI mới</div>
                                    <div className="text-center">Xem</div>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {lots.map((lot) => {
                                        const statusMeta = getLotStatusMeta(lot.status)
                                        const originalPrice = lot.originalUnitPrice ?? null
                                        const aiSuggestedPrice = lot.suggestedUnitPrice ?? null
                                        const sellingPrice = lot.finalUnitPrice ?? lot.sellingUnitPrice ?? null
                                        const discount = calcDiscount(
                                            originalPrice ?? undefined,
                                            sellingPrice ?? aiSuggestedPrice ?? undefined
                                        )
                                        const normalizedStatus = normalizeLotStatus(lot.status)

                                        const remainingText =
                                            typeof lot.daysRemaining === "number" || typeof lot.hoursRemaining === "number"
                                                ? `${typeof lot.daysRemaining === "number" ? `${lot.daysRemaining} ngày` : "—"}${typeof lot.hoursRemaining === "number" ? ` • ${lot.hoursRemaining} giờ` : ""}`
                                                : "—"

                                        return (
                                            <div
                                                key={lot.lotId}
                                                className="grid grid-cols-[72px_120px_72px_72px_64px_76px_58px_42px_42px_124px_86px_110px_84px_48px] items-center gap-2 px-4 py-2.5 text-[11px] text-slate-700 transition hover:bg-emerald-50/30"
                                            >
                                                <div>
                                                    <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                                        <img
                                                            src={
                                                                lot.mainImageUrl ||
                                                                lot.productImages?.[0]?.imageUrl ||
                                                                "/placeholder.png"
                                                            }
                                                            alt={lot.productName || "product"}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="truncate text-[11px] font-semibold text-slate-900">
                                                        {lot.productName || "—"}
                                                    </div>
                                                    <div className="mt-0.5 truncate text-[9px] text-slate-400">
                                                        {lot.barcode || lot.lotId || "—"}
                                                    </div>
                                                </div>

                                                <div className="truncate text-[10px] text-slate-600">
                                                    {lot.brand || "—"}
                                                </div>

                                                <div className="truncate text-[10px] text-slate-600">
                                                    {lot.category || "—"}
                                                </div>

                                                <div>
                                                    <span
                                                        className={cn(
                                                            "inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[9px] font-medium",
                                                            lot.isFreshFood
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-slate-100 text-slate-600"
                                                        )}
                                                    >
                                                        {lot.isFreshFood ? "Có" : "Không"}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span
                                                        className={cn(
                                                            "inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                                                            statusMeta.color
                                                        )}
                                                    >
                                                        {normalizedStatus === "PUBLISHED" ? "Đang bán" : statusMeta.label}
                                                    </span>
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="truncate text-[10px] font-medium text-slate-700">
                                                        {lot.unitName || "—"}
                                                    </div>
                                                    <div className="mt-0.5 truncate text-[9px] text-slate-400">
                                                        {lot.unitType || "—"}
                                                    </div>
                                                </div>

                                                <div className="text-center text-[10px] font-medium text-slate-800">
                                                    {typeof lot.quantity === "number" ? lot.quantity : "—"}
                                                </div>

                                                <div className="text-center text-[10px] font-medium text-slate-800">
                                                    {typeof lot.weight === "number" ? lot.weight : "—"}
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-[10px] font-medium text-slate-800">
                                                        SX: {formatDate(lot.manufactureDate)}
                                                    </div>
                                                    <div className="mt-0.5 text-[10px] text-slate-600">
                                                        HD: {formatDate(lot.expiryDate)}
                                                    </div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="truncate text-[10px] font-medium text-amber-700">
                                                        {remainingText}
                                                    </div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-[11px] font-semibold text-emerald-700">
                                                        {formatPrice(sellingPrice)}
                                                    </div>
                                                    <div className="mt-0.5 truncate text-[9px] text-slate-400 line-through">
                                                        {formatPrice(originalPrice)}
                                                    </div>
                                                    <div className="mt-0.5 text-[9px] font-semibold text-rose-600">
                                                        {discount > 0 ? `-${discount}%` : "—"}
                                                    </div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="truncate text-[10px] font-semibold text-sky-700">
                                                        {formatPrice(aiSuggestedPrice)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDetail(lot)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {openDetail && selectedLot ? (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
                            onClick={handleCloseDetail}
                        >
                            <div
                                className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {selectedLot.productName || "Chi tiết lot sản phẩm"}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Bấm ra ngoài để đóng popup.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCloseDetail}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                    >
                                        Đóng
                                    </button>
                                </div>

                                <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
                                    <div>
                                        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                                            <img
                                                src={
                                                    selectedLot.mainImageUrl ||
                                                    selectedLot.productImages?.[0]?.imageUrl ||
                                                    "/placeholder.png"
                                                }
                                                alt={selectedLot.productName || "product"}
                                                className="h-[280px] w-full object-cover"
                                            />
                                        </div>

                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="text-sm font-semibold text-slate-900">Ảnh sản phẩm</div>
                                            <div className="mt-2 text-sm text-slate-600">
                                                Tổng ảnh: {selectedLot.totalImages ?? selectedLot.productImages?.length ?? 0}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <DetailBlock
                                            title="Thông tin định danh"
                                            rows={[
                                                ["Mã lô hàng", selectedLot.lotId],
                                                ["Mã sản phẩm", selectedLot.productId],
                                                ["Barcode", selectedLot.barcode],
                                                ["Mã siêu thị", selectedLot.supermarketId],
                                                ["Tên siêu thị", selectedLot.supermarketName],
                                                ["Mã đơn vị sản phẩm", selectedLot.unitId],
                                            ]}
                                        />

                                        <DetailBlock
                                            title="Thông tin bổ sung"
                                            rows={[
                                                ["Tên sản phẩm", selectedLot.productName],
                                                ["Thương hiệu", selectedLot.brand],
                                                ["Danh mục", selectedLot.category],
                                                ["Đồ tươi sống", typeof selectedLot.isFreshFood === "boolean" ? String(selectedLot.isFreshFood) : "—"],
                                                ["Trạng thái", selectedLot.status],
                                                ["Chú thích hạn dùng", selectedLot.expiryStatusText],
                                                ["Ngày tạo", formatDate(selectedLot.createdAt)],
                                                ["Được đăng bán bởi", selectedLot.publishedBy],
                                                ["Được đăng bán vào ngày", formatDate(selectedLot.publishedAt)],
                                            ]}
                                        />

                                        <DetailBlock
                                            title="Thành phần / dinh dưỡng"
                                            rows={[
                                                ["Ingredients", selectedLot.ingredients?.length ? selectedLot.ingredients.join(", ") : "—"],
                                                [
                                                    "Nutrition facts",
                                                    selectedLot.nutritionFacts && Object.keys(selectedLot.nutritionFacts).length > 0
                                                        ? Object.entries(selectedLot.nutritionFacts)
                                                            .map(([key, value]) => `${key}: ${value}`)
                                                            .join(" | ")
                                                        : "—",
                                                ],
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="mt-4 flex items-center justify-center rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5">
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <span className="text-sm font-semibold text-slate-700">
                            Trang {page} / {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page === totalPages}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight className="h-4 w-4" />
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
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-[44px] w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
    )
}

const SummaryCard = ({
    title,
    value,
}: {
    title: string
    value: number
}) => {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-sm font-medium text-slate-500">{title}</div>
            <div className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                {value}
            </div>
        </div>
    )
}

const DetailBlock = ({
    title,
    rows,
}: {
    title: string
    rows: Array<[string, string | undefined]>
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-3 space-y-2">
                {rows.map(([label, value]) => (
                    <div
                        key={`${title}-${label}`}
                        className="grid grid-cols-[150px_1fr] gap-3 text-sm"
                    >
                        <div className="text-slate-500">{label}</div>
                        <div className="break-all font-medium text-slate-800">
                            {value && value !== "undefined" ? value : "—"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ProductsLotsPage
