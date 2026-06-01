import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import {
    STAFF_HEADER_CONFIG,
    STAFF_NOTIFICATION_ROUTES,
} from "@/constants/layoutByRole"
import { useLogoutAll } from "@/hooks/useLogoutAll"
import { marketingPromotionService } from "@/services/marketing-promotion.service"

const MarketingHeader = () => {
    const config = STAFF_HEADER_CONFIG.MarketingStaff
    const { logoutAll, loggingOutAll } = useLogoutAll()
    const navigate = useNavigate()
    const [activeCount, setActiveCount] = useState<number | null>(null)

    const loadActiveCount = useCallback(async () => {
        try {
            const rows = await marketingPromotionService.getPromotions()
            setActiveCount(rows.filter((item) => item.status === "Active").length)
        } catch {
            setActiveCount(null)
        }
    }, [])

    useEffect(() => {
        void loadActiveCount()
    }, [loadActiveCount])

    return (
        <BaseStaffHeader
            portalSubtitle={config.portalSubtitle}
            roleLabel={config.roleLabel}
            profileRoute={config.profileRoute}
            accentClass={config.accentClass}
            centerHint={config.centerHint}
            extraMeta={config.meta}
            notificationRoute={STAFF_NOTIFICATION_ROUTES.MarketingStaff}
            onLogoutAll={logoutAll}
            loggingOutAll={loggingOutAll}
            headerActions={
                <div className="hidden items-center gap-2 xl:flex">
                    {activeCount !== null && activeCount > 0 ? (
                        <span className="inline-flex h-10 items-center rounded-full bg-rose-50 px-3 text-sm font-medium text-rose-700">
                            {activeCount} đang áp dụng
                        </span>
                    ) : null}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/marketing/promotions", {
                                state: { focusCreate: true },
                            })
                        }
                        className="inline-flex h-10 items-center rounded-xl bg-rose-500 px-3 text-sm font-medium text-white transition hover:bg-rose-600"
                    >
                        Tạo chương trình
                    </button>
                </div>
            }
        />
    )
}

export default MarketingHeader
