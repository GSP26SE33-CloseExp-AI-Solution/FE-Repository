import { useAuthContext } from "@/contexts/AuthContext"
import CustomerHeader from "./headers/CustomerHeader"
import AdminHeader from "./headers/AdminHeader"
import SupermarketStaffHeader from "./headers/SupermarketStaffHeader"
import PackageHeader from "./headers/PackagingStaffHeader"
import MarketingHeader from "./headers/MarketingStaffHeader"

const Header = () => {
    const { user, roleName } = useAuthContext()

    if (!user || !roleName) return <CustomerHeader />

    switch (roleName) {
        case "Admin":
            return <AdminHeader />

        case "SupermarketStaff":
            return <SupermarketStaffHeader />

        case "PackagingStaff":
            return <PackageHeader />

        case "MarketingStaff":
            return <MarketingHeader />

        case "Vendor":
            return <CustomerHeader />

        default:
            return <CustomerHeader />
    }
}

export default Header
