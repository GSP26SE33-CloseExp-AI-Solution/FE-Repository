import { Navigate, Outlet } from 'react-router-dom';
import { getAuth } from '@/utils/auth';
import { UserRole } from '@/types/auth.type';
import { getRedirectByRole } from '@/utils/redirect';

interface Props {
    allow: UserRole[];
}

const RoleRoute = ({ allow }: Props) => {
    const auth = getAuth();

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    if (!allow.includes(auth.user.role)) {
        return (
            <Navigate
                to={getRedirectByRole(auth.user.role)}
                replace
            />
        );
    }

    return <Outlet />;
};

export default RoleRoute;
