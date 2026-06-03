import { Outlet } from "react-router-dom"

import NotificationRealtimeBridge from "@/components/notifications/NotificationRealtimeBridge"
import Footer from "@/components/layouts/Footer"
import Header from "@/components/layouts/Header"
import Sidebar from "@/components/layouts/Sidebar"
import { useAuthContext } from "@/contexts/AuthContext"
import { getNotificationScopeForRole } from "@/utils/notificationScope"

const MainLayout: React.FC = () => {
    const { user, roleName } = useAuthContext()
    const notificationScope = getNotificationScopeForRole(roleName)

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {notificationScope ? (
                <NotificationRealtimeBridge
                    enabled={Boolean(user?.userId)}
                    scope={notificationScope}
                />
            ) : null}
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
