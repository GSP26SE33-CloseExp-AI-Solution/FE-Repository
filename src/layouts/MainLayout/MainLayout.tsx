import { Outlet } from "react-router-dom";
import Header from "@/components/layouts/Header";

const MainLayout = () => {
    return (
        <div>
            <Header />
            <Outlet />
            {/* footer */}
        </div>
    );
};

export default MainLayout;
