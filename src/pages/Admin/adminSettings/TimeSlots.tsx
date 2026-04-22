import { useState } from "react"

import { adminService } from "@/services/admin.service"
import { showError, showSuccess } from "@/utils/toast"

import {
    hhmmFromTimeSpan,
    logApiError,
    logApiSuccess,
    parseMinutes,
    type TimeSlotUsageRow,
} from "./Shared"

type Props = {
    loading: boolean
    timeSlots: TimeSlotUsageRow[]
    onRefresh: () => Promise<void>
}

const AdminSettingsTimeSlots = ({ loading, timeSlots, onRefresh }: Props) => {
    const [newSlotStart, setNewSlotStart] = useState("08:00")
    const [newSlotEnd, setNewSlotEnd] = useState("10:00")

    const [editingTimeSlotId, setEditingTimeSlotId] = useState<string | null>(null)
    const [editSlotStart, setEditSlotStart] = useState("08:00")
    const [editSlotEnd, setEditSlotEnd] = useState("10:00")

    const resetEditing = () => {
        setEditingTimeSlotId(null)
        setEditSlotStart("08:00")
        setEditSlotEnd("10:00")
    }

    const handleCreateTimeSlot = async () => {
        if (!newSlotStart || !newSlotEnd) {
            showError("Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc")
            return
        }

        const startMinutes = parseMinutes(newSlotStart)
        const endMinutes = parseMinutes(newSlotEnd)

        if (startMinutes === null) return showError("Giờ bắt đầu không hợp lệ")
        if (endMinutes === null) return showError("Giờ kết thúc không hợp lệ")
        if (endMinutes <= startMinutes) {
            return showError("Giờ kết thúc phải lớn hơn giờ bắt đầu")
        }

        const payload = adminService.toTimeSlotPayload(newSlotStart, newSlotEnd)

        try {
            logApiSuccess("handleCreateTimeSlot - request", payload)
            const res = await adminService.createTimeSlot(payload)
            logApiSuccess("handleCreateTimeSlot - response", payload, res)

            showSuccess(`Đã tạo khung giờ ${newSlotStart} - ${newSlotEnd}`)
            setNewSlotStart("08:00")
            setNewSlotEnd("10:00")
            await onRefresh()
        } catch (error) {
            logApiError("handleCreateTimeSlot", error, payload)
            showError(`Không thể tạo khung giờ ${newSlotStart} - ${newSlotEnd}`)
        }
    }

    const handleStartEdit = (item: TimeSlotUsageRow) => {
        if (item.isInUse) {
            showError("Không thể sửa khung giờ đang được đơn hàng sử dụng")
            return
        }

        setEditingTimeSlotId(item.timeSlotId)
        setEditSlotStart(hhmmFromTimeSpan(item.startTime))
        setEditSlotEnd(hhmmFromTimeSpan(item.endTime))
    }

    const handleUpdateTimeSlot = async (timeSlotId: string) => {
        const targetTimeSlot = timeSlots.find((item) => item.timeSlotId === timeSlotId)

        if (targetTimeSlot?.isInUse) {
            showError("Không thể sửa khung giờ đang được đơn hàng sử dụng")
            resetEditing()
            return
        }

        if (!editSlotStart || !editSlotEnd) {
            showError("Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc")
            return
        }

        const startMinutes = parseMinutes(editSlotStart)
        const endMinutes = parseMinutes(editSlotEnd)

        if (startMinutes === null) return showError("Giờ bắt đầu không hợp lệ")
        if (endMinutes === null) return showError("Giờ kết thúc không hợp lệ")
        if (endMinutes <= startMinutes) {
            return showError("Giờ kết thúc phải lớn hơn giờ bắt đầu")
        }

        const payload = adminService.toTimeSlotPayload(editSlotStart, editSlotEnd)

        try {
            logApiSuccess("handleUpdateTimeSlot - request", { timeSlotId, payload })
            const res = await adminService.updateTimeSlot(timeSlotId, payload)
            logApiSuccess("handleUpdateTimeSlot - response", { timeSlotId, payload }, res)

            showSuccess(`Đã cập nhật khung giờ ${editSlotStart} - ${editSlotEnd}`)
            resetEditing()
            await onRefresh()
        } catch (error) {
            logApiError("handleUpdateTimeSlot", error, { timeSlotId, payload })
            showError("Không thể cập nhật khung giờ")
        }
    }

    const handleDeleteTimeSlot = async (timeSlotId: string) => {
        const targetTimeSlot = timeSlots.find((item) => item.timeSlotId === timeSlotId)

        if (targetTimeSlot?.isInUse) {
            showError("Không thể xóa khung giờ đang được đơn hàng sử dụng")
            return
        }

        try {
            logApiSuccess("handleDeleteTimeSlot - request", { timeSlotId })
            const res = await adminService.deleteTimeSlot(timeSlotId)
            logApiSuccess("handleDeleteTimeSlot - response", { timeSlotId }, res)

            showSuccess("Đã xóa khung giờ")
            await onRefresh()
        } catch (error) {
            logApiError("handleDeleteTimeSlot", error, { timeSlotId })
            showError("Không thể xóa khung giờ này")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Khung giờ</h2>
                <p className="text-sm text-slate-500">
                    Tạo và quản lý khung giờ giao hoặc nhận hàng
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                    type="time"
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                />
                <input
                    type="time"
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                />
                <button
                    onClick={() => void handleCreateTimeSlot()}
                    className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                >
                    Tạo khung giờ
                </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Bắt đầu</th>
                            <th className="px-4 py-3 text-left">Kết thúc</th>
                            <th className="px-4 py-3 text-left">Đang sử dụng</th>
                            <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((item) => {
                            const isEditing = editingTimeSlotId === item.timeSlotId

                            return (
                                <tr
                                    key={item.timeSlotId}
                                    className="border-t border-slate-200"
                                >
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input
                                                type="time"
                                                value={editSlotStart}
                                                onChange={(e) =>
                                                    setEditSlotStart(e.target.value)
                                                }
                                                className="rounded-xl border border-slate-300 px-3 py-1.5 outline-none focus:border-slate-900"
                                            />
                                        ) : (
                                            hhmmFromTimeSpan(item.startTime)
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input
                                                type="time"
                                                value={editSlotEnd}
                                                onChange={(e) =>
                                                    setEditSlotEnd(e.target.value)
                                                }
                                                className="rounded-xl border border-slate-300 px-3 py-1.5 outline-none focus:border-slate-900"
                                            />
                                        ) : (
                                            hhmmFromTimeSpan(item.endTime)
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={[
                                                "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                                                item.isInUse
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-emerald-100 text-emerald-700",
                                            ].join(" ")}
                                        >
                                            {item.isInUse
                                                ? `Có • ${item.relatedOrderCount ?? 0} đơn`
                                                : "Không"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            void handleUpdateTimeSlot(
                                                                item.timeSlotId
                                                            )
                                                        }
                                                        className="rounded-xl bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800"
                                                    >
                                                        Lưu
                                                    </button>
                                                    <button
                                                        onClick={resetEditing}
                                                        className="rounded-xl border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Hủy
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleStartEdit(item)}
                                                        disabled={item.isInUse}
                                                        title={
                                                            item.isInUse
                                                                ? "Khung giờ này đang có đơn nên không thể sửa"
                                                                : "Sửa khung giờ"
                                                        }
                                                        className={[
                                                            "rounded-xl border px-3 py-1.5 font-medium transition",
                                                            item.isInUse
                                                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                                                : "border-slate-200 text-slate-700 hover:bg-slate-50",
                                                        ].join(" ")}
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            void handleDeleteTimeSlot(
                                                                item.timeSlotId
                                                            )
                                                        }
                                                        disabled={item.isInUse}
                                                        title={
                                                            item.isInUse
                                                                ? "Khung giờ này đang có đơn nên không thể xóa"
                                                                : "Xóa khung giờ"
                                                        }
                                                        className={[
                                                            "rounded-xl border px-3 py-1.5 font-medium transition",
                                                            item.isInUse
                                                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                                                : "border-red-200 text-red-600 hover:bg-red-50",
                                                        ].join(" ")}
                                                    >
                                                        Xóa
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}

                        {!loading && timeSlots.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-6 text-center text-slate-500"
                                >
                                    Chưa có khung giờ nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AdminSettingsTimeSlots
