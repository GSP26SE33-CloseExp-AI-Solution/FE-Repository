import { useState } from 'react';
import { login } from '@/services/auth.service';
import { saveAuth } from '@/utils/auth';
import { AuthSession } from '@/types/auth.model';

interface LoginPayload {
    email: string;
    password: string;
}

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (
        payload: LoginPayload
    ): Promise<AuthSession> => {
        try {
            setLoading(true);
            setError(null);

            const res = await login(payload);

            saveAuth(res);

            return res;
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        handleLogin,
        loading,
        error,
    };
};
