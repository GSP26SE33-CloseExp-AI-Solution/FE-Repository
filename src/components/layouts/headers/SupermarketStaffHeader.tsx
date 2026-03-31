import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import { STAFF_HEADER_CONFIG } from "@/constants/layoutByRole"
import { useAuthContext } from "@/contexts/AuthContext"
import { useLogoutAll } from "@/hooks/useLogoutAll"

const SupermarketStaffHeader = () => {
    const config = STAFF_HEADER_CONFIG.SupermarketStaff
    const { supermarketName } = useAuthContext()
    const { logoutAll, loggingOutAll } = useLogoutAll()

    return (
        <BaseStaffHeader
            portalSubtitle={config.portalSubtitle}
            roleLabel={
                supermarketName
                    ? `Nhân viên siêu thị · ${supermarketName}`
                    : config.roleLabel
            }
            profileRoute={config.profileRoute}
            accentClass={config.accentClass}
            centerHint={config.centerHint}
            extraMeta={
                <div className="flex flex-wrap items-center gap-2">
                    {config.meta}
                    {supermarketName ? (
                        <span className="text-[11px] font-medium text-gray-500">
                            {supermarketName}
                        </span>
                    ) : null}
                </div>
            }
            onLogoutAll={logoutAll}
            loggingOutAll={loggingOutAll}
            headerActions={
                <div className="hidden xl:flex items-center gap-2">
                    <span className="inline-flex h-10 items-center rounded-full bg-sky-50 px-3 text-sm font-medium text-sky-700">
                        Đang hoạt động
                    </span>

                    <button
                        type="button"
                        className="inline-flex h-10 items-center rounded-xl border border-sky-200 bg-white px-3 text-sm font-medium text-sky-700 transition hover:bg-sky-50"
                    >
                        Thêm sản phẩm
                    </button>
                </div>
            }
        />
    )
}

export default SupermarketStaffHeader
