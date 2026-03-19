export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
    errors: string[] | null
}

export interface AuthData {
    accessToken: string
    refreshToken: string
    expiresAt: string
    user: User
}

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
    marketStaffInfo: MarketStaffInfo | null
}

export interface MarketStaffInfo {
    marketStaffId: string
    position: string
    joinedAt: string
    supermarket: Supermarket
}

export interface Supermarket {
    supermarketId: string
    name: string
    address: string
    contactPhone: string
    contactEmail?: string
}

export type RegistrationType = "Vendor" | "SupermarketStaff"

export interface NewSupermarketPayload {
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    contactEmail: string
}

export interface VendorRegisterPayload {
    fullName: string
    email: string
    phone: string
    password: string
    registrationType: "Vendor"
}

export interface SupermarketStaffRegisterPayload {
    fullName: string
    email: string
    phone: string
    password: string
    registrationType: "SupermarketStaff"
    newSupermarket: NewSupermarketPayload
    position: string
}

export type RegisterPayload = VendorRegisterPayload | SupermarketStaffRegisterPayload

export interface VerifyOtpPayload {
    email: string
    otpCode: string
}

export interface ResendOtpPayload {
    email: string
}
