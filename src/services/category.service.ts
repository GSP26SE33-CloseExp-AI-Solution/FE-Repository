import axiosClient from "@/utils/axiosClient"
import type {
    ApiResponse,
    CategoryItem,
    CategoryMutationMessage,
    CreateCategoryPayload,
    UpdateCategoryPayload,
} from "@/types/category.type"

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

export const categoryService = {
    async getCategories(includeInactive = false): Promise<CategoryItem[]> {
        const response = await axiosClient.get<ApiResponse<CategoryItem[]>>(
            "/Categories",
            {
                params: { includeInactive },
            },
        )

        return unwrap(response.data) ?? []
    },

    async getParentCategories(includeInactive = false): Promise<CategoryItem[]> {
        const response = await axiosClient.get<ApiResponse<CategoryItem[]>>(
            "/Categories/parents",
            {
                params: { includeInactive },
            },
        )

        return unwrap(response.data) ?? []
    },

    async getChildrenCategories(
        parentId: string,
        includeInactive = false,
    ): Promise<CategoryItem[]> {
        const response = await axiosClient.get<ApiResponse<CategoryItem[]>>(
            `/Categories/${parentId}/children`,
            {
                params: { includeInactive },
            },
        )

        return unwrap(response.data) ?? []
    },

    async getCategoryById(categoryId: string): Promise<CategoryItem | undefined> {
        const response = await axiosClient.get<ApiResponse<CategoryItem>>(
            `/Categories/${categoryId}`,
        )

        return unwrap(response.data)
    },

    async createCategory(payload: CreateCategoryPayload): Promise<CategoryItem | undefined> {
        const response = await axiosClient.post<ApiResponse<CategoryItem>>(
            "/Categories",
            payload,
        )

        return unwrap(response.data)
    },

    async updateCategory(
        categoryId: string,
        payload: UpdateCategoryPayload,
    ): Promise<CategoryMutationMessage | undefined> {
        const response = await axiosClient.put<ApiResponse<CategoryMutationMessage>>(
            `/Categories/${categoryId}`,
            payload,
        )

        return unwrap(response.data)
    },

    async deleteCategory(categoryId: string): Promise<void> {
        const response = await axiosClient.delete<ApiResponse<CategoryMutationMessage>>(
            `/Categories/${categoryId}`,
        )

        unwrap(response.data)
    },

    async getCategoryNameMap(includeInactive = false) {
        const categories = await this.getCategories(includeInactive)
        return new Map(categories.map((item) => [item.categoryId, item.name]))
    },
}
