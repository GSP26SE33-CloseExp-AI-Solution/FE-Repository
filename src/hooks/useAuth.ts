import { useState } from 'react'
import { loginApi } from '@/services/auth.service'
import { saveAuth, clearAuth } from '@/utils/authStorage'
import { AuthSession } from '@/types/auth.model'

export const useAuth = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const login = async (email: string, password: string): Promise<AuthSession | null> => {
        try {
            setLoading(true)
            setError(null)

            const session = await loginApi({ email, password })
            saveAuth(session)

            return session
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại')
            return null
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        clearAuth()
    }

    return { login, logout, loading, error }
}
