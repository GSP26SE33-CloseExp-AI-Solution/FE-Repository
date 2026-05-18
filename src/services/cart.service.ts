import axios from "axios"

import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"

export type ApiCartItem = {
    cartItemId: string
    lotId: string
    purchaseUnitId?: string | null
    purchaseUnitName?: string | null
    purchaseUnitSymbol?: string | null
    productId: string
    productName: string
    productImageUrl?: string | null
    supermarketId: string
    supermarketName?: string | null
    unitId: string
    unitName?: string | null
    unitSymbol?: string | null
    conversionRate?: number
    productUnitId: string
    productUnitName?: string | null
    productUnitSymbol?: string | null
    productConversionRate?: number
    expiryDate: string
    quantity: number
    unitPrice: number
    lineTotal: number
}

export type ApiCart = {
    cartId: string
    userId: string
    totalItems: number
    totalAmount: number
    updatedAt: string
    items: ApiCartItem[]
}

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

const getAxiosErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiResponse<unknown> | undefined
        return (
            data?.errors?.filter(Boolean).join(", ") ||
            data?.message ||
            fallback
        )
    }

    if (error instanceof Error && error.message) {
        return error.message
    }

    return fallback
}

export const cartService = {
    async getMyCart(): Promise<ApiCart> {
        const response = await axiosClient.get<ApiResponse<ApiCart>>("/Carts/my-cart")
        return unwrap(response.data)
    },

    async addItem(payload: {
        lotId: string
        purchaseUnitId?: string
        quantity?: number
    }): Promise<ApiCart> {
        try {
            const response = await axiosClient.post<ApiResponse<ApiCart>>(
                "/Carts/my-cart/items",
                {
                    lotId: payload.lotId,
                    purchaseUnitId: payload.purchaseUnitId,
                    quantity: payload.quantity ?? 1,
                },
            )
            return unwrap(response.data)
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Không thể thêm vào giỏ hàng"),
            )
        }
    },

    async updateItem(
        cartItemId: string,
        quantity: number,
    ): Promise<ApiCart> {
        try {
            const response = await axiosClient.put<ApiResponse<ApiCart>>(
                `/Carts/my-cart/items/${cartItemId}`,
                { quantity },
            )
            return unwrap(response.data)
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Không thể cập nhật giỏ hàng"),
            )
        }
    },

    async removeItem(cartItemId: string): Promise<ApiCart> {
        try {
            const response = await axiosClient.delete<ApiResponse<ApiCart>>(
                `/Carts/my-cart/items/${cartItemId}`,
            )
            return unwrap(response.data)
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Không thể xóa khỏi giỏ hàng"),
            )
        }
    },

    async clear(): Promise<void> {
        const response = await axiosClient.delete<ApiResponse<unknown>>(
            "/Carts/my-cart/items",
        )
        unwrap(response.data as ApiResponse<unknown>)
    },
}
