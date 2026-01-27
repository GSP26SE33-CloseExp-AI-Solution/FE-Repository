import { Outlet } from "react-router-dom";
import { Header, Sidebar, Footer } from "@/components/layouts";

const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />

            <div className="flex flex-1 pt-20">
                <Sidebar />
                <main className="flex-1 p-5 bg-white min-w-0">
                    <Outlet />
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default MainLayout;
