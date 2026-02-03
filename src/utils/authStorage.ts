import { AuthData } from "@/types/auth.types"

const KEY = "auth_session"

const getSession = (): AuthData | null => {
    const raw = localStorage.getItem(KEY)
    try {
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export const authStorage = {
    get: getSession,

    set(data: AuthData) {
        localStorage.setItem(KEY, JSON.stringify(data))
    },

    clear() {
        localStorage.removeItem(KEY)
    },

    isAuthenticated(): boolean {
        const session = getSession()
        if (!session?.accessToken) return false
        if (isTokenExpired(session.expiresAt)) {
            localStorage.removeItem(KEY)
            return false
        }
        return true
    },

    getAccessToken(): string | null {
        return getSession()?.accessToken ?? null
    },

    getRefreshToken(): string | null {
        return getSession()?.refreshToken ?? null
    },
}

export const getAuthSession = () => getSession()
export const saveAuth = (data: AuthData) => authStorage.set(data)
export const clearAuth = () => authStorage.clear()
export const isAuthenticated = () => authStorage.isAuthenticated()

export const getSupermarketName = (): string => {
    return authStorage.get()?.user?.marketStaffInfo?.supermarket?.name ?? ""
}

const isTokenExpired = (expiresAt?: string): boolean => {
    if (!expiresAt) return true
    return new Date(expiresAt).getTime() <= Date.now()
}
