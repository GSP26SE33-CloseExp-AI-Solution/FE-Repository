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

    async getPurchaseUnits(
        productId: string,
        lotId?: string,
    ): Promise<ProductPurchaseUnit[]> {
        const response = await axiosClient.get<ApiResponse<ProductPurchaseUnit[]>>(
            `/Products/${productId}/purchase-units`,
            {
                params: lotId ? { lotId } : undefined,
            },
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

    async updateProductUnit(productId: string, unitId: string): Promise<ProductResponseDto> {
        const response = await axiosClient.patch<ApiResponse<ProductResponseDto>>(
            `/Products/${productId}/unit`,
            { unitId },
        )

        return unwrap(response.data)
    },

    async updateProduct(
        productId: string,
        payload: ProductUpdatePayload,
    ): Promise<ApiResponse<string>> {
        const response = await axiosClient.put<ApiResponse<string>>(
            `/Products/${productId}`,
            payload,
        )

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

        const response = await axiosClient.put<ApiResponse<ProductResponseDto>>(
            `/SupermarketStaff/products/${productId}/images`,
            formData,
        )

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.message || "Không thể cập nhật ảnh sản phẩm")
        }

        return response.data.data
    },
}
