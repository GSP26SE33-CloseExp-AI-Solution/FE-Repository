import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"

const PublicLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#F6F8F6]">
            <Header />

            <div className="flex-1 pt-20">
                <Outlet />
            </div>
            
            <Footer />
        </div>
    )
}

export default PublicLayout