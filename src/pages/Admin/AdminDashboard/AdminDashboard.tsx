import React from 'react';
import { getAuthSession } from '@/utils/authStorage';
import { useLogout } from '@/hooks/useLogout';

const AdminDashboard: React.FC = () => {
    const auth = getAuthSession();
    const { logout } = useLogout();

    return (
        <div style={{ padding: '24px' }}>
            <h1>Dashboard</h1>

            <p>Xin chào, <strong>{auth?.user.email}</strong></p>
            <p>Role: <strong>{auth?.user.role}</strong></p>

            <button
                onClick={logout}
                style={{
                    marginTop: '16px',
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                }}
            >
                Đăng xuất
            </button>
        </div>
    );
};

export default AdminDashboard;
