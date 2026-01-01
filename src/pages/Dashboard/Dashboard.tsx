import React from 'react';
import { getAuth } from '../../utils/auth';

const Dashboard: React.FC = () => {
    const auth = getAuth();

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Xin chào, {auth?.userName}</p>
            <p>Role: {auth?.role}</p>
        </div>
    );
};

export default Dashboard;
