import { useNavigate } from 'react-router-dom';
import { clearAuth } from '@/utils/auth';

export const useLogout = () => {
    const navigate = useNavigate();

    const logout = () => {
        clearAuth();

        navigate('/login', {
            replace: true, // chặn back
        });
    };

    return { logout };
};
