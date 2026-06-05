import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Ban,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    ImagePlus,
    Loader2,
    Package2,
    Pencil,
    Plus,
    Save,
    Search,
    Sparkles,
    Trash2,
} from "lucide-react"
import toast from "react-hot-toast"

import { authStorage } from "@/utils/authStorage"
import { getApiOrigin } from "@/utils/apiConfig"
import { productService } from "@/services/product.service"
import { productLotService } from "@/services/product-lot.service"
import ProductsTab from "./components/ProductsTab"
import type {
    ProductDetailDto,
    ProductEditFormValues,
    ProductResponseDto,
    ProductSelectOption,
    ProductStateValue,
    ProductTypeValue,
    ProductUpdatePayload,
} from "@/types/product.type"
import {
    PRODUCT_STATUS_OPTIONS,
    PRODUCT_TYPE_OPTIONS,
} from "@/types/product.type"
import type { ProductLotItem } from "@/types/product-lot.type"
import { resolveProductImageFromDto } from "@/utils/productImage"
import type { ProductPurchaseUnit } from "@/types/purchase-unit.type"
import { categoryService } from "@/services/category.service"
import { unitService } from "@/services/unit.service"
import type { UnitItem } from "@/types/unit.type"
import { getApiErrorMessage } from "@/utils/apiError"
import {
    formatConversionRateHintWithBase,
    formatUnitDisplay,
} from "@/utils/unitMeasure"

type LotStatusFilter =
    | "ALL"
    | "DRAFT"
    | "VERIFIED"
    | "PRICED"
    | "PUBLISHED"
    | "HIDDEN"
    | "DELETED"
    | "EXPIRED"
    | "SOLDOUT"
type ExpiryFilter =
    | "Tất cả hạn dùng"
    | "Hết hạn hôm nay"
    | "Còn 1 - 2 ngày"
    | "Còn 3 - 7 ngày"
    | "Còn trên 7 ngày"
    | "Đã hết hạn"

type SortField = "brand" | "category" | "type"
type SortDirection = "asc" | "desc"

type SortRule = {
    field: SortField
    direction: SortDirection
}

type NutritionFactRow = {
    id: string
    label: string
    value: string
}

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

/** 10 cột: sản phẩm | brand | category | type | status | tồn kho | hạn dùng | giá | AI | xem */
const LOT_TABLE_GRID =
    "grid grid-cols-[minmax(220px,1.35fr)_minmax(96px,0.75fr)_minmax(108px,0.8fr)_minmax(92px,0.65fr)_minmax(96px,0.7fr)_minmax(118px,0.85fr)_minmax(138px,0.95fr)_minmax(128px,0.9fr)_minmax(96px,0.7fr)_52px] items-center gap-3"
const LOT_TABLE_MIN_WIDTH = "min-w-[1180px]"
const EMPTY_PARTIAL_PRODUCT_LOT = {} as Partial<ProductLotItem>

const compareText = (a?: string | null, b?: string | null) => {
    const left = (a || "").trim().toLocaleLowerCase("vi")
    const right = (b || "").trim().toLocaleLowerCase("vi")
    return left.localeCompare(right, "vi")
}

const compareBooleanLabel = (a: boolean, b: boolean) => {
    const left = a ? "tươi sống" : "thông thường"
    const right = b ? "tươi sống" : "thông thường"
    return left.localeCompare(right, "vi")
}

const API_ORIGIN = getApiOrigin()

const getImageUrl = (url?: string | null) => {
    if (!url?.trim() || url === "/placeholder.png") {
        return "/placeholder.png"
    }

    const trimmed = url.trim()

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("blob:") ||
        trimmed.startsWith("data:")
    ) {
        return trimmed
    }

    return `${API_ORIGIN}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`
}

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
    return `${price.toLocaleString("vi-VN")} đ`
}

const formatUnitLabel = (
    name?: string | null,
    symbol?: string | null,
    fallback = "—",
) => {
    const safeName = name?.trim() || fallback
    const safeSymbol = symbol?.trim() || ""

    if (!safeName || safeName === "—") return "—"
    return safeSymbol ? `${safeName} (${safeSymbol})` : safeName
}

const calcDiscount = (original?: number | null, sale?: number | null) => {
    if (!original || original <= 0 || !sale || sale <= 0) return 0
    return Math.max(0, Math.round(((original - sale) / original) * 100))
}

const LOT_STATUS_BY_NUMBER: Record<number, LotStatusFilter> = {
    0: "DRAFT",
    1: "VERIFIED",
    2: "PRICED",
    3: "PUBLISHED",
    4: "EXPIRED",
    5: "SOLDOUT",
    6: "HIDDEN",
    7: "DELETED",
}

const normalizeLotStatus = (status?: string | number | null): LotStatusFilter => {
    if (typeof status === "number" && LOT_STATUS_BY_NUMBER[status]) {
        return LOT_STATUS_BY_NUMBER[status]
    }

    const normalized = String(status ?? "").trim().toLowerCase()
    if (!normalized) return "ALL"

    const numericStatus = Number(normalized)
    if (!Number.isNaN(numericStatus) && LOT_STATUS_BY_NUMBER[numericStatus]) {
        return LOT_STATUS_BY_NUMBER[numericStatus]
    }

    if (normalized === "draft") return "DRAFT"
    if (normalized === "verified") return "VERIFIED"
    if (normalized === "priced" || normalized === "priceconfirmed") return "PRICED"
    if (normalized === "published") return "PUBLISHED"
    if (normalized === "hidden") return "HIDDEN"
    if (normalized === "deleted") return "DELETED"
    if (normalized === "expired") return "EXPIRED"
    if (normalized === "soldout") return "SOLDOUT"

    return "ALL"
}

const getLotStatusMeta = (status?: string | number | null) => {
    const normalized = normalizeLotStatus(status)

    if (normalized === "HIDDEN") {
        return {
            label: "Đã ẩn",
            color: "bg-amber-100 text-amber-800 border-amber-200",
            description:
                "Lô không hiển thị cho khách hàng. Nhân viên vẫn xem được và có thể đăng bán lại.",
        }
    }

    if (normalized === "DELETED") {
        return {
            label: "Đã xóa",
            color: "bg-rose-100 text-rose-700 border-rose-200",
            description:
                "Lô đã được đánh dấu xóa và tồn kho bằng 0. Dữ liệu vẫn được lưu trong hệ thống.",
        }
    }

    if (normalized === "DRAFT") {
        return {
            label: "Nháp",
            color: "bg-slate-100 text-slate-700 border-slate-200",
            description: "Lô đang ở trạng thái nháp, chưa sẵn sàng đăng bán.",
        }
    }

    if (normalized === "VERIFIED") {
        return {
            label: "Đã xác minh",
            color: "bg-sky-100 text-sky-800 border-sky-200",
            description: "Lô đã được xác minh, chờ chốt giá và đăng bán.",
        }
    }

    if (normalized === "PRICED") {
        return {
            label: "Đã chốt giá",
            color: "bg-violet-100 text-violet-700 border-violet-200",
            description: "Lô đã có giá bán, chờ đăng bán cho khách hàng.",
        }
    }

    if (normalized === "PUBLISHED") {
        return {
            label: "Đang bán",
            color: "bg-emerald-100 text-emerald-700 border-emerald-200",
            description: "Lô đang hiển thị và có thể được khách hàng mua.",
        }
    }

    if (normalized === "EXPIRED") {
        return {
            label: "Hết hạn",
            color: "bg-orange-100 text-orange-800 border-orange-200",
            description: "Lô đã quá hạn sử dụng, không thể đăng bán cho khách.",
        }
    }

    if (normalized === "SOLDOUT") {
        return {
            label: "Hết hàng",
            color: "bg-slate-100 text-slate-600 border-slate-200",
            description: "Lô đã hết tồn kho.",
        }
    }

    return {
        label: "Không xác định",
        color: "bg-slate-100 text-slate-700 border-slate-200",
        description: "Không xác định được trạng thái lô hàng.",
    }
}

const getLotStatusLabel = (status?: string | number | null) =>
    getLotStatusMeta(status).label

const getProductStatusLabel = (status?: number | null) => {
    if (typeof status !== "number") return "—"
    return (
        PRODUCT_STATUS_OPTIONS.find((item) => item.value === status)?.label ??
        String(status)
    )
}

const getFreshFoodLabel = (isFreshFood?: boolean | null) => {
    if (typeof isFreshFood !== "boolean") return "—"
    return isFreshFood ? "Tươi sống" : "Thông thường"
}

const getMerchandiseTypeLabel = (type?: number | null) => {
    if (typeof type !== "number") return "—"
    return (
        PRODUCT_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? "—"
    )
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
        .toLocaleLowerCase("vi-VN")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .split(" ")
        .map((word) =>
            word ? word.charAt(0).toLocaleUpperCase("vi-VN") + word.slice(1) : word,
        )
        .join(" ")
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

const createNutritionRow = (
    label = "",
    value = "",
): NutritionFactRow => ({
    id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
    label,
    value,
})

const nutritionObjectToRows = (
    input?: Record<string, string> | null,
): NutritionFactRow[] => {
    if (!input || typeof input !== "object") return [createNutritionRow()]

    const entries = Object.entries(input).filter(
        ([key, value]) => key?.trim() && String(value ?? "").trim(),
    )

    if (entries.length === 0) return [createNutritionRow()]

    return entries.map(([label, value]) =>
        createNutritionRow(label, String(value)),
    )
}

const nutritionRowsToJsonString = (rows: NutritionFactRow[]): string => {
    const normalizedEntries = rows
        .map((row) => ({
            label: row.label.trim(),
            value: row.value.trim(),
        }))
        .filter((row) => row.label && row.value)

    return JSON.stringify(
        Object.fromEntries(
            normalizedEntries.map((row) => [row.label, row.value]),
        ),
    )
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
    nutritionFactsText: "",
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

const buildEditForm = (
    product: ProductResponseDto,
    detail: ProductDetailDto,
): ProductEditFormValues => {
    return {
        supermarketId: product.supermarketId || "",
        name: product.name || detail.name || "",
        categoryName: product.category || detail.category || "",
        barcode: product.barcode || detail.barcode || "",
        type:
            typeof product.type === "number"
                ? product.type
                : typeof detail.type === "number"
                    ? detail.type
                    : 0,
        sku: product.sku || "",
        status:
            typeof product.status === "number"
                ? product.status
                : typeof detail.status === "number"
                    ? detail.status
                    : 0,

        // BE không GET ra ổn định => không dùng để edit
        responsibleOrg: "",
        isFeatured: false,
        tagsText: "",

        brand: product.brand || detail.brand || "",
        ingredientsText: joinIngredientsMultiline(detail.ingredients || product.ingredients),
        nutritionFactsText: JSON.stringify(
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
        throw new Error("Thành phần dinh dưỡng phải là JSON object hợp lệ")
    } catch {
        throw new Error("Thành phần dinh dưỡng phải là JSON object hợp lệ")
    }
}

const buildUpdatePayload = (form: ProductEditFormValues): ProductUpdatePayload => {
    return {
        supermarketId: form.supermarketId.trim(),
        name: form.name.trim(),
        categoryName: form.categoryName.trim(),
        barcode: form.barcode.trim(),
        type: (Number(form.type) || 0) as ProductTypeValue,
        sku: form.sku.trim(),
        status: (Number(form.status) || 0) as ProductStateValue,
        responsibleOrg: form.responsibleOrg.trim() || undefined,
        isFeatured: Boolean(form.isFeatured),
        tags: form.tagsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        detail: {
            brand: form.brand.trim() || undefined,
            ingredients: form.ingredientsText
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
                .join(", ") || undefined,
            nutritionFactsJson: parseNutritionFactsText(form.nutritionFactsText),
            usageInstructions: form.usageInstructions.trim() || undefined,
            storageInstructions: form.storageInstructions.trim() || undefined,
            manufacturer: form.manufacturer.trim() || undefined,
            origin: form.origin.trim() || undefined,
            description: form.description.trim() || undefined,
            safetyWarnings: form.safetyWarnings.trim() || undefined,
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

    const [lots, setLots] = useState<ProductLotItem[]>([])
    const [loading, setLoading] = useState(false)

    const [keyword, setKeyword] = useState("")
    const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("Tất cả hạn dùng")
    const [statusFilter, setStatusFilter] = useState<LotStatusFilter>("ALL")

    const [sortRules, setSortRules] = useState<SortRule[]>([])

    const [page, setPage] = useState(1)
    const pageSize = 10
    const [totalPages, setTotalPages] = useState(1)
    const [serverTotal, setServerTotal] = useState(0)

    const [selectedLotState, setSelectedLot] = useState<ProductLotItem | null>(null)
    const selectedLot = selectedLotState ?? EMPTY_PARTIAL_PRODUCT_LOT
    const [selectedProduct, setSelectedProduct] = useState<ProductResponseDto | null>(null)
    const [selectedProductDetail, setSelectedProductDetail] =
        useState<ProductDetailDto | null>(null)
    const [openDetail, setOpenDetail] = useState(false)
    const [loadingPopup, setLoadingPopup] = useState(false)
    const [lotActionLoading, setLotActionLoading] = useState(false)

    const [isEditing, setIsEditing] = useState(false)
    const [savingEdit, setSavingEdit] = useState(false)
    const [editForm, setEditForm] = useState<ProductEditFormValues>(
        createEmptyEditForm(),
    )
    const [editErrors, setEditErrors] = useState<Record<string, string>>({})
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [replaceExistingImages, setReplaceExistingImages] = useState(false)

    const [nutritionRows, setNutritionRows] = useState<NutritionFactRow[]>([
        createNutritionRow(),
    ])

    const [apiCategoryOptions, setApiCategoryOptions] = useState<string[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)

    const [activeTab, setActiveTab] = useState<"PRODUCTS" | "LOTS">("PRODUCTS")
    const [unitById, setUnitById] = useState<Record<string, UnitItem>>({})
    const [productUnitDraft, setProductUnitDraft] = useState("")
    const [savingProductUnit, setSavingProductUnit] = useState(false)
    const [productPurchaseUnits, setProductPurchaseUnits] = useState<
        ProductPurchaseUnit[]
    >([])
    const [productPurchaseUnitsLoading, setProductPurchaseUnitsLoading] =
        useState(false)

    const unitCatalog = useMemo(
        () => Object.values(unitById),
        [unitById],
    )

    const productUnitSelectOptions = useMemo(() => {
        const productType =
            selectedProductDetail?.unitType?.trim() ||
            selectedProduct?.unitType?.trim() ||
            ""

        if (!productType) return unitCatalog

        const normalized = productType.toLowerCase()
        return unitCatalog.filter(
            (unit) => unit.type?.trim().toLowerCase() === normalized,
        )
    }, [unitCatalog, selectedProductDetail?.unitType, selectedProduct?.unitType])

    const handleAddProduct = () => {
        navigate("/supermarketStaff/products/workflow")
    }

    const toggleSort = (field: SortField) => {
        setSortRules((prev) => {
            const existing = prev.find((item) => item.field === field)

            if (!existing) {
                return [{ field, direction: "asc" }, ...prev]
            }

            if (existing.direction === "asc") {
                return [
                    { field, direction: "desc" },
                    ...prev.filter((item) => item.field !== field),
                ]
            }

            return prev.filter((item) => item.field !== field)
        })
    }

    const getSortDirection = (field: SortField): SortDirection | null => {
        const matched = sortRules.find((item) => item.field === field)
        return matched?.direction || null
    }

    const mapExpiryFilterToApi = (
        value: ExpiryFilter,
    ): 1 | 2 | 3 | 4 | 5 | undefined => {
        switch (value) {
            case "Hết hạn hôm nay":
                return 1
            case "Còn 1 - 2 ngày":
                return 2
            case "Còn 3 - 7 ngày":
                return 3
            case "Còn trên 7 ngày":
                return 4
            case "Đã hết hạn":
                return 5
            default:
                return undefined
        }
    }

    const loadCategories = async () => {
        setLoadingCategories(true)

        try {
            const categories = await categoryService.getCategories(false)

            const names = Array.from(
                new Set(
                    (Array.isArray(categories) ? categories : [])
                        .map((item) => item?.name?.trim())
                        .filter((item): item is string => Boolean(item)),
                ),
            ).sort((a, b) => a.localeCompare(b, "vi"))

            setApiCategoryOptions(names)
        } catch (error) {
            setApiCategoryOptions([])
        } finally {
            setLoadingCategories(false)
        }
    }

    const loadLots = async () => {
        if (!supermarketId) {
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
    }, [page, keyword, expiryFilter, statusFilter, supermarketId])

    useEffect(() => {
        setPage(1)
    }, [keyword, expiryFilter, statusFilter])

    useEffect(() => {
        void loadCategories()
    }, [])

    useEffect(() => {
        const loadUnits = async () => {
            try {
                const units = await unitService.getUnits()
                const map = Object.fromEntries(
                    (Array.isArray(units) ? units : []).map((unit) => [unit.unitId, unit]),
                )
                setUnitById(map)
            } catch {
            }
        }

        void loadUnits()
    }, [])

    const displayLots = useMemo(() => {
        if (sortRules.length === 0) return lots

        const cloned = [...lots]

        cloned.sort((a, b) => {
            for (const rule of sortRules) {
                let result = 0

                if (rule.field === "brand") {
                    result = compareText(a.brand, b.brand)
                }

                if (rule.field === "category") {
                    result = compareText(a.category, b.category)
                }

                if (rule.field === "type") {
                    result = compareBooleanLabel(Boolean(a.isFreshFood), Boolean(b.isFreshFood))
                }

                if (result !== 0) {
                    return rule.direction === "asc" ? result : -result
                }
            }

            return 0
        })

        return cloned
    }, [lots, sortRules])

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
        const hiddenCount = lots.filter(
            (item) => normalizeLotStatus(item.status) === "HIDDEN",
        ).length
        const deletedCount = lots.filter(
            (item) => normalizeLotStatus(item.status) === "DELETED",
        ).length

        return {
            draftCount,
            pricedCount,
            publishedCount,
            hiddenCount,
            deletedCount,
            currentPageCount: lots.length,
        }
    }, [lots])

    const fallbackCategoryOptions = useMemo(() => {
        const values = new Set<string>()

        lots.forEach((item) => {
            if (item.category?.trim()) values.add(item.category.trim())
        })

        if (selectedLot?.category?.trim()) values.add(selectedLot.category.trim())
        if (selectedProduct?.category?.trim()) values.add(selectedProduct.category.trim())
        if (selectedProductDetail?.category?.trim()) {
            values.add(selectedProductDetail.category.trim())
        }
        if (editForm.categoryName?.trim()) values.add(editForm.categoryName.trim())

        return Array.from(values).sort((a, b) => a.localeCompare(b, "vi"))
    }, [
        lots,
        selectedLot?.category,
        selectedProduct?.category,
        selectedProductDetail?.category,
        editForm.categoryName,
    ])

    const categoryOptions = useMemo(() => {
        const values = new Set<string>()

        apiCategoryOptions.forEach((item) => {
            if (item?.trim()) values.add(item.trim())
        })

        fallbackCategoryOptions.forEach((item) => {
            if (item?.trim()) values.add(item.trim())
        })

        return Array.from(values).sort((a, b) => a.localeCompare(b, "vi"))
    }, [apiCategoryOptions, fallbackCategoryOptions])

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
        resolveProductImageFromDto(
            selectedProduct?.productImages?.[0],
            selectedProduct?.mainImageUrl,
        ) ||
        resolveProductImageFromDto(
            selectedProductDetail?.productImages?.[0],
            selectedProductDetail?.mainImageUrl,
        ) ||
        resolveProductImageFromDto(
            selectedLot?.productImages?.[0],
            selectedLot?.mainImageUrl,
        ) ||
        "/placeholder.png"

    useEffect(() => {
        setProductUnitDraft(
            selectedProduct?.unitId ||
            selectedProductDetail?.unitId ||
            selectedLot?.unitId ||
            "",
        )
    }, [
        selectedProduct?.unitId,
        selectedProductDetail?.unitId,
        selectedLot?.unitId,
        openDetail,
    ])

    const handleSaveProductUnit = async () => {
        const productId =
            selectedProduct?.productId || selectedProductDetail?.productId
        if (!productId || !productUnitDraft) return

        const currentUnitId =
            selectedProduct?.unitId || selectedProductDetail?.unitId || ""
        if (productUnitDraft === currentUnitId) {
            toast.success("Đơn vị gốc sản phẩm không thay đổi")
            return
        }

        setSavingProductUnit(true)
        try {
            const updated = await productService.updateProductUnit(
                productId,
                productUnitDraft,
            )
            setSelectedProduct(updated)
            const detail = await productService.getProductDetails(productId)
            setSelectedProductDetail(detail)
            toast.success("Đã cập nhật đơn vị gốc sản phẩm")
        } catch (error) {
            toast.error(
                getApiErrorMessage(error, "Không thể cập nhật đơn vị gốc sản phẩm"),
            )
        } finally {
            setSavingProductUnit(false)
        }
    }

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
        setNutritionRows([createNutritionRow()])
        setImageFiles([])
        setReplaceExistingImages(false)

        try {
            const [product, detail] = await Promise.all([
                productService.getProductById(lot.productId),
                productService.getProductDetails(lot.productId),
            ])

            setSelectedProduct(product)
            setSelectedProductDetail(detail)

            const nextForm = buildEditForm(product, detail)
            setEditForm(nextForm)
            setNutritionRows(
                nutritionObjectToRows(detail.nutritionFacts || product.nutritionFacts || {}),
            )
            setImageFiles([])
            setReplaceExistingImages(false)
        } catch (error) {
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
        setLotActionLoading(false)
        setIsEditing(false)
        setSavingEdit(false)
        setEditErrors({})
        setEditForm(createEmptyEditForm())
        setNutritionRows([createNutritionRow()])
        setProductPurchaseUnits([])
    }

    const handleDisableLot = async () => {
        if (!selectedLotState?.lotId || lotActionLoading) return

        const lotName =
            selectedLot.productName ||
            selectedProductDetail?.name ||
            selectedProduct?.name ||
            "lô hàng này"

        const ok = window.confirm(
            `Bạn có chắc muốn ẩn lô "${lotName}"?\n\nLô sẽ không hiển thị cho khách hàng. Nhân viên siêu thị vẫn xem được và có thể đăng bán lại sau.`,
        )
        if (!ok) return

        setLotActionLoading(true)
        try {
            await productLotService.disableLot(selectedLotState.lotId)
            toast.success("Đã ẩn lô hàng")
            handleCloseDetail()
            await loadLots()
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Không thể ẩn lô hàng"))
        } finally {
            setLotActionLoading(false)
        }
    }

    const handleDeleteLot = async () => {
        if (!selectedLotState?.lotId || lotActionLoading) return

        const lotName =
            selectedLot.productName ||
            selectedProductDetail?.name ||
            selectedProduct?.name ||
            "lô hàng này"

        const ok = window.confirm(
            `Bạn có chắc muốn xóa lô "${lotName}"?\n\nLô sẽ chuyển sang trạng thái đã xóa và tồn kho được đặt về 0. Dữ liệu lô vẫn được giữ lại trong hệ thống.`,
        )
        if (!ok) return

        setLotActionLoading(true)
        try {
            await productLotService.deleteLot(selectedLotState.lotId)
            toast.success("Đã xóa lô hàng")
            handleCloseDetail()
            await loadLots()
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Không thể xóa lô hàng"))
        } finally {
            setLotActionLoading(false)
        }
    }

    const handleRepublishLot = async () => {
        if (!selectedLotState?.lotId || lotActionLoading) return

        const lotName =
            selectedLot.productName ||
            selectedProductDetail?.name ||
            selectedProduct?.name ||
            "lô hàng này"

        const ok = window.confirm(
            `Bạn có chắc muốn đăng bán lại lô "${lotName}"?\n\nLô sẽ hiển thị lại cho khách hàng nếu còn tồn kho và chưa hết hạn.`,
        )
        if (!ok) return

        setLotActionLoading(true)
        try {
            await productLotService.republishLot(selectedLotState.lotId)
            toast.success("Đã đăng bán lại lô hàng")
            handleCloseDetail()
            await loadLots()
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Không thể đăng bán lại lô hàng"))
        } finally {
            setLotActionLoading(false)
        }
    }

    const handleOpenProductDetail = async (productId: string) => {
        setSelectedLot(null)
        setSelectedProduct(null)
        setSelectedProductDetail(null)
        setOpenDetail(true)
        setLoadingPopup(true)
        setIsEditing(false)
        setSavingEdit(false)
        setEditErrors({})
        setEditForm(createEmptyEditForm())
        setNutritionRows([createNutritionRow()])
        setProductPurchaseUnits([])
        setProductPurchaseUnitsLoading(true)

        try {
            const [product, detail, purchaseUnits] = await Promise.all([
                productService.getProductById(productId),
                productService.getProductDetails(productId),
                productService.getPurchaseUnits(productId).catch(() => []),
            ])

            setSelectedProduct(product)
            setSelectedProductDetail(detail)
            setProductPurchaseUnits(purchaseUnits)

            const nextForm = buildEditForm(product, detail)
            setEditForm(nextForm)
            setNutritionRows(
                nutritionObjectToRows(detail.nutritionFacts || product.nutritionFacts || {}),
            )
            setImageFiles([])
            setReplaceExistingImages(false)
        } catch (error) {
            toast.error("Không tải được chi tiết sản phẩm")
            setOpenDetail(false)
        } finally {
            setLoadingPopup(false)
            setProductPurchaseUnitsLoading(false)
        }
    }

    const isProductOnlyDetail = Boolean(selectedProduct && !selectedLotState)
    const canEditProductUnit = isProductOnlyDetail
    const selectedLotStatusKey = normalizeLotStatus(selectedLot.status)
    const selectedLotStatusMeta = getLotStatusMeta(selectedLot.status)
    const canHideLot =
        Boolean(selectedLotState) &&
        selectedLotStatusKey !== "HIDDEN" &&
        selectedLotStatusKey !== "DELETED"
    const canDeleteLot =
        Boolean(selectedLotState) && selectedLotStatusKey !== "DELETED"
    const canRepublishLot =
        Boolean(selectedLotState) && selectedLotStatusKey === "HIDDEN"

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

    const setNutritionRow = (
        id: string,
        key: "label" | "value",
        value: string,
    ) => {
        setNutritionRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [key]: value } : row,
            ),
        )

        setEditErrors((prev) => {
            if (!prev.nutritionFactsText) return prev
            const next = { ...prev }
            delete next.nutritionFactsText
            return next
        })
    }

    const addNutritionRow = () => {
        setNutritionRows((prev) => [...prev, createNutritionRow()])
    }

    const removeNutritionRow = (id: string) => {
        setNutritionRows((prev) => {
            const next = prev.filter((row) => row.id !== id)
            return next.length > 0 ? next : [createNutritionRow()]
        })

        setEditErrors((prev) => {
            if (!prev.nutritionFactsText) return prev
            const next = { ...prev }
            delete next.nutritionFactsText
            return next
        })
    }

    const validateEditForm = () => {
        const nextErrors: Record<string, string> = {}

        if (!editForm.supermarketId.trim()) {
            nextErrors.supermarketId = "Thiếu mã siêu thị"
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
            parseNutritionFactsText(nutritionRowsToJsonString(nutritionRows))
        } catch (error) {
            nextErrors.nutritionFactsText =
                error instanceof Error
                    ? error.message
                    : "Thành phần dinh dưỡng không hợp lệ"
        }

        setEditErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const handleSelectImages = (files: FileList | null) => {
        const nextFiles = Array.from(files || [])
        const validImages = nextFiles.filter((file) => file.type.startsWith("image/"))

        if (validImages.length !== nextFiles.length) {
            toast.error("Chỉ được chọn file ảnh")
        }

        if (validImages.length === 0) return

        setImageFiles((prev) => [...prev, ...validImages])
    }

    const handleRemoveImageFile = (index: number) => {
        setImageFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
    }

    const handleSaveProduct = async () => {
        const targetId = [
            selectedLotState?.productId,
            selectedProductDetail?.productId,
            selectedProduct?.productId,
        ].find((id): id is string => Boolean(id?.trim()))

        if (!targetId) {
            toast.error("Không tìm thấy mã sản phẩm để cập nhật")
            return
        }

        if (!validateEditForm()) return

        setSavingEdit(true)

        try {
            const payload = buildUpdatePayload({
                ...editForm,
                nutritionFactsText: nutritionRowsToJsonString(nutritionRows),
            })

            const updateResponse = await productService.updateProduct(
                targetId,
                payload,
            )
            let imageUpdateResponse: ProductResponseDto | null = null

            if (imageFiles.length > 0) {
                imageUpdateResponse = await productService.updateProductImages(
                    targetId,
                    imageFiles,
                    replaceExistingImages,
                )
            }

            const [product, detail] = await Promise.all([
                productService.getProductById(targetId),
                productService.getProductDetails(targetId),
            ])

            const normalizedIngredients = (payload.detail.ingredients ?? "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
                .join("|")

            const fetchedIngredients = (detail.ingredients || product.ingredients || [])
                .map((item) => item.trim())
                .filter(Boolean)
                .join("|")

            const expectedNutrition = JSON.stringify(
                JSON.parse(payload.detail.nutritionFactsJson || "{}"),
            )
            const actualNutrition = JSON.stringify(
                detail.nutritionFacts || product.nutritionFacts || {},
            )

            const expectedBrand = payload.detail.brand?.trim() ?? ""
            const expectedManufacturer = payload.detail.manufacturer?.trim() ?? ""
            const expectedOrigin = payload.detail.origin?.trim() ?? ""
            const expectedDescription = payload.detail.description?.trim() ?? ""
            const expectedUsageInstructions = payload.detail.usageInstructions?.trim() ?? ""
            const expectedStorageInstructions = payload.detail.storageInstructions?.trim() ?? ""
            const expectedSafetyWarnings = payload.detail.safetyWarnings?.trim() ?? ""

            const isMetadataSynced =
                (product.name || detail.name || "").trim() === payload.name.trim() &&
                (product.barcode || detail.barcode || "").trim() === payload.barcode.trim() &&
                (product.category || detail.category || "").trim() === payload.categoryName.trim() &&
                (product.brand || detail.brand || "").trim() === expectedBrand &&
                (product.sku || "").trim() === payload.sku.trim() &&
                Number(product.type ?? detail.type ?? 0) === Number(payload.type) &&
                Number(product.status ?? detail.status ?? 0) === Number(payload.status) &&
                (detail.manufacturer || "").trim() === expectedManufacturer &&
                (detail.origin || "").trim() === expectedOrigin &&
                (detail.description || "").trim() === expectedDescription &&
                (detail.usageInstructions || "").trim() === expectedUsageInstructions &&
                (detail.storageInstructions || "").trim() === expectedStorageInstructions &&
                (detail.safetyWarning || "").trim() === expectedSafetyWarnings &&
                fetchedIngredients === normalizedIngredients &&
                actualNutrition === expectedNutrition

            const uploadedImageCount = imageFiles.length

            if (!isMetadataSynced && !imageUpdateResponse) {
                toast.error(
                    "BE báo thành công nhưng dữ liệu chưa được cập nhật thật",
                )
                return
            }

            const nextProduct = imageUpdateResponse || product

            setSelectedProduct(nextProduct)
            setSelectedProductDetail({
                ...detail,
                mainImageUrl: nextProduct.mainImageUrl || detail.mainImageUrl,
                totalImages: nextProduct.totalImages ?? detail.totalImages,
                productImages: nextProduct.productImages?.length
                    ? nextProduct.productImages
                    : detail.productImages,
            })
            setEditForm(buildEditForm(product, detail))
            setNutritionRows(
                nutritionObjectToRows(detail.nutritionFacts || product.nutritionFacts || {}),
            )
            setImageFiles([])
            setReplaceExistingImages(false)
            setIsEditing(false)

            await loadLots()

            if (imageUpdateResponse && !isMetadataSynced) {
                toast.success("Cập nhật ảnh sản phẩm thành công")
            } else if (uploadedImageCount > 0) {
                toast.success("Cập nhật thông tin và ảnh sản phẩm thành công")
            } else {
                toast.success(
                    updateResponse.message ||
                    "Cập nhật thông tin sản phẩm thành công",
                )
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Không thể cập nhật thông tin sản phẩm",
            )
        } finally {
            setSavingEdit(false)
        }
    }

    const effectiveDaysRemaining =
        typeof selectedLot?.daysRemaining === "number"
            ? selectedLot.daysRemaining
            : typeof selectedProductDetail?.daysToExpiry === "number"
                ? selectedProductDetail.daysToExpiry
                : null

    const effectiveHoursRemaining =
        effectiveDaysRemaining === null &&
            typeof selectedLot?.hoursRemaining === "number"
            ? selectedLot.hoursRemaining
            : null

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-[1380px] px-4 pb-10 pt-4 md:px-5 md:pt-6">
                <div className="mb-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                <Sparkles className="h-3.5 w-3.5" />
                                Sản phẩm & Lô hàng
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
                                Quản lý sản phẩm của {supermarketName}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Quản lý danh sách sản phẩm và theo dõi các lô hàng chi tiết.
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

                    <div className="mt-6 flex space-x-2 border-b border-slate-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab("PRODUCTS")}
                            className={cn(
                                "px-4 py-2.5 text-sm font-semibold transition border-b-2",
                                activeTab === "PRODUCTS"
                                    ? "border-emerald-500 text-emerald-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Danh sách sản phẩm
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("LOTS")}
                            className={cn(
                                "px-4 py-2.5 text-sm font-semibold transition border-b-2",
                                activeTab === "LOTS"
                                    ? "border-emerald-500 text-emerald-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Danh sách lô hàng
                        </button>
                    </div>
                </div>

                {activeTab === "PRODUCTS" ? (
                    <ProductsTab
                        supermarketId={supermarketId}
                        onViewDetail={handleOpenProductDetail}
                    />
                ) : (
                    <>
                        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                            <SummaryCard title="Tổng lô hàng" value={serverTotal} />
                            <SummaryCard title="Trên trang này" value={summary.currentPageCount} />
                            <SummaryCard title="Đã chốt giá" value={summary.pricedCount} />
                            <SummaryCard title="Đang bán" value={summary.publishedCount} />
                            <SummaryCard title="Đã ẩn" value={summary.hiddenCount} />
                            <SummaryCard title="Đã xóa" value={summary.deletedCount} />
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
                                        placeholder="Nhập tên sản phẩm hoặc mã vạch..."
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
                                        { label: "Đã ẩn", value: "HIDDEN" },
                                        { label: "Đã xóa", value: "DELETED" },
                                        { label: "Hết hạn", value: "EXPIRED" },
                                        { label: "Hết hàng", value: "SOLDOUT" },
                                    ]}
                                />

                                <SelectBox
                                    value={expiryFilter}
                                    onChange={(value) => setExpiryFilter(value as ExpiryFilter)}
                                    options={[
                                        { label: "Tất cả hạn dùng", value: "Tất cả hạn dùng" },
                                        { label: "Hết hạn hôm nay", value: "Hết hạn hôm nay" },
                                        { label: "Còn 1 - 2 ngày", value: "Còn 1 - 2 ngày" },
                                        { label: "Còn 3 - 7 ngày", value: "Còn 3 - 7 ngày" },
                                        { label: "Còn trên 7 ngày", value: "Còn trên 7 ngày" },
                                        { label: "Đã hết hạn", value: "Đã hết hạn" },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Danh sách lô hàng sản phẩm
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {loading
                                            ? "Đang tải dữ liệu..."
                                            : `${displayLots.length} lô hàng trên trang này`}
                                    </p>
                                </div>
                                {!loading && displayLots.length > 0 ? (
                                    <p className="text-[11px] text-slate-400">
                                        Cuộn ngang để xem đầy đủ cột
                                    </p>
                                ) : null}
                            </div>

                            {loading ? (
                                <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                                    <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                                    Đang tải danh sách lô hàng...
                                </div>
                            ) : displayLots.length === 0 ? (
                                <div className="flex h-[300px] flex-col items-center justify-center px-6 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                        <Package2 className="h-7 w-7 text-slate-400" />
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-800">
                                        Chưa có lô hàng phù hợp
                                    </h3>
                                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                        Bạn thử đổi từ khóa tìm kiếm hoặc thay bộ lọc để xem thêm lô hàng.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className={LOT_TABLE_MIN_WIDTH}>
                                        <div
                                            className={cn(
                                                LOT_TABLE_GRID,
                                                "border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-600",
                                            )}
                                        >
                                            <div>Sản phẩm</div>

                                            <SortableHeader
                                                label="Thương hiệu"
                                                direction={getSortDirection("brand")}
                                                onClick={() => toggleSort("brand")}
                                            />

                                            <SortableHeader
                                                label="Danh mục"
                                                direction={getSortDirection("category")}
                                                onClick={() => toggleSort("category")}
                                            />

                                            <SortableHeader
                                                label="Loại hàng"
                                                direction={getSortDirection("type")}
                                                onClick={() => toggleSort("type")}
                                            />

                                            <div>Trạng thái</div>
                                            <div>Tồn kho</div>
                                            <div>Hạn dùng</div>
                                            <div className="text-center">Giá bán</div>
                                            <div className="text-center">Giá AI</div>
                                            <div className="text-center">Xem</div>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {displayLots.map((lot) => {
                                                const statusMeta = getLotStatusMeta(lot.status)
                                                const originalPrice = lot.originalUnitPrice ?? null
                                                const aiSuggestedPrice = lot.suggestedUnitPrice ?? null
                                                const sellingPrice =
                                                    lot.finalUnitPrice ?? lot.sellingUnitPrice ?? null
                                                const discount = calcDiscount(
                                                    originalPrice,
                                                    sellingPrice ?? aiSuggestedPrice,
                                                )

                                                const remainingText =
                                                    typeof lot.daysRemaining === "number" ||
                                                        typeof lot.hoursRemaining === "number"
                                                        ? `${typeof lot.daysRemaining === "number" ? `${lot.daysRemaining} ngày` : "—"}${typeof lot.hoursRemaining === "number" ? ` • ${lot.hoursRemaining} giờ` : ""}`
                                                        : "—"

                                                return (
                                                    <div
                                                        key={lot.lotId}
                                                        className={cn(
                                                            LOT_TABLE_GRID,
                                                            "px-4 py-3 text-[11px] text-slate-700 transition hover:bg-emerald-50/30",
                                                        )}
                                                    >
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                                                <img
                                                                    src={getImageUrl(
                                                                        resolveProductImageFromDto(
                                                                            lot.productImages?.[0],
                                                                            lot.mainImageUrl,
                                                                        ) || "/placeholder.png",
                                                                    )}
                                                                    alt={lot.productName || "sản phẩm"}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="line-clamp-2 text-[11px] font-semibold leading-snug text-slate-900">
                                                                    {lot.productName || "—"}
                                                                </div>
                                                                <div className="mt-0.5 truncate text-[9px] text-slate-400">
                                                                    {lot.barcode || lot.lotId || "—"}
                                                                </div>
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
                                                                {getFreshFoodLabel(lot.isFreshFood)}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <span
                                                                className={cn(
                                                                    "inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                                                                    statusMeta.color,
                                                                )}
                                                            >
                                                                {statusMeta.label}
                                                            </span>
                                                        </div>

                                                        <div className="min-w-0 space-y-0.5">
                                                            <div className="text-[10px] font-semibold text-slate-800">
                                                                {typeof lot.quantity === "number"
                                                                    ? lot.quantity
                                                                    : "—"}{" "}
                                                                {formatUnitLabel(lot.unitName, lot.unitSymbol)}
                                                            </div>
                                                            <div className="truncate text-[9px] text-slate-500">
                                                                {lot.unitType || "—"}
                                                                {typeof lot.weight === "number"
                                                                    ? ` • KL: ${lot.weight}`
                                                                    : ""}
                                                            </div>
                                                            {(() => {
                                                                const unitMeta = lot.unitId
                                                                    ? unitById[lot.unitId]
                                                                    : undefined
                                                                const conversionHint = unitMeta
                                                                    ? formatConversionRateHintWithBase(
                                                                        unitMeta,
                                                                        unitCatalog,
                                                                    )
                                                                    : lot.conversionRate &&
                                                                        lot.conversionRate !== 1
                                                                        ? formatConversionRateHintWithBase(
                                                                            {
                                                                                name: lot.unitName,
                                                                                symbol: lot.unitSymbol,
                                                                                type: lot.unitType,
                                                                                conversionRate:
                                                                                    lot.conversionRate,
                                                                            },
                                                                            unitCatalog,
                                                                        )
                                                                        : null
                                                                return conversionHint ? (
                                                                    <div className="truncate text-[9px] text-sky-700">
                                                                        {conversionHint}
                                                                    </div>
                                                                ) : null
                                                            })()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-medium text-slate-800">
                                                                SX: {formatDate(lot.manufactureDate)}
                                                            </div>
                                                            <div className="mt-0.5 text-[10px] text-slate-600">
                                                                HD: {formatDate(lot.expiryDate)}
                                                            </div>
                                                            <div className="mt-1 truncate text-[10px] font-semibold text-amber-700">
                                                                Còn: {remainingText}
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
                        </div>
                    </>
                )}

                {openDetail ? (
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
                                        {selectedLotState
                                            ? selectedLot.productName ||
                                            selectedProductDetail?.name ||
                                            selectedProduct?.name ||
                                            "Chi tiết lô hàng"
                                            : selectedProduct?.name ||
                                            selectedProductDetail?.name ||
                                            "Chi tiết sản phẩm"}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {isEditing
                                            ? "Bạn đang chỉnh sửa thông tin sản phẩm."
                                            : selectedLotState
                                                ? `Trạng thái lô: ${getLotStatusLabel(selectedLot.status)}. Bấm ra ngoài để đóng.`
                                                : "Bấm ra ngoài để đóng popup."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {canRepublishLot && !isEditing ? (
                                        <button
                                            type="button"
                                            onClick={() => void handleRepublishLot()}
                                            disabled={loadingPopup || lotActionLoading}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {lotActionLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4" />
                                                    Đăng bán lại
                                                </>
                                            )}
                                        </button>
                                    ) : null}

                                    {canHideLot && !isEditing ? (
                                        <button
                                            type="button"
                                            onClick={() => void handleDisableLot()}
                                            disabled={loadingPopup || lotActionLoading}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {lotActionLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    <Ban className="h-4 w-4" />
                                                    Ẩn lô
                                                </>
                                            )}
                                        </button>
                                    ) : null}

                                    {canDeleteLot && !isEditing ? (
                                        <button
                                            type="button"
                                            onClick={() => void handleDeleteLot()}
                                            disabled={loadingPopup || lotActionLoading}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {lotActionLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4" />
                                                    Xóa lô
                                                </>
                                            )}
                                        </button>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={() => setIsEditing((prev) => !prev)}
                                        disabled={loadingPopup || !selectedProduct || lotActionLoading}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        {isEditing ? "Xem" : "Sửa"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCloseDetail}
                                        disabled={lotActionLoading}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">
                                                            Ảnh sản phẩm
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            Chọn ảnh mới để thêm vào sản phẩm hoặc thay toàn bộ ảnh cũ.
                                                        </div>
                                                    </div>

                                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
                                                        <ImagePlus className="h-4 w-4" />
                                                        Chọn ảnh
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                            onChange={(event) => {
                                                                handleSelectImages(event.target.files)
                                                                event.target.value = ""
                                                            }}
                                                        />
                                                    </label>
                                                </div>

                                                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={replaceExistingImages}
                                                        onChange={(event) => setReplaceExistingImages(event.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300"
                                                    />
                                                    Thay toàn bộ ảnh hiện tại
                                                </label>

                                                {imageFiles.length > 0 ? (
                                                    <div className="mt-4 space-y-2">
                                                        {imageFiles.map((file, index) => (
                                                            <div
                                                                key={`${file.name}-${index}`}
                                                                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="truncate font-medium text-slate-800">
                                                                        {file.name}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">
                                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveImageFile(index)}
                                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-sm text-slate-500">
                                                        Chưa chọn ảnh mới
                                                    </div>
                                                )}
                                            </div>

                                            <FieldLabel label="Tên sản phẩm" required />
                                            <TextInput
                                                value={editForm.name}
                                                onChange={(value) => setEditField("name", value)}
                                                error={editErrors.name}
                                            />

                                            <FieldLabel label="Mã vạch" required />
                                            <TextInput
                                                value={editForm.barcode}
                                                onChange={(value) => setEditField("barcode", value)}
                                                error={editErrors.barcode}
                                            />

                                            <FieldLabel label="Danh mục" required />
                                            <div>
                                                <select
                                                    value={editForm.categoryName}
                                                    onChange={(e) => setEditField("categoryName", e.target.value)}
                                                    disabled={loadingCategories}
                                                    className={cn(
                                                        "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                                                        editErrors.categoryName
                                                            ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-50"
                                                            : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
                                                    )}
                                                >
                                                    <option value="">
                                                        {loadingCategories ? "-- Đang tải danh mục --" : "-- Chọn danh mục --"}
                                                    </option>
                                                    {categoryOptions.map((category) => (
                                                        <option key={category} value={category}>
                                                            {category}
                                                        </option>
                                                    ))}
                                                </select>
                                                {editErrors.categoryName ? (
                                                    <div className="mt-1 text-xs text-rose-500">{editErrors.categoryName}</div>
                                                ) : null}
                                            </div>

                                            <FieldLabel label="Thương hiệu" />
                                            <TextInput
                                                value={editForm.brand}
                                                onChange={(value) => setEditField("brand", value)}
                                            />

                                            <FieldLabel label="SKU" />
                                            <TextInput
                                                value={editForm.sku}
                                                onChange={(value) => setEditField("sku", value)}
                                            />

                                            <FieldLabel label="Loại mặt hàng" />
                                            <SelectInput
                                                value={editForm.type}
                                                onChange={(value) =>
                                                    setEditField("type", Number(value) as ProductTypeValue)
                                                }
                                                options={PRODUCT_TYPE_OPTIONS}
                                            />

                                            <FieldLabel label="Trạng thái sản phẩm" />
                                            <SelectInput
                                                value={editForm.status}
                                                onChange={(value) =>
                                                    setEditField("status", Number(value) as ProductStateValue)
                                                }
                                                options={PRODUCT_STATUS_OPTIONS}
                                            />

                                            <FieldLabel label="Mã siêu thị" />
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                                                {editForm.supermarketId || "—"}
                                            </div>
                                        </div>

                                        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                            <div className="text-sm font-semibold text-slate-900">
                                                Mô tả chi tiết
                                            </div>

                                            <FieldLabel label="Nhà sản xuất" />
                                            <TextInput
                                                value={editForm.manufacturer}
                                                onChange={(value) => setEditField("manufacturer", value)}
                                            />

                                            <FieldLabel label="Xuất xứ" />
                                            <TextInput
                                                value={editForm.origin}
                                                onChange={(value) => setEditField("origin", value)}
                                            />

                                            <FieldLabel label="Mô tả" />
                                            <TextArea
                                                value={editForm.description}
                                                onChange={(value) => setEditField("description", value)}
                                            />

                                            <FieldLabel label="Thành phần" />
                                            <TextArea
                                                value={editForm.ingredientsText}
                                                onChange={(value) => setEditField("ingredientsText", value)}
                                                placeholder="Mỗi dòng một thành phần"
                                            />

                                            <FieldLabel label="Thành phần dinh dưỡng" />

                                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                {nutritionRows.map((row, index) => (
                                                    <div
                                                        key={row.id}
                                                        className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]"
                                                    >
                                                        <TextInput
                                                            value={row.label}
                                                            onChange={(value) =>
                                                                setNutritionRow(row.id, "label", value)
                                                            }
                                                            placeholder={
                                                                index === 0
                                                                    ? "Ví dụ: Năng lượng"
                                                                    : "Tên chỉ số"
                                                            }
                                                        />

                                                        <TextInput
                                                            value={row.value}
                                                            onChange={(value) =>
                                                                setNutritionRow(row.id, "value", value)
                                                            }
                                                            placeholder={
                                                                index === 0 ? "Ví dụ: 76 kcal" : "Giá trị"
                                                            }
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() => removeNutritionRow(row.id)}
                                                            className="inline-flex h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                                            title="Xóa dòng"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}

                                                <div className="flex items-center justify-between gap-3 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={addNutritionRow}
                                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        Thêm dòng
                                                    </button>
                                                </div>
                                            </div>

                                            {editErrors.nutritionFactsText ? (
                                                <div className="mt-1 text-xs text-rose-500">
                                                    {editErrors.nutritionFactsText}
                                                </div>
                                            ) : null}

                                            <FieldLabel label="Hướng dẫn sử dụng" />
                                            <TextArea
                                                value={editForm.usageInstructions}
                                                onChange={(value) =>
                                                    setEditField("usageInstructions", value)
                                                }
                                            />

                                            <FieldLabel label="Hướng dẫn bảo quản" />
                                            <TextArea
                                                value={editForm.storageInstructions}
                                                onChange={(value) =>
                                                    setEditField("storageInstructions", value)
                                                }
                                            />

                                            <FieldLabel label="Cảnh báo an toàn" />
                                            <TextArea
                                                value={editForm.safetyWarnings}
                                                onChange={(value) => setEditField("safetyWarnings", value)}
                                            />
                                        </div>
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
                                                src={getImageUrl(popupImageUrl)}
                                                alt={selectedLot.productName || selectedProductDetail?.name || selectedProduct?.name || "sản phẩm"}
                                                className="h-[280px] w-full object-cover"
                                                onError={(event) => {
                                                    if (event.currentTarget.src !== `${window.location.origin}/placeholder.png`) {
                                                        event.currentTarget.src = "/placeholder.png"
                                                    }
                                                }}
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
                                                    selectedProductDetail?.productImages?.length ??
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
                                                    "Mã vạch",
                                                    selectedProductDetail?.barcode ||
                                                    selectedProduct?.barcode ||
                                                    selectedLot.barcode ||
                                                    "—",
                                                ],
                                                [
                                                    "Mã siêu thị",
                                                    selectedLot.supermarketId ||
                                                    selectedProduct?.supermarketId ||
                                                    selectedProductDetail?.supermarketId ||
                                                    "—",
                                                ],
                                                [
                                                    "Tên siêu thị",
                                                    selectedProductDetail?.supermarketName ||
                                                    selectedLot.supermarketName ||
                                                    "—",
                                                ],
                                                [
                                                    "Mã đơn vị sản phẩm",
                                                    selectedProduct?.unitId ||
                                                    selectedProductDetail?.unitId ||
                                                    "—",
                                                ],
                                                [
                                                    "Tên đơn vị gốc",
                                                    formatUnitLabel(
                                                        selectedProduct?.unitName || selectedProductDetail?.unitName,
                                                        selectedProduct?.unitSymbol || selectedProductDetail?.unitSymbol,
                                                    ),
                                                ],
                                                [
                                                    "Loại đơn vị gốc",
                                                    selectedProduct?.unitType ||
                                                    selectedProductDetail?.unitType ||
                                                    "—",
                                                ],
                                                [
                                                    "Đơn vị lô hàng",
                                                    formatUnitLabel(
                                                        selectedLot.unitName,
                                                        selectedLot.unitSymbol,
                                                    ),
                                                ],
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
                                                    "Loại hàng",
                                                    getFreshFoodLabel(
                                                        selectedProductDetail?.isFreshFood ??
                                                        selectedProduct?.isFreshFood ??
                                                        selectedLot.isFreshFood,
                                                    ),
                                                ],
                                                [
                                                    "Loại mặt hàng",
                                                    getMerchandiseTypeLabel(
                                                        selectedProduct?.type ?? selectedProductDetail?.type,
                                                    ),
                                                ],
                                                ["Trạng thái lô hàng", getLotStatusLabel(selectedLot.status)],
                                                [
                                                    "Trạng thái sản phẩm",
                                                    getProductStatusLabel(
                                                        selectedProduct?.status ??
                                                        selectedProductDetail?.status,
                                                    ),
                                                ],
                                                [
                                                    "Mô tả",
                                                    selectedProductDetail?.description ||
                                                    selectedProduct?.barcodeLookupInfo?.description ||
                                                    "—",
                                                ],
                                                ["Xuất xứ", selectedProductDetail?.origin || "—"],
                                                [
                                                    "Nhà sản xuất",
                                                    selectedProductDetail?.manufacturer ||
                                                    selectedProduct?.barcodeLookupInfo?.manufacturer ||
                                                    "—",
                                                ],
                                            ]}
                                        />

                                        <DetailBlock
                                            title="Thông tin lô hàng / hạn dùng"
                                            rows={[
                                                [
                                                    "Mã trạng thái hạn dùng",
                                                    typeof selectedLot.expiryStatus === "number"
                                                        ? String(selectedLot.expiryStatus)
                                                        : typeof selectedProductDetail?.expiryStatus ===
                                                            "number"
                                                            ? String(selectedProductDetail.expiryStatus)
                                                            : "—",
                                                ],
                                                [
                                                    "Chú thích hạn dùng",
                                                    selectedLot.expiryStatusText ||
                                                    selectedProductDetail?.expiryStatusText ||
                                                    "—",
                                                ],

                                                ...(effectiveDaysRemaining !== null
                                                    ? [
                                                        [
                                                            "Số ngày còn lại",
                                                            String(effectiveDaysRemaining),
                                                        ] as [string, string],
                                                    ]
                                                    : []),

                                                ...(effectiveDaysRemaining === null &&
                                                    effectiveHoursRemaining !== null
                                                    ? [
                                                        [
                                                            "Số giờ còn lại",
                                                            String(effectiveHoursRemaining),
                                                        ] as [string, string],
                                                    ]
                                                    : []),

                                                [
                                                    "Số lượng",
                                                    typeof selectedLot.quantity === "number"
                                                        ? String(selectedLot.quantity)
                                                        : typeof selectedProductDetail?.quantity === "number"
                                                            ? String(selectedProductDetail.quantity)
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
                                                        selectedProduct?.createdAt ||
                                                        selectedProductDetail?.createdAt,
                                                    ),
                                                ],
                                                [
                                                    "Tạo bởi",
                                                    selectedLot.createdBy ||
                                                    selectedProduct?.createdBy ||
                                                    selectedProductDetail?.createdBy ||
                                                    "—",
                                                ],
                                            ]}
                                        />

                                        <DetailBlock
                                            title="Giá gốc / đề xuất / bán"
                                            rows={[
                                                [
                                                    "Giá gốc",
                                                    formatPrice(selectedLot.originalUnitPrice ?? selectedProductDetail?.originalPrice ?? selectedProduct?.originalPrice),
                                                ],
                                                [
                                                    "Giá hệ thống đề xuất",
                                                    formatPrice(selectedLot.suggestedUnitPrice ?? selectedProductDetail?.suggestedPrice ?? selectedProduct?.suggestedPrice),
                                                ],
                                                [
                                                    "Giá bán cuối",
                                                    formatPrice(
                                                        selectedLot.finalUnitPrice ??
                                                        selectedLot.sellingUnitPrice ??
                                                        selectedProductDetail?.finalPrice ??
                                                        selectedProduct?.finalPrice,
                                                    ),
                                                ],
                                            ]}
                                        />

                                        {selectedLotState ? (
                                            <div className="rounded-2xl border border-slate-200 p-5">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    Quản lý trạng thái lô hàng
                                                </div>

                                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                                    <span className="text-sm text-slate-600">
                                                        Trạng thái hiện tại:
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                                                            selectedLotStatusMeta.color,
                                                        )}
                                                    >
                                                        {selectedLotStatusMeta.label}
                                                    </span>
                                                </div>

                                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                                    {selectedLotStatusMeta.description}
                                                </p>

                                                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                                                    {canHideLot ? (
                                                        <li>
                                                            <span className="font-medium text-amber-800">
                                                                Ẩn lô:
                                                            </span>{" "}
                                                            Tạm ẩn khỏi khách hàng, giữ nguyên tồn kho
                                                            để có thể đăng bán lại sau.
                                                        </li>
                                                    ) : null}
                                                    {canRepublishLot ? (
                                                        <li>
                                                            <span className="font-medium text-emerald-800">
                                                                Đăng bán lại:
                                                            </span>{" "}
                                                            Hiển thị lại cho khách khi lô còn tồn kho
                                                            và chưa hết hạn.
                                                        </li>
                                                    ) : null}
                                                    {canDeleteLot ? (
                                                        <li>
                                                            <span className="font-medium text-rose-700">
                                                                Xóa lô:
                                                            </span>{" "}
                                                            Chuyển sang trạng thái đã xóa, đặt tồn kho
                                                            về 0, không xóa dữ liệu khỏi hệ thống.
                                                        </li>
                                                    ) : null}
                                                    {selectedLotStatusKey === "DELETED" ? (
                                                        <li className="text-slate-500">
                                                            Lô đã xóa — không thể thực hiện thêm thao
                                                            tác quản lý.
                                                        </li>
                                                    ) : null}
                                                </ul>
                                            </div>
                                        ) : null}

                                        <div className="rounded-2xl border border-slate-200 p-5">
                                            <div className="text-sm font-semibold text-slate-900">
                                                Thông tin khác / bổ sung
                                            </div>

                                            <div className="mt-4 space-y-5">
                                                <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                                                    <div className="text-sm font-medium text-slate-500">
                                                        Thành phần
                                                    </div>

                                                    <div className="text-sm leading-7 text-slate-800 whitespace-pre-line break-words">
                                                        {ingredientsText && ingredientsText !== "undefined"
                                                            ? ingredientsText
                                                            : "—"}
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-100 pt-5">
                                                    <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                                                        <div className="text-sm font-medium text-slate-500">
                                                            Thành phần dinh dưỡng
                                                        </div>

                                                        <div>
                                                            {nutritionPairs.length === 0 ? (
                                                                <div className="text-sm leading-7 text-slate-500">
                                                                    —
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2.5">
                                                                    {nutritionPairs.map((item, index) => (
                                                                        <div
                                                                            key={`${item.label}-${index}`}
                                                                            className="flex items-start justify-between gap-6 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                                                                        >
                                                                            <div className="min-w-0 text-sm font-medium text-slate-500">
                                                                                {item.label}
                                                                            </div>

                                                                            <div className="shrink-0 whitespace-nowrap text-right text-sm font-medium leading-7 text-slate-800">
                                                                                {item.value || "—"}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {selectedProduct ? (
                                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                                        <Package2 className="h-4 w-4 text-emerald-600" />
                                                                        Đơn vị gốc sản phẩm
                                                                    </div>
                                                                    <p className="mt-1 text-xs text-slate-600">
                                                                        Đơn vị chuẩn khi tạo sản phẩm (
                                                                        {selectedProduct?.unitType ||
                                                                            selectedProductDetail?.unitType ||
                                                                            "—"}
                                                                        ). Chỉ chỉnh được khi sản phẩm chưa có lô.
                                                                    </p>
                                                                </div>
                                                                {isProductOnlyDetail ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleCloseDetail()
                                                                            navigate(
                                                                                "/supermarketStaff/purchase-units",
                                                                                {
                                                                                    state: {
                                                                                        productId:
                                                                                            selectedProduct?.productId,
                                                                                    },
                                                                                },
                                                                            )
                                                                        }}
                                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
                                                                    >
                                                                        Quản lý chi tiết
                                                                    </button>
                                                                ) : null}
                                                            </div>

                                                            {canEditProductUnit ? (
                                                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                                                                    <label className="flex-1 text-sm">
                                                                        <span className="mb-1 block font-medium text-slate-700">
                                                                            Đơn vị gốc
                                                                        </span>
                                                                        <select
                                                                            value={productUnitDraft}
                                                                            onChange={(event) =>
                                                                                setProductUnitDraft(event.target.value)
                                                                            }
                                                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                                                                        >
                                                                            <option value="">— Chọn đơn vị —</option>
                                                                            {productUnitSelectOptions.map((unit) => (
                                                                                <option key={unit.unitId} value={unit.unitId}>
                                                                                    {formatUnitLabel(unit.name, unit.symbol)}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => void handleSaveProductUnit()}
                                                                        disabled={savingProductUnit || !productUnitDraft}
                                                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                                                                    >
                                                                        {savingProductUnit ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Save className="h-4 w-4" />
                                                                        )}
                                                                        Lưu đơn vị gốc
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="mt-4 rounded-xl border border-white/80 bg-white p-3">
                                                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                                        Đơn vị gốc (chỉ đọc)
                                                                    </div>
                                                                    <div className="mt-1 text-sm font-semibold text-slate-900">
                                                                        {formatUnitDisplay(
                                                                            selectedProduct?.unitName ||
                                                                            selectedProductDetail?.unitName,
                                                                            selectedProduct?.unitSymbol ||
                                                                            selectedProductDetail?.unitSymbol,
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {isProductOnlyDetail ? (
                                                                <div className="mt-4 rounded-xl border border-white/80 bg-white p-3">
                                                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                                        Đơn vị khách mua được
                                                                    </div>
                                                                    {productPurchaseUnitsLoading ? (
                                                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                            Đang tải...
                                                                        </div>
                                                                    ) : productPurchaseUnits.length === 0 ? (
                                                                        <p className="mt-2 text-xs text-slate-500">
                                                                            Chưa có lô đang bán — tạo lô với đơn vị phù hợp để mở thêm đơn vị mua.
                                                                        </p>
                                                                    ) : (
                                                                        <ul className="mt-2 space-y-1.5">
                                                                            {productPurchaseUnits.map((unit) => (
                                                                                <li
                                                                                    key={unit.unitId}
                                                                                    className="flex flex-wrap items-center justify-between gap-2 text-xs"
                                                                                >
                                                                                    <span className="font-medium text-slate-800">
                                                                                        {formatUnitDisplay(unit.name, unit.symbol)}
                                                                                        {unit.isProductDefault ? " (chuẩn)" : ""}
                                                                                    </span>
                                                                                    <span className="text-slate-500">
                                                                                        {unit.hasPublishedLot ? "Có lô bán" : "Chưa có lô"}
                                                                                    </span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : null}

                                                    {selectedLot.lotId ? (
                                                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                                            <div className="text-sm font-semibold text-slate-900">
                                                                Đơn vị lô hàng
                                                            </div>
                                                            <p className="mt-1 text-xs text-slate-600">
                                                                Cố định khi tạo lô — giá và tồn kho gắn với đơn vị này, không thể chỉnh sửa.
                                                            </p>
                                                            <div className="mt-3 rounded-xl border border-white bg-white p-3">
                                                                <div className="text-sm font-semibold text-slate-900">
                                                                    {formatUnitLabel(
                                                                        selectedLot.unitName,
                                                                        selectedLot.unitSymbol,
                                                                    )}
                                                                </div>
                                                                <div className="mt-1 text-xs text-slate-500">
                                                                    Loại: {selectedLot.unitType || "—"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    <DetailBlock
                                                        title="Thông tin định danh"
                                                        rows={[
                                                            ["Mã lô hàng", selectedLot.lotId],
                                                            ["Mã sản phẩm", selectedLot.productId],
                                                            [
                                                                "Mã vạch",
                                                                selectedProductDetail?.barcode ||
                                                                selectedProduct?.barcode ||
                                                                selectedLot.barcode ||
                                                                "—",
                                                            ],
                                                            [
                                                                "Mã siêu thị",
                                                                selectedLot.supermarketId ||
                                                                selectedProduct?.supermarketId ||
                                                                selectedProductDetail?.supermarketId ||
                                                                "—",
                                                            ],
                                                            [
                                                                "Tên siêu thị",
                                                                selectedProductDetail?.supermarketName ||
                                                                selectedLot.supermarketName ||
                                                                "—",
                                                            ],
                                                            [
                                                                "Mã đơn vị sản phẩm",
                                                                selectedProduct?.unitId ||
                                                                selectedProductDetail?.unitId ||
                                                                selectedLot.unitId ||
                                                                "—",
                                                            ],
                                                            [
                                                                "Tên đơn vị",
                                                                formatUnitLabel(
                                                                    selectedProduct?.unitName ||
                                                                    selectedProductDetail?.unitName ||
                                                                    selectedLot.unitName,
                                                                    selectedProduct?.unitSymbol ||
                                                                    selectedProductDetail?.unitSymbol ||
                                                                    selectedLot.unitSymbol,
                                                                ),
                                                            ],
                                                            [
                                                                "Loại đơn vị",
                                                                selectedProduct?.unitType ||
                                                                selectedProductDetail?.unitType ||
                                                                selectedLot.unitType ||
                                                                "—",
                                                            ],
                                                            [
                                                                "Hệ số quy đổi",
                                                                (() => {
                                                                    const unitMeta = selectedLot.unitId
                                                                        ? unitById[selectedLot.unitId]
                                                                        : undefined
                                                                    const hint = unitMeta
                                                                        ? formatConversionRateHintWithBase(
                                                                            unitMeta,
                                                                            unitCatalog,
                                                                        )
                                                                        : null
                                                                    if (hint) return hint
                                                                    const rate =
                                                                        selectedProduct?.conversionRate ??
                                                                        selectedProductDetail?.conversionRate ??
                                                                        selectedLot.conversionRate
                                                                    return rate != null && rate !== 1
                                                                        ? `1 đơn vị = ${rate} (cùng loại)`
                                                                        : "Đơn vị gốc (hệ số = 1)"
                                                                })(),
                                                            ],
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
                                                                "Loại hàng",
                                                                getFreshFoodLabel(
                                                                    selectedProductDetail?.isFreshFood ??
                                                                    selectedProduct?.isFreshFood ??
                                                                    selectedLot.isFreshFood,
                                                                ),
                                                            ],
                                                            [
                                                                "Loại mặt hàng",
                                                                getMerchandiseTypeLabel(
                                                                    selectedProduct?.type ?? selectedProductDetail?.type,
                                                                ),
                                                            ],
                                                            ["Trạng thái lô hàng", getLotStatusLabel(selectedLot.status)],
                                                            [
                                                                "Trạng thái sản phẩm",
                                                                getProductStatusLabel(
                                                                    selectedProduct?.status ??
                                                                    selectedProductDetail?.status,
                                                                ),
                                                            ],
                                                            [
                                                                "Mô tả",
                                                                selectedProductDetail?.description ||
                                                                selectedProduct?.barcodeLookupInfo?.description ||
                                                                "—",
                                                            ],
                                                            ["Xuất xứ", selectedProductDetail?.origin || "—"],
                                                            [
                                                                "Nhà sản xuất",
                                                                selectedProductDetail?.manufacturer ||
                                                                selectedProduct?.barcodeLookupInfo?.manufacturer ||
                                                                "—",
                                                            ],
                                                        ]}
                                                    />

                                                    <DetailBlock
                                                        title="Thông tin lô hàng / hạn dùng"
                                                        rows={[
                                                            [
                                                                "Mã trạng thái hạn dùng",
                                                                typeof selectedLot.expiryStatus === "number"
                                                                    ? String(selectedLot.expiryStatus)
                                                                    : typeof selectedProductDetail?.expiryStatus ===
                                                                        "number"
                                                                        ? String(selectedProductDetail.expiryStatus)
                                                                        : "—",
                                                            ],
                                                            [
                                                                "Chú thích hạn dùng",
                                                                selectedLot.expiryStatusText ||
                                                                selectedProductDetail?.expiryStatusText ||
                                                                "—",
                                                            ],

                                                            ...(effectiveDaysRemaining !== null
                                                                ? [
                                                                    [
                                                                        "Số ngày còn lại",
                                                                        String(effectiveDaysRemaining),
                                                                    ] as [string, string],
                                                                ]
                                                                : []),

                                                            ...(effectiveDaysRemaining === null &&
                                                                effectiveHoursRemaining !== null
                                                                ? [
                                                                    [
                                                                        "Số giờ còn lại",
                                                                        String(effectiveHoursRemaining),
                                                                    ] as [string, string],
                                                                ]
                                                                : []),

                                                            [
                                                                "Số lượng",
                                                                typeof selectedLot.quantity === "number"
                                                                    ? String(selectedLot.quantity)
                                                                    : typeof selectedProductDetail?.quantity === "number"
                                                                        ? String(selectedProductDetail.quantity)
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
                                                                    selectedProduct?.createdAt ||
                                                                    selectedProductDetail?.createdAt,
                                                                ),
                                                            ],
                                                            [
                                                                "Tạo bởi",
                                                                selectedLot.createdBy ||
                                                                selectedProduct?.createdBy ||
                                                                selectedProductDetail?.createdBy ||
                                                                "—",
                                                            ],
                                                        ]}
                                                    />

                                                    <DetailBlock
                                                        title="Giá gốc / đề xuất / bán"
                                                        rows={[
                                                            [
                                                                "Giá gốc",
                                                                formatPrice(selectedLot.originalUnitPrice ?? selectedProductDetail?.originalPrice ?? selectedProduct?.originalPrice),
                                                            ],
                                                            [
                                                                "Giá hệ thống đề xuất",
                                                                formatPrice(selectedLot.suggestedUnitPrice ?? selectedProductDetail?.suggestedPrice ?? selectedProduct?.suggestedPrice),
                                                            ],
                                                            [
                                                                "Giá bán cuối",
                                                                formatPrice(
                                                                    selectedLot.finalUnitPrice ??
                                                                    selectedLot.sellingUnitPrice ??
                                                                    selectedProductDetail?.finalPrice ??
                                                                    selectedProduct?.finalPrice,
                                                                ),
                                                            ],
                                                        ]}
                                                    />

                                                    <div className="rounded-2xl border border-slate-200 p-5">
                                                        <div className="text-sm font-semibold text-slate-900">
                                                            Thông tin khác / bổ sung
                                                        </div>

                                                        <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                                                            <div className="text-sm font-medium text-slate-500">
                                                                Hướng dẫn bảo quản
                                                            </div>
                                                            <div className="text-sm leading-7 text-slate-800 break-words">
                                                                {selectedProductDetail?.storageInstructions ||
                                                                    "—"}
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                                                            <div className="text-sm font-medium text-slate-500">
                                                                Cảnh báo an toàn
                                                            </div>
                                                            <div className="text-sm leading-7 text-slate-800 break-words">
                                                                {selectedProductDetail?.safetyWarning || "—"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {activeTab === "LOTS" && (
                    <>
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
                    </>
                )}
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

const SortableHeader = ({
    label,
    direction,
    onClick,
}: {
    label: string
    direction: "asc" | "desc" | null
    onClick: () => void
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-600 transition hover:text-slate-900"
            title={`${label}: bấm để đổi thứ tự sắp xếp`}
        >
            <span>{label}</span>
            <span className="inline-flex w-3 justify-center text-[10px] leading-none">
                {direction === "asc" ? "↑" : direction === "desc" ? "↓" : "↕"}
            </span>
        </button>
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
    rows: Array<[string, string | number | null | undefined]>
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 p-5">
            <div className="text-sm font-semibold text-slate-900">{title}</div>

            <div className="mt-4 space-y-3">
                {rows.map(([label, value]) => (
                    <div
                        key={`${title}-${label}`}
                        className="grid items-start gap-5 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 lg:grid-cols-[180px_minmax(0,1fr)]"
                    >
                        <div className="text-sm font-medium text-slate-500">
                            {label}
                        </div>

                        <div className="text-sm leading-7 text-slate-800 break-words">
                            {value !== null && value !== undefined && String(value) !== "undefined"
                                ? String(value)
                                : "—"}
                        </div>
                    </div>
                ))}
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
