import { Navigate, Outlet } from 'react-router-dom';
import { getAuth } from '@/utils/auth';
import { UserRole } from '@/types/auth.type';

interface Props {
    allow: UserRole[];
}

const RoleRoute = ({ allow }: Props) => {
    const auth = getAuth();

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    if (!allow.includes(auth.user.role)) {
        return <Navigate to="/403" replace />;
    }

    return <Outlet />;
};

export default RoleRoute;
