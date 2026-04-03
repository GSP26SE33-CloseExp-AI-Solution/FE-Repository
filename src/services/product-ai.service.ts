// src/services/product-ai.service.ts

import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    AiDirectPricingResult,
    AiExtractPayload,
    AiExtractResult,
    AiPricingPayload,
    AnalyzeImagePayload,
    AnalyzeImageResult,
    ConfirmLotPricePayload,
    ConfirmLotPriceResult,
    CreateDraftProductPayload,
    CreateDraftProductResult,
    CreateLotFromExistingPayload,
    CreateLotFromExistingResult,
    LotPricingSuggestionPayload,
    LotPricingSuggestionResult,
    ProductScanResult,
    PublishLotPayload,
    PublishLotResult,
    VerifyProductPayload,
    VerifyProductResult,
} from "@/types/product-ai-workflow.type"

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
    return (
        typeof value === "object" &&
        value !== null &&
        "success" in value &&
        "message" in value &&
        "data" in value
    )
}

const unwrap = <T>(response: ApiResponse<T> | { data: ApiResponse<T> }): T => {
    const payload = isApiResponse<T>((response as { data?: unknown })?.data)
        ? (response as { data: ApiResponse<T> }).data
        : (response as ApiResponse<T>)

    if (!payload.success) {
        const backendMessage =
            payload.errors?.filter(Boolean).join(", ") || payload.message || "Request failed"
        throw new Error(backendMessage)
    }

    return payload.data
}

const toFormData = (entries: Record<string, string | Blob | undefined | null>) => {
    const formData = new FormData()

    Object.entries(entries).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        formData.append(key, value)
    })

    return formData
}

export const productAiService = {
    async scanBarcode(barcode: string, supermarketId: string) {
        const response = await axiosClient.get<ApiResponse<ProductScanResult>>(
            `/Products/scan/${encodeURIComponent(barcode)}`,
            {
                params: { supermarketId },
            },
        )

        return unwrap(response.data)
    },

    async analyzeImage(payload: AnalyzeImagePayload) {
        const formData = new FormData()
        formData.append("supermarketId", payload.supermarketId)
        formData.append("file", payload.file)

        const response = await axiosClient.post<ApiResponse<AnalyzeImageResult>>(
            "/Products/analyze-image",
            formData
        )

        return unwrap(response.data)
    },

    async createDraftProduct(payload: CreateDraftProductPayload) {
        const response = await axiosClient.post<ApiResponse<CreateDraftProductResult>>(
            "/Products/create-new",
            {
                supermarketId: payload.supermarketId,
                name: payload.name,
                barcode: payload.barcode,
                brand: payload.brand,
                category: payload.category,
                isFreshFood: payload.isFreshFood,
                ingredients: payload.ingredients,
                manufacturer: payload.manufacturer,
                origin: payload.origin,
                ocrImageUrl: payload.ocrImageUrl,
                ocrExtractedData: payload.ocrExtractedData,
                ocrConfidence: payload.ocrConfidence,
                createdBy: payload.createdBy,
            },
        )

        return unwrap(response.data)
    },

    async verifyProduct(productId: string, payload: VerifyProductPayload) {
        const response = await axiosClient.post<ApiResponse<VerifyProductResult>>(
            `/Products/${productId}/verify`,
            {
                name: payload.name,
                brand: payload.brand,
                category: payload.category,
                barcode: payload.barcode,
                originalPrice: payload.originalPrice,
                expiryDate: payload.expiryDate,
                manufactureDate: payload.manufactureDate,
                isFreshFood: payload.isFreshFood,
                verifiedBy: payload.verifiedBy,
            },
        )

        return unwrap(response.data)
    },

    async createLotFromExisting(payload: CreateLotFromExistingPayload) {
        const response = await axiosClient.post<ApiResponse<CreateLotFromExistingResult>>(
            "/Products/lots/from-existing",
            {
                productId: payload.productId,
                expiryDate: payload.expiryDate,
                manufactureDate: payload.manufactureDate,
                quantity: payload.quantity,
                weight: payload.weight,
                createdBy: payload.createdBy,
            },
        )

        return unwrap(response.data)
    },

    async getLotPricingSuggestion(lotId: string, payload: LotPricingSuggestionPayload) {
        const response = await axiosClient.post<ApiResponse<LotPricingSuggestionResult>>(
            `/Products/lots/${lotId}/pricing-suggestion`,
            {
                originalPrice: payload.originalPrice,
            },
        )

        return unwrap(response.data)
    },

    async confirmLotPrice(lotId: string, payload: ConfirmLotPricePayload) {
        const response = await axiosClient.post<ApiResponse<ConfirmLotPriceResult>>(
            `/Products/lots/${lotId}/confirm-price`,
            {
                finalPrice: payload.finalPrice,
                priceFeedback: payload.priceFeedback,
                acceptedSuggestion: payload.acceptedSuggestion,
                confirmedBy: payload.confirmedBy,
            },
        )

        return unwrap(response.data)
    },

    async publishLot(lotId: string, payload: PublishLotPayload) {
        const response = await axiosClient.post<ApiResponse<PublishLotResult>>(
            `/Products/lots/${lotId}/publish`,
            {
                publishedBy: payload.publishedBy,
            },
        )

        return unwrap(response.data)
    },

    async aiExtract(payload: AiExtractPayload) {
        const formData = toFormData({
            file: payload.file,
        })

        const response = await axiosClient.post<ApiResponse<AiExtractResult>>(
            "/AI/extract",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        )

        return unwrap(response.data)
    },

    async aiPricing(payload: AiPricingPayload) {
        const response = await axiosClient.post<ApiResponse<AiDirectPricingResult>>(
            "/AI/pricing",
            {
                productName: payload.productName,
                category: payload.category,
                brand: payload.brand,
                originalPrice: payload.originalPrice,
                expiryDate: payload.expiryDate,
                manufactureDate: payload.manufactureDate,
                daysToExpiry: payload.daysToExpiry,
            },
        )

        return unwrap(response.data)
    },
}
