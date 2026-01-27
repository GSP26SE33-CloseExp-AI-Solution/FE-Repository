import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/services/authService';

const GuestHome: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = (): void => {
        logout();
        navigate('/login');
    };

    return (
        <div>
            <h1>GuestHome</h1>
            <p>Welcome to Close Expired Products Platform</p>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
};

export default GuestHome;
