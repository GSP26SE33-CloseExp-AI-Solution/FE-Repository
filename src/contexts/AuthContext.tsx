import { createContext, useContext, useEffect, useState } from "react"
import { AuthData, User } from "@/types/auth.types"
import { getAuthSession, clearAuth, saveAuth } from "@/utils/authStorage"

type AuthContextType = {
    user: User | null
    roleName: string | null
    supermarketName: string
    loginSuccess: (session: AuthData) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [roleName, setRoleName] = useState<string | null>(null)
    const [supermarketName, setSupermarketName] = useState("")

    useEffect(() => {
        const session = getAuthSession()
        if (session?.user) {
            setUser(session.user)
            setRoleName(session.user.roleName)
            setSupermarketName(
                session.user.marketStaffInfo?.supermarket?.name ?? ""
            )
        }
    }, [])

    const loginSuccess = (session: AuthData) => {
        saveAuth(session)
        setUser(session.user)
        setRoleName(session.user.roleName)
        setSupermarketName(
            session.user.marketStaffInfo?.supermarket?.name ?? ""
        )
    }

    const logout = () => {
        clearAuth()
        setUser(null)
        setRoleName(null)
        setSupermarketName("")
        window.location.href = "/login"
    }

    return (
        <AuthContext.Provider
            value={{ user, roleName, supermarketName, loginSuccess, logout }}
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
