import { authService } from "@/services/auth.service"
import { authStorage, clearAuth } from "@/utils/authStorage"

export const useLogout = () => {
    const logout = async () => {
        const refreshToken = authStorage.getRefreshToken()

        try {
            if (refreshToken) {
                await authService.logout(refreshToken)
            }
        } catch (error) {
            console.warn("Logout API failed", error)
        } finally {
            clearAuth()
            window.location.href = "/login"
        }
    }

    return { logout }
}
