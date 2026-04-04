// ======================================================
// Shared domain models used across supermarket-related UI
// ======================================================

// Dùng cho:
// - GET /api/Supermarkets
// - GET /api/Supermarkets/available
// - GET /api/Supermarkets/search
// - client-side nearby supermarket filtering
export type Supermarket = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone?: string
    contactEmail?: string
    status?: number
    createdAt?: string
    distanceKm?: number
}

// Dùng cho:
// - GET /api/Orders/collection-points (public)
// - chọn điểm nhận hàng phía client
export type PickupPoint = {
    pickupPointId: string
    name: string
    address: string
    lat: number
    lng: number
    distanceKm?: number
}

// Dùng cho:
// - GET /api/Supermarkets/geocode/forward
// - GET /api/Supermarkets/geocode/reverse
// - GET /api/Supermarkets/geocode/suggest
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

// ======================================================
// Raw API item models
// ======================================================

// Raw item dùng cho:
// - GET /api/Supermarkets
// - GET /api/Supermarkets/available
// - GET /api/Supermarkets/search
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
    contactEmail?: string

    status?: number | string
    createdAt?: string
    createdDate?: string

    [key: string]: unknown
}

// Raw item dùng cho:
// - GET /api/Orders/collection-points
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

// ======================================================
// Generic helpers for APIs returning list / pagination-like
// ======================================================

export type PaginationLike<T> = {
    items?: T[]
    totalResult?: number
    page?: number
    pageSize?: number
    total?: number
    totalItems?: number
}

// Response wrapper dùng cho:
// - GET /api/Supermarkets
export type SupermarketsPageResponse = {
    success?: boolean
    message?: string
    data?: SupermarketApiItem[] | PaginationLike<SupermarketApiItem> | null
    errors?: string[] | null
}

// Response wrapper dùng cho:
// - GET /api/Orders/collection-points
export type PickupPointsResponse = {
    success?: boolean
    message?: string
    data?: PickupPointApiItem[] | PaginationLike<PickupPointApiItem> | null
    errors?: string[] | null
}

// ======================================================
// Partner application flow
// ======================================================

// Payload dùng cho:
// - POST /api/Supermarkets/applications
export type CreateSupermarketApplicationPayload = {
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    contactEmail?: string
}

// Model dùng cho:
// - response từ POST /api/Supermarkets/applications
// - GET /api/Supermarkets/applications/my
export type MySupermarketApplication = {
    supermarketId: string
    applicationReference: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    contactEmail?: string | null
    status: number
    applicantUserId?: string
    submittedAt?: string | null
    reviewedAt?: string | null
    adminReviewNote?: string | null
    createdAt?: string | null
}
