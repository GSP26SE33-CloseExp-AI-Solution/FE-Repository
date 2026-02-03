import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"

const PrivateRoute = () => {
    const { user } = useAuthContext()
    const location = useLocation()

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
