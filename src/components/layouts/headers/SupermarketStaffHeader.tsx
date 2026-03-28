import BaseStaffHeader from "@/components/layouts/shared/BaseStaffHeader"
import { STAFF_HEADER_CONFIG } from "@/constants/layoutByRole"
import { useAuthContext } from "@/contexts/AuthContext"

const SupermarketStaffHeader = () => {
    const config = STAFF_HEADER_CONFIG.SupermarketStaff
    const { supermarketName } = useAuthContext()

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
                <div className="flex items-center gap-2 flex-wrap">
                    {config.meta}
                    {supermarketName ? (
                        <span className="text-[11px] text-gray-500 font-medium">
                            {supermarketName}
                        </span>
                    ) : null}
                </div>
            }
            headerActions={
                <div className="hidden xl:flex items-center gap-2">
                    <span className="rounded-full bg-sky-50 px-3 h-10 inline-flex items-center text-sm font-medium text-sky-700">
                        Đang hoạt động
                    </span>

                    <button
                        type="button"
                        className="inline-flex items-center rounded-xl border border-sky-200 bg-white px-3 h-10 text-sm font-medium text-sky-700 hover:bg-sky-50 transition"
                    >
                        Thêm sản phẩm
                    </button>
                </div>
            }
        />
    )
}

export default SupermarketStaffHeader
