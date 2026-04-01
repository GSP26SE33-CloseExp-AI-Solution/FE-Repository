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
    distanceKm?: number
}

export type GeocodeItem = {
    latitude: number | string
    longitude: number | string
    fullAddress: string
    placeName?: string
    region?: string
    district?: string
    country?: string
    countryCode?: string
    accuracy?: string
}

export type SupermarketApiItem = {
    supermarketId?: string
    id?: string

    name?: string
    supermarketName?: string

    address?: string
    addressLine?: string
    location?: string

    latitude?: number | string | null
    longitude?: number | string | null
    lat?: number | string | null
    lng?: number | string | null

    contactPhone?: string
    phone?: string

    status?: number | string
    createdAt?: string
    createdDate?: string

    [key: string]: unknown
}

export type PickupPointApiItem = {
    collectionPointId?: string
    collectionId?: string
    pickupPointId?: string
    id?: string

    name?: string
    collectionPointName?: string

    address?: string
    addressLine?: string
    location?: string

    latitude?: number | string | null
    longitude?: number | string | null
    lat?: number | string | null
    lng?: number | string | null

    [key: string]: unknown
}

export type PaginationLike<T> = {
    items?: T[]
    totalResult?: number
    page?: number
    pageSize?: number
    total?: number
    totalItems?: number
}

export type SupermarketsPageResponse = {
    success?: boolean
    message?: string
    data?: SupermarketApiItem[] | PaginationLike<SupermarketApiItem> | null
    errors?: string[] | null
}

export type PickupPointsResponse = {
    success?: boolean
    message?: string
    data?: PickupPointApiItem[] | PaginationLike<PickupPointApiItem> | null
    errors?: string[] | null
}
