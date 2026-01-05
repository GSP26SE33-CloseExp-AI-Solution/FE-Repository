import React from 'react';
import { useLogin } from '@/hooks/useLogin';

const Login: React.FC = () => {
    const {
        email,
        password,
        error,
        loading,
        setEmail,
        setPassword,
        handleSubmit,
    } = useLogin();

    return (
        <div style={styles.container}>
            <h2>Đăng nhập hệ thống</h2>

            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                />

                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />

                {error && <p style={styles.error}>{error}</p>}

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

            </form>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '400px',
        margin: '80px auto',
        padding: '24px',
        border: '1px solid #ddd',
        borderRadius: '8px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    input: {
        padding: '10px',
        fontSize: '14px',
    },
    button: {
        padding: '10px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        fontSize: '13px',
    },
};

export default Login;
