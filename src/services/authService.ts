import axiosClient from './axiosClient';
import { mockUsers } from '@/mocks/mockUsers';
import { ILoginResponse } from '@/types/auth.type';
import { clearAuth } from '@/utils/auth';

interface LoginPayload {
    email: string;
    password: string;
}

export const login = async (
    payload: LoginPayload
): Promise<ILoginResponse> => {
    // ==========================
    // 🔴 API thật (dùng sau)
    // ==========================
    /*
    return axiosClient.post('/auth/login', payload);
    */

    const user = mockUsers.find(
        u => u.email === payload.email && u.password === payload.password
    );

    if (!user) {
        throw new Error('Email hoặc mật khẩu không đúng');
    }

    return {
        token: `mock-token-${user.id}`,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    };
};

export const logout = (): void => {
    clearAuth();

    // ==========================
    // 🔴 API thật (dùng sau)
    // ==========================
    /*
    return axiosClient.post('/auth/logout');
    */
};