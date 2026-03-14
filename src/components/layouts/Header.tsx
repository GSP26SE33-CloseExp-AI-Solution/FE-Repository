import { useAuthContext } from "@/contexts/AuthContext"
import CustomerHeader from "./headers/CustomerHeader"
import AdminHeader from "./headers/AdminHeader"
import SupplierHeader from "./headers/SupplierHeader"
import PackageHeader from "./headers/PackageHeader"
import MarketingHeader from "./headers/MarketingHeader"

const Header = () => {
    const { user, roleName } = useAuthContext()

    if (!user || !roleName) return <CustomerHeader />

    switch (roleName) {
        case "Admin":
            return <AdminHeader />

        case "SupplierStaff":
            return <SupplierHeader />

        case "PackageStaff":
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
