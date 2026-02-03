import { clearAuth } from "@/utils/authStorage"

export const useLogout = () => {
    const logout = () => {
        clearAuth()
        window.location.href = "/login"
    }

    return { logout }
}
