import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { useAuthContext } from "@/contexts/AuthContext"
import { getRedirectByRoleSafe } from "@/utils/roleRedirect"

const RoleRedirect = () => {
    const { user, initialized } = useAuthContext()
    const navigate = useNavigate()

    useEffect(() => {
        if (!initialized) return

        if (!user) {
            navigate("/login", { replace: true })
            return
        }

        const path = getRedirectByRoleSafe(user.roleId)
        navigate(path, { replace: true })
    }, [initialized, user, navigate])

    return (
        <div className="h-screen flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">
                Đang chuyển tới không gian làm việc…
            </p>
        </div>
    )
}

export default RoleRedirect
