import { Outlet } from "react-router-dom"

import NotificationRealtimeBridge from "@/components/notifications/NotificationRealtimeBridge"
import Footer from "./Footer"
import Header from "./Header"
import { useAuthContext } from "@/contexts/AuthContext"
import { getNotificationScopeForRole } from "@/utils/notificationScope"

const PublicLayout: React.FC = () => {
    const { user, roleName } = useAuthContext()
    const notificationScope = getNotificationScopeForRole(roleName)

    return (
        <div className="min-h-screen flex flex-col bg-[#F6F8F6]">
            {notificationScope ? (
                <NotificationRealtimeBridge
                    enabled={Boolean(user?.userId)}
                    scope={notificationScope}
                />
            ) : null}
            <Header />

            <div className="flex-1 pt-20">
                <Outlet />
            </div>
            
            <Footer />
        </div>
    )
}

export default PublicLayout
