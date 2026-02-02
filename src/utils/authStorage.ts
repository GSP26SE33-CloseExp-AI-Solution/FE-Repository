import { AuthSession } from '@/types/auth.model'
import { STORAGE_KEYS } from '@/constants/storageKeys'

export const saveAuth = (data: AuthSession): void => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(data))
}

export const getAuth = (): AuthSession | null => {
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
    const auth = getAuth()
    if (!auth?.accessToken || !auth.expiresAt) return false
    return auth.expiresAt > Date.now()
}
