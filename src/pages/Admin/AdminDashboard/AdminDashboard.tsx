import React from 'react';
import { getAuth } from '@/utils/auth';
import { useLogout } from '@/hooks/useLogout';

const AdminDashboard: React.FC = () => {
    const auth = getAuth();

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Xin chào, {auth?.user.email}</p>
            <p>Role: {auth?.user.role}</p>
        </div>
    );
};

export default AdminDashboard;
