import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import { STAFF_HEADER_CONFIG } from "@/constants/layoutByRole"
import { useLogoutAll } from "@/hooks/useLogoutAll"

const MarketingHeader = () => {
    const config = STAFF_HEADER_CONFIG.MarketingStaff
    const { logoutAll, loggingOutAll } = useLogoutAll()

    return (
        <BaseStaffHeader
            portalSubtitle={config.portalSubtitle}
            roleLabel={config.roleLabel}
            profileRoute={config.profileRoute}
            accentClass={config.accentClass}
            centerHint={config.centerHint}
            extraMeta={config.meta}
            onLogoutAll={logoutAll}
            loggingOutAll={loggingOutAll}
            headerActions={
                <div className="hidden xl:flex items-center gap-2">
                    <span className="inline-flex h-10 items-center rounded-full bg-rose-50 px-3 text-sm font-medium text-rose-700">
                        3 chiến dịch đang chạy
                    </span>

                    <button
                        type="button"
                        className="inline-flex h-10 items-center rounded-xl bg-rose-500 px-3 text-sm font-medium text-white transition hover:bg-rose-600"
                    >
                        Tạo chiến dịch
                    </button>
                </div>
            }
        />
    )
}

export default MarketingHeader
