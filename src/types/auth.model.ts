export type UserRole =
    | 'ADMIN'
    | 'SUPERMARKET'
    | 'VENDOR'
    | 'MARKETING'
    | 'PACKAGE'
    | ''

export interface AuthUser {
    userId: string
    fullName: string
    email: string
    phone: string
    role: UserRole
}

export interface AuthSession {
    accessToken: string
    refreshToken: string
    expiresAt: number
    user: AuthUser
}
