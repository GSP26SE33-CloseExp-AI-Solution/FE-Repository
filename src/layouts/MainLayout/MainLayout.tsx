import { Outlet } from "react-router-dom";

const MainLayout = () => {
    return (
        <div>
            {/* header */}
            <Outlet />
            {/* footer */}
        </div>
    );
};

export default MainLayout;
