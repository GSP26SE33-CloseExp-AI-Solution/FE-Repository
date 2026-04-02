import { Navigate, Outlet } from "react-router-dom"

import { useAuthContext } from "@/contexts/AuthContext"

interface Props {
    allow: string[]
}

const RoleRoute = ({ allow }: Props) => {
    const { user, roleName, initialized } = useAuthContext()

    if (!initialized) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                Đang kiểm tra quyền truy cập...
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (!roleName || !allow.includes(roleName)) {
        return <Navigate to="/forbidden" replace />
    }

    return <Outlet />
}

export default RoleRoute
