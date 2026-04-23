export type { ApiResponse } from "./api.types"

export interface AuthData {
    accessToken: string
    refreshToken: string
    expiresAt: string
    user: AuthUser
    requiresStaffContext?: boolean
}

/** Logged-in user from auth/session (JWT + profile). Distinct from admin list User in user.type. */
export interface AuthUser {
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
    parentSuperStaffId?: string | null
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

export class AuthFlowError extends Error {
    code: string
    email?: string

    constructor(message: string, code: string, email?: string) {
        super(message)
        this.name = "AuthFlowError"
        this.code = code
        this.email = email
    }
}
