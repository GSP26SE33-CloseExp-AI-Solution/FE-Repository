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

// ================= SUPPLIER STAFF =================

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
    contactEmail?: string
}

// ================= REGISTER TYPES =================

export type RegistrationType = "Vendor" | "SupplierStaff"

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

export interface SupplierStaffRegisterPayload {
    fullName: string
    email: string
    phone: string
    password: string
    registrationType: "SupplierStaff"
    newSupermarket: NewSupermarketPayload
    position: string
}

export type RegisterPayload = VendorRegisterPayload | SupplierStaffRegisterPayload

// ================= REGISTER / OTP =================

export interface RegisterResponse {
    success: boolean
    message: string
    data: null
    errors: string[] | null
}

export interface VerifyOtpPayload {
    email: string
    otpCode: string
}

export interface ResendOtpPayload {
    email: string
}
