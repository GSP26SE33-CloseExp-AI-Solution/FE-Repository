import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{ textAlign: 'center', marginTop: 80 }}>
            <h1>404</h1>
            <h2>Trang không tồn tại</h2>
            <p>Đường dẫn bạn truy cập không hợp lệ.</p>

            <button onClick={() => navigate('/')}>
                Quay về trang chủ
            </button>
        </div>
    );
};

export default NotFound;
