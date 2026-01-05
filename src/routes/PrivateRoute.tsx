import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    // Chưa đăng nhập
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Đã đăng nhập
    return <>{children}</>;
};

export default PrivateRoute;
