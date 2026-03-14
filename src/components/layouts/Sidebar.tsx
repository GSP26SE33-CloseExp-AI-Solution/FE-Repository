import { useAuthContext } from "@/contexts/AuthContext"
import AdminSidebar from "./sidebars/AdminSidebar"
import SupplierSidebar from "./sidebars/SupplierSidebar"
import PackageSidebar from "./sidebars/PackageSidebar"
import MarketingSidebar from "./sidebars/MarketingSidebar"

const Sidebar = () => {
    const { roleName } = useAuthContext()

    switch (roleName) {
        case "Admin":
            return <AdminSidebar />

        case "SupplierStaff":
            return <SupplierSidebar />

        case "PackageStaff":
            return <PackageSidebar />

        case "MarketingStaff":
            return <MarketingSidebar />

        default:
            return null
    }
}

export default Sidebar
