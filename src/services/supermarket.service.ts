import axiosClient from "@/utils/axiosClient"

export type GeocodeItem = {
    id: string
    addressText: string
    lat: number
    lng: number
}

export type Supermarket = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
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
    async forwardGeocode(address: string): Promise<GeocodeItem[]> {
        const trimmed = address.trim()
        if (!trimmed) return []

        const res = await axiosClient.get<
            ApiResponse<{
                latitude: number
                longitude: number
                fullAddress: string
                placeName: string
                region: string
                district: string
                country: string
                countryCode: string
                accuracy: string
            }>
        >("/Supermarkets/geocode/forward", {
            params: { address: trimmed },
        })

        const item = res.data?.data
        if (!item) return []

        return [
            {
                id: `${item.latitude}_${item.longitude}`,
                addressText: item.fullAddress || item.placeName || trimmed,
                lat: Number(item.latitude),
                lng: Number(item.longitude),
            },
        ]
    },

    async getAvailableSupermarkets(): Promise<Supermarket[]> {
        const res = await axiosClient.get<
            ApiResponse<
                Array<{
                    supermarketId: string
                    name: string
                    address: string
                    latitude: number
                    longitude: number
                    contactPhone: string
                    status: number
                    createdAt: string
                }>
            >
        >("/Supermarkets/available")

        return (res.data?.data ?? []).map((item) => ({
            supermarketId: item.supermarketId,
            name: item.name,
            address: item.address,
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
        }))
    },

    async getNearbySupermarketsByClientFilter(params: {
        lat: number
        lng: number
        radiusKm?: number
    }): Promise<Supermarket[]> {
        const all = await this.getAvailableSupermarkets()
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
