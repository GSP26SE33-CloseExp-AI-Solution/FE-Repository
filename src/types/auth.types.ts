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
    requiresStaffContext?: boolean
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
    isManager?: boolean
    employeeCodeHint?: string
    supermarket: Supermarket
}

export interface Supermarket {
    supermarketId: string
    name: string
    address: string
    contactPhone: string
    contactEmail?: string
}

export type RegistrationType = "Vendor"

export interface RegisterPayload {
    fullName: string
    email: string
    phone: string
    password: string
    registrationType: "Vendor"
}

export interface VerifyOtpPayload {
    email: string
    otpCode: string
}

export interface ResendOtpPayload {
    email: string
}

export interface ForgotPasswordPayload {
    email: string
}

export interface ResetPasswordPayload {
    email: string
    otpCode: string
    newPassword: string
}

export interface GoogleLoginPayload {
    idToken: string
}
