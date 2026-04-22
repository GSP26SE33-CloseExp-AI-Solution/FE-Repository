import type { AdminUser, InternalStaffRow } from "@/types/admin.type"
import { ROLE_USER, USER_STATUS } from "@/types/admin.type"

export const INTERNAL_ROLE_IDS = [
    ROLE_USER.PACKAGING_STAFF,
    ROLE_USER.MARKETING_STAFF,
    ROLE_USER.DELIVERY_STAFF,
] as const

export const STATUS_OPTIONS = [
    { value: USER_STATUS.UNVERIFIED, label: "Chưa xác minh" },
    { value: USER_STATUS.PENDING_APPROVAL, label: "Chờ phê duyệt" },
    { value: USER_STATUS.ACTIVE, label: "Đang hoạt động" },
    { value: USER_STATUS.REJECTED, label: "Bị từ chối" },
    { value: USER_STATUS.LOCKED, label: "Đã khóa" },
    { value: USER_STATUS.BANNED, label: "Bị cấm" },
    { value: USER_STATUS.HIDDEN, label: "Đã ẩn" },
    { value: USER_STATUS.DELETED, label: "Đã xóa" },
]

export const DEFAULT_INTERNAL_ROLE_OPTIONS = [
    {
        roleId: ROLE_USER.PACKAGING_STAFF,
        roleName: "PackagingStaff",
        label: "Nhân sự đóng gói",
        hint: "Phụ trách xác nhận, thu gom và đóng gói đơn hàng",
    },
    {
        roleId: ROLE_USER.MARKETING_STAFF,
        roleName: "MarketingStaff",
        label: "Nhân sự marketing",
        hint: "Phụ trách nội dung, ưu đãi và truyền thông",
    },
    {
        roleId: ROLE_USER.DELIVERY_STAFF,
        roleName: "DeliveryStaff",
        label: "Nhân sự giao hàng",
        hint: "Phụ trách vận chuyển và giao đơn",
    },
] as const

export const formatDateTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export const normalizeText = (value?: string | null) =>
    (value || "").trim().toLowerCase()

export const isInternalRoleId = (roleId?: number | null) =>
    INTERNAL_ROLE_IDS.includes(
        Number(roleId) as (typeof INTERNAL_ROLE_IDS)[number]
    )

export const getRoleLabelById = (
    roleId?: number | null,
    roleName?: string | null
) => {
    switch (roleId) {
        case ROLE_USER.PACKAGING_STAFF:
            return "Nhân sự đóng gói"
        case ROLE_USER.MARKETING_STAFF:
            return "Nhân sự marketing"
        case ROLE_USER.DELIVERY_STAFF:
            return "Nhân sự giao hàng"
        default:
            return roleName || "--"
    }
}

export const getRoleHintById = (roleId?: number | null) => {
    switch (roleId) {
        case ROLE_USER.PACKAGING_STAFF:
            return "Xử lý đơn và đóng gói"
        case ROLE_USER.MARKETING_STAFF:
            return "Quản lý truyền thông và ưu đãi"
        case ROLE_USER.DELIVERY_STAFF:
            return "Điều phối và giao hàng"
        default:
            return "Nhân sự vận hành nội bộ"
    }
}

export const getRoleClassById = (roleId?: number | null) => {
    switch (roleId) {
        case ROLE_USER.MARKETING_STAFF:
            return "border border-sky-200 bg-sky-100 text-sky-700"
        case ROLE_USER.PACKAGING_STAFF:
            return "border border-orange-200 bg-orange-100 text-orange-700"
        case ROLE_USER.DELIVERY_STAFF:
            return "border border-cyan-200 bg-cyan-100 text-cyan-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

export const isOperationalRoutingRole = (roleId?: number | null) =>
    roleId === ROLE_USER.PACKAGING_STAFF ||
    roleId === ROLE_USER.DELIVERY_STAFF

export const getOperationsRoute = (roleId?: number | null) => {
    if (roleId === ROLE_USER.PACKAGING_STAFF) return "/admin/operations"
    if (roleId === ROLE_USER.DELIVERY_STAFF) return "/admin/delivery"
    return "/admin"
}

const statusMap: Record<number, string> = {
    [USER_STATUS.UNVERIFIED]: "Chưa xác minh",
    [USER_STATUS.PENDING_APPROVAL]: "Chờ phê duyệt",
    [USER_STATUS.ACTIVE]: "Đang hoạt động",
    [USER_STATUS.REJECTED]: "Bị từ chối",
    [USER_STATUS.LOCKED]: "Đã khóa",
    [USER_STATUS.BANNED]: "Bị cấm",
    [USER_STATUS.DELETED]: "Đã xóa",
    [USER_STATUS.HIDDEN]: "Đã ẩn",
}

export const getStatusClass = (status?: number) => {
    switch (status) {
        case USER_STATUS.UNVERIFIED:
            return "border border-slate-200 bg-slate-100 text-slate-700"
        case USER_STATUS.PENDING_APPROVAL:
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case USER_STATUS.ACTIVE:
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case USER_STATUS.REJECTED:
            return "border border-rose-200 bg-rose-100 text-rose-700"
        case USER_STATUS.LOCKED:
            return "border border-orange-200 bg-orange-100 text-orange-700"
        case USER_STATUS.BANNED:
            return "border border-red-200 bg-red-100 text-red-700"
        case USER_STATUS.DELETED:
            return "border border-slate-300 bg-slate-200 text-slate-700"
        case USER_STATUS.HIDDEN:
            return "border border-zinc-200 bg-zinc-100 text-zinc-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

export const getStatusLabel = (status?: number) =>
    statusMap[status ?? -1] ?? "Không xác định"

export const matchesKeyword = (item: InternalStaffRow, keyword: string) => {
    const normalizedKeyword = normalizeText(keyword)
    if (!normalizedKeyword) return true

    return [
        item.fullName,
        item.email,
        item.phone,
        item.roleName,
        item.position,
        item.department,
        item.organizationName,
    ]
        .map((value) => normalizeText(value))
        .some((value) => value.includes(normalizedKeyword))
}

export const mapAdminUserToInternalStaffRow = (
    user: AdminUser
): InternalStaffRow => ({
    id: user.marketStaffInfo?.marketStaffId || user.userId,
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    roleName: user.roleName,
    roleId: user.roleId,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    department:
        user.roleId === ROLE_USER.PACKAGING_STAFF
            ? "Đóng gói"
            : user.roleId === ROLE_USER.MARKETING_STAFF
                ? "Marketing"
                : user.roleId === ROLE_USER.DELIVERY_STAFF
                    ? "Giao hàng"
                    : undefined,
    position: user.marketStaffInfo?.position,
    organizationName: user.marketStaffInfo?.supermarket?.name,
})
