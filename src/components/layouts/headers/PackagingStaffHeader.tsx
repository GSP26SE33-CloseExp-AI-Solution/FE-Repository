import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import { STAFF_HEADER_CONFIG } from "@/constants/layoutByRole"
import { useLogoutAll } from "@/hooks/useLogoutAll"

const PackageHeader = () => {
    const config = STAFF_HEADER_CONFIG.PackagingStaff
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
                    <span className="inline-flex h-10 items-center rounded-full bg-amber-50 px-3 text-sm font-medium text-amber-700">
                        12 đơn chờ xử lý
                    </span>

                    <button
                        type="button"
                        className="inline-flex h-10 items-center rounded-xl border border-amber-200 bg-white px-3 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                    >
                        Xem hàng chờ
                    </button>
                </div>
            }
        />
    )
}

export default PackageHeader
