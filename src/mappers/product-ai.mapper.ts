// src/mappers/product-ai.mapper.ts

import type {
    BarcodeLookupInfoDto,
    ExistingProductSummaryDto,
    OcrExtractedInfoDto,
    ProductWorkflowMode,
    ProductWorkflowState,
    ProductWorkflowStep,
    WorkflowAnalyzeImageResultDto,
    WorkflowCreateAndPublishLotResultDto,
    WorkflowCreateProductResultDto,
    WorkflowIdentifyResultDto,
} from "@/types/product-ai-workflow.type"
import {
    buildInitialWorkflowState,
    emptyLotForm,
    emptyProductForm,
} from "@/types/product-ai-workflow.type"

const firstText = (...values: Array<string | null | undefined>) => {
    const found = values.find((value) => typeof value === "string" && value.trim())
    return found?.trim() || ""
}

const stringifyIngredients = (value?: string[] | null) => {
    if (!value?.length) return ""
    return value.filter(Boolean).join(", ")
}

const stringifyNutrition = (value?: Record<string, string> | null) => {
    if (!value || Object.keys(value).length === 0) return ""
    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return ""
    }
}

const normalizeDateInput = (value?: string | null) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value.includes("T") ? value.slice(0, 10) : value
    }
    return date.toISOString().slice(0, 10)
}

export const mapProductStateLabel = (status?: string | number | null) => {
    switch (status) {
        case 0:
        case "Draft":
            return "Nháp"
        case 1:
        case "Verified":
            return "Đã xác nhận"
        case 2:
        case "Priced":
            return "Đã chốt giá"
        case 3:
        case "Published":
            return "Đã đăng bán"
        case 4:
        case "Expired":
            return "Hết hạn"
        case 5:
        case "SoldOut":
            return "Hết hàng"
        case 6:
        case "Hidden":
            return "Đã ẩn"
        case 7:
        case "Deleted":
            return "Đã xóa"
        default:
            return "Chưa rõ"
    }
}

const resolveModeFromNextAction = (
    nextAction?: string | null,
): ProductWorkflowMode => {
    switch (nextAction) {
        case "CREATE_STOCKLOT":
            return "CREATE_STOCKLOT"
        case "VERIFY_PRODUCT":
            return "VERIFY_OWN_PRODUCT"
        case "CHOOSE_OR_CREATE_PRIVATE_PRODUCT":
            return "CREATE_PRIVATE_PRODUCT"
        case "CREATE_PRODUCT":
            return "CREATE_NEW_PRODUCT"
        default:
            return null
    }
}

const resolveStepFromMode = (mode: ProductWorkflowMode): ProductWorkflowStep => {
    switch (mode) {
        case "CREATE_STOCKLOT":
            return "LOT"
        case "VERIFY_OWN_PRODUCT":
        case "CREATE_PRIVATE_PRODUCT":
        case "CREATE_NEW_PRODUCT":
            return "PRODUCT"
        default:
            return "ERROR"
    }
}

const pickOwnProduct = (result: WorkflowIdentifyResultDto) => {
    const matched = result.matchedProducts || []

    if (result.existingProduct && result.nextAction === "VERIFY_PRODUCT") {
        return {
            ...result.existingProduct,
            isCurrentSupermarket: true,
        }
    }

    const current = matched.find((item) => item.isCurrentSupermarket)
    return current || null
}

const pickReferenceProduct = (result: WorkflowIdentifyResultDto) => {
    if (result.nextAction !== "CHOOSE_OR_CREATE_PRIVATE_PRODUCT") return null
    return result.existingProduct || (result.matchedProducts || [])[0] || null
}

const mapReferenceIntoProductForm = ({
    barcode,
    ownProduct,
    referenceProduct,
    lookup,
}: {
    barcode: string
    ownProduct?: ExistingProductSummaryDto | null
    referenceProduct?: ExistingProductSummaryDto | null
    lookup?: BarcodeLookupInfoDto | null
}) => {
    return {
        ...emptyProductForm(),
        barcode: firstText(
            ownProduct?.barcode,
            referenceProduct?.barcode,
            lookup?.barcode,
            barcode,
        ),
        name: firstText(
            ownProduct?.name,
            referenceProduct?.name,
            lookup?.productName,
        ),
        brand: firstText(
            ownProduct?.brand,
            referenceProduct?.brand,
            lookup?.brand,
        ),
        categoryName: firstText(
            ownProduct?.category,
            referenceProduct?.category,
            lookup?.category,
        ),
        manufacturer: firstText(
            ownProduct?.manufacturer,
            referenceProduct?.manufacturer,
            lookup?.manufacturer,
        ),
        origin: firstText(lookup?.country),
        description: firstText(lookup?.description),
        ingredients: firstText(
            stringifyIngredients(ownProduct?.ingredients),
            stringifyIngredients(referenceProduct?.ingredients),
            stringifyIngredients(lookup?.ingredients),
        ),
        nutritionFacts: firstText(
            stringifyNutrition(lookup?.nutritionFacts),
        ),
        usageInstructions: "",
        storageInstructions: "",
        safetyWarnings: "",
    }
}

export const mapWorkflowIdentifyResultToState = (
    result: WorkflowIdentifyResultDto,
): ProductWorkflowState => {
    const mode = resolveModeFromNextAction(result.nextAction)
    const step = resolveStepFromMode(mode)
    const ownProduct = pickOwnProduct(result)
    const referenceProduct = pickReferenceProduct(result)

    const matched = result.matchedProducts || []
    const externalProducts = matched.filter((item) => !item.isCurrentSupermarket)

    const canCreateLotDirectly = Boolean(result.canCreateLotDirectly)

    return {
        ...buildInitialWorkflowState(),
        step,
        mode,
        nextAction: result.nextAction,
        barcode: result.barcode,
        phase: result.phase || null,
        statusText:
            result.nextAction === "CREATE_STOCKLOT"
                ? "Đã có sản phẩm verified của siêu thị hiện tại, đi thẳng tạo lô"
                : result.nextAction === "VERIFY_PRODUCT"
                    ? "Sản phẩm nội bộ cần xác nhận trước khi tạo lô"
                    : result.nextAction === "CHOOSE_OR_CREATE_PRIVATE_PRODUCT"
                        ? "Đã có sản phẩm cùng barcode từ siêu thị khác, chỉ dùng để điền sẵn thông tin"
                        : "Chưa có barcode trong hệ thống, tạo sản phẩm mới",
        errorMessage: null,

        identifyResult: result,
        analyzeResult: null,
        createdProduct: null,
        createdLot: null,

        ownProduct,
        referenceProduct,
        externalProducts,

        requiresVerification: Boolean(result.requiresVerification),
        verificationProductId: result.verificationProductId || null,
        canCreateLotDirectly,
        canCreatePrivateProductForCurrentSupermarket: Boolean(
            result.canCreatePrivateProductForCurrentSupermarket,
        ),

        productForm: mapReferenceIntoProductForm({
            barcode: result.barcode,
            ownProduct,
            referenceProduct,
            lookup: result.barcodeLookupInfo,
        }),
        lotForm: {
            ...emptyLotForm(),
            quantity: 1,
        },
    }
}

export const mapWorkflowAnalyzeImageResultToState = (
    previous: ProductWorkflowState,
    result: WorkflowAnalyzeImageResultDto,
): ProductWorkflowState => {
    const extracted: OcrExtractedInfoDto | null = result.extractedInfo || null
    const lookup = result.barcodeLookupInfo || null

    return {
        ...previous,
        analyzeResult: result,
        productForm: {
            ...previous.productForm,
            barcode: firstText(
                extracted?.barcode,
                lookup?.barcode,
                previous.productForm.barcode,
                previous.barcode,
            ),
            name: firstText(
                extracted?.name,
                lookup?.productName,
                previous.productForm.name,
            ),
            brand: firstText(
                extracted?.brand,
                lookup?.brand,
                previous.productForm.brand,
            ),
            categoryName: firstText(
                extracted?.category,
                lookup?.category,
                previous.productForm.categoryName,
            ),
            manufacturer: firstText(
                extracted?.manufacturer,
                lookup?.manufacturer,
                previous.productForm.manufacturer,
            ),
            origin: firstText(
                extracted?.origin,
                lookup?.country,
                previous.productForm.origin,
            ),
            description: firstText(
                previous.productForm.description,
                lookup?.description,
            ),
            ingredients: firstText(
                stringifyIngredients(extracted?.ingredients),
                stringifyIngredients(lookup?.ingredients),
                previous.productForm.ingredients,
            ),
            nutritionFacts: firstText(
                stringifyNutrition(extracted?.nutritionFacts),
                stringifyNutrition(lookup?.nutritionFacts),
                previous.productForm.nutritionFacts,
            ),
        },
        lotForm: {
            ...previous.lotForm,
            expiryDate:
                normalizeDateInput(extracted?.expiryDate) || previous.lotForm.expiryDate,
            manufactureDate:
                normalizeDateInput(extracted?.manufactureDate) ||
                previous.lotForm.manufactureDate,
        },
    }
}

export const mapWorkflowCreateProductResultToState = (
    previous: ProductWorkflowState,
    result: WorkflowCreateProductResultDto,
): ProductWorkflowState => {
    return {
        ...previous,
        step: "LOT",
        mode: "CREATE_STOCKLOT",
        nextAction: result.nextAction || "CREATE_STOCKLOT",
        statusText:
            result.nextActionDescription ||
            "Đã tạo/xác nhận product thành công, tiếp tục tạo lô",
        createdProduct: result,
        ownProduct: {
            productId: result.productId,
            supermarketId: result.supermarketId,
            name: result.name,
            brand: result.brand,
            category: result.category,
            barcode: result.barcode,
            manufacturer: result.manufacturer,
            ingredients: result.ingredients,
            mainImageUrl: result.mainImageUrl,
            status: result.status,
            isCurrentSupermarket: true,
        },
    }
}

export const mapWorkflowCreateAndPublishLotResultToState = (
    previous: ProductWorkflowState,
    result: WorkflowCreateAndPublishLotResultDto,
): ProductWorkflowState => {
    const stockLot = result.stockLot
    const pricing = result.pricingSuggestion

    return {
        ...previous,
        step: "DONE",
        phase: result.phase || previous.phase,
        statusText: result.pricingSuggestionResolvedBeforePublish
            ? "Đã tạo lot và publish thành công, giá AI đã được xử lý trước khi đăng"
            : "Đã tạo lot và publish thành công",
        createdLot: result,
        productForm: {
            ...previous.productForm,
            categoryName: firstText(
                result.productCategory,
                previous.productForm.categoryName,
            ),
            nutritionFacts: firstText(
                stringifyNutrition(result.productNutritionFacts),
                previous.productForm.nutritionFacts,
            ),
        },
        lotForm: {
            ...previous.lotForm,
            expiryDate:
                normalizeDateInput(stockLot?.expiryDate) || previous.lotForm.expiryDate,
            manufactureDate:
                normalizeDateInput(stockLot?.manufactureDate) ||
                previous.lotForm.manufactureDate,
            quantity:
                typeof stockLot?.quantity === "number"
                    ? stockLot.quantity
                    : previous.lotForm.quantity,
            weight:
                typeof stockLot?.weight === "number"
                    ? stockLot.weight
                    : previous.lotForm.weight,
            originalUnitPrice:
                typeof stockLot?.originalPrice === "number"
                    ? stockLot.originalPrice
                    : typeof pricing?.originalPrice === "number"
                        ? pricing.originalPrice
                        : previous.lotForm.originalUnitPrice,
            finalUnitPrice:
                typeof stockLot?.finalPrice === "number"
                    ? stockLot.finalPrice
                    : typeof pricing?.suggestedPrice === "number" &&
                        previous.lotForm.acceptedSuggestion
                        ? pricing.suggestedPrice
                        : previous.lotForm.finalUnitPrice,
            acceptedSuggestion:
                typeof result.pricingSuggestionResolvedBeforePublish === "boolean"
                    ? result.pricingSuggestionResolvedBeforePublish
                    : previous.lotForm.acceptedSuggestion,
        },
        ownProduct: previous.ownProduct
            ? {
                ...previous.ownProduct,
                category:
                    result.productCategory ?? previous.ownProduct.category ?? null,
            }
            : previous.ownProduct,
    }
}
