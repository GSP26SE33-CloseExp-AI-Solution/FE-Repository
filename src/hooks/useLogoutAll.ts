import { useState } from "react"

import { authService } from "@/services/auth.service"
import { authStorage, clearAuth } from "@/utils/authStorage"
import { showError, showSuccess } from "@/utils/toast"

export const useLogoutAll = () => {
    const [loggingOutAll, setLoggingOutAll] = useState(false)

    const logoutAll = async () => {
        if (!authStorage.getRefreshToken() && !authStorage.getAccessToken()) {
            clearAuth()
            window.location.href = "/login"
            return
        }

        try {
            setLoggingOutAll(true)

            await authService.logoutAll()
            showSuccess("Đã đăng xuất khỏi tất cả thiết bị.")
        } catch (error: any) {
            console.error("Logout all failed", error)
            showError(error?.message || "Không thể đăng xuất khỏi tất cả thiết bị.")
            return
        } finally {
            setLoggingOutAll(false)
        }

        clearAuth()
        window.location.href = "/login"
    }

    return {
        logoutAll,
        loggingOutAll,
    }
}
