import axiosClient from "@/utils/axiosClient"
import { Product } from "@/types/aiProduct.type"

export const productService = {
    /* ================= OCR ================= */
    uploadOcr(payload: { supermarketId: string; createdBy: string; file: File }) {
        const formData = new FormData()
        formData.append("supermarketId", payload.supermarketId)
        formData.append("createdBy", payload.createdBy)
        formData.append("file", payload.file)

        return axiosClient.post("/Products/upload-ocr", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
    },

    /* ================= GET BY ID ================= */
    getById(productId: string) {
        return axiosClient.get<{
            success: boolean
            message: string
            data: Product
        }>(`/Products/${productId}`)
    },

    /* ================= LIST ================= */
    getMySupermarket() {
        return axiosClient.get("/Products/my-supermarket")
    },

    getByStatus(supermarketId: string, status: number) {
        return axiosClient.get(`/Products/by-status/${supermarketId}`, {
            params: { status },
        })
    },

    /* ================= VERIFY ================= */
    verify(
        productId: string,
        payload: {
            name: string
            brand: string
            category: string
            barcode: string
            originalPrice: number
            expiryDate: string
            manufactureDate?: string | null
            verifiedBy: string
            isFreshFood?: boolean
        }
    ) {
        return axiosClient.post(`/Products/${productId}/verify`, payload)
    },

    /* ================= PRICING ================= */
    pricingSuggestion(productId: string, originalPrice: number) {
        return axiosClient.post(`/Products/${productId}/pricing-suggestion`, {
            originalPrice,
        })
    },

    /* ================= CONFIRM PRICE ================= */
    confirmPrice(
        productId: string,
        payload: {
            finalPrice: number
            priceFeedback?: string
            acceptedSuggestion: boolean
            confirmedBy: string
        }
    ) {
        return axiosClient.post(`/Products/${productId}/confirm-price`, payload)
    },

    /* ================= PUBLISH ================= */
    publish(productId: string, publishedBy: string) {
        return axiosClient.post(`/Products/${productId}/publish`, { publishedBy })
    },
}