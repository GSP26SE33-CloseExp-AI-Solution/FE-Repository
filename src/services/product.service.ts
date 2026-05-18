import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    GetMySupermarketProductsQuery,
    GetProductsQuery,
    ProductDetailDto,
    ProductEnumOptionDto,
    ProductListResult,
    ProductResponseDto,
    ProductUpdatePayload,
} from "@/types/product.type"
import type { ProductPurchaseUnit } from "@/types/purchase-unit.type"
import { parsePurchaseUnitsResponse } from "@/utils/purchaseUnits"

const unwrap = <T,>(response?: ApiResponse<T> | null): T => {
    if (!response) {
        throw new Error("Không nhận được phản hồi từ máy chủ")
    }

    if (!response.success) {
        const message =
            response.errors?.filter(Boolean).join(", ") ||
            response.message ||
            "Yêu cầu thất bại"

        throw new Error(message)
    }

    return response.data
}

export const productService = {
    async getProducts(query?: GetProductsQuery): Promise<ProductListResult> {
        const response = await axiosClient.get<ApiResponse<ProductListResult>>(
            "/Products",
            {
                params: {
                    pageNumber: query?.pageNumber ?? 1,
                    pageSize: query?.pageSize ?? 20,
                },
            },
        )

        return unwrap(response.data)
    },

    async getMySupermarketProducts(
        query?: GetMySupermarketProductsQuery,
    ): Promise<ProductListResult> {
        const response = await axiosClient.get<ApiResponse<ProductListResult>>(
            "/Products/my-supermarket",
            {
                params: {
                    searchTerm: query?.searchTerm?.trim() || undefined,
                    category: query?.category?.trim() || undefined,
                    pageNumber: query?.pageNumber ?? 1,
                    pageSize: query?.pageSize ?? 20,
                },
            },
        )

        return unwrap(response.data)
    },

    async getProductById(productId: string): Promise<ProductResponseDto> {
        const response = await axiosClient.get<ApiResponse<ProductResponseDto>>(
            `/Products/${productId}`,
        )

        return unwrap(response.data)
    },

    async getProductDetails(productId: string): Promise<ProductDetailDto> {
        const response = await axiosClient.get<ApiResponse<ProductDetailDto>>(
            `/Products/${productId}/details`,
        )

        return unwrap(response.data)
    },

    async getPurchaseUnits(productId: string): Promise<ProductPurchaseUnit[]> {
        const response = await axiosClient.get<ApiResponse<ProductPurchaseUnit[]>>(
            `/Products/${productId}/purchase-units`,
        )

        unwrap(response.data)
        return parsePurchaseUnitsResponse(response.data ?? {})
    },

    async getExpiryStatuses(): Promise<ProductEnumOptionDto[]> {
        const response = await axiosClient.get<ApiResponse<ProductEnumOptionDto[]>>(
            "/Products/expiry-statuses",
        )

        return unwrap(response.data)
    },

    async getWeightTypes(): Promise<ProductEnumOptionDto[]> {
        const response = await axiosClient.get<ApiResponse<ProductEnumOptionDto[]>>(
            "/Products/weight-types",
        )

        return unwrap(response.data)
    },

    async updateProduct(
        productId: string,
        payload: ProductUpdatePayload,
    ): Promise<ApiResponse<string>> {
        console.log("[productService.updateProduct] -> productId:", productId)
        console.log("[productService.updateProduct] -> payload:", payload)

        const response = await axiosClient.put<ApiResponse<string>>(
            `/Products/${productId}`,
            payload,
        )

        console.log("[productService.updateProduct] -> raw response:", response.data)

        if (!response.data?.success) {
            const message =
                response.data?.errors?.filter(Boolean).join(", ") ||
                response.data?.message ||
                "Không thể cập nhật sản phẩm"

            throw new Error(message)
        }

        return response.data
    },

    async deleteProduct(productId: string): Promise<string> {
        const response = await axiosClient.delete<ApiResponse<string>>(
            `/Products/${productId}`,
        )

        return unwrap(response.data)
    },

    updateProductImages: async (
        productId: string,
        files: File[],
        replaceExisting = false,
    ): Promise<ProductResponseDto> => {
        const formData = new FormData()

        files.forEach((file) => {
            formData.append("files", file)
        })

        formData.append("replaceExisting", String(replaceExisting))

        console.log("[productService.updateProductImages] request:", {
            productId,
            replaceExisting,
            fileCount: files.length,
            files: files.map((file) => ({
                name: file.name,
                type: file.type,
                size: file.size,
            })),
        })

        const response = await axiosClient.put<ApiResponse<ProductResponseDto>>(
            `/SupermarketStaff/products/${productId}/images`,
            formData,
        )

        console.log("[productService.updateProductImages] raw response:", response.data)

        if (!response.data.success || !response.data.data) {
            console.error("[productService.updateProductImages] failed:", response.data)

            throw new Error(response.data.message || "Không thể cập nhật ảnh sản phẩm")
        }

        console.log("[productService.updateProductImages] success data:", {
            productId: response.data.data.productId,
            mainImageUrl: response.data.data.mainImageUrl,
            totalImages: response.data.data.totalImages,
            productImages: response.data.data.productImages,
        })

        return response.data.data
    },
}
