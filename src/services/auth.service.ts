import axiosClient from '@/utils/axiosClient'
import { ILoginPayload, IAuthTokens, IRegisterPayload } from '@/types/auth.api.type'
import { AuthSession } from '@/types/auth.model'
import { mapAuthSession } from '@/mappers/auth.mapper'
import { saveAuth, clearAuth } from '@/utils/authStorage'
import { UserRole } from '@/types/auth.model'

const USE_MOCK = true

const mockUsers: Record<string, UserRole> = {
    'admin@demo.com': 'ADMIN',
    'supermarket@demo.com': 'SUPERMARKET',
    'vendor@demo.com': 'VENDOR',
    'marketing@demo.com': 'MARKETING'
}

export const loginApi = async (payload: ILoginPayload): Promise<AuthSession> => {

    // ================= MOCK LOGIN =================
    if (USE_MOCK) {
        const role = mockUsers[payload.email]

        if (!role) {
            throw new Error('Tài khoản không tồn tại (mock)')
        }

        const fakeTokens: IAuthTokens = {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1h
            user: {
                userId: 'mock-id',
                fullName: role + ' User',
                email: payload.email,
                phone: '0123456789',
                roleName: role,
                roleId: 1,
                status: 'ACTIVE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }

        const session = mapAuthSession(fakeTokens)
        saveAuth(session)

        return session
    }

    // ================= LOGIN API =================
    const tokens: IAuthTokens = (await axiosClient.post('/api/Auth/login', payload)).data

    const session = mapAuthSession(tokens)
    saveAuth(session)

    return session
}

export const logoutApi = () => {
    clearAuth()
    window.location.href = '/login'
}

export const registerApi = async (payload: IRegisterPayload): Promise<void> => {
    if (USE_MOCK) {
        console.log('🟡 MOCK REGISTER thành công', payload)
        return
    }

    await axiosClient.post('/api/Auth/register', payload)
}
