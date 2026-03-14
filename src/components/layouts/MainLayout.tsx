import { Outlet } from "react-router-dom"
import Header from "@/components/layouts/Header"
import Sidebar from "@/components/layouts/Sidebar"
import Footer from "@/components/layouts/Footer"

const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />

            <div className="flex flex-1 pt-20">
                <Sidebar />
                <main className="flex-1 min-w-0 p-5 bg-white">
                    <Outlet />
                </main>
            </div>

            <Footer />
        </div>
    )
}

export default MainLayout
