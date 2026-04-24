import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type { UnitItem } from "@/types/unit.type"

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

export const unitService = {
    async getUnits(): Promise<UnitItem[]> {
        const response = await axiosClient.get<ApiResponse<UnitItem[]>>(
            "/admin/catalog/units",
        )

        return unwrap(response.data)
    },
}
