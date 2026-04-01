import axiosClient from "@/utils/axiosClient"
import type {
    ApiResponse,
    CategoryItem,
    CreateCategoryPayload,
    UpdateCategoryPayload,
} from "@/types/category.type"

export const categoryService = {
    async getCategories(includeInactive = false) {
        const response = await axiosClient.get<ApiResponse<CategoryItem[]>>("/Categories", {
            params: { includeInactive },
        })

        return response.data?.data ?? []
    },

    async getParentCategories(includeInactive = false) {
        const response = await axiosClient.get<ApiResponse<CategoryItem[]>>("/Categories/parents", {
            params: { includeInactive },
        })

        return response.data?.data ?? []
    },

    async getChildrenCategories(parentId: string, includeInactive = false) {
        const response = await axiosClient.get<ApiResponse<CategoryItem[]>>(
            `/Categories/${parentId}/children`,
            {
                params: { includeInactive },
            }
        )

        return response.data?.data ?? []
    },

    async getCategoryById(categoryId: string) {
        const response = await axiosClient.get<ApiResponse<CategoryItem>>(
            `/Categories/${categoryId}`
        )

        return response.data?.data
    },

    async createCategory(payload: CreateCategoryPayload) {
        const response = await axiosClient.post<ApiResponse<CategoryItem>>("/Categories", payload)
        return response.data?.data
    },

    async updateCategory(categoryId: string, payload: UpdateCategoryPayload) {
        const response = await axiosClient.put<ApiResponse<CategoryItem>>(
            `/Categories/${categoryId}`,
            payload
        )

        return response.data?.data
    },

    async deleteCategory(categoryId: string) {
        await axiosClient.delete(`/Categories/${categoryId}`)
    },

    async getCategoryNameMap(includeInactive = false) {
        const categories = await this.getCategories(includeInactive)

        return new Map(categories.map((item) => [item.categoryId, item.name]))
    },
}
