import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/auth.types"
import type {
    MySupermarketApplication,
    NewSupermarketApplicationPayload,
} from "@/types/supermarketApplication.types"

const unwrap = <T>(res: ApiResponse<T>): T => {
    if (!res?.success) {
        const msg = res?.errors?.[0] || res?.message || "Request failed"
        throw new Error(msg)
    }
    return res.data
}

export async function getMySupermarketApplications(): Promise<
    MySupermarketApplication[]
> {
    const res = await axiosClient.get<
        ApiResponse<MySupermarketApplication[]>
    >("/Supermarkets/applications/my")
    return unwrap(res.data)
}

export async function submitSupermarketApplication(
    payload: NewSupermarketApplicationPayload
): Promise<MySupermarketApplication> {
    const res = await axiosClient.post<ApiResponse<MySupermarketApplication>>(
        "/Supermarkets/applications",
        payload
    )
    return unwrap(res.data)
}
