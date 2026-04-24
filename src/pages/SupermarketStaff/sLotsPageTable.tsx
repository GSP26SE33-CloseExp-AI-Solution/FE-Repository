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
    ProductStateValue,
    ProductTypeValue,
    ProductUpdatePayload,
} from "@/types/product.type"
import {
    PRODUCT_STATUS_OPTIONS,
    PRODUCT_TYPE_OPTIONS,
} from "@/types/product.type"
import type { ProductLotItem } from "@/types/product-lot.type"
import { categoryService } from "@/services/category.service"

type LotStatusFilter = "ALL" | "DRAFT" | "PRICED" | "PUBLISHED"
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

    const [nutritionRows, setNutritionRows] = useState<NutritionFactRow[]>([
        createNutritionRow(),
    ])

    const [apiCategoryOptions, setApiCategoryOptions] = useState<string[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)

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
            console.error("ProductsLotsPage.loadCategories -> error:", error)
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
    }, [page, keyword, expiryFilter, statusFilter, supermarketId])

    useEffect(() => {
        setPage(1)
    }, [keyword, expiryFilter, statusFilter])

    useEffect(() => {
        void loadCategories()
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

        return {
            draftCount,
            pricedCount,
            publishedCount,
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
        setNutritionRows([createNutritionRow()])

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
        setNutritionRows([createNutritionRow()])
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

    const handleSaveProduct = async () => {
        if (!selectedLot?.productId) return
        if (!validateEditForm()) return

        setSavingEdit(true)

        try {
            const payload = buildUpdatePayload({
                ...editForm,
                nutritionFactsText: nutritionRowsToJsonString(nutritionRows),
            })

            console.log(
                "ProductsLotsPage.handleSaveProduct -> productId:",
                selectedLot.productId,
            )
            console.log("ProductsLotsPage.handleSaveProduct -> payload:", payload)

            const updateResponse = await productService.updateProduct(
                selectedLot.productId,
                payload,
            )

            console.log(
                "ProductsLotsPage.handleSaveProduct -> update response:",
                updateResponse,
            )

            const [product, detail] = await Promise.all([
                productService.getProductById(selectedLot.productId),
                productService.getProductDetails(selectedLot.productId),
            ])

            console.log("ProductsLotsPage.handleSaveProduct -> refreshed product:", product)
            console.log("ProductsLotsPage.handleSaveProduct -> refreshed detail:", detail)

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

            const didChange =
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

            if (!didChange) {
                console.warn(
                    "ProductsLotsPage.handleSaveProduct -> BE trả success nhưng dữ liệu sau reload không đổi",
                )

                toast.error(
                    updateResponse.message ||
                    "BE báo thành công nhưng dữ liệu chưa được cập nhật thật",
                )
                return
            }

            setSelectedProduct(product)
            setSelectedProductDetail(detail)
            setEditForm(buildEditForm(product, detail))
            setNutritionRows(
                nutritionObjectToRows(detail.nutritionFacts || product.nutritionFacts || {}),
            )
            setIsEditing(false)

            await loadLots()

            toast.success(updateResponse.message || "Cập nhật thông tin sản phẩm thành công")
        } catch (error) {
            console.error("ProductsLotsPage.handleSaveProduct -> error:", error)

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
                                Lô hàng sản phẩm
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
                                Quản lý lô hàng của {supermarketName}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Theo dõi danh sách lô hàng sản phẩm, tìm kiếm nhanh theo tên hoặc
                                mã vạch và lọc theo trạng thái, hạn dùng.
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
                        <SummaryCard title="Tổng lô hàng" value={serverTotal} />
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
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
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
                        <div className="overflow-x-hidden">
                            <div className="min-w-0">
                                <div className="grid grid-cols-[72px_120px_72px_72px_64px_76px_58px_42px_42px_124px_86px_110px_84px_48px] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-600">
                                    <div>Ảnh</div>
                                    <div>Tên sản phẩm</div>

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
                                    <div>Đơn vị/loại</div>
                                    <div className="text-center">Số lượng</div>
                                    <div className="text-center">Khối lượng</div>
                                    <div className="text-center">SX / HD</div>
                                    <div className="text-center">Còn lại</div>
                                    <div className="text-center">Giá bán / gốc</div>
                                    <div className="text-center">Giá AI mới</div>
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
                                                            alt={lot.productName || "sản phẩm"}
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
                                                        {normalizedStatus === "PUBLISHED"
                                                            ? "Đang bán"
                                                            : statusMeta.label}
                                                    </span>
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="truncate text-[10px] font-medium text-slate-700">
                                                        {formatUnitLabel(lot.unitName, lot.unitSymbol)}
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
                                            {selectedLot.productName || "Chi tiết lô hàng sản phẩm"}
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
                                                    src={popupImageUrl}
                                                    alt={selectedLot.productName || "sản phẩm"}
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
                                                    ["Mã đơn vị sản phẩm", selectedLot.unitId || "—"],
                                                    [
                                                        "Tên đơn vị",
                                                        formatUnitLabel(
                                                            selectedProductDetail?.unitName || selectedLot.unitName,
                                                            selectedProductDetail?.unitSymbol || selectedLot.unitSymbol,
                                                        ),
                                                    ],
                                                    [
                                                        "Loại đơn vị",
                                                        selectedProductDetail?.unitType || selectedLot.unitType || "—",
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
                                                    ["Trạng thái lô hàng", selectedLot.status || "—"],
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
                                                        "Giá gốc lô hàng",
                                                        formatPrice(selectedLot.originalUnitPrice),
                                                    ],
                                                    [
                                                        "Giá hệ thống đề xuất lô hàng",
                                                        formatPrice(selectedLot.suggestedUnitPrice),
                                                    ],
                                                    [
                                                        "Giá bán cuối của lô hàng",
                                                        formatPrice(
                                                            selectedLot.finalUnitPrice ??
                                                            selectedLot.sellingUnitPrice,
                                                        ),
                                                    ],
                                                ]}
                                            />

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

                                                    <div className="border-t border-slate-100 pt-5">
                                                        <div className="space-y-4">
                                                            <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                                                                <div className="text-sm font-medium text-slate-500">
                                                                    Hướng dẫn sử dụng
                                                                </div>
                                                                <div className="text-sm leading-7 text-slate-800 break-words">
                                                                    {selectedProductDetail?.usageInstructions ||
                                                                        "—"}
                                                                </div>
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
    rows: Array<[string, string]>
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
