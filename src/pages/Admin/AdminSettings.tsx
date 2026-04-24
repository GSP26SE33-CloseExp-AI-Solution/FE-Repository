import { useEffect, useMemo, useState, type ComponentType } from "react"
import {
    Clock3,
    FolderTree,
    Gift,
    MapPinned,
    RefreshCcw,
    Settings2,
    Tag,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    AdminTimeSlot,
    CategoryItem,
    CollectionPoint,
    PromotionItem,
    SystemParameter,
    UnitItem,
} from "@/types/admin.type"
import { showError, showSuccess } from "@/utils/toast"

import AdminSettingsCategories from "./adminSettings/Categories"
import AdminSettingsCollectionPoints from "./adminSettings/CollectionPoints"
import AdminSettingsPromotions from "./adminSettings/Promotions"
import AdminSettingsTimeSlots from "./adminSettings/TimeSlots"
import AdminSettingsUnits from "./adminSettings/Units"
import {
    formatDateTime,
    logApiError,
    logApiSuccess,
    type CollectionUsageRow,
    type TabKey,
    type TimeSlotUsageRow,
    type UnitUsageRow,
} from "./adminSettings/Shared"

const tabs: Array<{
    key: TabKey
    label: string
    icon: ComponentType<{ size?: number }>
}> = [
        { key: "timeSlots", label: "Khung giờ", icon: Clock3 },
        { key: "collectionPoints", label: "Điểm tập kết", icon: MapPinned },
        { key: "parameters", label: "Tham số", icon: Settings2 },
        { key: "categories", label: "Danh mục", icon: FolderTree },
        { key: "units", label: "Đơn vị", icon: Tag },
        { key: "promotions", label: "Khuyến mãi", icon: Gift },
    ]

type ParameterMeta = {
    title: string
    description: string
    placeholder?: string
    suffix?: string
    inputMode?: "text" | "numeric"
}

const PARAMETER_META: Record<string, ParameterMeta> = {
    ORDER_AUTO_CONFIRM_DAYS_AFTER_DELIVERED: {
        title: "Số ngày tự xác nhận đơn sau khi giao",
        description:
            "Sau khoảng thời gian này, đơn đã giao thành công sẽ được hệ thống tự xác nhận hoàn tất.",
        placeholder: "Ví dụ: 3",
        suffix: "ngày",
        inputMode: "numeric",
    },
    ORDER_CANCEL_WINDOW_MINUTES_AFTER_PAID: {
        title: "Thời gian cho phép hủy đơn sau thanh toán",
        description:
            "Khách hàng chỉ được hủy đơn trong khoảng thời gian này kể từ lúc thanh toán thành công.",
        placeholder: "Ví dụ: 30",
        suffix: "phút",
        inputMode: "numeric",
    },
    ORDER_READY_TO_SHIP_MAX_WAIT_MINUTES: {
        title: "Thời gian tối đa chờ xử lý đơn sẵn sàng giao",
        description:
            "Sau khoảng thời gian này, đơn đã sẵn sàng giao nhưng chưa được xử lý tiếp sẽ được xem là cần ưu tiên kiểm tra.",
        placeholder: "Ví dụ: 90",
        suffix: "phút",
        inputMode: "numeric",
    },
    ORDER_SYSTEM_USAGE_FEE_VND: {
        title: "Phí sử dụng hệ thống trên mỗi đơn",
        description:
            "Khoản phí hệ thống được áp dụng cho mỗi đơn hàng theo cấu hình vận hành hiện tại.",
        placeholder: "Ví dụ: 5000",
        suffix: "đ",
        inputMode: "numeric",
    },
}

const getParameterMeta = (configKey: string): ParameterMeta => {
    return (
        PARAMETER_META[configKey] ?? {
            title: configKey
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (char) => char.toUpperCase()),
            description:
                "Tham số hệ thống dùng cho cấu hình vận hành. Hãy kiểm tra kỹ trước khi thay đổi.",
            placeholder: "Nhập giá trị",
            inputMode: "text",
        }
    )
}

const isNumericValue = (value: string) => /^-?\d+([.,]\d+)?$/.test(value.trim())

type ParameterRowProps = {
    configKey: string
    configValue: string
    updatedAt?: string
    onSave: (configKey: string, configValue: string) => Promise<void>
}

const ParameterRow = ({
    configKey,
    configValue,
    updatedAt,
    onSave,
}: ParameterRowProps) => {
    const [value, setValue] = useState(configValue)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setValue(configValue)
    }, [configValue])

    const meta = getParameterMeta(configKey)
    const isDirty = value !== configValue
    const showPreview =
        meta.suffix && value.trim() && meta.inputMode === "numeric" && isNumericValue(value)

    const handleSave = async () => {
        if (saving) return
        setSaving(true)
        try {
            await onSave(configKey, value)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">{meta.title}</p>

                        {showPreview ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                Hiện tại: {value.trim()} {meta.suffix}
                            </span>
                        ) : null}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        {meta.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                            Mã tham số: {configKey}
                        </span>
                        <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                            Cập nhật: {formatDateTime(updatedAt)}
                        </span>
                    </div>
                </div>

                <div className="w-full xl:w-[420px]">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <input
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                inputMode={meta.inputMode === "numeric" ? "numeric" : "text"}
                                placeholder={meta.placeholder}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 pr-16 outline-none transition focus:border-slate-900"
                            />
                            {meta.suffix ? (
                                <span className="pointer-events-none absolute inset-y-0 right-4 inline-flex items-center text-sm text-slate-400">
                                    {meta.suffix}
                                </span>
                            ) : null}
                        </div>

                        <button
                            onClick={() => void handleSave()}
                            disabled={!isDirty || saving}
                            className={[
                                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                                !isDirty || saving
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-slate-900 text-white hover:bg-slate-800",
                            ].join(" ")}
                        >
                            {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>

                    {isDirty ? (
                        <p className="mt-2 text-xs text-amber-600">
                            Bạn đang có thay đổi chưa lưu.
                        </p>
                    ) : (
                        <p className="mt-2 text-xs text-slate-400">
                            Thay đổi sẽ có hiệu lực theo logic xử lý của hệ thống.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

const AdminSettings = () => {
    const [tab, setTab] = useState<TabKey>("timeSlots")
    const [loading, setLoading] = useState(false)

    const [timeSlots, setTimeSlots] = useState<TimeSlotUsageRow[]>([])
    const [collectionPoints, setCollectionPoints] = useState<CollectionUsageRow[]>([])
    const [parameters, setParameters] = useState<SystemParameter[]>([])
    const [categories, setCategories] = useState<CategoryItem[]>([])
    const [parentCategories, setParentCategories] = useState<CategoryItem[]>([])
    const [units, setUnits] = useState<UnitUsageRow[]>([])
    const [promotions, setPromotions] = useState<PromotionItem[]>([])

    const activeTabLabel = useMemo(
        () => tabs.find((item) => item.key === tab)?.label ?? "",
        [tab]
    )

    const fetchBaseData = async () => {
        try {
            setLoading(true)

            const [slotRes, cpRes, unitRes] = await Promise.all([
                adminService.getTimeSlots(),
                adminService.getCollectionPoints(),
                adminService.getUnits(),
            ])

            logApiSuccess("fetchBaseData - getTimeSlots", undefined, slotRes)
            logApiSuccess("fetchBaseData - getCollectionPoints", undefined, cpRes)
            logApiSuccess("fetchBaseData - getUnits", undefined, unitRes)

            setTimeSlots(
                (slotRes ?? []).map((slot: AdminTimeSlot) => ({
                    ...slot,
                    isInUse: (slot.relatedOrderCount ?? 0) > 0,
                }))
            )

            setCollectionPoints(
                (cpRes ?? []).map((item: CollectionPoint) => ({
                    ...item,
                    isInUse: (item.relatedOrderCount ?? 0) > 0,
                }))
            )

            setUnits(
                (unitRes ?? []).map((item: UnitItem) => ({
                    ...item,
                    isInUse:
                        Boolean(item.isInUse) || (item.relatedStockLotCount ?? 0) > 0,
                }))
            )
        } catch (error) {
            logApiError("fetchBaseData", error)
            showError("Không tải được cấu hình hệ thống")
        } finally {
            setLoading(false)
        }
    }

    const fetchCategoriesData = async () => {
        const [categoriesRes, parentCategoriesRes] = await Promise.all([
            adminService.getCategories(true),
            adminService.getParentCategories(true),
        ])

        logApiSuccess("fetchCategoriesData - getCategories", undefined, categoriesRes)
        logApiSuccess(
            "fetchCategoriesData - getParentCategories",
            undefined,
            parentCategoriesRes
        )

        setCategories(categoriesRes ?? [])
        setParentCategories(parentCategoriesRes ?? [])
    }

    const fetchPromotionsData = async () => {
        const [promotionsRes, categoriesRes, parentCategoriesRes] = await Promise.all([
            adminService.getPromotions(),
            adminService.getCategories(true),
            adminService.getParentCategories(true),
        ])

        logApiSuccess("fetchPromotionsData - getPromotions", undefined, promotionsRes)
        logApiSuccess("fetchPromotionsData - getCategories", undefined, categoriesRes)
        logApiSuccess(
            "fetchPromotionsData - getParentCategories",
            undefined,
            parentCategoriesRes
        )

        setPromotions(promotionsRes ?? [])
        setCategories(categoriesRes ?? [])
        setParentCategories(parentCategoriesRes ?? [])
    }

    const fetchTabData = async (targetTab: TabKey) => {
        try {
            setLoading(true)

            if (targetTab === "parameters") {
                const res = await adminService.getSystemParameters()
                logApiSuccess("fetchTabData - getSystemParameters", undefined, res)
                setParameters(res ?? [])
                return
            }

            if (targetTab === "categories") {
                await fetchCategoriesData()
                return
            }

            if (targetTab === "promotions") {
                await fetchPromotionsData()
            }
        } catch (error) {
            logApiError(`fetchTabData - ${targetTab}`, error)
            showError(`Không tải được dữ liệu mục ${activeTabLabel.toLowerCase()}`)
        } finally {
            setLoading(false)
        }
    }

    const refreshCurrentTab = async () => {
        await fetchBaseData()

        if (tab === "parameters" || tab === "categories" || tab === "promotions") {
            await fetchTabData(tab)
        }
    }

    useEffect(() => {
        void fetchBaseData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (tab === "parameters" || tab === "categories" || tab === "promotions") {
            void fetchTabData(tab)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab])

    const handleUpdateParameter = async (configKey: string, configValue: string) => {
        const payload = { configValue }

        try {
            logApiSuccess("handleUpdateParameter - request", { configKey, ...payload })
            const res = await adminService.updateSystemParameter(configKey, payload)
            logApiSuccess(
                "handleUpdateParameter - response",
                { configKey, ...payload },
                res
            )

            showSuccess("Đã cập nhật tham số")
            await refreshCurrentTab()
        } catch (error) {
            logApiError("handleUpdateParameter", error, { configKey, payload })
            showError("Không thể cập nhật tham số")
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            Thiết lập quản trị
                        </p>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Cấu hình hệ thống
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Đang xem: {activeTabLabel}
                        </p>
                    </div>

                    <button
                        onClick={() => void refreshCurrentTab()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        <RefreshCcw size={16} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_1fr]">
                <aside className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                    <div className="space-y-1">
                        {tabs.map((item) => {
                            const Icon = item.icon
                            const active = tab === item.key

                            return (
                                <button
                                    key={item.key}
                                    onClick={() => setTab(item.key)}
                                    className={[
                                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                                        active
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-700 hover:bg-slate-100",
                                    ].join(" ")}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </button>
                            )
                        })}
                    </div>
                </aside>

                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    {tab === "timeSlots" && (
                        <AdminSettingsTimeSlots
                            loading={loading}
                            timeSlots={timeSlots}
                            onRefresh={refreshCurrentTab}
                        />
                    )}

                    {tab === "collectionPoints" && (
                        <AdminSettingsCollectionPoints
                            loading={loading}
                            collectionPoints={collectionPoints}
                            onRefresh={refreshCurrentTab}
                        />
                    )}

                    {tab === "parameters" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Tham số hệ thống
                                </h2>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                                    <p className="text-sm text-slate-500">Tổng số tham số</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        {parameters.length}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                                    <p className="text-sm text-slate-500">Đã cấu hình</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        {
                                            parameters.filter((item) =>
                                                String(item.configValue ?? "").trim()
                                            ).length
                                        }
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                                    <p className="text-sm text-slate-500">Cập nhật gần đây</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {parameters.length > 0
                                            ? formatDateTime(
                                                [...parameters]
                                                    .sort((a, b) =>
                                                        String(b.updatedAt ?? "").localeCompare(
                                                            String(a.updatedAt ?? "")
                                                        )
                                                    )[0]?.updatedAt
                                            )
                                            : "--"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {parameters.map((item) => (
                                    <ParameterRow
                                        key={item.configKey}
                                        configKey={item.configKey}
                                        configValue={item.configValue}
                                        updatedAt={item.updatedAt}
                                        onSave={handleUpdateParameter}
                                    />
                                ))}

                                {!loading && parameters.length === 0 && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-500">
                                        Chưa có tham số nào.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "categories" && (
                        <AdminSettingsCategories
                            loading={loading}
                            categories={categories}
                            parentCategories={parentCategories}
                            onRefresh={refreshCurrentTab}
                        />
                    )}

                    {tab === "units" && (
                        <AdminSettingsUnits
                            loading={loading}
                            units={units}
                            onRefresh={refreshCurrentTab}
                        />
                    )}

                    {tab === "promotions" && (
                        <AdminSettingsPromotions
                            loading={loading}
                            promotions={promotions}
                            categories={categories}
                            onRefresh={refreshCurrentTab}
                        />
                    )}
                </section>
            </div>
        </div>
    )
}

export default AdminSettings
