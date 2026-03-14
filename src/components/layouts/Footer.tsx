import React from "react"
import { useAuthContext } from "@/contexts/AuthContext"

import CustomerFooter from "./footers/CustomerFooter"
import AdminFooter from "./footers/AdminFooter"
import SupplierFooter from "./footers/SupplierFooter"
import PackageFooter from "./footers/PackageFooter"
import MarketingFooter from "./footers/MarketingFooter"

const Footer: React.FC = () => {
    const { user, roleName } = useAuthContext()

    if (!user || !roleName) return <CustomerFooter />

    switch (roleName) {
        case "Admin":
            return <AdminFooter />

        case "SupplierStaff":
            return <SupplierFooter />

        case "PackageStaff":
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
