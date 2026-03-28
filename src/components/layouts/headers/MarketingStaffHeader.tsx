import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import { STAFF_HEADER_CONFIG } from "@/constants/layoutByRole"

const MarketingHeader = () => {
    const config = STAFF_HEADER_CONFIG.MarketingStaff

    return (
        <BaseStaffHeader
            portalSubtitle={config.portalSubtitle}
            roleLabel={config.roleLabel}
            profileRoute={config.profileRoute}
            accentClass={config.accentClass}
            centerHint={config.centerHint}
            extraMeta={config.meta}
            headerActions={
                <div className="hidden xl:flex items-center gap-2">
                    <span className="rounded-full bg-rose-50 px-3 h-10 inline-flex items-center text-sm font-medium text-rose-700">
                        3 chiến dịch đang chạy
                    </span>

                    <button
                        type="button"
                        className="inline-flex items-center rounded-xl bg-rose-500 px-3 h-10 text-sm font-medium text-white hover:bg-rose-600 transition"
                    >
                        Tạo chiến dịch
                    </button>
                </div>
            }
        />
    )
}

export default MarketingHeader
