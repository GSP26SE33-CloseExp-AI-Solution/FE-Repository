import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/utils/authStorage";

const PrivateRoute = () => {
    const location = useLocation();

    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
