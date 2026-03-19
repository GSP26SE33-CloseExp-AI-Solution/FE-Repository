import { useAuthContext } from "@/contexts/AuthContext"
import AdminSidebar from "./sidebars/AdminSidebar"
import SupermarketStaffSidebar from "./sidebars/SupermarketStaffSidebar"
import PackageSidebar from "./sidebars/PackagingStaffSidebar"
import MarketingSidebar from "./sidebars/MarketingStaffSidebar"

const Sidebar = () => {
    const { roleName } = useAuthContext()

    switch (roleName) {
        case "Admin":
            return <AdminSidebar />

        case "SupermarketStaff":
            return <SupermarketStaffSidebar />

        case "PackagingStaff":
            return <PackageSidebar />

        case "MarketingStaff":
            return <MarketingSidebar />

        default:
            return null
    }
}

export default Sidebar
