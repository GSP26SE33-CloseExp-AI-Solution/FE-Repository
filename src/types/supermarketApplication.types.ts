/** Khớp enum SupermarketState backend (JSON số). */
export const SupermarketState = {
    PendingApproval: 0,
    Active: 1,
    Suspended: 2,
    Closed: 3,
    Rejected: 4,
} as const

export type MySupermarketApplication = {
    supermarketId: string
    applicationReference?: string | null
    status: number
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    contactEmail?: string | null
    submittedAt?: string | null
    reviewedAt?: string | null
    adminReviewNote?: string | null
}

export type NewSupermarketApplicationPayload = {
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    contactEmail?: string | null
}
