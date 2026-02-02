import { IAuthTokens } from '@/types/auth.api.type'
import { AuthSession, UserRole } from '@/types/auth.model'

export const mapRole = (roleName: string): UserRole => {
    switch (roleName?.toUpperCase()) {
        case 'ADMIN':
            return 'ADMIN'
        case 'SUPERMARKET':
            return 'SUPERMARKET'
        case 'VENDOR':
            return 'VENDOR'
        case 'PACKAGE':
            return 'PACKAGE'
        case 'MARKETING':
            return 'MARKETING'
        default:
            return ''
    }
}

export const mapAuthSession = (data: IAuthTokens): AuthSession => ({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: new Date(data.expiresAt).getTime(),
    user: {
        userId: data.user.userId,
        fullName: data.user.fullName,
        email: data.user.email,
        phone: data.user.phone,
        role: mapRole(data.user.roleName),
    },
})
