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
