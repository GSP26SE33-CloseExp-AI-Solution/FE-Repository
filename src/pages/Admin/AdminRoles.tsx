import { useEffect, useMemo, useState } from "react"
import {
    BadgeCheck,
    Briefcase,
    Building2,
    RefreshCcw,
    Search,
    Shield,
    ShieldCheck,
    Users,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { AdminUser, InternalStaffRow } from "@/types/admin.type"

type RoleSummary = {
    roleId: number
    roleName: string
    totalUsers: number
    activeUsers: number
    pendingUsers: number
    blockedUsers: number
    sampleDepartments: string[]
    sampleOrganizations: string[]
}

const statusMap: Record<number, string> = {
    0: "Chờ duyệt",
    1: "Đang hoạt động",
    2: "Từ chối / Khóa",
}

const getStatusClass = (status?: number) => {
    switch (status) {
        case 0:
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case 1:
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case 2:
            return "border border-rose-200 bg-rose-100 text-rose-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

const getRoleClass = (roleName?: string) => {
    const normalized = roleName?.toLowerCase()

    if (normalized?.includes("admin")) {
        return "border border-violet-200 bg-violet-100 text-violet-700"
    }

    if (normalized?.includes("marketing")) {
        return "border border-sky-200 bg-sky-100 text-sky-700"
    }

    if (normalized?.includes("packaging")) {
        return "border border-orange-200 bg-orange-100 text-orange-700"
    }

    if (normalized?.includes("delivery")) {
        return "border border-cyan-200 bg-cyan-100 text-cyan-700"
    }

    if (normalized?.includes("supermarket")) {
        return "border border-emerald-200 bg-emerald-100 text-emerald-700"
    }

    if (normalized?.includes("vendor")) {
        return "border border-pink-200 bg-pink-100 text-pink-700"
    }

    return "border border-slate-200 bg-slate-100 text-slate-700"
}

const formatDateTime = (value?: string) => {
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

const StatCard = ({
    title,
    value,
    hint,
    icon: Icon,
}: {
    title: string
    value: string | number
    hint: string
    icon: React.ComponentType<{ className?: string }>
}) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
                    <p className="mt-2 text-sm text-slate-500">{hint}</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-3">
                    <Icon className="h-5 w-5 text-slate-700" />
                </div>
            </div>
        </div>
    )
}

const RoleCard = ({
    role,
    selected,
    onSelect,
}: {
    role: RoleSummary
    selected: boolean
    onSelect: () => void
}) => {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full rounded-3xl border p-5 text-left transition ${selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-lg font-bold ${selected ? "text-white" : "text-slate-900"}`}>
                            {role.roleName || `Role ${role.roleId}`}
                        </h3>

                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selected
                                    ? "border border-white/20 bg-white/10 text-white"
                                    : getRoleClass(role.roleName)
                                }`}
                        >
                            ID: {role.roleId}
                        </span>
                    </div>

                    <div
                        className={`mt-4 grid grid-cols-2 gap-3 text-sm ${selected ? "text-slate-200" : "text-slate-600"
                            }`}
                    >
                        <div className={`rounded-2xl px-4 py-3 ${selected ? "bg-white/10" : "bg-slate-50"}`}>
                            <p className="opacity-80">Tổng user</p>
                            <p className="mt-1 text-lg font-bold">{role.totalUsers}</p>
                        </div>

                        <div className={`rounded-2xl px-4 py-3 ${selected ? "bg-white/10" : "bg-slate-50"}`}>
                            <p className="opacity-80">Đang hoạt động</p>
                            <p className="mt-1 text-lg font-bold">{role.activeUsers}</p>
                        </div>

                        <div className={`rounded-2xl px-4 py-3 ${selected ? "bg-white/10" : "bg-slate-50"}`}>
                            <p className="opacity-80">Chờ duyệt</p>
                            <p className="mt-1 text-lg font-bold">{role.pendingUsers}</p>
                        </div>

                        <div className={`rounded-2xl px-4 py-3 ${selected ? "bg-white/10" : "bg-slate-50"}`}>
                            <p className="opacity-80">Khóa / từ chối</p>
                            <p className="mt-1 text-lg font-bold">{role.blockedUsers}</p>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    )
}

const AdminRoles = () => {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [staffRows, setStaffRows] = useState<InternalStaffRow[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")

    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")

    const loadData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const [usersRes, staffRes] = await Promise.all([
                adminService.getUsers(),
                adminService.getInternalStaffRows({
                    pageNumber: 1,
                    pageSize: 200,
                }),
            ])

            const nextUsers = Array.isArray(usersRes)
                ? usersRes
                : Array.isArray((usersRes as any)?.items)
                    ? (usersRes as any).items
                    : []

            const nextStaff = Array.isArray(staffRes)
                ? staffRes
                : Array.isArray((staffRes as any)?.items)
                    ? (staffRes as any).items
                    : []

            setUsers(nextUsers)
            setStaffRows(nextStaff)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải dữ liệu roles.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadData()
    }, [])

    const roleSummaries = useMemo<RoleSummary[]>(() => {
        const roleMap = new Map<number, RoleSummary>()

        users.forEach((user) => {
            const existing = roleMap.get(user.roleId)

            const staffMatches = staffRows.filter((item) => item.roleId === user.roleId)

            const departments = Array.from(
                new Set(staffMatches.map((item) => item.department).filter(Boolean))
            ) as string[]

            const organizations = Array.from(
                new Set(staffMatches.map((item) => item.organizationName).filter(Boolean))
            ) as string[]

            if (!existing) {
                roleMap.set(user.roleId, {
                    roleId: user.roleId,
                    roleName: user.roleName,
                    totalUsers: 1,
                    activeUsers: user.status === 1 ? 1 : 0,
                    pendingUsers: user.status === 0 ? 1 : 0,
                    blockedUsers: user.status === 2 ? 1 : 0,
                    sampleDepartments: departments,
                    sampleOrganizations: organizations,
                })
                return
            }

            existing.totalUsers += 1
            if (user.status === 1) existing.activeUsers += 1
            if (user.status === 0) existing.pendingUsers += 1
            if (user.status === 2) existing.blockedUsers += 1

            existing.sampleDepartments = Array.from(
                new Set([...existing.sampleDepartments, ...departments])
            )
            existing.sampleOrganizations = Array.from(
                new Set([...existing.sampleOrganizations, ...organizations])
            )
        })

        return Array.from(roleMap.values()).sort((a, b) => a.roleId - b.roleId)
    }, [users, staffRows])

    const filteredRoles = useMemo(() => {
        const normalized = keyword.trim().toLowerCase()

        return roleSummaries.filter((role) => {
            if (!normalized) return true

            return Boolean(
                role.roleName?.toLowerCase().includes(normalized) ||
                String(role.roleId).includes(normalized) ||
                role.sampleDepartments.some((item) =>
                    item.toLowerCase().includes(normalized)
                ) ||
                role.sampleOrganizations.some((item) =>
                    item.toLowerCase().includes(normalized)
                )
            )
        })
    }, [roleSummaries, keyword])

    const selectedRole = useMemo(() => {
        if (selectedRoleId === null) return filteredRoles[0] ?? null
        return filteredRoles.find((item) => item.roleId === selectedRoleId) ?? null
    }, [filteredRoles, selectedRoleId])

    const usersInSelectedRole = useMemo(() => {
        if (!selectedRole) return []

        return users
            .filter((item) => item.roleId === selectedRole.roleId)
            .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
    }, [users, selectedRole])

    const totalRoles = filteredRoles.length
    const totalUsers = filteredRoles.reduce((sum, item) => sum + item.totalUsers, 0)
    const totalActiveUsers = filteredRoles.reduce((sum, item) => sum + item.activeUsers, 0)
    const totalPendingUsers = filteredRoles.reduce((sum, item) => sum + item.pendingUsers, 0)

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setKeyword(search.trim())
    }

    useEffect(() => {
        if (!selectedRole && filteredRoles.length > 0) {
            setSelectedRoleId(filteredRoles[0].roleId)
        }
    }, [filteredRoles, selectedRole])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Roles</h1>
                        <p className="mt-1 text-sm text-slate-500">Đang tải dữ liệu vai trò...</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                    <div className="space-y-4 xl:col-span-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-44 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                            />
                        ))}
                    </div>
                    <div className="h-[520px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100 xl:col-span-3" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Roles</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Theo dõi phân bố vai trò trong hệ thống và danh sách người dùng theo từng role.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadData(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Vai trò hiện có"
                    value={totalRoles}
                    hint="Số role đang xuất hiện trong dữ liệu user"
                    icon={Shield}
                />
                <StatCard
                    title="Tổng người dùng"
                    value={totalUsers}
                    hint="Tổng user thuộc các role đang hiển thị"
                    icon={Users}
                />
                <StatCard
                    title="Đang hoạt động"
                    value={totalActiveUsers}
                    hint="Số user status hoạt động"
                    icon={ShieldCheck}
                />
                <StatCard
                    title="Chờ duyệt"
                    value={totalPendingUsers}
                    hint="Số user status chờ duyệt"
                    icon={BadgeCheck}
                />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <form
                    onSubmit={handleSearch}
                    className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(280px,1fr)_auto]"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên role, role id, department, organization..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                    </div>

                    <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Tìm kiếm
                    </button>
                </form>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            {filteredRoles.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Shield className="h-7 w-7 text-slate-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                        Không có role phù hợp
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Chưa tìm thấy vai trò nào khớp với điều kiện hiện tại.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                    <div className="space-y-4 xl:col-span-2">
                        {filteredRoles.map((role) => (
                            <RoleCard
                                key={role.roleId}
                                role={role}
                                selected={selectedRole?.roleId === role.roleId}
                                onSelect={() => setSelectedRoleId(role.roleId)}
                            />
                        ))}
                    </div>

                    <div className="xl:col-span-3">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        {selectedRole?.roleName || "--"}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Danh sách người dùng thuộc role đang chọn.
                                    </p>
                                </div>

                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleClass(
                                        selectedRole?.roleName
                                    )}`}
                                >
                                    Role ID: {selectedRole?.roleId ?? "--"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Tổng user
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-slate-900">
                                        {selectedRole?.totalUsers ?? 0}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Departments
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {selectedRole?.sampleDepartments.join(", ") || "--"}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Organizations
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {selectedRole?.sampleOrganizations.join(", ") || "--"}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Trạng thái nổi bật
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(1)}`}>
                                            Active: {selectedRole?.activeUsers ?? 0}
                                        </span>
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(0)}`}>
                                            Pending: {selectedRole?.pendingUsers ?? 0}
                                        </span>
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(2)}`}>
                                            Blocked: {selectedRole?.blockedUsers ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 overflow-x-auto">
                                <table className="min-w-full border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-left text-sm text-slate-500">
                                            <th className="px-4 py-2 font-medium">Họ tên</th>
                                            <th className="px-4 py-2 font-medium">Email</th>
                                            <th className="px-4 py-2 font-medium">SĐT</th>
                                            <th className="px-4 py-2 font-medium">Trạng thái</th>
                                            <th className="px-4 py-2 font-medium">Cập nhật</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersInSelectedRole.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
                                                >
                                                    Không có user nào thuộc role này.
                                                </td>
                                            </tr>
                                        ) : (
                                            usersInSelectedRole.map((user) => (
                                                <tr key={user.userId} className="bg-slate-50">
                                                    <td className="rounded-l-2xl px-4 py-3 text-sm font-medium text-slate-900">
                                                        <div className="flex items-center gap-2">
                                                            <div className="rounded-xl bg-white p-2">
                                                                <Users className="h-4 w-4 text-slate-600" />
                                                            </div>
                                                            {user.fullName || "--"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">
                                                        {user.email || "--"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">
                                                        {user.phone || "--"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                                user.status
                                                            )}`}
                                                        >
                                                            {statusMap[user.status] ?? "Không xác định"}
                                                        </span>
                                                    </td>
                                                    <td className="rounded-r-2xl px-4 py-3 text-sm text-slate-700">
                                                        {formatDateTime(user.updatedAt || user.createdAt)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Briefcase className="h-4 w-4" />
                                        <p className="text-sm font-semibold">Departments liên quan</p>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600">
                                        {selectedRole?.sampleDepartments.join(", ") || "--"}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Building2 className="h-4 w-4" />
                                        <p className="text-sm font-semibold">Đơn vị liên quan</p>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600">
                                        {selectedRole?.sampleOrganizations.join(", ") || "--"}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <ShieldCheck className="h-4 w-4" />
                                        <p className="text-sm font-semibold">Ghi chú</p>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600">
                                        Đây là bản tổng hợp role từ dữ liệu users/staff,
                                        chưa phải CRUD role.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminRoles
