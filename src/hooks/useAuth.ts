import { useState } from 'react'
import { loginApi, registerApi } from '@/services/auth.service'
import { clearAuth } from '@/utils/authStorage'
import { AuthSession } from '@/types/auth.model'

export const useAuth = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const login = async (email: string, password: string): Promise<AuthSession | null> => {
        try {
            setLoading(true)
            setError(null)

            const session = await loginApi({ email, password })
            return session
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại')
            return null
        } finally {
            setLoading(false)
        }
    }

    const register = async (
        fullName: string,
        email: string,
        phone: string,
        password: string
    ): Promise<boolean> => {
        try {
            setLoading(true)
            setError(null)

            await registerApi({ fullName, email, phone, password })
            return true
        } catch (err: any) {
            setError(err.message || 'Đăng ký thất bại')
            return false
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        clearAuth()
    }

    return { login, register, logout, loading, error }
}
