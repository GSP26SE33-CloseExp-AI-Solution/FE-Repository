// ================= API RESPONSE =================

export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
    errors: string[] | null
}

// ================= AUTH DATA =================

export interface AuthData {
    accessToken: string
    refreshToken: string
    expiresAt: string
    user: User
}

// ================= USER =================

export interface User {
    userId: string
    fullName: string
    email: string
    phone: string
    roleName: string
    roleId: number
    status: number
    createdAt: string
    updatedAt: string
    marketStaffInfo?: MarketStaffInfo
}

// ================= MARKET STAFF =================

export interface MarketStaffInfo {
    marketStaffId: string
    position: string
    joinedAt: string
    supermarket: Supermarket
}

// ================= SUPERMARKET =================

export interface Supermarket {
    supermarketId: string
    name: string
    address: string
    contactPhone: string
}
