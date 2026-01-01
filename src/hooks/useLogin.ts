import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { saveAuth } from '../utils/auth';
import { ILoginRequest } from '../types/auth.type';

export const useLogin = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }

        setLoading(true);
        setError('');

        const payload: ILoginRequest = {
            email,
            password,
        };

        try {
            const response = await login(payload);

            // LƯU AUTH
            saveAuth(response);

            // REDIRECT THEO ROLE
            switch (response.role) {
                case 'ADMIN':
                    navigate('/dashboard');
                    break;
                case 'STAFF':
                    navigate('/orders');
                    break;
                default:
                    navigate('/');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        email,
        password,
        error,
        loading,
        setEmail,
        setPassword,
        handleSubmit,
    };
};
