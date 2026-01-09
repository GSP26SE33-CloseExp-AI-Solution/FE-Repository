import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '@/hooks/useLogin';

const Login = () => {
    const navigate = useNavigate();
    const { handleLogin, loading, error } = useLogin();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await handleLogin({ email, password });

            switch (response.user.role) {
                case 'ADMIN':
                    navigate('/admin/dashboard');
                    break;
                case 'SUPERMARKET_STAFF':
                    navigate('/supermarket/products');
                    break;
                case 'PACKAGE_STAFF':
                    navigate('/package/orders');
                    break;
                case 'MARKETING_STAFF':
                    navigate('/marketing/promotions');
                    break;
                case 'VENDOR':
                    navigate('/');
                    break;
                default:
                    navigate('/guest');
            }

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
                    <li>STAFF — staff@test.com / 123456</li>
                    <li>USER — user@test.com / 123456</li>
                </ul>
            </div>
        </form>
    );
};

export default Login;
