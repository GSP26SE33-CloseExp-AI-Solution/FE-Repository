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
}
