import type {
    BarcodeLookupInfoDto,
    ExistingProductSummaryDto,
    OcrExtractedInfoDto,
    OcrPrefillFieldDto,
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
import type { ProductStateValue } from "@/types/product.type"

const firstText = (...values: Array<string | null | undefined>) => {
    const found = values.find((value) => typeof value === "string" && value.trim())
    return found?.trim() || ""
}

const firstNumber = (...values: Array<number | null | undefined>) => {
    const found = values.find(
        (value) => typeof value === "number" && !Number.isNaN(value),
    )
    return typeof found === "number" ? found : undefined
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

const prefillValue = (field?: OcrPrefillFieldDto | null) =>
    (field?.value || "").trim()

const normalizeStatusKey = (status?: string | number | null) => {
    if (typeof status === "number") return status
    return status?.trim().toLowerCase() || ""
}

export const mapProductStateLabel = (
    status?: ProductStateValue | string | number | null,
) => {
    switch (normalizeStatusKey(status)) {
        case 0:
        case "draft":
            return "Nháp"
        case 1:
        case "verified":
            return "Đã xác nhận"
        case 2:
        case "priced":
            return "Đã chốt giá"
        case 3:
        case "published":
            return "Đã đăng bán"
        case 4:
        case "expired":
            return "Hết hạn"
        case 5:
        case "soldout":
        case "sold_out":
        case "sold out":
            return "Hết hàng"
        case 6:
        case "hidden":
            return "Đã ẩn"
        case 7:
        case "deleted":
            return "Đã xóa"
        default:
            return typeof status === "string" && status.trim() ? status : "Chưa rõ"
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

const withCurrentSupermarketFlag = (
    product?: ExistingProductSummaryDto | null,
    isCurrentSupermarket = false,
): ExistingProductSummaryDto | null => {
    if (!product) return null

    return {
        ...product,
        isCurrentSupermarket:
            product.isCurrentSupermarket ?? isCurrentSupermarket,
    }
}

const pickOwnProduct = (result: WorkflowIdentifyResultDto) => {
    if (
        result.existingProduct &&
        (result.nextAction === "CREATE_STOCKLOT" ||
            result.nextAction === "VERIFY_PRODUCT")
    ) {
        return withCurrentSupermarketFlag(result.existingProduct, true)
    }

    const matched = result.matchedProducts || []
    const current = matched.find((item) => item.isCurrentSupermarket)

    return withCurrentSupermarketFlag(current, true)
}

const pickReferenceProduct = (result: WorkflowIdentifyResultDto) => {
    if (result.nextAction !== "CHOOSE_OR_CREATE_PRIVATE_PRODUCT") return null

    if (result.existingProduct) {
        return withCurrentSupermarketFlag(
            result.existingProduct,
            Boolean(result.existingProduct.isCurrentSupermarket),
        )
    }

    const matched = result.matchedProducts || []

    return withCurrentSupermarketFlag(matched[0] || null, false)
}

const mapReferenceIntoProductForm = ({
    barcode,
    ownProduct,
    referenceProduct,
    lookup,
    unitId,
}: {
    barcode: string
    ownProduct?: ExistingProductSummaryDto | null
    referenceProduct?: ExistingProductSummaryDto | null
    lookup?: BarcodeLookupInfoDto | null
    unitId?: string | null
}) => {
    return {
        ...emptyProductForm(),
        unitId: firstText(unitId),
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
        nutritionFacts: firstText(stringifyNutrition(lookup?.nutritionFacts)),
        usageInstructions: "",
        storageInstructions: "",
        safetyWarnings: "",
        isManualFallback: false,
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
    const externalProducts = matched.filter(
        (item) => !item.isCurrentSupermarket && item.productId !== ownProduct?.productId,
    )

    const canCreateLotDirectly =
        typeof result.canCreateLotDirectly === "boolean"
            ? result.canCreateLotDirectly
            : result.nextAction === "CREATE_STOCKLOT"

    const requiresVerification =
        typeof result.requiresVerification === "boolean"
            ? result.requiresVerification
            : result.nextAction === "VERIFY_PRODUCT"

    const canCreatePrivateProductForCurrentSupermarket =
        typeof result.canCreatePrivateProductForCurrentSupermarket === "boolean"
            ? result.canCreatePrivateProductForCurrentSupermarket
            : result.nextAction === "CHOOSE_OR_CREATE_PRIVATE_PRODUCT"

    return {
        ...buildInitialWorkflowState(),
        step,
        mode,
        nextAction: result.nextAction,
        barcode: result.barcode,
        phase: result.phase || null,
        statusText:
            result.nextAction === "CREATE_STOCKLOT"
                ? "Đã có sản phẩm phù hợp, tiếp tục tạo lô hàng"
                : result.nextAction === "VERIFY_PRODUCT"
                    ? "Sản phẩm cần xác nhận trước khi tạo lô hàng"
                    : result.nextAction === "CHOOSE_OR_CREATE_PRIVATE_PRODUCT"
                        ? "Đã tìm thấy sản phẩm tham khảo cùng mã vạch"
                        : result.nextAction === "CREATE_PRODUCT"
                            ? "Chưa có sản phẩm, cần tạo mới"
                            : "Đã nhận diện mã vạch",
        errorMessage: null,

        identifyResult: result,
        analyzeResult: null,
        createdProduct: null,
        createdLot: null,

        ownProduct,
        referenceProduct,
        externalProducts,

        requiresVerification,
        verificationProductId: result.verificationProductId || ownProduct?.productId || null,
        canCreateLotDirectly,
        canCreatePrivateProductForCurrentSupermarket,

        ...(() => {
            const productForm = mapReferenceIntoProductForm({
                barcode: result.barcode,
                ownProduct,
                referenceProduct,
                lookup: result.barcodeLookupInfo,
                unitId: result.unitId,
            })

            const productDefaultUnitId = firstText(productForm.unitId)

            return {
                productForm,
                lotForm: {
                    ...emptyLotForm(),
                    quantity: 1,
                    // Đơn vị gốc lô mới = đơn vị chuẩn sản phẩm (không lấy đơn vị bán của lô cũ).
                    unitId: productDefaultUnitId,
                },
            }
        })(),
    }
}

export const mapWorkflowAnalyzeImageResultToState = (
    previous: ProductWorkflowState,
    result: WorkflowAnalyzeImageResultDto,
): ProductWorkflowState => {
    const extracted: OcrExtractedInfoDto | null = result.extractedInfo || null
    const lookup = result.barcodeLookupInfo || null
    const prefill = result.prefillFields || null

    return {
        ...previous,
        step: previous.step === "SCAN" ? "PRODUCT" : previous.step,
        analyzeResult: result,
        statusText: result.aiSkipped
            ? "Đã bỏ qua AI, bạn có thể nhập tay thông tin sản phẩm"
            : "Đã phân tích ảnh, vui lòng kiểm tra lại thông tin sản phẩm",
        productForm: {
            ...previous.productForm,
            barcode: firstText(
                prefillValue(prefill?.barcode),
                extracted?.barcode,
                lookup?.barcode,
                previous.productForm.barcode,
                previous.barcode,
            ),
            name: firstText(
                prefillValue(prefill?.name),
                extracted?.name,
                lookup?.productName,
                previous.productForm.name,
            ),
            brand: firstText(
                prefillValue(prefill?.brand),
                extracted?.brand,
                lookup?.brand,
                previous.productForm.brand,
            ),
            categoryName: firstText(
                prefillValue(prefill?.category),
                extracted?.category,
                lookup?.category,
                previous.productForm.categoryName,
            ),
            manufacturer: firstText(
                prefillValue(prefill?.manufacturer),
                extracted?.manufacturer,
                lookup?.manufacturer,
                previous.productForm.manufacturer,
            ),
            origin: firstText(
                prefillValue(prefill?.origin),
                extracted?.origin,
                lookup?.country,
                previous.productForm.origin,
            ),
            description: firstText(
                previous.productForm.description,
                lookup?.description,
            ),
            ingredients: firstText(
                prefillValue(prefill?.ingredients),
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
            "Đã tạo/xác nhận sản phẩm thành công, tiếp tục tạo lô hàng",
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
        productForm: {
            ...previous.productForm,
            unitId: firstText(result.unitId, previous.productForm.unitId),
        },
        lotForm: {
            ...previous.lotForm,
            unitId: firstText(
                result.unitId,
                previous.productForm.unitId,
                previous.lotForm.unitId,
            ),
        },
        requiresVerification: false,
        verificationProductId: null,
        canCreateLotDirectly: true,
        canCreatePrivateProductForCurrentSupermarket: false,
    }
}

export const mapWorkflowCreateAndPublishLotResultToState = (
    previous: ProductWorkflowState,
    result: WorkflowCreateAndPublishLotResultDto,
): ProductWorkflowState => {
    const stockLot = result.stockLot
    const pricing = result.pricingSuggestion

    const originalUnitPrice = firstNumber(
        stockLot?.originalUnitPrice,
        stockLot?.originalPrice,
        pricing?.originalPrice,
    )

    const finalUnitPrice = firstNumber(
        stockLot?.sellingUnitPrice,
        stockLot?.finalUnitPrice,
        stockLot?.finalPrice,
        previous.lotForm.acceptedSuggestion ? stockLot?.suggestedUnitPrice : undefined,
        previous.lotForm.acceptedSuggestion ? stockLot?.suggestedPrice : undefined,
        previous.lotForm.acceptedSuggestion ? pricing?.suggestedPrice : undefined,
    )

    return {
        ...previous,
        step: "DONE",
        phase: result.phase || previous.phase,
        nextAction: null,
        statusText: result.pricingSuggestionResolvedBeforePublish
            ? "Đã tạo lô hàng và đăng bán thành công, giá AI đã được xử lý trước khi đăng bán"
            : "Đã tạo lô hàng và đăng bán thành công",
        createdLot: result,
        productForm: {
            ...previous.productForm,
            unitId: firstText(
                previous.createdProduct?.unitId,
                previous.productForm.unitId,
            ),
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
            unitId: firstText(stockLot?.unitId, previous.lotForm.unitId),
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
                typeof originalUnitPrice === "number"
                    ? originalUnitPrice
                    : previous.lotForm.originalUnitPrice,
            finalUnitPrice:
                typeof finalUnitPrice === "number"
                    ? finalUnitPrice
                    : previous.lotForm.finalUnitPrice,
            acceptedSuggestion: previous.lotForm.acceptedSuggestion,
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

export const mergeWorkflowState = (
    current: ProductWorkflowState,
    patch: Partial<ProductWorkflowState>,
): ProductWorkflowState => {
    return {
        ...current,
        ...patch,
        productForm: patch.productForm
            ? {
                ...current.productForm,
                ...patch.productForm,
            }
            : current.productForm,
        lotForm: patch.lotForm
            ? {
                ...current.lotForm,
                ...patch.lotForm,
            }
            : current.lotForm,
    }
}
