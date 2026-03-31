import { useState } from "react"

import { authService } from "@/services/auth.service"
import { clearAuth } from "@/utils/authStorage"
import { showError, showSuccess } from "@/utils/toast"

export const useLogoutAll = () => {
    const [loggingOutAll, setLoggingOutAll] = useState(false)

    const logoutAll = async () => {
        try {
            setLoggingOutAll(true)

            await authService.logoutAll()
            showSuccess("Đã đăng xuất khỏi tất cả thiết bị.")

            clearAuth()
            window.location.href = "/login"
        } catch (error: any) {
            console.error("Logout all failed", error)
            showError(error?.message || "Không thể đăng xuất khỏi tất cả thiết bị.")
        } finally {
            setLoggingOutAll(false)
        }
    }

    return {
        logoutAll,
        loggingOutAll,
    }
}
