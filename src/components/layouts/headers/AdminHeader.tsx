import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import { STAFF_HEADER_CONFIG } from "@/constants/layoutByRole"

const AdminHeader = () => {
    const config = STAFF_HEADER_CONFIG.Admin

    return (
        <BaseStaffHeader
            portalSubtitle={config.portalSubtitle}
            roleLabel={config.roleLabel}
            profileRoute={config.profileRoute}
            accentClass={config.accentClass}
            centerHint={config.centerHint}
            extraMeta={config.meta}
            headerActions={
                <button
                    type="button"
                    className="hidden xl:inline-flex items-center rounded-xl border border-emerald-100 bg-emerald-50 px-3 h-10 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
                >
                    Cảnh báo SLA
                </button>
            }
        />
    )
}

export default AdminHeader
