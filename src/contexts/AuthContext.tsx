import { createContext, useContext, useEffect, useState } from "react"
import { AuthData, User } from "@/types/auth.types"
import { getAuthSession, clearAuth, saveAuth } from "@/utils/authStorage"
import { authService } from "@/services/auth.service"

type AuthContextType = {
    user: User | null
    roleName: string | null
    supermarketName: string
    initialized: boolean
    loginSuccess: (session: AuthData) => void
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [roleName, setRoleName] = useState<string | null>(null)
    const [supermarketName, setSupermarketName] = useState("")
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        const session = getAuthSession()
        if (session?.user) {
            setUser(session.user)
            setRoleName(session.user.roleName)
            setSupermarketName(session.user.marketStaffInfo?.supermarket?.name ?? "")
        }
        setInitialized(true)
    }, [])

    const loginSuccess = (session: AuthData) => {
        saveAuth(session)
        setUser(session.user)
        setRoleName(session.user.roleName)
        setSupermarketName(session.user.marketStaffInfo?.supermarket?.name ?? "")
        setInitialized(true)
    }

    const logout = async () => {
        const session = getAuthSession()
        const refreshToken = session?.refreshToken

        try {
            if (refreshToken) {
                await authService.logout(refreshToken)
            }
        } finally {
            clearAuth()
            setUser(null)
            setRoleName(null)
            setSupermarketName("")
            setInitialized(true)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                roleName,
                supermarketName,
                initialized,
                loginSuccess,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuthContext = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider")
    return ctx
}
