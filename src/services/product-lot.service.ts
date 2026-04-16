import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    GetMySupermarketLotsQuery,
    GetSupermarketLotsQuery,
    ProductLotListResult,
} from "@/types/product-lot.type"

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

export const productLotService = {
    async getMySupermarketLots(
        query?: GetMySupermarketLotsQuery,
    ): Promise<ProductLotListResult> {
        const response = await axiosClient.get<ApiResponse<ProductLotListResult>>(
            "/Products/my-supermarket/lots",
            {
                params: {
                    expiryStatus: query?.expiryStatus,
                    weightType: query?.weightType,
                    isFreshFood: query?.isFreshFood,
                    searchTerm: query?.searchTerm?.trim() || undefined,
                    category: query?.category?.trim() || undefined,
                    pageNumber: query?.pageNumber ?? 1,
                    pageSize: query?.pageSize ?? 20,
                },
            },
        )

        return unwrap(response.data)
    },

    async getLotsBySupermarket(
        query: GetSupermarketLotsQuery,
    ): Promise<ProductLotListResult> {
        const response = await axiosClient.get<ApiResponse<ProductLotListResult>>(
            `/Products/lots/supermarket/${query.supermarketId}`,
            {
                params: {
                    expiryStatus: query.expiryStatus,
                    weightType: query.weightType,
                    isFreshFood: query.isFreshFood,
                    searchTerm: query.searchTerm?.trim() || undefined,
                    category: query.category?.trim() || undefined,
                    pageNumber: query.pageNumber ?? 1,
                    pageSize: query.pageSize ?? 20,
                },
            },
        )

        return unwrap(response.data)
    },
}
