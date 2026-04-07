import axios from "axios"
import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    CreateCustomerAddressPayload,
    CustomerAddress,
    UpdateCustomerAddressPayload,
} from "@/types/order.type"

const unwrap = <T,>(response: { data: ApiResponse<T> }) => response.data.data

const getAxiosErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as
            | { message?: string; errors?: string[]; error?: string }
            | undefined
        return data?.errors?.[0] || data?.message || data?.error || fallback
    }
    return fallback
}

export const customerAddressService = {
    async listAddresses(): Promise<CustomerAddress[]> {
        try {
            const response = await axiosClient.get<ApiResponse<CustomerAddress[]>>(
                "/CustomerAddresses"
            )
            const data = unwrap(response)
            return Array.isArray(data) ? data : []
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Không thể tải danh sách địa chỉ")
            )
        }
    },

    async getDefaultAddress() {
        try {
            const response = await axiosClient.get<ApiResponse<CustomerAddress>>(
                "/CustomerAddresses/default"
            )
            return unwrap(response)
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null
            }
            throw new Error(
                getAxiosErrorMessage(error, "Không thể lấy địa chỉ mặc định")
            )
        }
    },

    async createAddress(payload: CreateCustomerAddressPayload) {
        try {
            const response = await axiosClient.post<ApiResponse<CustomerAddress>>(
                "/CustomerAddresses",
                payload
            )
            return unwrap(response)
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Không thể tạo địa chỉ giao hàng")
            )
        }
    },

    async updateAddress(id: string, payload: UpdateCustomerAddressPayload) {
        try {
            const response = await axiosClient.put<ApiResponse<CustomerAddress>>(
                `/CustomerAddresses/${id}`,
                payload
            )
            return unwrap(response)
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Không thể cập nhật địa chỉ")
            )
        }
    },

    async setDefaultAddress(id: string) {
        try {
            await axiosClient.patch<ApiResponse<boolean>>(
                `/CustomerAddresses/${id}/set-default`
            )
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Không thể đặt địa chỉ mặc định")
            )
        }
    },

    async deleteAddress(id: string) {
        try {
            await axiosClient.delete<ApiResponse<boolean>>(
                `/CustomerAddresses/${id}`
            )
        } catch (error) {
            throw new Error(getAxiosErrorMessage(error, "Không thể xóa địa chỉ"))
        }
    },
}
