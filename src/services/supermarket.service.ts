import axiosClient from "@/utils/axiosClient"

export type Supermarket = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone?: string
    status?: number
    createdAt?: string
    distanceKm?: number
}

export type PickupPoint = {
    pickupPointId: string
    name: string
    address: string
    lat: number
    lng: number
}

type ApiResponse<T> = {
    success?: boolean
    message?: string
    data?: T
    errors?: string[]
}

type SupermarketApiItem = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone?: string
    status?: number
    createdAt?: string
}

type SupermarketsResponse = {
    success: boolean
    message: string
    data?: {
        items?: SupermarketApiItem[]
        totalResult?: number
        page?: number
        pageSize?: number
    }
    errors?: string[] | null
}

const toRad = (value: number) => (value * Math.PI) / 180

const haversineKm = (
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
) => {
    const R = 6371
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)

    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) *
        Math.cos(toRad(b.lat)) *
        Math.sin(dLng / 2) ** 2

    return 2 * R * Math.asin(Math.sqrt(x))
}

export const supermarketService = {
    async getSupermarkets(params?: { pageNumber?: number; pageSize?: number }): Promise<Supermarket[]> {
        const res = await axiosClient.get<SupermarketsResponse>("/Supermarkets", {
            params: {
                pageNumber: params?.pageNumber ?? 1,
                pageSize: params?.pageSize ?? 100,
            },
        })

        const items = res.data?.data?.items ?? []

        return items.map((item) => ({
            supermarketId: item.supermarketId,
            name: item.name,
            address: item.address,
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
            contactPhone: item.contactPhone,
            status: item.status,
            createdAt: item.createdAt,
        }))
    },

    async getNearbySupermarketsByClientFilter(params: {
        lat: number
        lng: number
        radiusKm?: number
    }): Promise<Supermarket[]> {
        const all = await this.getSupermarkets({
            pageNumber: 1,
            pageSize: 100,
        })

        const radiusKm = params.radiusKm ?? 5

        return all
            .map((item) => ({
                ...item,
                distanceKm: haversineKm(
                    { lat: params.lat, lng: params.lng },
                    { lat: item.latitude, lng: item.longitude }
                ),
            }))
            .filter((item) => (item.distanceKm ?? 999) <= radiusKm)
            .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    },

    async getPickupPoints(): Promise<PickupPoint[]> {
        const res = await axiosClient.get<ApiResponse<any[]>>(
            "/admin/system-config/collection-points"
        )

        return (res.data?.data ?? []).map((item) => ({
            pickupPointId: String(item?.pickupPointId ?? item?.collectionId ?? item?.id ?? ""),
            name: String(item?.name ?? ""),
            address: String(item?.address ?? ""),
            lat: Number(item?.lat ?? item?.latitude ?? 0),
            lng: Number(item?.lng ?? item?.longitude ?? 0),
        }))
    },
}
