import { useAuthContext } from "@/contexts/AuthContext"
import CustomerHeader from "./headers/CustomerHeader"
import StaffHeader from "./headers/StaffHeader"

const DASHBOARD_ROLES = new Set([
    "Admin",
    "Staff",
    "MarketingStaff",
    "SupplierStaff",
    "DeliveryStaff",
])

const Header = () => {
    const { user, roleName } = useAuthContext()

    if (!user || !roleName) return <CustomerHeader />

    if (roleName === "Vendor") return <CustomerHeader />

    if (DASHBOARD_ROLES.has(roleName)) return <StaffHeader />

    return <CustomerHeader />
}

export default Header