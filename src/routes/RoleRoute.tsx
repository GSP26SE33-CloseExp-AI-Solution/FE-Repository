import { Navigate, Outlet } from 'react-router-dom'
import { getAuthSession } from '@/utils/authStorage'
import { UserRole } from '@/types/auth.model'

interface Props {
    allow: UserRole[]
}

const RoleRoute = ({ allow }: Props) => {
    const auth = getAuthSession()

    if (!auth) return <Navigate to="/login" replace />

    if (!allow.includes(auth.user.role)) {
        return <Navigate to="/forbidden" replace />
    }

    return <Outlet />
}

export default RoleRoute
