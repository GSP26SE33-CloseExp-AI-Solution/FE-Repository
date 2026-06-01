export type { ApiResponse } from "./api.types"

export type CategoryItem = {
    categoryId: string
    parentCatId?: string | null
    parentName?: string | null
    isFreshFood: boolean
    name: string
    description?: string | null
    catIconUrl?: string | null
    isActive: boolean
}

export type CreateCategoryPayload = {
    parentCatId?: string | null
    isFreshFood: boolean
    name: string
    description?: string | null
    catIconUrl?: string | null
    isActive: boolean
}

export type UpdateCategoryPayload = {
    parentCatId?: string | null
    isFreshFood: boolean
    name: string
    description?: string | null
    catIconUrl?: string | null
    isActive: boolean
}

export type CategoryMutationMessage = string

export type CategoryProductImpact = {
    categoryId: string
    categoryName: string
    subcategoryCount: number
    totalProducts: number
    publishedProducts: number
}

export type CategoryProductListItem = {
    productId: string
    name: string
    brand: string
    categoryName: string
    status: string
    finalPrice: number
}

export type CategoryProductsQuery = {
    pageNumber?: number
    pageSize?: number
    search?: string
    publishedOnly?: boolean
}

export type CategoryProductsResult = {
    items: CategoryProductListItem[]
    totalResult: number
    page: number
    pageSize: number
}
