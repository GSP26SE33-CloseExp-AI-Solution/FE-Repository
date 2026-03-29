import { useEffect, useState } from "react"
import { Outlet, useLocation, Navigate } from "react-router-dom"

import { getMySupermarketApplications } from "@/services/supermarketApplication.service"
import { SupermarketState } from "@/types/supermarketApplication.types"

const STATUS_PAGE = "/vendor/supermarket-application"

/**
 * Vendor đang có hồ sơ PendingApproval không được vào mua hàng / giỏ —
 * chuyển sang màn trạng thái hồ sơ (theo kế hoạch nghiệp vụ).
 */
const VendorSupermarketGate = () => {
    const location = useLocation()
    const [decision, setDecision] = useState<"allow" | "block" | null>(null)

    useEffect(() => {
        if (location.pathname === STATUS_PAGE) {
            setDecision("allow")
            return
        }

        let cancelled = false
        ;(async () => {
            try {
                const list = await getMySupermarketApplications()
                if (cancelled) return
                const hasPending = list.some(
                    (a) => a.status === SupermarketState.PendingApproval
                )
                setDecision(hasPending ? "block" : "allow")
            } catch {
                if (!cancelled) setDecision("allow")
            }
        })()

        return () => {
            cancelled = true
        }
    }, [location.pathname])

    if (decision === null) {
        return (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-gray-600">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Đang kiểm tra hồ sơ siêu thị…</p>
            </div>
        )
    }

    if (decision === "block") {
        return <Navigate to={STATUS_PAGE} replace />
    }

    return <Outlet />
}

export default VendorSupermarketGate
