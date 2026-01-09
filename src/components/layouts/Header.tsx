import { useLogout } from '@/hooks/useLogout';

const Header = () => {
    const { logout } = useLogout();

    return (
        <header>
            <h1>Đây là Header</h1>
            <button onClick={logout}>Đăng xuất</button>
        </header>
    );
};

export default Header;
