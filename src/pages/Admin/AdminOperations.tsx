import { useCallback, useEffect, useMemo, useState } from "react"
import {
    Building2,
    Loader2,
    PackageCheck,
    RefreshCcw,
    Save,
    Store,
    UserRound,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { AdminUser, AdminSupermarketItem } from "@/types/admin.type"
import { ROLE_USER } from "@/types/admin.type"
import { showError, showSuccess } from "@/utils/toast"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type StaffBindingRow = {
    userId: string
    fullName: string
    email: string
    phone?: string
    supermarketId: string
    supermarketName?: string
    pendingSupermarketId: string
    saving: boolean
}

const AdminOperations = () => {
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [supermarkets, setSupermarkets] = useState<AdminSupermarketItem[]>([])
    const [staffRows, setStaffRows] = useState<StaffBindingRow[]>([])

    const loadData = useCallback(async () => {
        try {
            const [marketResult, userResult] = await Promise.all([
                adminService.getSupermarkets({ pageNumber: 1, pageSize: 500 }),
                adminService.getUsers({
                    roleId: ROLE_USER.PACKAGING_STAFF,
                    pageNumber: 1,
                    pageSize: 500,
                }),
            ])

            setSupermarkets(marketResult.items ?? [])

            const packagingStaff = (userResult.items ?? []).filter(
                (user) => user.roleId === ROLE_USER.PACKAGING_STAFF,
            )

            setStaffRows(
                packagingStaff.map((user) => mapStaffRow(user)),
            )
        } catch (err) {
            showError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải dữ liệu điều phối đóng gói",
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        void loadData()
    }, [loadData])

    const supermarketMap = useMemo(() => {
        return new Map(
            supermarkets.map((item) => [item.supermarketId, item.name]),
        )
    }, [supermarkets])

    const stats = useMemo(() => {
        const assignedSupermarketIds = new Set(
            staffRows
                .map((row) => row.supermarketId)
                .filter(Boolean),
        )

        return {
            totalStaff: staffRows.length,
            assignedSupermarkets: assignedSupermarketIds.size,
            unassignedStaff: staffRows.filter((row) => !row.supermarketId).length,
            uncoveredSupermarkets: supermarkets.filter(
                (market) => !assignedSupermarketIds.has(market.supermarketId),
            ).length,
        }
    }, [staffRows, supermarkets])

    const handlePendingChange = (userId: string, supermarketId: string) => {
        setStaffRows((prev) =>
            prev.map((row) =>
                row.userId === userId
                    ? { ...row, pendingSupermarketId: supermarketId }
                    : row,
            ),
        )
    }

    const handleSaveBinding = async (row: StaffBindingRow) => {
        if (!row.pendingSupermarketId) {
            showError("Vui lòng chọn siêu thị cho nhân viên đóng gói.")
            return
        }

        setStaffRows((prev) =>
            prev.map((item) =>
                item.userId === row.userId ? { ...item, saving: true } : item,
            ),
        )

        try {
            await adminService.updateUser(row.userId, {
                supermarketId: row.pendingSupermarketId,
            })

            showSuccess(`Đã gán ${row.fullName} cho siêu thị mới.`)

            setStaffRows((prev) =>
                prev.map((item) =>
                    item.userId === row.userId
                        ? {
                              ...item,
                              supermarketId: row.pendingSupermarketId,
                              supermarketName:
                                  supermarketMap.get(row.pendingSupermarketId) ??
                                  item.supermarketName,
                              pendingSupermarketId: row.pendingSupermarketId,
                              saving: false,
                          }
                        : item,
                ),
            )
        } catch (err) {
            showError(
                err instanceof Error
                    ? err.message
                    : "Không thể cập nhật gán siêu thị",
            )
            setStaffRows((prev) =>
                prev.map((item) =>
                    item.userId === row.userId ? { ...item, saving: false } : item,
                ),
            )
        }
    }

    const mapStaffRow = (user: AdminUser): StaffBindingRow => {
        const supermarketId =
            user.packagingStaffInfo?.supermarket?.supermarketId ?? ""

        return {
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            supermarketId,
            supermarketName: user.packagingStaffInfo?.supermarket?.name,
            pendingSupermarketId: supermarketId,
            saving: false,
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        <PackageCheck className="h-3.5 w-3.5" />
                        Điều phối đóng gói
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Gán nhân viên đóng gói theo siêu thị
                    </h1>
                    <p className="mt-1 max-w-3xl text-sm text-slate-500">
                        Mỗi nhân viên đóng gói chỉ thuộc một siêu thị cho đến khi admin
                        thay đổi. Nhân viên chỉ xử lý đơn hàng thuộc siêu thị được gán.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setRefreshing(true)
                        void loadData()
                    }}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                    {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCcw className="h-4 w-4" />
                    )}
                    Làm mới
                </button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                {[
                    { label: "Nhân viên đóng gói", value: stats.totalStaff },
                    { label: "Siêu thị đã có nhân sự", value: stats.assignedSupermarkets },
                    { label: "Nhân viên chưa gán", value: stats.unassignedStaff },
                    { label: "Siêu thị chưa có nhân sự", value: stats.uncoveredSupermarkets },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                    >
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-4 py-4">
                        <h2 className="text-base font-semibold text-slate-900">
                            Danh sách gán siêu thị
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Chọn siêu thị mới và lưu để thay đổi phạm vi xử lý đơn của nhân viên.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Nhân viên</th>
                                    <th className="px-4 py-3 font-semibold">Siêu thị hiện tại</th>
                                    <th className="px-4 py-3 font-semibold">Gán siêu thị</th>
                                    <th className="px-4 py-3 font-semibold">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffRows.map((row) => {
                                    const changed =
                                        row.pendingSupermarketId !== row.supermarketId

                                    return (
                                        <tr
                                            key={row.userId}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-700">
                                                        <UserRound className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {row.fullName}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {row.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {row.supermarketName ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        <Store className="h-3.5 w-3.5" />
                                                        {row.supermarketName}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        Chưa gán
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <select
                                                    value={row.pendingSupermarketId}
                                                    onChange={(e) =>
                                                        handlePendingChange(
                                                            row.userId,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full min-w-[220px] rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
                                                >
                                                    <option value="">
                                                        Chọn siêu thị
                                                    </option>
                                                    {supermarkets.map((market) => (
                                                        <option
                                                            key={market.supermarketId}
                                                            value={market.supermarketId}
                                                        >
                                                            {market.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4">
                                                <button
                                                    type="button"
                                                    disabled={!changed || row.saving}
                                                    onClick={() =>
                                                        void handleSaveBinding(row)
                                                    }
                                                    className={cn(
                                                        "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                                                        changed
                                                            ? "bg-slate-900 text-white hover:bg-slate-800"
                                                            : "border border-slate-200 bg-slate-50 text-slate-400",
                                                        row.saving && "opacity-60",
                                                    )}
                                                >
                                                    {row.saving ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4" />
                                                    )}
                                                    Lưu gán
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}

                                {staffRows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-12 text-center text-slate-500"
                                        >
                                            Chưa có nhân viên đóng gói. Tạo tài khoản tại{" "}
                                            <span className="font-medium text-slate-700">
                                                Nhân sự nội bộ
                                            </span>
                                            .
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900">
                <div className="flex items-start gap-2">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                        Một siêu thị có thể có nhiều nhân viên đóng gói, nhưng mỗi nhân viên
                        chỉ thuộc duy nhất một siêu thị tại một thời điểm. Thay đổi gán sẽ
                        có hiệu lực ngay cho các thao tác đóng gói tiếp theo.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AdminOperations
