import { createContext, useContext, useEffect, useState } from "react"
import type { AuthData, User } from "@/types/auth.types"
import { getAuthSession, clearAuth, saveAuth } from "@/utils/authStorage"
import { authService } from "@/services/auth.service"

type AuthContextType = {
    user: User | null
    roleName: string | null
    supermarketName: string
    isSupermarketManager: boolean
    isSubSupermarketStaff: boolean
    employeeCodeHint: string
    initialized: boolean
    loginSuccess: (session: AuthData) => void
    logout: () => Promise<void>
    logoutAll: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const getDerivedAuthState = (user: User | null) => {
    const marketStaffInfo = user?.marketStaffInfo ?? null
    const parentSuperStaffId = marketStaffInfo?.parentSuperStaffId ?? null

    const isSupermarketManager = !!marketStaffInfo && !parentSuperStaffId
    const isSubSupermarketStaff = !!parentSuperStaffId
    const supermarketName = marketStaffInfo?.supermarket?.name ?? ""
    const employeeCodeHint = marketStaffInfo?.employeeCodeHint ?? ""

    return {
        isSupermarketManager,
        isSubSupermarketStaff,
        supermarketName,
        employeeCodeHint,
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [roleName, setRoleName] = useState<string | null>(null)
    const [supermarketName, setSupermarketName] = useState("")
    const [isSupermarketManager, setIsSupermarketManager] = useState(false)
    const [isSubSupermarketStaff, setIsSubSupermarketStaff] = useState(false)
    const [employeeCodeHint, setEmployeeCodeHint] = useState("")
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        const session = getAuthSession()

        if (session?.user) {
            const derived = getDerivedAuthState(session.user)

            setUser(session.user)
            setRoleName(session.user.roleName ?? null)
            setSupermarketName(derived.supermarketName)
            setIsSupermarketManager(derived.isSupermarketManager)
            setIsSubSupermarketStaff(derived.isSubSupermarketStaff)
            setEmployeeCodeHint(derived.employeeCodeHint)
        }

        setInitialized(true)
    }, [])

    const loginSuccess = (session: AuthData) => {
        const derived = getDerivedAuthState(session.user)

        saveAuth(session)
        setUser(session.user)
        setRoleName(session.user.roleName ?? null)
        setSupermarketName(derived.supermarketName)
        setIsSupermarketManager(derived.isSupermarketManager)
        setIsSubSupermarketStaff(derived.isSubSupermarketStaff)
        setEmployeeCodeHint(derived.employeeCodeHint)
        setInitialized(true)
    }

    const resetAuthState = () => {
        clearAuth()
        setUser(null)
        setRoleName(null)
        setSupermarketName("")
        setIsSupermarketManager(false)
        setIsSubSupermarketStaff(false)
        setEmployeeCodeHint("")
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
            resetAuthState()
        }
    }

    const logoutAll = async () => {
        try {
            await authService.logoutAll()
        } finally {
            resetAuthState()
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                roleName,
                supermarketName,
                isSupermarketManager,
                isSubSupermarketStaff,
                employeeCodeHint,
                initialized,
                loginSuccess,
                logout,
                logoutAll,
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
