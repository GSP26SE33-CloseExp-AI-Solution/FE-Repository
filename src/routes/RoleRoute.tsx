import { Navigate, Outlet } from "react-router-dom"

import { useAuthContext } from "@/contexts/AuthContext"

interface Props {
    allow: string[]
}

const RoleRoute = ({ allow }: Props) => {
    const { user } = useAuthContext()

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (!allow.includes(user.roleName)) {
        return <Navigate to="/forbidden" replace />
    }

    return <Outlet />
}

export default RoleRoute
