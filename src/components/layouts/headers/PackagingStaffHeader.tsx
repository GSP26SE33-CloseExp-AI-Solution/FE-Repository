import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import { STAFF_HEADER_CONFIG } from "@/constants/layoutByRole"

const PackageHeader = () => {
    const config = STAFF_HEADER_CONFIG.PackagingStaff

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
                    <span className="rounded-full bg-amber-50 px-3 h-10 inline-flex items-center text-sm font-medium text-amber-700">
                        12 đơn chờ xử lý
                    </span>

                    <button
                        type="button"
                        className="inline-flex items-center rounded-xl border border-amber-200 bg-white px-3 h-10 text-sm font-medium text-amber-700 hover:bg-amber-50 transition"
                    >
                        Xem hàng chờ
                    </button>
                </div>
            }
        />
    )
}

export default PackageHeader
