import { AuthSession } from '@/types/auth.model'
import { STORAGE_KEYS } from '@/constants/storageKeys'

export const saveAuth = (data: AuthSession): void => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(data))
}

export const getAuthSession = (): AuthSession | null => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH)
    if (!raw) return null

    try {
        return JSON.parse(raw) as AuthSession
    } catch {
        clearAuth()
        return null
    }
}

export const clearAuth = (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
}

export const isAuthenticated = (): boolean => {
    const session = getAuthSession()
    return !!session?.accessToken && !isTokenExpired()
}

export const getAccessToken = (): string | null => {
    return getAuthSession()?.accessToken ?? null
}

export const getUserRole = () => {
    return getAuthSession()?.user.role ?? ''
}

export const isTokenExpired = (): boolean => {
    const session = getAuthSession()
    if (!session?.expiresAt) return true
    return Date.now() >= session.expiresAt
}
