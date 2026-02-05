import axiosClient from "@/utils/axiosClient"
import { Product } from "@/types/aiProduct.type"

export interface UploadOcrPayload {
    supermarketId: string
    createdBy: string
    file: File
}

export interface UploadOcrResponse {
    success: boolean
    message: string
    data: Product
}

export const productService = {
    uploadOcr(payload: UploadOcrPayload) {
        const formData = new FormData()
        formData.append("supermarketId", payload.supermarketId)
        formData.append("createdBy", payload.createdBy)
        formData.append("file", payload.file)

        return axiosClient.post<UploadOcrResponse>(
            "/Products/upload-ocr",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        )
    },

    getById(productId: string) {
        return axiosClient.get<Product>(`/Products/${productId}`)
    },

    verify(productId: string, payload: Partial<Product>) {
        return axiosClient.post<Product>(
            `/Products/${productId}/verify`,
            payload
        )
    },
}
