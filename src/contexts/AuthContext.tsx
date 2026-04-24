import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { AuthData, AuthUser } from "@/types/auth.types"
import { getAuthSession, clearAuth, saveAuth } from "@/utils/authStorage"
import { authService } from "@/services/auth.service"
import { adminService } from "@/services/admin.service"

type AuthContextType = {
    user: AuthUser | null
    roleName: string | null
    supermarketName: string
    isSupermarketManager: boolean
    isSubSupermarketStaff: boolean
    employeeCodeHint: string
    initialized: boolean
    loginSuccess: (session: AuthData) => void
    logout: () => Promise<void>
    logoutAll: () => Promise<void>
    refreshProfile: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextType | null>(null)

const CUSTOMER_CART_KEY = "customer_cart_v1"
const CUSTOMER_DELIVERY_CONTEXT_KEY = "customer_delivery_context_v3"

const getDerivedAuthState = (user: AuthUser | null) => {
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

const clearCustomerPurchaseStateIfNeeded = (user: AuthUser | null) => {
    const roleName = user?.roleName ?? ""

    if (roleName !== "Vendor") {
        localStorage.removeItem(CUSTOMER_CART_KEY)
        localStorage.removeItem(CUSTOMER_DELIVERY_CONTEXT_KEY)
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [roleName, setRoleName] = useState<string | null>(null)
    const [supermarketName, setSupermarketName] = useState("")
    const [isSupermarketManager, setIsSupermarketManager] = useState(false)
    const [isSubSupermarketStaff, setIsSubSupermarketStaff] = useState(false)
    const [employeeCodeHint, setEmployeeCodeHint] = useState("")
    const [initialized, setInitialized] = useState(false)

    const applyUserState = useCallback((nextUser: AuthUser | null) => {
        const derived = getDerivedAuthState(nextUser)

        clearCustomerPurchaseStateIfNeeded(nextUser)

        setUser(nextUser)
        setRoleName(nextUser?.roleName ?? null)
        setSupermarketName(derived.supermarketName)
        setIsSupermarketManager(derived.isSupermarketManager)
        setIsSubSupermarketStaff(derived.isSubSupermarketStaff)
        setEmployeeCodeHint(derived.employeeCodeHint)
    }, [])

    const refreshProfile = useCallback(async (): Promise<AuthUser | null> => {
        try {
            const latestUser = await adminService.getCurrentUserProfile()

            const normalizedUser = {
                ...latestUser,
                phone: latestUser.phone ?? "",
            } as AuthUser

            const currentSession = getAuthSession()

            if (currentSession) {
                saveAuth({
                    ...currentSession,
                    user: normalizedUser,
                })
            }

            applyUserState(normalizedUser)
            return normalizedUser
        } catch (err) {
            console.error("AuthContext.refreshProfile -> error:", err)
            return null
        }
    }, [applyUserState])

    useEffect(() => {
        const run = async () => {
            const session = getAuthSession()

            if (session?.user) {
                applyUserState(session.user)

                try {
                    await refreshProfile()
                } finally {
                    setInitialized(true)
                }

                return
            }

            setInitialized(true)
        }

        void run()
    }, [applyUserState, refreshProfile])

    const loginSuccess = (session: AuthData) => {
        saveAuth(session)
        applyUserState(session.user)
        setInitialized(true)

        void refreshProfile()
    }

    const resetAuthState = () => {
        clearAuth()
        localStorage.removeItem(CUSTOMER_CART_KEY)
        localStorage.removeItem(CUSTOMER_DELIVERY_CONTEXT_KEY)

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
                refreshProfile,
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
