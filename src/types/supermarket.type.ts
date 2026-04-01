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

export type GeocodeItem = {
    latitude: number
    longitude: number
    fullAddress: string
    placeName?: string
    region?: string
    district?: string
    country?: string
    countryCode?: string
    accuracy?: string
}

export type SupermarketApiItem = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone?: string
    status?: number
    createdAt?: string
}

export type PickupPointApiItem = {
    collectionPointId?: string
    collectionId?: string
    pickupPointId?: string
    name: string
    address?: string
    addressLine?: string
    latitude: number
    longitude: number
}

export type SupermarketsPageResponse = {
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
