import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '@/hooks/useLogin';
import { getRedirectByRole } from '@/utils/redirect';
import { getAuth } from '@/utils/auth';

const Login = () => {
    const navigate = useNavigate();
    const { handleLogin, loading, error } = useLogin();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Nếu đã login thì đá về trang theo role
    useEffect(() => {
        const auth = getAuth();
        if (auth) {
            navigate(getRedirectByRole(auth.user.role), { replace: true });
        }
    }, [navigate]);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await handleLogin({ email, password });
            if (!response) return;

            const redirectUrl = getRedirectByRole(response.user.role);
            navigate(redirectUrl, { replace: true });
        } catch {
            // error đã được set trong useLogin
        }
    };

    return (
        <form onSubmit={onSubmit}>
            <h2>Đăng nhập</h2>

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <button type="submit" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div style={{ marginTop: 16 }}>
                <p>Account test:</p>
                <ul>
                    <li>ADMIN — admin@test.com / 123456</li>
                    <li>VENDOR — vendor@test.com / 123456</li>
                    <li>SUPERMARKET STAFF — supermarket@test.com / 123456</li>
                    <li>PACKAGE STAFF — package@test.com / 123456</li>
                    <li>MARKETING STAFF — marketing@test.com / 123456</li>
                </ul>
            </div>
        </form>
    );
};

export default Login;
