import axios from "axios"
import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import { User, UpdateUserStatusPayload } from "@/types/user.type"

export type UserImage = {
    imageId: string
    userId: string
    imageUrl: string
    preSignedUrl: string
    imageType: string
    isPrimary: boolean
    createdAt: string
}

export type UpdateProfilePayload = {
    fullName?: string
    phone?: string
}

const unwrap = <T>(res: ApiResponse<T>): T => {
    if (!res?.success) {
        const msg = res?.errors?.[0] || res?.message || "Request failed"
        throw new Error(msg)
    }
    return res.data
}

const getAxiosErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as
            | { message?: string; errors?: string[]; error?: string }
            | undefined

        return data?.errors?.[0] || data?.message || data?.error || fallback
    }

    return fallback
}

export const getUsersApi = async (): Promise<User[]> => {
    try {
        const res = await axiosClient.get<ApiResponse<User[]>>("/Users")
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Không tải được danh sách tài khoản"))
    }
}

export const updateUserStatusApi = async (
    userId: string,
    payload: UpdateUserStatusPayload
): Promise<User> => {
    try {
        const res = await axiosClient.patch<ApiResponse<User>>(`/Users/${userId}/status`, payload)
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Cập nhật trạng thái tài khoản không thành công"))
    }
}

export const updateMyProfileApi = async (payload: UpdateProfilePayload): Promise<User> => {
    try {
        const res = await axiosClient.put<ApiResponse<User>>("/Users/current-user", payload)
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Cập nhật hồ sơ không thành công"))
    }
}

export const uploadMyAvatarApi = async (
    file: File,
    imageType = "avatar",
    setAsPrimary = true
): Promise<UserImage> => {
    try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await axiosClient.post<ApiResponse<UserImage>>(
            `/Users/current-user/images?imageType=${encodeURIComponent(imageType)}&setAsPrimary=${setAsPrimary}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        )
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Tải ảnh lên không thành công"))
    }
}

export const getMyImagesApi = async (): Promise<UserImage[]> => {
    try {
        const res = await axiosClient.get<ApiResponse<UserImage[]>>("/Users/current-user/images")
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Không tải được danh sách ảnh"))
    }
}

export const getMyPrimaryImageApi = async (): Promise<UserImage | null> => {
    try {
        const res = await axiosClient.get<ApiResponse<UserImage>>("/Users/current-user/images/primary")
        return unwrap(res.data)
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null
        }
        throw new Error(getAxiosErrorMessage(error, "Không tải được ảnh đại diện"))
    }
}

export const setMyPrimaryImageApi = async (imageId: string): Promise<boolean> => {
    try {
        const res = await axiosClient.patch<ApiResponse<boolean>>(
            `/Users/current-user/images/${imageId}/set-primary`
        )
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Đặt ảnh đại diện không thành công"))
    }
}

export const deleteMyImageApi = async (imageId: string): Promise<boolean> => {
    try {
        const res = await axiosClient.delete<ApiResponse<boolean>>(
            `/Users/current-user/images/${imageId}`
        )
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Xóa ảnh không thành công"))
    }
}
