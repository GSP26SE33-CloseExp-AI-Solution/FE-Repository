import { useNavigate } from 'react-router-dom';

const Forbidden = () => {
    const navigate = useNavigate();

    return (
        <div style={{ textAlign: 'center', marginTop: 80 }}>
            <h1>403</h1>
            <h2>Truy cập bị từ chối</h2>
            <p>Bạn không có quyền truy cập trang này.</p>

            <button onClick={() => navigate(-1)}>
                Quay lại
            </button>
        </div>
    );
};

export default Forbidden;
