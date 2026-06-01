import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Loader2, PackageOpen, RefreshCcw } from "lucide-react"

import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import {
    STAFF_HEADER_CONFIG,
    STAFF_NOTIFICATION_ROUTES,
} from "@/constants/layoutByRole"
import { useLogoutAll } from "@/hooks/useLogoutAll"
import { packagingService } from "@/services/packaging.service"

const PackageHeader = () => {
    const config = STAFF_HEADER_CONFIG.PackagingStaff
    const { logoutAll, loggingOutAll } = useLogoutAll()
    const navigate = useNavigate()
    const location = useLocation()

    const [pendingCount, setPendingCount] = useState<number | null>(null)
    const [loadingPendingCount, setLoadingPendingCount] = useState(false)

    const isOrdersPage = location.pathname === "/package/orders"

    const loadPendingCount = useCallback(async () => {
        try {
            setLoadingPendingCount(true)

            const response = await packagingService.getPendingOrders(1, 1)

            setPendingCount(response.data?.totalResult ?? 0)
        } catch (error) {
            console.error("PackageHeader.loadPendingCount error:", error)
            setPendingCount(null)
        } finally {
            setLoadingPendingCount(false)
        }
    }, [])

    useEffect(() => {
        void loadPendingCount()
    }, [loadPendingCount, location.pathname])

    useEffect(() => {
        const handleFocus = () => {
            void loadPendingCount()
        }

        window.addEventListener("focus", handleFocus)

        return () => {
            window.removeEventListener("focus", handleFocus)
        }
    }, [loadPendingCount])

    return (
        <BaseStaffHeader
            portalSubtitle={config.portalSubtitle}
            roleLabel={config.roleLabel}
            profileRoute={config.profileRoute}
            accentClass={config.accentClass}
            centerHint={config.centerHint}
            extraMeta={config.meta}
            notificationRoute={STAFF_NOTIFICATION_ROUTES.PackagingStaff}
            onLogoutAll={logoutAll}
            loggingOutAll={loggingOutAll}
            headerActions={
                <div className="hidden items-center gap-2 xl:flex">
                    <button
                        type="button"
                        onClick={() => void loadPendingCount()}
                        disabled={loadingPendingCount}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-amber-50 px-3 text-sm font-medium text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                        title="Làm mới số đơn chờ xử lý"
                    >
                        {loadingPendingCount ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <PackageOpen className="h-4 w-4" />
                        )}

                        {pendingCount === null
                            ? "Đơn chờ xử lý"
                            : `${pendingCount} đơn chờ xử lý`}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/package/orders")}
                        disabled={isOrdersPage}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-default disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        {isOrdersPage ? (
                            "Đang xem hàng chờ"
                        ) : (
                            <>
                                Xem hàng chờ
                                <RefreshCcw className="h-3.5 w-3.5" />
                            </>
                        )}
                    </button>
                </div>
            }
        />
    )
}

export default PackageHeader
