import { useState } from "react"
import { loginApi, registerApi } from "@/services/auth.service"
import { AuthData } from "@/types/auth.types"
import { useAuthContext } from "@/contexts/AuthContext"

export const useAuth = () => {
    const [loading, setLoading] = useState(false)
    const { user, loginSuccess, logout: contextLogout } = useAuthContext()

    const login = async (
        email: string,
        password: string
    ): Promise<AuthData | null> => {
        try {
            setLoading(true)

            const session = await loginApi({ email, password })
            console.log("✅ LOGIN SESSION:", session)

            loginSuccess(session)

            return session
        } catch (e) {
            console.error("❌ LOGIN ERROR", e)
            return null
        } finally {
            setLoading(false)
        }
    }

    const register = async (payload: any): Promise<AuthData | null> => {
        try {
            setLoading(true)

            const session = await registerApi(payload)
            console.log("✅ REGISTER SESSION:", session)

            loginSuccess(session)

            return session
        } catch (e) {
            console.error("❌ REGISTER ERROR", e)
            return null
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        await contextLogout()
    }

    return {
        user,
        login,
        register,
        logout,
        loading,
    }
}
