import { useState } from "react"
import { loginApi, registerApi } from "@/services/auth.service"
import { saveAuth, clearAuth } from "@/utils/authStorage"
import { AuthData } from "@/types/auth.types"

export const useAuth = () => {
    const [loading, setLoading] = useState(false)

    const logout = () => {
        clearAuth()
    }

    const login = async (email: string, password: string): Promise<AuthData | null> => {
        try {
            setLoading(true)

            const session = await loginApi({ email, password })

            console.log("✅ SESSION:", session)
            console.log("🏪 SUPERMARKET:", session.user.marketStaffInfo?.supermarket?.name)

            saveAuth(session)

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

            saveAuth(session)

            return session
        } catch (e) {
            console.error("❌ REGISTER ERROR", e)
            return null
        } finally {
            setLoading(false)
        }
    }

    return { login, register, loading, logout }
}
