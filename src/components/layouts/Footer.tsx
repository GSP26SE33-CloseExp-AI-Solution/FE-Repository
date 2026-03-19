import React from "react"
import { useAuthContext } from "@/contexts/AuthContext"

import CustomerFooter from "./footers/CustomerFooter"
import AdminFooter from "./footers/AdminFooter"
import SupermarketStaffFooter from "./footers/SupermarketStaffFooter"
import PackageFooter from "./footers/PackagingStaffFooter"
import MarketingFooter from "./footers/MarketingStaffFooter"

const Footer: React.FC = () => {
    const { user, roleName } = useAuthContext()

    if (!user || !roleName) return <CustomerFooter />

    switch (roleName) {
        case "Admin":
            return <AdminFooter />

        case "SupermarketStaff":
            return <SupermarketStaffFooter />

        case "PackagingStaff":
            return <PackageFooter />

        case "MarketingStaff":
            return <MarketingFooter />

        case "Vendor":
            return <CustomerFooter />

        default:
            return <CustomerFooter />
    }
}

export default Footer
