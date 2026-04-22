import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Plus, RefreshCcw, Search, Users, Loader2 } from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    AdminUser,
    InternalStaffRow,
    UpdateUserPayload,
} from "@/types/admin.type"
import { ROLE_USER, USER_STATUS } from "@/types/admin.type"
import { showError, showSuccess } from "@/utils/toast"

import {
    BaseModal,
    CreateInternalStaffModal,
    EditInternalStaffModal,
} from "./adminInternalStaff/FormModals"
import StaffDetailModal from "./adminInternalStaff/DetailModal"
import InternalStaffTable from "./adminInternalStaff/Table"
import {
    DEFAULT_INTERNAL_ROLE_OPTIONS,
    STATUS_OPTIONS,
    formatDateTime,
    getRoleClassById,
    getRoleHintById,
    getRoleLabelById,
    getStatusClass,
    getStatusLabel,
    isInternalRoleId,
    mapAdminUserToInternalStaffRow,
    matchesKeyword,
} from "./adminInternalStaff/adminInternalStaff.utils"

type InternalRoleOption = {
    roleId: number
    roleName: string
    label: string
    hint: string
}

type CreateInternalUserForm = {
    fullName: string
    email: string
    phone: string
    roleId: number
}

type EditInternalUserForm = {
    fullName: string
    email: string
    phone: string
    roleId: number
    status: number
}

type ConfirmActionState = {
    open: boolean
    title: string
    description: string
    confirmText: string
    tone?: "default" | "danger" | "warning"
    onConfirm?: () => Promise<void>
}

const ConfirmActionModal = ({
    state,
    loading,
    onClose,
}: {
    state: ConfirmActionState
    loading: boolean
    onClose: () => void
}) => {
    if (!state.open) return null

    const toneClass =
        state.tone === "danger"
            ? "bg-rose-600 hover:bg-rose-700"
            : state.tone === "warning"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-slate-900 hover:bg-slate-800"

    return (
        <BaseModal
            open={state.open}
            title={state.title}
            description={state.description}
            onClose={onClose}
            maxWidth="max-w-xl"
        >
            <div className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => void state.onConfirm?.()}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {state.confirmText}
                    </button>
                </div>
            </div>
        </BaseModal>
    )
}

const AdminInternalStaff = () => {
    const [allItems, setAllItems] = useState<InternalStaffRow[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)
    const [error, setError] = useState("")
    const [openCreateModal, setOpenCreateModal] = useState(false)
    const [openEditModal, setOpenEditModal] = useState(false)
    const [openDetailModal, setOpenDetailModal] = useState(false)

    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    const [page, setPage] = useState(1)
    const pageSize = 12

    const [selectedStaff, setSelectedStaff] = useState<InternalStaffRow | null>(null)
    const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUser | null>(null)

    const [confirmAction, setConfirmAction] = useState<ConfirmActionState>({
        open: false,
        title: "",
        description: "",
        confirmText: "",
        tone: "default",
    })

    const [createForm, setCreateForm] = useState<CreateInternalUserForm>({
        fullName: "",
        email: "",
        phone: "",
        roleId: DEFAULT_INTERNAL_ROLE_OPTIONS[0]?.roleId ?? ROLE_USER.PACKAGING_STAFF,
    })

    const [editForm, setEditForm] = useState<EditInternalUserForm>({
        fullName: "",
        email: "",
        phone: "",
        roleId: DEFAULT_INTERNAL_ROLE_OPTIONS[0]?.roleId ?? ROLE_USER.PACKAGING_STAFF,
        status: USER_STATUS.PENDING_APPROVAL,
    })

    const detectedRoleOptions = useMemo<InternalRoleOption[]>(() => {
        const fromApi = allItems
            .filter((item) => isInternalRoleId(item.roleId))
            .map((item) => ({
                roleId: item.roleId,
                roleName: item.roleName || "",
                label: getRoleLabelById(item.roleId, item.roleName),
                hint: getRoleHintById(item.roleId),
            }))

        const merged = [...DEFAULT_INTERNAL_ROLE_OPTIONS, ...fromApi]
        const map = new Map<number, InternalRoleOption>()

        merged.forEach((item) => {
            if (!map.has(item.roleId)) {
                map.set(item.roleId, item)
            }
        })

        return Array.from(map.values()).sort((a, b) => a.roleId - b.roleId)
    }, [allItems])

    const filteredItems = useMemo(() => {
        return allItems.filter((item) => {
            const matchesRole = !roleFilter || String(item.roleId) === roleFilter
            const matchesStatus = !statusFilter || String(item.status ?? "") === statusFilter
            return matchesKeyword(item, keyword) && matchesRole && matchesStatus
        })
    }, [allItems, keyword, roleFilter, statusFilter])

    const pagedItems = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredItems.slice(start, start + pageSize)
    }, [filteredItems, page])

    const totalPages = useMemo(() => {
        const total = Math.ceil(filteredItems.length / pageSize)
        return total > 0 ? total : 1
    }, [filteredItems.length])

    const activeCount = useMemo(
        () => allItems.filter((item) => item.status === USER_STATUS.ACTIVE).length,
        [allItems]
    )

    const pendingCount = useMemo(
        () =>
            allItems.filter((item) => item.status === USER_STATUS.PENDING_APPROVAL).length,
        [allItems]
    )

    const packagingCount = useMemo(
        () => allItems.filter((item) => item.roleId === ROLE_USER.PACKAGING_STAFF).length,
        [allItems]
    )

    const marketingCount = useMemo(
        () => allItems.filter((item) => item.roleId === ROLE_USER.MARKETING_STAFF).length,
        [allItems]
    )

    const deliveryCount = useMemo(
        () => allItems.filter((item) => item.roleId === ROLE_USER.DELIVERY_STAFF).length,
        [allItems]
    )

    const loadInternalStaff = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            setError("")

            const response = await adminService.getUsers({
                pageNumber: 1,
                pageSize: 99999,
                keyword: keyword || undefined,
            })

            const internalUsers = (response.items ?? []).filter((user) =>
                isInternalRoleId(user.roleId)
            )

            setAllItems(internalUsers.map(mapAdminUserToInternalStaffRow))
        } catch (err: any) {
            setError(err?.message || "Không thể tải danh sách nhân sự nội bộ.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadInternalStaff()
    }, [keyword])

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setPage(1)
        setKeyword(search.trim())
    }

    const handleCreateFormChange = <K extends keyof CreateInternalUserForm>(
        field: K,
        value: CreateInternalUserForm[K]
    ) => {
        setCreateForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleEditFormChange = <K extends keyof EditInternalUserForm>(
        field: K,
        value: EditInternalUserForm[K]
    ) => {
        setEditForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const resetCreateForm = () => {
        setCreateForm({
            fullName: "",
            email: "",
            phone: "",
            roleId:
                detectedRoleOptions[0]?.roleId ??
                DEFAULT_INTERNAL_ROLE_OPTIONS[0]?.roleId ??
                ROLE_USER.PACKAGING_STAFF,
        })
    }

    const handleOpenCreateModal = () => {
        resetCreateForm()
        setOpenCreateModal(true)
    }

    const handleCloseCreateModal = () => {
        if (submitting) return
        setOpenCreateModal(false)
    }

    const handleCreateInternalUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const trimmedFullName = createForm.fullName.trim()
        const trimmedEmail = createForm.email.trim()
        const trimmedPhone = createForm.phone.trim()

        if (!trimmedFullName) {
            showError("Vui lòng nhập họ và tên.")
            return
        }

        if (!trimmedEmail) {
            showError("Vui lòng nhập email.")
            return
        }

        if (!isInternalRoleId(createForm.roleId)) {
            showError("Vai trò nội bộ không hợp lệ.")
            return
        }

        try {
            setSubmitting(true)

            await adminService.registerInternalStaff({
                fullName: trimmedFullName,
                email: trimmedEmail,
                phone: trimmedPhone || undefined,
                roleId: createForm.roleId,
            })

            showSuccess("Đã tạo tài khoản nội bộ.")
            setOpenCreateModal(false)
            resetCreateForm()
            setPage(1)
            await loadInternalStaff(true)
        } catch (err: any) {
            showError(err?.message || "Tạo tài khoản nội bộ không thành công.")
        } finally {
            setSubmitting(false)
        }
    }

    const loadUserDetail = async (userId: string) => {
        try {
            setDetailLoading(true)
            const detail = await adminService.getUserById(userId)
            setSelectedUserDetail(detail)
            return detail
        } catch (err: any) {
            showError(err?.message || "Không thể tải chi tiết nhân sự.")
            return null
        } finally {
            setDetailLoading(false)
        }
    }

    const handleOpenDetail = async (item: InternalStaffRow) => {
        setSelectedStaff(item)
        setOpenDetailModal(true)
        await loadUserDetail(item.userId)
    }

    const handleOpenEdit = async (item: InternalStaffRow) => {
        setSelectedStaff(item)
        const detail = await loadUserDetail(item.userId)
        if (!detail) return

        setEditForm({
            fullName: detail.fullName || "",
            email: detail.email || "",
            phone: detail.phone || "",
            roleId: isInternalRoleId(detail.roleId)
                ? detail.roleId
                : DEFAULT_INTERNAL_ROLE_OPTIONS[0]?.roleId ?? ROLE_USER.PACKAGING_STAFF,
            status: detail.status ?? USER_STATUS.PENDING_APPROVAL,
        })
        setOpenDetailModal(false)
        setOpenEditModal(true)
    }

    const handleCloseEditModal = () => {
        if (submitting) return
        setOpenEditModal(false)
    }

    const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!selectedStaff) {
            showError("Không tìm thấy nhân sự cần cập nhật.")
            return
        }

        const trimmedFullName = editForm.fullName.trim()
        const trimmedEmail = editForm.email.trim()
        const trimmedPhone = editForm.phone.trim()

        if (!trimmedFullName) {
            showError("Vui lòng nhập họ và tên.")
            return
        }

        if (!trimmedEmail) {
            showError("Vui lòng nhập email.")
            return
        }

        if (!isInternalRoleId(editForm.roleId)) {
            showError("Vai trò nội bộ không hợp lệ.")
            return
        }

        try {
            setSubmitting(true)

            const payload: UpdateUserPayload = {
                fullName: trimmedFullName,
                email: trimmedEmail,
                phone: trimmedPhone || undefined,
                roleId: editForm.roleId,
                status: editForm.status,
            }

            await adminService.updateUser(selectedStaff.userId, payload)

            showSuccess("Đã cập nhật hồ sơ nhân sự.")
            setOpenEditModal(false)

            if (openDetailModal) {
                const detail = await loadUserDetail(selectedStaff.userId)
                if (detail) {
                    setSelectedUserDetail(detail)
                }
            }

            await loadInternalStaff(true)
        } catch (err: any) {
            showError(err?.message || "Không thể cập nhật hồ sơ nhân sự.")
        } finally {
            setSubmitting(false)
        }
    }

    const openConfirm = (state: Omit<ConfirmActionState, "open">) => {
        setConfirmAction({
            ...state,
            open: true,
        })
    }

    const closeConfirm = () => {
        if (actionLoading) return
        setConfirmAction({
            open: false,
            title: "",
            description: "",
            confirmText: "",
            tone: "default",
        })
    }

    const executeDelete = async (staff: InternalStaffRow) => {
        try {
            setActionLoading(true)
            await adminService.deleteUser(staff.userId)
            showSuccess("Đã xóa mềm tài khoản nhân sự.")

            if (selectedStaff?.userId === staff.userId) {
                setOpenDetailModal(false)
                setSelectedUserDetail(null)
                setSelectedStaff(null)
            }

            await loadInternalStaff(true)
            closeConfirm()
        } catch (err: any) {
            showError(err?.message || "Không thể xóa tài khoản nhân sự.")
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = (staff: InternalStaffRow) => {
        openConfirm({
            title: "Xóa mềm tài khoản nhân sự",
            description: `Tài khoản "${staff.fullName}" sẽ bị đánh dấu đã xóa trong hệ thống. Bạn vẫn có thể tra cứu lại bằng dữ liệu backend, nhưng người dùng sẽ không còn dùng tài khoản này như bình thường.`,
            confirmText: "Xóa mềm tài khoản",
            tone: "danger",
            onConfirm: async () => {
                await executeDelete(staff)
            },
        })
    }

    return (
        <>
            <div className="space-y-6">
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-sky-50 via-white to-white px-6 py-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100/80 px-3 py-1 text-xs font-semibold text-sky-800">
                                    <Users className="h-3.5 w-3.5" />
                                    Nhân sự vận hành
                                </div>

                                <h1 className="mt-3 text-2xl font-bold text-slate-900">
                                    Nhân sự nội bộ
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                    Quản lý nhân sự nội bộ: hồ sơ, vai trò, trạng thái và điều
                                    hướng sang màn vận hành tương ứng.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleOpenCreateModal}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tạo tài khoản nội bộ
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void loadInternalStaff(true)}
                                    disabled={refreshing}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <RefreshCcw
                                        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                                    />
                                    Làm mới
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Tổng nhân sự</p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">
                            {allItems.length}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Toàn bộ nội bộ đang quản lý
                        </p>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Đang hoạt động</p>
                        <h3 className="mt-2 text-2xl font-bold text-emerald-700">
                            {activeCount}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Có thể vận hành bình thường
                        </p>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Chờ phê duyệt</p>
                        <h3 className="mt-2 text-2xl font-bold text-amber-700">
                            {pendingCount}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Cần admin xác nhận thêm
                        </p>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Theo vai trò</p>
                        <h3 className="mt-2 text-2xl font-bold text-sky-700">
                            {packagingCount + marketingCount + deliveryCount}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {packagingCount} đóng gói • {marketingCount} marketing •{" "}
                            {deliveryCount} giao hàng
                        </p>
                    </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_minmax(260px,1fr)_auto]"
                    >
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo họ tên, email, số điện thoại hoặc chức vụ"
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setPage(1)
                                setRoleFilter(e.target.value)
                            }}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        >
                            <option value="">Tất cả vai trò nội bộ</option>
                            {detectedRoleOptions.map((role) => (
                                <option key={role.roleId} value={role.roleId}>
                                    {role.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setPage(1)
                                setStatusFilter(e.target.value)
                            }}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        >
                            <option value="">Tất cả trạng thái</option>
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Áp dụng
                        </button>
                    </form>
                </div>

                {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                ) : null}

                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-56 animate-pulse rounded-[28px] border border-slate-200 bg-slate-100"
                            />
                        ))}
                    </div>
                ) : pagedItems.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                            <Users className="h-7 w-7 text-slate-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                            Không có nhân sự nội bộ phù hợp
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Không tìm thấy nhân sự nào khớp với điều kiện đang chọn.
                        </p>
                    </div>
                ) : (
                    <>
                        <InternalStaffTable
                            items={pagedItems}
                            actionLoading={actionLoading}
                            onView={handleOpenDetail}
                        />

                        <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Đang hiển thị{" "}
                                <span className="font-semibold text-slate-900">
                                    {pagedItems.length}
                                </span>{" "}
                                /{" "}
                                <span className="font-semibold text-slate-900">
                                    {filteredItems.length}
                                </span>{" "}
                                nhân sự phù hợp
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                    disabled={page === 1}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Trước
                                </button>

                                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                                    {page} / {totalPages}
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((prev) => Math.min(totalPages, prev + 1))
                                    }
                                    disabled={page >= totalPages}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <CreateInternalStaffModal
                open={openCreateModal}
                form={createForm}
                roleOptions={detectedRoleOptions}
                submitting={submitting}
                onClose={handleCloseCreateModal}
                onChange={handleCreateFormChange}
                onSubmit={handleCreateInternalUser}
            />

            <EditInternalStaffModal
                open={openEditModal}
                form={editForm}
                roleOptions={detectedRoleOptions}
                submitting={submitting}
                onClose={handleCloseEditModal}
                onChange={handleEditFormChange}
                onSubmit={handleSubmitEdit}
                getStatusClass={getStatusClass}
                getStatusLabel={getStatusLabel}
            />

            <StaffDetailModal
                open={openDetailModal}
                loading={detailLoading}
                user={selectedUserDetail}
                onClose={() => setOpenDetailModal(false)}
                onEdit={() => {
                    if (!selectedUserDetail || !selectedStaff) return
                    setEditForm({
                        fullName: selectedUserDetail.fullName || "",
                        email: selectedUserDetail.email || "",
                        phone: selectedUserDetail.phone || "",
                        roleId: isInternalRoleId(selectedUserDetail.roleId)
                            ? selectedUserDetail.roleId
                            : DEFAULT_INTERNAL_ROLE_OPTIONS[0]?.roleId ??
                            ROLE_USER.PACKAGING_STAFF,
                        status:
                            selectedUserDetail.status ?? USER_STATUS.PENDING_APPROVAL,
                    })
                    setOpenDetailModal(false)
                    setOpenEditModal(true)
                }}
                onDelete={() => {
                    if (!selectedStaff) return
                    handleDelete(selectedStaff)
                }}
                getRoleClassById={getRoleClassById}
                getRoleLabelById={getRoleLabelById}
                getRoleHintById={getRoleHintById}
                getStatusClass={getStatusClass}
                getStatusLabel={getStatusLabel}
                formatDateTime={formatDateTime}
            />

            <ConfirmActionModal
                state={confirmAction}
                loading={actionLoading}
                onClose={closeConfirm}
            />
        </>
    )
}

export default AdminInternalStaff
