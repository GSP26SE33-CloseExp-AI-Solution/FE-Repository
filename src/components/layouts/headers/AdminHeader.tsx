import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import { STAFF_HEADER_CONFIG } from "@/constants/layoutByRole"
import { useLogoutAll } from "@/hooks/useLogoutAll"

const AdminHeader = () => {
    const config = STAFF_HEADER_CONFIG.Admin
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
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="hidden xl:inline-flex h-10 items-center rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                        Cảnh báo SLA
                    </button>
                </div>
            }
        />
    )
}

export default AdminHeader
