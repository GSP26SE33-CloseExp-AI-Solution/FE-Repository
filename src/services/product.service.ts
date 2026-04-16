import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    GetMySupermarketProductsQuery,
    GetProductsQuery,
    ProductDetailDto,
    ProductListResult,
    ProductResponseDto,
    UpdateProductRequestDto,
} from "@/types/product.type"

const unwrap = <T,>(response: ApiResponse<T>): T => {
    if (!response.success) {
        const message =
            response.errors?.filter(Boolean).join(", ") ||
            response.message ||
            "Request failed"

        throw new Error(message)
    }

    return response.data
}

export const productService = {
    async getProducts(query?: GetProductsQuery): Promise<ProductListResult> {
        const response = await axiosClient.get<ApiResponse<ProductListResult>>("/Products", {
            params: {
                pageNumber: query?.pageNumber ?? 1,
                pageSize: query?.pageSize ?? 20,
            },
        })

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

    async updateProduct(
        productId: string,
        payload: UpdateProductRequestDto,
    ): Promise<string> {
        const response = await axiosClient.put<ApiResponse<string>>(
            `/Products/${productId}`,
            payload,
        )

        return unwrap(response.data)
    },

    async deleteProduct(productId: string): Promise<string> {
        const response = await axiosClient.delete<ApiResponse<string>>(
            `/Products/${productId}`,
        )

        return unwrap(response.data)
    },
}
