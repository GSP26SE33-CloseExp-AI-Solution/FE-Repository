import { Eye, Mail, Phone, Route, UserCog } from "lucide-react"
import { useNavigate } from "react-router-dom"

import type { InternalStaffRow } from "@/types/admin.type"
import {
    formatDateTime,
    getOperationsRoute,
    getRoleClassById,
    getRoleHintById,
    getRoleLabelById,
    getStatusClass,
    getStatusLabel,
    isOperationalRoutingRole,
} from "./adminInternalStaff.utils"

type InternalStaffTableProps = {
    items: InternalStaffRow[]
    actionLoading: boolean
    onView: (item: InternalStaffRow) => void
}

const InternalStaffTable = ({
    items,
    actionLoading,
    onView,
}: InternalStaffTableProps) => {
    const navigate = useNavigate()

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-full table-fixed">
                    <colgroup>
                        <col className="w-[22%]" />
                        <col className="w-[16%]" />
                        <col className="w-[16%]" />
                        <col className="w-[14%]" />
                        <col className="w-[16%]" />
                        <col className="w-[16%]" />
                    </colgroup>

                    <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200">
                            <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Nhân sự
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Vai trò
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Liên hệ
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Bộ phận
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Cập nhật
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                Thao tác
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((item) => {
                            const canNavigateToOperations = isOperationalRoutingRole(
                                item.roleId
                            )

                            return (
                                <tr
                                    key={`${item.userId}-${item.id}`}
                                    className="border-b border-slate-100 align-top last:border-b-0 hover:bg-slate-50/60"
                                >
                                    <td className="px-4 py-4">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-900">
                                                {item.fullName || "--"}
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                {getRoleHintById(item.roleId)}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex flex-col items-start gap-2">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getRoleClassById(
                                                    item.roleId
                                                )}`}
                                            >
                                                {getRoleLabelById(item.roleId, item.roleName)}
                                            </span>
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                                                    item.status
                                                )}`}
                                            >
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="space-y-2 text-sm text-slate-700">
                                            <div className="flex items-start gap-2">
                                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                                <span className="break-all">
                                                    {item.email || "--"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                                                <span>{item.phone || "--"}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="space-y-1 text-sm text-slate-700">
                                            <p>{item.department || "--"}</p>
                                            <p className="text-xs text-slate-500">
                                                {item.position || "--"}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex items-start gap-2 text-sm text-slate-700">
                                            <UserCog className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                            <span>
                                                {formatDateTime(
                                                    item.updatedAt || item.createdAt
                                                )}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onView(item)}
                                                disabled={actionLoading}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Chi tiết
                                            </button>

                                            {canNavigateToOperations ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            getOperationsRoute(item.roleId)
                                                        )
                                                    }
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                                >
                                                    <Route className="h-4 w-4" />
                                                    Điều phối
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default InternalStaffTable
