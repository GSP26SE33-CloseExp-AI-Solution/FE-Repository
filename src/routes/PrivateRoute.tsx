import { Outlet, Navigate, useLocation } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"

const PrivateRoute = () => {
    const { user, initialized } = useAuthContext()
    const location = useLocation()

    if (!initialized) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        )
    }

    return <Outlet />
}

export default PrivateRoute
