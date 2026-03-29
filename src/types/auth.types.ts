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
    /** Backend: nhiều persona nhân viên — cần gọi select-staff-context */
    requiresStaffContext?: boolean
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
    marketStaffMemberships?: MarketStaffInfo[]
}

// ================= SUPPLIER STAFF =================

export interface MarketStaffInfo {
    marketStaffId: string
    position: string
    joinedAt: string
    isManager?: boolean
    employeeCodeHint?: string | null
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

export interface RegisterPayload {
    fullName: string
    email: string
    phone: string
    password: string
    registrationType: "Vendor"
}

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
