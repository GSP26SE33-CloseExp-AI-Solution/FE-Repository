import { useEffect, useMemo, useState } from "react"

import type { UpsertUnitPayload } from "@/types/admin.type"
import { adminService } from "@/services/admin.service"
import { showError, showSuccess } from "@/utils/toast"

import {
    formatDateTime,
    formatNumber,
    logApiError,
    logApiSuccess,
    type UnitUsageRow,
} from "./Shared"

type Props = {
    loading: boolean
    units: UnitUsageRow[]
    onRefresh: () => Promise<void>
}

type UsageFilter = "ALL" | "USED" | "UNUSED"

const CUSTOM_TYPE_VALUE = "__CUSTOM__"

const EMPTY_UNIT_FORM: UpsertUnitPayload = {
    name: "",
    type: "",
    symbol: "",
}

const normalizeUnitPayload = (source: UpsertUnitPayload): UpsertUnitPayload => ({
    name: source.name.trim(),
    type: source.type.trim(),
    symbol: source.symbol.trim() || source.name.trim(),
})

const normalizeText = (value?: string) =>
    (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()

const compareText = (left?: string, right?: string) =>
    (left ?? "").localeCompare(right ?? "", "vi", {
        sensitivity: "base",
        numeric: true,
    })

const TABLE_COLS = {
    name: "w-[24%]",
    type: "w-[18%]",
    symbol: "w-[14%]",
    usage: "w-[14%]",
    updatedAt: "w-[16%]",
    actions: "w-[14%]",
}

const cellBase = "px-4 py-3 align-top"
const inputBase =
    "w-full rounded-xl border border-slate-300 px-3 py-1.5 outline-none focus:border-slate-900"
const actionBtnBase =
    "rounded-xl border px-3 py-1.5 font-medium transition whitespace-nowrap"

const AdminSettingsUnits = ({ loading, units, onRefresh }: Props) => {
    const [newUnit, setNewUnit] = useState<UpsertUnitPayload>(EMPTY_UNIT_FORM)
    const [newTypeMode, setNewTypeMode] = useState<string>("")

    const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
    const [editUnit, setEditUnit] = useState<UpsertUnitPayload>(EMPTY_UNIT_FORM)
    const [editTypeMode, setEditTypeMode] = useState<string>("")

    const [searchKeyword, setSearchKeyword] = useState("")
    const [typeFilter, setTypeFilter] = useState("ALL")
    const [usageFilter, setUsageFilter] = useState<UsageFilter>("ALL")
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

    const usedUnitsCount = useMemo(
        () => units.filter((item) => item.isInUse).length,
        [units]
    )

    const editableUnitsCount = useMemo(
        () => units.filter((item) => !item.isInUse).length,
        [units]
    )

    const unitTypeOptions = useMemo(() => {
        const uniqueTypes = Array.from(
            new Set(
                units
                    .map((item) => item.type?.trim())
                    .filter((value): value is string => Boolean(value))
            )
        )

        return uniqueTypes.sort((a, b) => compareText(a, b))
    }, [units])

    const filteredUnits = useMemo(() => {
        const keyword = normalizeText(searchKeyword)

        return [...units]
            .filter((item) => {
                if (typeFilter !== "ALL" && (item.type?.trim() || "") !== typeFilter) {
                    return false
                }

                if (usageFilter === "USED" && !item.isInUse) {
                    return false
                }

                if (usageFilter === "UNUSED" && item.isInUse) {
                    return false
                }

                if (!keyword) return true

                const haystacks = [item.name, item.type, item.symbol]
                    .map((value) => normalizeText(value))
                    .filter(Boolean)

                return haystacks.some((value) => value.includes(keyword))
            })
            .sort((a, b) => {
                const typeCompare = compareText(a.type, b.type)
                if (typeCompare !== 0) return typeCompare
                return compareText(a.name, b.name)
            })
    }, [units, searchKeyword, typeFilter, usageFilter])

    const groupedUnits = useMemo(() => {
        const map = new Map<string, UnitUsageRow[]>()

        filteredUnits.forEach((item) => {
            const key = item.type?.trim() || "Chưa phân loại"
            if (!map.has(key)) {
                map.set(key, [])
            }
            map.get(key)!.push(item)
        })

        return Array.from(map.entries()).sort((a, b) => compareText(a[0], b[0]))
    }, [filteredUnits])

    useEffect(() => {
        setCollapsedGroups((prev) => {
            const next = { ...prev }

            groupedUnits.forEach(([groupName]) => {
                if (!(groupName in next)) {
                    next[groupName] = false
                }
            })

            Object.keys(next).forEach((key) => {
                if (!groupedUnits.some(([groupName]) => groupName === key)) {
                    delete next[key]
                }
            })

            return next
        })
    }, [groupedUnits])

    const resetEditing = () => {
        setEditingUnitId(null)
        setEditUnit(EMPTY_UNIT_FORM)
        setEditTypeMode("")
    }

    const toggleGroup = (groupName: string) => {
        setCollapsedGroups((prev) => ({
            ...prev,
            [groupName]: !prev[groupName],
        }))
    }

    const collapseAllGroups = () => {
        const next: Record<string, boolean> = {}
        groupedUnits.forEach(([groupName]) => {
            next[groupName] = true
        })
        setCollapsedGroups(next)
    }

    const expandAllGroups = () => {
        const next: Record<string, boolean> = {}
        groupedUnits.forEach(([groupName]) => {
            next[groupName] = false
        })
        setCollapsedGroups(next)
    }

    const handleChangeNewTypeMode = (value: string) => {
        setNewTypeMode(value)

        if (value === CUSTOM_TYPE_VALUE) {
            setNewUnit((prev) => ({ ...prev, type: "" }))
            return
        }

        setNewUnit((prev) => ({ ...prev, type: value }))
    }

    const handleChangeEditTypeMode = (value: string) => {
        setEditTypeMode(value)

        if (value === CUSTOM_TYPE_VALUE) {
            setEditUnit((prev) => ({ ...prev, type: "" }))
            return
        }

        setEditUnit((prev) => ({ ...prev, type: value }))
    }

    const handleCreateUnit = async () => {
        if (!newUnit.name.trim()) {
            showError("Vui lòng nhập tên đơn vị")
            return
        }

        if (!newUnit.type.trim()) {
            showError("Vui lòng chọn hoặc nhập loại đơn vị")
            return
        }

        const payload = normalizeUnitPayload(newUnit)

        try {
            logApiSuccess("handleCreateUnit - request", payload)
            const res = await adminService.createUnit(payload)
            logApiSuccess("handleCreateUnit - response", payload, res)

            showSuccess("Đã tạo đơn vị")
            setNewUnit(EMPTY_UNIT_FORM)
            setNewTypeMode("")
            await onRefresh()
        } catch (error) {
            logApiError("handleCreateUnit", error, payload)
            showError("Không thể tạo đơn vị")
        }
    }

    const handleStartEdit = (item: UnitUsageRow) => {
        if (item.isInUse) {
            showError("Không thể sửa đơn vị đang được sử dụng")
            return
        }

        const currentType = item.type?.trim() || ""
        const isExistingType = unitTypeOptions.includes(currentType)

        setEditingUnitId(item.unitId)
        setEditUnit({
            name: item.name ?? "",
            type: currentType,
            symbol: item.symbol ?? "",
        })
        setEditTypeMode(isExistingType ? currentType : CUSTOM_TYPE_VALUE)
    }

    const handleUpdateUnit = async (unitId: string) => {
        const target = units.find((item) => item.unitId === unitId)

        if (target?.isInUse) {
            showError("Không thể sửa đơn vị đang được sử dụng")
            resetEditing()
            return
        }

        if (!editUnit.name.trim()) {
            showError("Vui lòng nhập tên đơn vị")
            return
        }

        if (!editUnit.type.trim()) {
            showError("Vui lòng chọn hoặc nhập loại đơn vị")
            return
        }

        const payload = normalizeUnitPayload(editUnit)

        try {
            logApiSuccess("handleUpdateUnit - request", { unitId, payload })
            const res = await adminService.updateUnit(unitId, payload)
            logApiSuccess("handleUpdateUnit - response", { unitId, payload }, res)

            showSuccess("Đã cập nhật đơn vị")
            resetEditing()
            await onRefresh()
        } catch (error) {
            logApiError("handleUpdateUnit", error, { unitId, payload })
            showError("Không thể cập nhật đơn vị")
        }
    }

    const handleDeleteUnit = async (unitId: string) => {
        const target = units.find((item) => item.unitId === unitId)

        if (target?.isInUse) {
            showError("Không thể xóa đơn vị đang được sử dụng")
            return
        }

        try {
            logApiSuccess("handleDeleteUnit - request", { unitId })
            const res = await adminService.deleteUnit(unitId)
            logApiSuccess("handleDeleteUnit - response", { unitId }, res)

            showSuccess("Đã xóa đơn vị")
            await onRefresh()
        } catch (error) {
            logApiError("handleDeleteUnit", error, { unitId })
            showError("Không thể xóa đơn vị")
        }
    }

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Đơn vị tính</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Tạo mới, chỉnh sửa và quản lý theo loại đơn vị.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm text-slate-500">Tổng số</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatNumber(units.length)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm text-slate-500">Đang sử dụng</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatNumber(usedUnitsCount)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm text-slate-500">Có thể chỉnh sửa</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatNumber(editableUnitsCount)}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">Tạo đơn vị mới</h3>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <input
                        value={newUnit.name}
                        onChange={(e) =>
                            setNewUnit((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                        placeholder="Tên đơn vị"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    />

                    <input
                        value={newUnit.symbol}
                        onChange={(e) =>
                            setNewUnit((prev) => ({
                                ...prev,
                                symbol: e.target.value,
                            }))
                        }
                        placeholder="Ký hiệu"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    />

                    <div className="space-y-2">
                        <select
                            value={newTypeMode}
                            onChange={(e) => handleChangeNewTypeMode(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                        >
                            <option value="">Chọn loại đơn vị</option>
                            {unitTypeOptions.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                            <option value={CUSTOM_TYPE_VALUE}>Khác...</option>
                        </select>

                        {newTypeMode === CUSTOM_TYPE_VALUE ? (
                            <input
                                value={newUnit.type}
                                onChange={(e) =>
                                    setNewUnit((prev) => ({
                                        ...prev,
                                        type: e.target.value,
                                    }))
                                }
                                placeholder="Nhập loại mới"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                            />
                        ) : null}
                    </div>

                    <button
                        onClick={() => void handleCreateUnit()}
                        className="rounded-2xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800"
                    >
                        Tạo đơn vị
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
                    <input
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Tìm tên, loại hoặc ký hiệu"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    />

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    >
                        <option value="ALL">Tất cả loại</option>
                        {unitTypeOptions.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>

                    <select
                        value={usageFilter}
                        onChange={(e) => setUsageFilter(e.target.value as UsageFilter)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="USED">Đang sử dụng</option>
                        <option value="UNUSED">Chưa dùng</option>
                    </select>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={expandAllGroups}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Mở hết
                        </button>
                        <button
                            type="button"
                            onClick={collapseAllGroups}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Thu gọn
                        </button>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                        {formatNumber(filteredUnits.length)} đơn vị
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                        {formatNumber(groupedUnits.length)} nhóm
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                {groupedUnits.map(([groupName, groupItems]) => {
                    const isCollapsed = collapsedGroups[groupName] ?? false

                    return (
                        <div
                            key={groupName}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                            <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        {groupName}
                                    </h3>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                                        {formatNumber(groupItems.length)}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => toggleGroup(groupName)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    {isCollapsed ? "Mở" : "Thu"}
                                </button>
                            </div>

                            {!isCollapsed ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full table-fixed text-sm">
                                        <thead className="border-t border-slate-200 bg-white text-slate-500">
                                            <tr>
                                                <th className={`${cellBase} ${TABLE_COLS.name} text-left font-medium`}>
                                                    Tên
                                                </th>
                                                <th className={`${cellBase} ${TABLE_COLS.type} text-left font-medium`}>
                                                    Loại
                                                </th>
                                                <th className={`${cellBase} ${TABLE_COLS.symbol} text-left font-medium`}>
                                                    Ký hiệu
                                                </th>
                                                <th className={`${cellBase} ${TABLE_COLS.usage} text-left font-medium`}>
                                                    Sử dụng
                                                </th>
                                                <th className={`${cellBase} ${TABLE_COLS.updatedAt} text-left font-medium`}>
                                                    Cập nhật
                                                </th>
                                                <th className={`${cellBase} ${TABLE_COLS.actions} text-right font-medium`}>
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item) => {
                                                const isEditing = editingUnitId === item.unitId

                                                return (
                                                    <tr
                                                        key={item.unitId}
                                                        className="border-t border-slate-200"
                                                    >
                                                        <td className={`${cellBase} ${TABLE_COLS.name} font-medium text-slate-900`}>
                                                            {isEditing ? (
                                                                <input
                                                                    value={editUnit.name}
                                                                    onChange={(e) =>
                                                                        setEditUnit((prev) => ({
                                                                            ...prev,
                                                                            name: e.target.value,
                                                                        }))
                                                                    }
                                                                    className={inputBase}
                                                                />
                                                            ) : (
                                                                <div className="truncate" title={item.name}>
                                                                    {item.name}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className={`${cellBase} ${TABLE_COLS.type}`}>
                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    <select
                                                                        value={editTypeMode}
                                                                        onChange={(e) =>
                                                                            handleChangeEditTypeMode(
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className={inputBase}
                                                                    >
                                                                        <option value="">
                                                                            Chọn loại đơn vị
                                                                        </option>
                                                                        {unitTypeOptions.map((type) => (
                                                                            <option
                                                                                key={type}
                                                                                value={type}
                                                                            >
                                                                                {type}
                                                                            </option>
                                                                        ))}
                                                                        <option value={CUSTOM_TYPE_VALUE}>
                                                                            + Nhập loại mới
                                                                        </option>
                                                                    </select>

                                                                    {editTypeMode === CUSTOM_TYPE_VALUE ? (
                                                                        <input
                                                                            value={editUnit.type}
                                                                            onChange={(e) =>
                                                                                setEditUnit((prev) => ({
                                                                                    ...prev,
                                                                                    type: e.target.value,
                                                                                }))
                                                                            }
                                                                            placeholder="Nhập loại mới"
                                                                            className={inputBase}
                                                                        />
                                                                    ) : null}
                                                                </div>
                                                            ) : (
                                                                <div className="truncate">
                                                                    <span className="inline-flex max-w-full rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                                        <span className="truncate" title={item.type?.trim() || "--"}>
                                                                            {item.type?.trim() || "--"}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className={`${cellBase} ${TABLE_COLS.symbol}`}>
                                                            {isEditing ? (
                                                                <input
                                                                    value={editUnit.symbol}
                                                                    onChange={(e) =>
                                                                        setEditUnit((prev) => ({
                                                                            ...prev,
                                                                            symbol: e.target.value,
                                                                        }))
                                                                    }
                                                                    className={inputBase}
                                                                />
                                                            ) : (
                                                                <div className="truncate">
                                                                    <span className="inline-flex max-w-full rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                                        <span
                                                                            className="truncate"
                                                                            title={item.symbol?.trim() || item.name || "--"}
                                                                        >
                                                                            {item.symbol?.trim() || item.name || "--"}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className={`${cellBase} ${TABLE_COLS.usage}`}>
                                                            <span
                                                                className={[
                                                                    "inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium",
                                                                    item.isInUse
                                                                        ? "bg-amber-100 text-amber-700"
                                                                        : "bg-emerald-100 text-emerald-700",
                                                                ].join(" ")}
                                                            >
                                                                {item.isInUse
                                                                    ? `${formatNumber(item.relatedStockLotCount)} lot`
                                                                    : "Chưa dùng"}
                                                            </span>
                                                        </td>

                                                        <td className={`${cellBase} ${TABLE_COLS.updatedAt} text-slate-500`}>
                                                            <div
                                                                className="truncate"
                                                                title={formatDateTime(
                                                                    item.updatedAt || item.createdAt
                                                                )}
                                                            >
                                                                {formatDateTime(
                                                                    item.updatedAt || item.createdAt
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className={`${cellBase} ${TABLE_COLS.actions} text-right`}>
                                                            <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                                                                {isEditing ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() =>
                                                                                void handleUpdateUnit(
                                                                                    item.unitId
                                                                                )
                                                                            }
                                                                            className="rounded-xl bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800"
                                                                        >
                                                                            Lưu
                                                                        </button>
                                                                        <button
                                                                            onClick={resetEditing}
                                                                            className={`${actionBtnBase} border-slate-200 text-slate-700 hover:bg-slate-50`}
                                                                        >
                                                                            Hủy
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleStartEdit(item)
                                                                            }
                                                                            disabled={item.isInUse}
                                                                            className={[
                                                                                actionBtnBase,
                                                                                item.isInUse
                                                                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                                                                    : "border-slate-200 text-slate-700 hover:bg-slate-50",
                                                                            ].join(" ")}
                                                                        >
                                                                            Sửa
                                                                        </button>

                                                                        <button
                                                                            onClick={() =>
                                                                                void handleDeleteUnit(
                                                                                    item.unitId
                                                                                )
                                                                            }
                                                                            disabled={item.isInUse}
                                                                            className={[
                                                                                actionBtnBase,
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
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-4 py-3 text-sm text-slate-400">
                                    Đang thu gọn
                                </div>
                            )}
                        </div>
                    )
                })}

                {!loading && groupedUnits.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-500">
                        Không có đơn vị phù hợp
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminSettingsUnits
