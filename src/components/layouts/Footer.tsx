import React from "react"
import { useAuthContext } from "@/contexts/AuthContext"

import CustomerFooter from "./footers/CustomerFooter"
import SupplierFooter from "./footers/SupplierFooter"
import StaffFooter from "./footers/StaffFooter"

const INTERNAL_ROLES = new Set(["Admin", "Staff", "MarketingStaff", "DeliveryStaff"])

const Footer: React.FC = () => {
    const { user, roleName } = useAuthContext()

    if (!user || !roleName) return <CustomerFooter />

    if (roleName === "Vendor") return <CustomerFooter />

    if (roleName === "SupplierStaff") return <SupplierFooter />

    if (INTERNAL_ROLES.has(roleName)) return <StaffFooter />

    return <CustomerFooter />
}

export default Footer