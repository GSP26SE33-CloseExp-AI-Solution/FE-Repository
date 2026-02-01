import axiosClient from './axiosClient'
import {
    IAuthResponse,
    ILoginPayload,
    IRegisterPayload,
} from '@/types/auth.type'
import { clearAuth, saveAuth } from '@/utils/auth'
import { mapAuthSession } from '@/mappers/auth.mapper'
import { AuthSession } from '@/types/auth.model'

const AUTH_BASE = '/api/Auth'

export const login = async (
    payload: ILoginPayload
): Promise<AuthSession> => {
    const response = await axiosClient.post<IAuthResponse>(
        `${AUTH_BASE}/login`,
        payload
    )

    const res = response.data

    if (!res.success || !res.data) {
        throw new Error(res.message || 'Đăng nhập thất bại')
    }

    const session = mapAuthSession(res.data)
    saveAuth(session)

    return session
}

export const register = async (
    payload: IRegisterPayload
): Promise<AuthSession> => {
    const response = await axiosClient.post<IAuthResponse>(
        `${AUTH_BASE}/register`,
        payload
    )

    const res = response.data

    if (!res.success || !res.data) {
        throw new Error(res.message || 'Đăng ký thất bại')
    }

    const session = mapAuthSession(res.data)
    saveAuth(session)

    return session
}

export const logout = async (): Promise<void> => {
    try {
        // logout
    } finally {
        clearAuth()
    }
}
