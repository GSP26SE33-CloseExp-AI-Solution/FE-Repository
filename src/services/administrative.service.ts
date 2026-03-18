import axios from "axios"

export type AdministrativeDistrict = {
    code: number
    name: string
}

export type AdministrativeWard = {
    code: number
    name: string
}

type ProvinceApiResponse<T> = T | { results?: T }

const administrativeClient = axios.create({
    baseURL: "https://provinces.open-api.vn/api",
    headers: {
        "Content-Type": "application/json",
    },
})

const normalizeArray = <T,>(payload: ProvinceApiResponse<T[]>): T[] => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.results)) return payload.results
    return []
}

export const administrativeService = {
    async getHcmDistricts(): Promise<AdministrativeDistrict[]> {
        const res = await administrativeClient.get<ProvinceApiResponse<any[]>>("/p/79?depth=2")
        const payload = res.data as any

        const districts = Array.isArray(payload?.districts) ? payload.districts : []

        return districts.map((item: any) => ({
            code: Number(item.code),
            name: String(item.name ?? ""),
        }))
    },

    async getWardsByDistrictCode(districtCode: number): Promise<AdministrativeWard[]> {
        const res = await administrativeClient.get<ProvinceApiResponse<any>>(`/d/${districtCode}?depth=2`)
        const payload = res.data as any

        const wards = Array.isArray(payload?.wards) ? payload.wards : []

        return wards.map((item: any) => ({
            code: Number(item.code),
            name: String(item.name ?? ""),
        }))
    },
}
