import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Loader2,
    Package2,
    Pencil,
    Plus,
    Save,
    Search,
    Sparkles,
} from "lucide-react"
import toast from "react-hot-toast"

import { authStorage } from "@/utils/authStorage"
import { productService } from "@/services/product.service"
import { productLotService } from "@/services/product-lot.service"
import type {
    ProductDetailDto,
    ProductEditFormValues,
    ProductResponseDto,
    ProductSelectOption,
} from "@/types/product.type"
import {
    PRODUCT_STATUS_OPTIONS,
    PRODUCT_TYPE_OPTIONS,
} from "@/types/product.type"
import type { ProductLotItem } from "@/types/product-lot.type"

type LotStatusFilter = "ALL" | "DRAFT" | "PRICED" | "PUBLISHED"
type ExpiryFilter =
    | "Tất cả hạn dùng"
    | "Còn trên 7 ngày"
    | "Còn 3 - 7 ngày"
    | "Còn 1 - 2 ngày"
    | "Hết hạn hôm nay"
    | "Đã hết hạn"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleDateString("vi-VN")
}

const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleString("vi-VN")
}

const formatPrice = (price?: number | null) => {
    if (typeof price !== "number" || Number.isNaN(price)) return "—"
    return price.toLocaleString("vi-VN") + " đ"
}

const calcDiscount = (original?: number | null, sale?: number | null) => {
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

const normalizeNutritionKeyLabel = (key: string) => {
    const raw = key.trim()
    const compact = raw.toLowerCase().replace(/[\s_-]/g, "")

    const map: Record<string, string> = {
        energy: "Năng lượng",
        calories: "Năng lượng",
        calorie: "Năng lượng",
        fat: "Chất béo",
        totalfat: "Chất béo",
        saturatedfat: "Chất béo bão hòa",
        saturates: "Chất béo bão hòa",
        transfat: "Chất béo chuyển hóa",
        carbohydrate: "Carbohydrate",
        carbohydrates: "Carbohydrate",
        carbs: "Carbohydrate",
        sugar: "Đường",
        sugars: "Đường tổng",
        totalsugar: "Đường tổng",
        protein: "Chất đạm",
        sodium: "Natri",
        salt: "Muối",
        calcium: "Canxi",
        potassium: "Kali",
        phosphorus: "Phốt pho",
        magnesium: "Magiê",
        zinc: "Kẽm",
        iodine: "Iốt",
        selenium: "Selenium",
        vitamina: "Vitamin A",
        vitamind: "Vitamin D",
        vitaminb1: "Vitamin B1",
        vitaminb2: "Vitamin B2",
        vitaminb12: "Vitamin B12",
        vitaminc: "Vitamin C",
        choline: "Choline",
        fiber: "Chất xơ",
        dietaryfiber: "Chất xơ",
    }

    if (map[compact]) return map[compact]

    return raw
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

const parseNutritionDescriptionText = (text: string) => {
    const clean = text
        .replace(/^giá trị dinh dưỡng trung bình[^:]*:/i, "")
        .replace(/^nutrition facts[^:]*:/i, "")
        .replace(/^thành phần dinh dưỡng[^:]*:/i, "")
        .trim()

    if (!clean) return []

    return clean
        .split(/[;|]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
            const matched = item.match(/^(.+?)\s+([0-9.,]+.*)$/)
            if (matched) {
                return {
                    label: matched[1].trim(),
                    value: matched[2].trim(),
                }
            }

            const [left, ...rest] = item.split(":")
            if (rest.length > 0) {
                return {
                    label: left.trim(),
                    value: rest.join(":").trim(),
                }
            }

            return {
                label: item.trim(),
                value: "",
            }
        })
}

const extractNutritionPairs = (
    input?: Record<string, string> | null,
): Array<{ label: string; value: string }> => {
    if (!input || typeof input !== "object") return []

    const directEntries = Object.entries(input).filter(
        ([key, value]) =>
            Boolean(key?.trim()) &&
            Boolean(String(value || "").trim()) &&
            !["description", "note"].includes(key.toLowerCase()),
    )

    if (directEntries.length > 0) {
        return directEntries.map(([key, value]) => ({
            label: normalizeNutritionKeyLabel(key),
            value: String(value).trim(),
        }))
    }

    const descriptionLike =
        input.description || input.Description || input.note || input.Note || ""

    if (typeof descriptionLike === "string" && descriptionLike.trim()) {
        return parseNutritionDescriptionText(descriptionLike)
    }

    return []
}

const createEmptyEditForm = (): ProductEditFormValues => ({
    supermarketId: "",
    name: "",
    categoryName: "",
    barcode: "",
    type: 0,
    sku: "",
    status: 0,
    responsibleOrg: "",
    isFeatured: false,
    tagsText: "",
    brand: "",
    ingredientsText: "",
    nutritionFactsText: "{}",
    usageInstructions: "",
    storageInstructions: "",
    manufacturer: "",
    origin: "",
    description: "",
    safetyWarnings: "",
})

const joinIngredientsMultiline = (items?: string[]) => {
    if (!items?.length) return ""
    return items.join("\n")
}

const prettyNutritionJson = (value?: Record<string, string> | null) => {
    if (!value || Object.keys(value).length === 0) return "{}"
    return JSON.stringify(value, null, 2)
}

const buildEditForm = (
    product: ProductResponseDto,
    detail: ProductDetailDto,
): ProductEditFormValues => {
    return {
        supermarketId: product.supermarketId || detail.supermarketId || "",
        name: product.name || detail.name || "",
        categoryName: product.category || detail.category || "",
        barcode: product.barcode || detail.barcode || "",
        type:
            typeof product.type === "number"
                ? product.type
                : typeof detail.type === "number"
                    ? detail.type
                    : 0,
        sku: product.sku || detail.sku || "",
        status:
            typeof product.status === "number"
                ? product.status
                : typeof detail.status === "number"
                    ? detail.status
                    : 0,
        responsibleOrg:
            product.responsibleOrg ||
            detail.responsibleOrg ||
            detail.distributor ||
            "",
        isFeatured: product.isFeatured ?? detail.isFeatured ?? false,
        tagsText: (product.tags || detail.tags || []).join(", "),
        brand: detail.brand || product.brand || "",
        ingredientsText: joinIngredientsMultiline(detail.ingredients || product.ingredients),
        nutritionFactsText: prettyNutritionJson(
            detail.nutritionFacts || product.nutritionFacts || {},
        ),
        usageInstructions: detail.usageInstructions || "",
        storageInstructions: detail.storageInstructions || "",
        manufacturer:
            detail.manufacturer || product.barcodeLookupInfo?.manufacturer || "",
        origin: detail.origin || "",
        description:
            detail.description || product.barcodeLookupInfo?.description || "",
        safetyWarnings: detail.safetyWarning || "",
    }
}

const parseNutritionFactsText = (value: string): string => {
    const trimmed = value.trim()
    if (!trimmed) return "{}"

    try {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return JSON.stringify(parsed)
        }
        throw new Error("Nutrition facts phải là JSON object")
    } catch (error) {
        throw new Error("Thành phần dinh dưỡng phải là JSON object hợp lệ")
    }
}

const buildUpdatePayload = (form: ProductEditFormValues) => {
    return {
        supermarketId: form.supermarketId.trim(),
        name: form.name.trim(),
        categoryName: form.categoryName.trim(),
        barcode: form.barcode.trim(),
        type: Number(form.type) || 0,
        sku: form.sku.trim(),
        status: Number(form.status) || 0,
        responsibleOrg: form.responsibleOrg.trim(),
        isFeatured: Boolean(form.isFeatured),
        tags: form.tagsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        detail: {
            brand: form.brand.trim(),
            ingredients: form.ingredientsText
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
                .join(", "),
            nutritionFactsJson: parseNutritionFactsText(form.nutritionFactsText),
            usageInstructions: form.usageInstructions.trim(),
            storageInstructions: form.storageInstructions.trim(),
            manufacturer: form.manufacturer.trim(),
            origin: form.origin.trim(),
            description: form.description.trim(),
            safetyWarnings: form.safetyWarnings.trim(),
        },
    }
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
    const [selectedProduct, setSelectedProduct] = useState<ProductResponseDto | null>(null)
    const [selectedProductDetail, setSelectedProductDetail] =
        useState<ProductDetailDto | null>(null)
    const [openDetail, setOpenDetail] = useState(false)
    const [loadingPopup, setLoadingPopup] = useState(false)

    const [isEditing, setIsEditing] = useState(false)
    const [savingEdit, setSavingEdit] = useState(false)
    const [editForm, setEditForm] = useState<ProductEditFormValues>(
        createEmptyEditForm(),
    )
    const [editErrors, setEditErrors] = useState<Record<string, string>>({})

    const handleAddProduct = () => {
        navigate("/supermarketStaff/products/workflow")
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
            const data = await productLotService.getMySupermarketLots({
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
                        (item) => normalizeLotStatus(item.status) === statusFilter,
                    )

            setLots(filteredByStatus)
            setServerTotal(
                typeof data.totalResult === "number" && data.totalResult >= 0
                    ? data.totalResult
                    : rawItems.length,
            )
            setTotalPages(
                Math.max(
                    1,
                    Math.ceil(
                        (typeof data.totalResult === "number" && data.totalResult > 0
                            ? data.totalResult
                            : rawItems.length) / pageSize,
                    ),
                ),
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
            (item) => normalizeLotStatus(item.status) === "DRAFT",
        ).length
        const pricedCount = lots.filter(
            (item) => normalizeLotStatus(item.status) === "PRICED",
        ).length
        const publishedCount = lots.filter(
            (item) => normalizeLotStatus(item.status) === "PUBLISHED",
        ).length

        return {
            draftCount,
            pricedCount,
            publishedCount,
            currentPageCount: lots.length,
        }
    }, [lots])

    const nutritionPairs = useMemo(() => {
        return extractNutritionPairs(
            selectedProductDetail?.nutritionFacts ||
            selectedProduct?.nutritionFacts ||
            selectedLot?.nutritionFacts ||
            null,
        )
    }, [selectedLot, selectedProduct, selectedProductDetail])

    const ingredientsText = useMemo(() => {
        const detailIngredients = selectedProductDetail?.ingredients || []
        if (detailIngredients.length > 0) return detailIngredients.join(", ")

        const productIngredients = selectedProduct?.ingredients || []
        if (productIngredients.length > 0) return productIngredients.join(", ")

        const lotIngredients = selectedLot?.ingredients || []
        if (lotIngredients.length > 0) return lotIngredients.join(", ")

        return "—"
    }, [selectedLot, selectedProduct, selectedProductDetail])

    const popupImageUrl =
        selectedProductDetail?.mainImageUrl ||
        selectedProduct?.mainImageUrl ||
        selectedLot?.mainImageUrl ||
        selectedProductDetail?.productImages?.[0]?.imageUrl ||
        selectedProduct?.productImages?.[0]?.imageUrl ||
        selectedLot?.productImages?.[0]?.imageUrl ||
        "/placeholder.png"

    const handleOpenDetail = async (lot: ProductLotItem) => {
        setSelectedLot(lot)
        setSelectedProduct(null)
        setSelectedProductDetail(null)
        setOpenDetail(true)
        setLoadingPopup(true)
        setIsEditing(false)
        setSavingEdit(false)
        setEditErrors({})
        setEditForm(createEmptyEditForm())

        try {
            const [product, detail] = await Promise.all([
                productService.getProductById(lot.productId),
                productService.getProductDetails(lot.productId),
            ])

            setSelectedProduct(product)
            setSelectedProductDetail(detail)
            setEditForm(buildEditForm(product, detail))
        } catch (error) {
            console.error("ProductsLotsPage.handleOpenDetail -> error:", error)
            toast.error("Không tải được chi tiết sản phẩm")
        } finally {
            setLoadingPopup(false)
        }
    }

    const handleCloseDetail = () => {
        setOpenDetail(false)
        setSelectedLot(null)
        setSelectedProduct(null)
        setSelectedProductDetail(null)
        setLoadingPopup(false)
        setIsEditing(false)
        setSavingEdit(false)
        setEditErrors({})
        setEditForm(createEmptyEditForm())
    }

    const setEditField = <K extends keyof ProductEditFormValues>(
        key: K,
        value: ProductEditFormValues[K],
    ) => {
        setEditForm((prev) => ({
            ...prev,
            [key]: value,
        }))

        setEditErrors((prev) => {
            if (!prev[key as string]) return prev
            const next = { ...prev }
            delete next[key as string]
            return next
        })
    }

    const validateEditForm = () => {
        const nextErrors: Record<string, string> = {}

        if (!editForm.supermarketId.trim()) {
            nextErrors.supermarketId = "Thiếu supermarketId"
        }
        if (!editForm.name.trim()) {
            nextErrors.name = "Vui lòng nhập tên sản phẩm"
        }
        if (!editForm.categoryName.trim()) {
            nextErrors.categoryName = "Vui lòng nhập danh mục"
        }
        if (!editForm.barcode.trim()) {
            nextErrors.barcode = "Vui lòng nhập mã vạch"
        }

        try {
            parseNutritionFactsText(editForm.nutritionFactsText)
        } catch (error) {
            nextErrors.nutritionFactsText =
                error instanceof Error ? error.message : "JSON không hợp lệ"
        }

        setEditErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const handleSaveProduct = async () => {
        if (!selectedLot?.productId) return
        if (!validateEditForm()) return

        setSavingEdit(true)

        try {
            const payload = buildUpdatePayload(editForm)

            console.log("ProductsLotsPage.handleSaveProduct -> payload:", payload)

            await productService.updateProduct(selectedLot.productId, payload)

            const [product, detail] = await Promise.all([
                productService.getProductById(selectedLot.productId),
                productService.getProductDetails(selectedLot.productId),
            ])

            setSelectedProduct(product)
            setSelectedProductDetail(detail)
            setEditForm(buildEditForm(product, detail))
            setIsEditing(false)

            await loadLots()
            toast.success("Cập nhật thông tin sản phẩm thành công")
        } catch (error) {
            console.error("ProductsLotsPage.handleSaveProduct -> error:", error)
            toast.error("Không thể cập nhật thông tin sản phẩm")
        } finally {
            setSavingEdit(false)
        }
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
                                Theo dõi danh sách lot sản phẩm, tìm kiếm nhanh theo tên hoặc
                                barcode và lọc theo trạng thái, hạn dùng.
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
                            <h2 className="text-sm font-semibold text-slate-900">
                                Danh sách lot sản phẩm
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {loading
                                    ? "Đang tải dữ liệu..."
                                    : `${lots.length} lot trên trang này`}
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
                            <div className="min-w-[1240px]">
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
                                        const sellingPrice =
                                            lot.finalUnitPrice ?? lot.sellingUnitPrice ?? null
                                        const discount = calcDiscount(
                                            originalPrice,
                                            sellingPrice ?? aiSuggestedPrice,
                                        )
                                        const normalizedStatus = normalizeLotStatus(lot.status)

                                        const remainingText =
                                            typeof lot.daysRemaining === "number" ||
                                                typeof lot.hoursRemaining === "number"
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
                                                                : "bg-slate-100 text-slate-600",
                                                        )}
                                                    >
                                                        {lot.isFreshFood ? "Có" : "Không"}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span
                                                        className={cn(
                                                            "inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                                                            statusMeta.color,
                                                        )}
                                                    >
                                                        {normalizedStatus === "PUBLISHED"
                                                            ? "Đang bán"
                                                            : statusMeta.label}
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
                                                    {typeof lot.quantity === "number"
                                                        ? lot.quantity
                                                        : "—"}
                                                </div>

                                                <div className="text-center text-[10px] font-medium text-slate-800">
                                                    {typeof lot.weight === "number"
                                                        ? lot.weight
                                                        : "—"}
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
                                                        onClick={() => void handleOpenDetail(lot)}
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
                                            {isEditing
                                                ? "Bạn đang chỉnh sửa thông tin sản phẩm."
                                                : "Bấm ra ngoài để đóng popup."}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing((prev) => !prev)}
                                            disabled={loadingPopup || !selectedProduct}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            {isEditing ? "Xem" : "Sửa"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCloseDetail}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>

                                {loadingPopup ? (
                                    <div className="flex h-[420px] items-center justify-center text-sm text-slate-500">
                                        <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                                        Đang tải chi tiết sản phẩm...
                                    </div>
                                ) : isEditing ? (
                                    <div className="p-6">
                                        <div className="grid gap-6 lg:grid-cols-2">
                                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    Thông tin chính
                                                </div>

                                                <FieldLabel label="Tên sản phẩm" required />
                                                <TextInput
                                                    value={editForm.name}
                                                    onChange={(value) =>
                                                        setEditField("name", value)
                                                    }
                                                    error={editErrors.name}
                                                />

                                                <FieldLabel label="Barcode" required />
                                                <TextInput
                                                    value={editForm.barcode}
                                                    onChange={(value) =>
                                                        setEditField("barcode", value)
                                                    }
                                                    error={editErrors.barcode}
                                                />

                                                <FieldLabel label="Danh mục" required />
                                                <TextInput
                                                    value={editForm.categoryName}
                                                    onChange={(value) =>
                                                        setEditField("categoryName", value)
                                                    }
                                                    error={editErrors.categoryName}
                                                />

                                                <FieldLabel label="Thương hiệu" />
                                                <TextInput
                                                    value={editForm.brand}
                                                    onChange={(value) =>
                                                        setEditField("brand", value)
                                                    }
                                                />

                                                <FieldLabel label="SKU" />
                                                <TextInput
                                                    value={editForm.sku}
                                                    onChange={(value) =>
                                                        setEditField("sku", value)
                                                    }
                                                />

                                                <FieldLabel label="Loại sản phẩm" />
                                                <SelectInput
                                                    value={editForm.type}
                                                    onChange={(value) =>
                                                        setEditField("type", Number(value))
                                                    }
                                                    options={PRODUCT_TYPE_OPTIONS}
                                                />

                                                <FieldLabel label="Trạng thái sản phẩm" />
                                                <SelectInput
                                                    value={editForm.status}
                                                    onChange={(value) =>
                                                        setEditField("status", Number(value))
                                                    }
                                                    options={PRODUCT_STATUS_OPTIONS}
                                                />

                                                <FieldLabel label="Supermarket ID" />
                                                <TextInput
                                                    value={editForm.supermarketId}
                                                    onChange={(value) =>
                                                        setEditField("supermarketId", value)
                                                    }
                                                    error={editErrors.supermarketId}
                                                />

                                                <FieldLabel label="Responsible org" />
                                                <TextInput
                                                    value={editForm.responsibleOrg}
                                                    onChange={(value) =>
                                                        setEditField("responsibleOrg", value)
                                                    }
                                                />

                                                <FieldLabel label="Tags" />
                                                <TextInput
                                                    value={editForm.tagsText}
                                                    onChange={(value) =>
                                                        setEditField("tagsText", value)
                                                    }
                                                    placeholder="tag1, tag2, tag3"
                                                />

                                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.isFeatured}
                                                        onChange={(e) =>
                                                            setEditField(
                                                                "isFeatured",
                                                                e.target.checked,
                                                            )
                                                        }
                                                        className="h-4 w-4 rounded border-slate-300"
                                                    />
                                                    Đánh dấu nổi bật
                                                </label>
                                            </div>

                                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    Mô tả chi tiết
                                                </div>

                                                <FieldLabel label="Nhà sản xuất" />
                                                <TextInput
                                                    value={editForm.manufacturer}
                                                    onChange={(value) =>
                                                        setEditField("manufacturer", value)
                                                    }
                                                />

                                                <FieldLabel label="Xuất xứ" />
                                                <TextInput
                                                    value={editForm.origin}
                                                    onChange={(value) =>
                                                        setEditField("origin", value)
                                                    }
                                                />

                                                <FieldLabel label="Mô tả" />
                                                <TextArea
                                                    value={editForm.description}
                                                    onChange={(value) =>
                                                        setEditField("description", value)
                                                    }
                                                />

                                                <FieldLabel label="Thành phần" />
                                                <TextArea
                                                    value={editForm.ingredientsText}
                                                    onChange={(value) =>
                                                        setEditField("ingredientsText", value)
                                                    }
                                                    placeholder="Mỗi dòng một thành phần"
                                                />

                                                <FieldLabel label="Thành phần dinh dưỡng JSON" />
                                                <TextArea
                                                    value={editForm.nutritionFactsText}
                                                    onChange={(value) =>
                                                        setEditField(
                                                            "nutritionFactsText",
                                                            value,
                                                        )
                                                    }
                                                    error={editErrors.nutritionFactsText}
                                                    className="min-h-[180px] font-mono"
                                                    placeholder={`{\n  "Năng lượng": "76 kcal",\n  "Chất béo": "1,7 g"\n}`}
                                                />

                                                <FieldLabel label="Hướng dẫn sử dụng" />
                                                <TextArea
                                                    value={editForm.usageInstructions}
                                                    onChange={(value) =>
                                                        setEditField(
                                                            "usageInstructions",
                                                            value,
                                                        )
                                                    }
                                                />

                                                <FieldLabel label="Hướng dẫn bảo quản" />
                                                <TextArea
                                                    value={editForm.storageInstructions}
                                                    onChange={(value) =>
                                                        setEditField(
                                                            "storageInstructions",
                                                            value,
                                                        )
                                                    }
                                                />

                                                <FieldLabel label="Cảnh báo an toàn" />
                                                <TextArea
                                                    value={editForm.safetyWarnings}
                                                    onChange={(value) =>
                                                        setEditField("safetyWarnings", value)
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                            Hiện chỉ lưu được <strong>product info</strong>. Các
                                            field thuộc <strong>lot</strong> như ngày sản xuất,
                                            hạn sử dụng, số lượng, khối lượng, đơn vị, giá gốc
                                            lot, giá bán lot, giá AI lot chưa có API update riêng
                                            nên FE chưa lưu xuống BE được.
                                        </div>

                                        <div className="mt-5 flex items-center justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                disabled={savingEdit}
                                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Hủy
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => void handleSaveProduct()}
                                                disabled={savingEdit}
                                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {savingEdit ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Đang lưu...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4" />
                                                        Lưu thay đổi
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
                                        <div>
                                            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                                                <img
                                                    src={popupImageUrl}
                                                    alt={selectedLot.productName || "product"}
                                                    className="h-[280px] w-full object-cover"
                                                />
                                            </div>

                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    Ảnh sản phẩm
                                                </div>
                                                <div className="mt-2 text-sm text-slate-600">
                                                    Tổng ảnh:{" "}
                                                    {selectedProductDetail?.totalImages ??
                                                        selectedProduct?.totalImages ??
                                                        selectedLot.totalImages ??
                                                        selectedProductDetail?.productImages
                                                            ?.length ??
                                                        selectedProduct?.productImages?.length ??
                                                        selectedLot.productImages?.length ??
                                                        0}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <DetailBlock
                                                title="Thông tin định danh"
                                                rows={[
                                                    ["Mã lô hàng", selectedLot.lotId],
                                                    ["Mã sản phẩm", selectedLot.productId],
                                                    [
                                                        "Barcode",
                                                        selectedProductDetail?.barcode ||
                                                        selectedProduct?.barcode ||
                                                        selectedLot.barcode ||
                                                        "—",
                                                    ],
                                                    ["Mã siêu thị", selectedLot.supermarketId || "—"],
                                                    [
                                                        "Tên siêu thị",
                                                        selectedProductDetail?.supermarketName ||
                                                        selectedLot.supermarketName ||
                                                        "—",
                                                    ],
                                                    ["Mã đơn vị sản phẩm", selectedLot.unitId || "—"],
                                                    [
                                                        "Tên đơn vị",
                                                        selectedProductDetail?.unitName ||
                                                        selectedLot.unitName ||
                                                        "—",
                                                    ],
                                                    ["Loại đơn vị", selectedLot.unitType || "—"],
                                                    ["SKU", selectedProduct?.sku || "—"],
                                                ]}
                                            />

                                            <DetailBlock
                                                title="Thông tin sản phẩm"
                                                rows={[
                                                    [
                                                        "Tên sản phẩm",
                                                        selectedProductDetail?.name ||
                                                        selectedProduct?.name ||
                                                        selectedLot.productName ||
                                                        "—",
                                                    ],
                                                    [
                                                        "Thương hiệu",
                                                        selectedProductDetail?.brand ||
                                                        selectedProduct?.brand ||
                                                        selectedLot.brand ||
                                                        "—",
                                                    ],
                                                    [
                                                        "Danh mục",
                                                        selectedProductDetail?.category ||
                                                        selectedProduct?.category ||
                                                        selectedLot.category ||
                                                        "—",
                                                    ],
                                                    [
                                                        "Đồ tươi sống",
                                                        typeof (
                                                            selectedProductDetail?.isFreshFood ??
                                                            selectedProduct?.isFreshFood ??
                                                            selectedLot.isFreshFood
                                                        ) === "boolean"
                                                            ? String(
                                                                selectedProductDetail?.isFreshFood ??
                                                                selectedProduct?.isFreshFood ??
                                                                selectedLot.isFreshFood,
                                                            )
                                                            : "—",
                                                    ],
                                                    ["Trạng thái lot", selectedLot.status || "—"],
                                                    [
                                                        "Trạng thái product",
                                                        typeof selectedProduct?.status === "number"
                                                            ? String(selectedProduct.status)
                                                            : typeof selectedProductDetail?.status ===
                                                                "number"
                                                                ? String(
                                                                    selectedProductDetail.status,
                                                                )
                                                                : "—",
                                                    ],
                                                    [
                                                        "Mô tả",
                                                        selectedProductDetail?.description ||
                                                        selectedProduct?.barcodeLookupInfo
                                                            ?.description ||
                                                        "—",
                                                    ],
                                                    [
                                                        "Xuất xứ",
                                                        selectedProductDetail?.origin || "—",
                                                    ],
                                                    [
                                                        "Nhà sản xuất",
                                                        selectedProductDetail?.manufacturer ||
                                                        selectedProduct?.barcodeLookupInfo
                                                            ?.manufacturer ||
                                                        "—",
                                                    ],
                                                    [
                                                        "Responsible org",
                                                        selectedProduct?.responsibleOrg ||
                                                        selectedProductDetail?.responsibleOrg ||
                                                        selectedProductDetail?.distributor ||
                                                        "—",
                                                    ],
                                                ]}
                                            />

                                            <DetailBlock
                                                title="Thông tin lot / hạn dùng"
                                                rows={[
                                                    [
                                                        "Mã trạng thái hạn dùng",
                                                        typeof selectedLot.expiryStatus === "number"
                                                            ? String(selectedLot.expiryStatus)
                                                            : typeof selectedProductDetail?.expiryStatus ===
                                                                "number"
                                                                ? String(
                                                                    selectedProductDetail.expiryStatus,
                                                                )
                                                                : "—",
                                                    ],
                                                    [
                                                        "Chú thích hạn dùng",
                                                        selectedLot.expiryStatusText ||
                                                        selectedProductDetail?.expiryStatusText ||
                                                        "—",
                                                    ],
                                                    [
                                                        "Số ngày còn lại",
                                                        typeof selectedLot.daysRemaining === "number"
                                                            ? String(selectedLot.daysRemaining)
                                                            : typeof selectedProductDetail?.daysToExpiry ===
                                                                "number"
                                                                ? String(
                                                                    selectedProductDetail.daysToExpiry,
                                                                )
                                                                : "—",
                                                    ],
                                                    [
                                                        "Số giờ còn lại",
                                                        typeof selectedLot.hoursRemaining === "number"
                                                            ? String(selectedLot.hoursRemaining)
                                                            : "—",
                                                    ],
                                                    [
                                                        "Số lượng",
                                                        typeof selectedLot.quantity === "number"
                                                            ? String(selectedLot.quantity)
                                                            : typeof selectedProductDetail?.quantity ===
                                                                "number"
                                                                ? String(
                                                                    selectedProductDetail.quantity,
                                                                )
                                                                : "—",
                                                    ],
                                                    [
                                                        "Khối lượng",
                                                        selectedProductDetail?.weight ||
                                                        (typeof selectedLot.weight === "number"
                                                            ? String(selectedLot.weight)
                                                            : "—"),
                                                    ],
                                                    [
                                                        "Ngày sản xuất",
                                                        formatDate(
                                                            selectedLot.manufactureDate ||
                                                            selectedProductDetail?.manufactureDate ||
                                                            selectedProduct?.manufactureDate,
                                                        ),
                                                    ],
                                                    [
                                                        "Hạn sử dụng",
                                                        formatDate(
                                                            selectedLot.expiryDate ||
                                                            selectedProductDetail?.expiryDate ||
                                                            selectedProduct?.expiryDate,
                                                        ),
                                                    ],
                                                    [
                                                        "Ngày tạo",
                                                        formatDateTime(
                                                            selectedLot.createdAt ||
                                                            selectedProduct?.createdAt,
                                                        ),
                                                    ],
                                                    ["Tạo bởi", selectedLot.createdBy || "—"],
                                                    ["Đăng bán bởi", selectedLot.publishedBy || "—"],
                                                    [
                                                        "Đăng bán vào ngày",
                                                        formatDateTime(selectedLot.publishedAt),
                                                    ],
                                                ]}
                                            />

                                            <DetailBlock
                                                title="Giá / định giá"
                                                rows={[
                                                    [
                                                        "Giá gốc lot",
                                                        formatPrice(selectedLot.originalUnitPrice),
                                                    ],
                                                    [
                                                        "Giá AI đề xuất lot",
                                                        formatPrice(selectedLot.suggestedUnitPrice),
                                                    ],
                                                    [
                                                        "Giá bán cuối lot",
                                                        formatPrice(
                                                            selectedLot.finalUnitPrice ??
                                                            selectedLot.sellingUnitPrice,
                                                        ),
                                                    ],
                                                    [
                                                        "Giá gốc product",
                                                        formatPrice(selectedProduct?.originalPrice),
                                                    ],
                                                    [
                                                        "Giá AI product",
                                                        formatPrice(selectedProduct?.suggestedPrice),
                                                    ],
                                                    [
                                                        "Giá cuối product",
                                                        formatPrice(selectedProduct?.finalPrice),
                                                    ],
                                                ]}
                                            />

                                            <div className="rounded-2xl border border-slate-200 p-4">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    Thành phần / dinh dưỡng
                                                </div>

                                                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                                                    <InlineInfoCard
                                                        label="Thành phần"
                                                        value={ingredientsText}
                                                    />

                                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                            Dinh dưỡng
                                                        </div>

                                                        {nutritionPairs.length === 0 ? (
                                                            <div className="text-sm text-slate-500">
                                                                —
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                {nutritionPairs.map((item, index) => (
                                                                    <div
                                                                        key={`${item.label}-${index}`}
                                                                        className="rounded-lg border border-white bg-white px-3 py-2"
                                                                    >
                                                                        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
                                                                            {item.label}
                                                                        </div>
                                                                        <div className="mt-1 text-sm font-medium text-slate-800">
                                                                            {item.value || "—"}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                                    <InlineInfoCard
                                                        label="Hướng dẫn sử dụng"
                                                        value={
                                                            selectedProductDetail?.usageInstructions ||
                                                            "—"
                                                        }
                                                    />
                                                    <InlineInfoCard
                                                        label="Hướng dẫn bảo quản"
                                                        value={
                                                            selectedProductDetail?.storageInstructions ||
                                                            "—"
                                                        }
                                                    />
                                                </div>

                                                <div className="mt-3">
                                                    <InlineInfoCard
                                                        label="Cảnh báo an toàn"
                                                        value={
                                                            selectedProductDetail?.safetyWarning ||
                                                            "—"
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
    rows: Array<[string, string]>
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

const InlineInfoCard = ({
    label,
    value,
}: {
    label: string
    value: string
}) => {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                {label}
            </div>
            <div className="text-sm leading-6 text-slate-800">
                {value && value !== "undefined" ? value : "—"}
            </div>
        </div>
    )
}

const FieldLabel = ({
    label,
    required,
}: {
    label: string
    required?: boolean
}) => {
    return (
        <div className="mb-1.5 text-sm font-medium text-slate-700">
            {label} {required ? <span className="text-rose-500">*</span> : null}
        </div>
    )
}

const TextInput = ({
    value,
    onChange,
    placeholder,
    error,
}: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    error?: string
}) => {
    return (
        <div>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
                    error
                        ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-50"
                        : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
                )}
            />
            {error ? <div className="mt-1 text-xs text-rose-500">{error}</div> : null}
        </div>
    )
}

const TextArea = ({
    value,
    onChange,
    placeholder,
    error,
    className,
}: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    error?: string
    className?: string
}) => {
    return (
        <div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "min-h-[110px] w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
                    error
                        ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-50"
                        : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
                    className,
                )}
            />
            {error ? <div className="mt-1 text-xs text-rose-500">{error}</div> : null}
        </div>
    )
}

const SelectInput = ({
    value,
    onChange,
    options,
}: {
    value: number
    onChange: (value: string) => void
    options: ProductSelectOption<number>[]
}) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    )
}

export default ProductsLotsPage
