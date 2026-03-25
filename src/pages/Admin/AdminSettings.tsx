import { useEffect, useMemo, useState } from "react"
import {
    Clock3,
    Gift,
    MapPinned,
    RefreshCcw,
    Settings2,
    Tag,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    AdminTimeSlot,
    CollectionPoint,
    PromotionItem,
    SystemParameter,
    UnitItem,
    UpsertPromotionPayload,
    UpsertUnitPayload,
} from "@/types/admin.type"
import { showError, showSuccess } from "@/utils/toast"

type TabKey =
    | "timeSlots"
    | "collectionPoints"
    | "parameters"
    | "units"
    | "promotions"

const tabs: Array<{
    key: TabKey
    label: string
    icon: React.ComponentType<{ size?: number }>
}> = [
        { key: "timeSlots", label: "Khung giờ", icon: Clock3 },
        { key: "collectionPoints", label: "Điểm tập kết", icon: MapPinned },
        { key: "parameters", label: "Tham số", icon: Settings2 },
        { key: "units", label: "Đơn vị", icon: Tag },
        { key: "promotions", label: "Khuyến mãi", icon: Gift },
    ]

const hhmmToTimeSpanString = (value: string) => {
    if (!value) return "00:00:00"
    return `${value}:00`
}

const hhmmFromTimeValue = (value?: string) => {
    if (!value) return "00:00"
    return value.slice(0, 5)
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

const formatNumber = (value?: number) => {
    return new Intl.NumberFormat("vi-VN").format(value ?? 0)
}

const formatMoney = (value?: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value ?? 0)
}

const getPromotionStatusLabel = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
        case "draft":
            return "Bản nháp"
        case "active":
            return "Đang áp dụng"
        case "expired":
            return "Đã hết hạn"
        case "disabled":
            return "Đã tắt"
        default:
            return status || "--"
    }
}

const getPromotionStatusClass = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
        case "draft":
            return "bg-slate-100 text-slate-700"
        case "active":
            return "bg-emerald-100 text-emerald-700"
        case "expired":
            return "bg-amber-100 text-amber-700"
        case "disabled":
            return "bg-rose-100 text-rose-700"
        default:
            return "bg-slate-100 text-slate-700"
    }
}

const getDiscountTypeLabel = (discountType?: string) => {
    switch ((discountType ?? "").toLowerCase()) {
        case "percentage":
            return "Giảm theo phần trăm"
        case "fixedamount":
            return "Giảm số tiền cố định"
        default:
            return discountType || "--"
    }
}

const AdminSettings = () => {
    const [tab, setTab] = useState<TabKey>("timeSlots")
    const [loading, setLoading] = useState(false)

    const [timeSlots, setTimeSlots] = useState<AdminTimeSlot[]>([])
    const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([])
    const [parameters, setParameters] = useState<SystemParameter[]>([])
    const [units, setUnits] = useState<UnitItem[]>([])
    const [promotions, setPromotions] = useState<PromotionItem[]>([])

    const [newSlotStart, setNewSlotStart] = useState("08:00")
    const [newSlotEnd, setNewSlotEnd] = useState("10:00")

    const [newCollectionName, setNewCollectionName] = useState("")
    const [newCollectionAddress, setNewCollectionAddress] = useState("")
    const [newCollectionLat, setNewCollectionLat] = useState("")
    const [newCollectionLng, setNewCollectionLng] = useState("")

    const [newUnit, setNewUnit] = useState<UpsertUnitPayload>({
        name: "",
        type: "",
        symbol: "",
    })

    const [newPromotion, setNewPromotion] = useState<UpsertPromotionPayload>({
        code: "",
        categoryId: "",
        name: "",
        discountType: "Percentage",
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        maxUsage: 0,
        perUserLimit: 0,
        startDate: "",
        endDate: "",
        status: "Draft",
    })

    const activeTabLabel = useMemo(
        () => tabs.find((item) => item.key === tab)?.label ?? "",
        [tab]
    )

    const fetchAll = async () => {
        try {
            setLoading(true)

            const [slotRes, cpRes, unitRes] = await Promise.all([
                adminService.getTimeSlots(),
                adminService.getCollectionPoints(),
                adminService.getUnits(),
            ])

            setTimeSlots(slotRes ?? [])
            setCollectionPoints(cpRes ?? [])
            setUnits(unitRes ?? [])

            setParameters([])
            setPromotions([])
        } catch (error: any) {
            showError(error?.response?.data?.message || "Không tải được cấu hình hệ thống")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadTabData = async () => {
            try {
                setLoading(true)

                if (tab === "parameters") {
                    const res = await adminService.getSystemParameters()
                    setParameters(res ?? [])
                }

                if (tab === "promotions") {
                    const res = await adminService.getPromotions()
                    setPromotions(res ?? [])
                }
            } catch (error: any) {
                showError(
                    error?.response?.data?.message ||
                    `Không tải được dữ liệu mục ${activeTabLabel.toLowerCase()}`
                )
            } finally {
                setLoading(false)
            }
        }

        if (tab === "parameters" || tab === "promotions") {
            void loadTabData()
        }
    }, [tab, activeTabLabel])

    useEffect(() => {
        void fetchAll()
    }, [])

    const handleCreateTimeSlot = async () => {
        const toMinutes = (value: string) => {
            const [hour, minute] = value.split(":").map(Number)
            return hour * 60 + minute
        }

        if (toMinutes(newSlotEnd) <= toMinutes(newSlotStart)) {
            showError("Giờ kết thúc phải lớn hơn giờ bắt đầu")
            return
        }

        const payload = {
            startTime: `0.${newSlotStart}:00`,
            endTime: `0.${newSlotEnd}:00`,
        }

        try {
            console.log("createTimeSlot payload:", payload)

            await adminService.createTimeSlot(payload)

            showSuccess("Đã tạo khung giờ")
            void fetchAll()
        } catch (error: any) {
            console.error("createTimeSlot lỗi:", error?.response?.data || error)

            showError(
                error?.response?.data?.message ||
                error?.response?.data?.errors?.[0] ||
                "Tạo khung giờ thất bại"
            )
        }
    }

    const handleDeleteTimeSlot = async (timeSlotId: string) => {
        try {
            await adminService.deleteTimeSlot(timeSlotId)
            showSuccess("Đã xóa khung giờ")
            void fetchAll()
        } catch (error: any) {
            showError(error?.response?.data?.message || "Xóa khung giờ thất bại")
        }
    }

    const handleCreateCollectionPoint = async () => {
        if (
            !newCollectionName.trim() ||
            !newCollectionAddress.trim() ||
            newCollectionLat.trim() === "" ||
            newCollectionLng.trim() === ""
        ) {
            showError("Vui lòng nhập đủ tên, địa chỉ, vĩ độ và kinh độ")
            return
        }

        try {
            await adminService.createCollectionPoint({
                name: newCollectionName.trim(),
                addressLine: newCollectionAddress.trim(),
                latitude: Number(newCollectionLat),
                longitude: Number(newCollectionLng),
            })

            showSuccess("Đã tạo điểm tập kết")
            setNewCollectionName("")
            setNewCollectionAddress("")
            setNewCollectionLat("")
            setNewCollectionLng("")
            void fetchAll()
        } catch (error: any) {
            showError(error?.response?.data?.message || "Tạo điểm tập kết thất bại")
        }
    }

    const handleDeleteCollectionPoint = async (collectionId: string) => {
        try {
            await adminService.deleteCollectionPoint(collectionId)
            showSuccess("Đã xóa điểm tập kết")
            void fetchAll()
        } catch (error: any) {
            showError(error?.response?.data?.message || "Xóa điểm tập kết thất bại")
        }
    }

    const handleUpdateParameter = async (configKey: string, configValue: string) => {
        try {
            await adminService.updateSystemParameter(configKey, { configValue })
            showSuccess("Đã cập nhật tham số")
            void fetchAll()
        } catch (error: any) {
            showError(error?.response?.data?.message || "Cập nhật tham số thất bại")
        }
    }

    const handleCreateUnit = async () => {
        if (!newUnit.name.trim() || !newUnit.type.trim() || !newUnit.symbol.trim()) {
            showError("Vui lòng nhập đủ thông tin đơn vị")
            return
        }

        try {
            await adminService.createUnit({
                name: newUnit.name.trim(),
                type: newUnit.type.trim(),
                symbol: newUnit.symbol.trim(),
            })
            showSuccess("Đã tạo đơn vị")
            setNewUnit({ name: "", type: "", symbol: "" })
            void fetchAll()
        } catch (error: any) {
            showError(error?.response?.data?.message || "Tạo đơn vị thất bại")
        }
    }

    const handleDeleteUnit = async (unitId: string) => {
        try {
            await adminService.deleteUnit(unitId)
            showSuccess("Đã xóa đơn vị")
            void fetchAll()
        } catch (error: any) {
            showError(error?.response?.data?.message || "Xóa đơn vị thất bại")
        }
    }

    const handleCreatePromotion = async () => {
        if (
            !newPromotion.code.trim() ||
            !newPromotion.categoryId.trim() ||
            !newPromotion.name.trim() ||
            !newPromotion.startDate ||
            !newPromotion.endDate
        ) {
            showError("Vui lòng nhập đủ thông tin khuyến mãi")
            return
        }

        try {
            await adminService.createPromotion(newPromotion)
            showSuccess("Đã tạo khuyến mãi")

            setNewPromotion({
                code: "",
                categoryId: "",
                name: "",
                discountType: "Percentage",
                discountValue: 0,
                minOrderAmount: 0,
                maxDiscountAmount: 0,
                maxUsage: 0,
                perUserLimit: 0,
                startDate: "",
                endDate: "",
                status: "Draft",
            })

            void fetchAll()
        } catch (error: any) {
            showError(error?.response?.data?.message || "Tạo khuyến mãi thất bại")
        }
    }

    const handleUpdatePromotionStatus = async (
        promotionId: string,
        status: string
    ) => {
        try {
            await adminService.updatePromotionStatus(promotionId, status)
            showSuccess("Đã cập nhật trạng thái khuyến mãi")
            void fetchAll()
        } catch (error: any) {
            showError(
                error?.response?.data?.message || "Cập nhật trạng thái khuyến mãi thất bại"
            )
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Thiết lập quản trị</p>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Cấu hình hệ thống
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Đang xem: {activeTabLabel}
                        </p>
                    </div>

                    <button
                        onClick={() => void fetchAll()}
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
                                            <th className="px-4 py-3 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeSlots.map((item) => (
                                            <tr key={item.timeSlotId} className="border-t border-slate-200">
                                                <td className="px-4 py-3">
                                                    {hhmmFromTimeValue(item.startTime)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {hhmmFromTimeValue(item.endTime)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => void handleDeleteTimeSlot(item.timeSlotId)}
                                                        className="rounded-xl border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50"
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && timeSlots.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                                                    Chưa có khung giờ nào.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === "collectionPoints" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Điểm tập kết</h2>
                                <p className="text-sm text-slate-500">
                                    Quản lý các địa điểm nhận hàng và lấy hàng
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                                <input
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder="Tên điểm tập kết"
                                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                                />

                                <input
                                    value={newCollectionAddress}
                                    onChange={(e) => setNewCollectionAddress(e.target.value)}
                                    placeholder="Địa chỉ"
                                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                                />

                                <input
                                    type="number"
                                    step="any"
                                    value={newCollectionLat}
                                    onChange={(e) => setNewCollectionLat(e.target.value)}
                                    placeholder="Vĩ độ"
                                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                                />

                                <input
                                    type="number"
                                    step="any"
                                    value={newCollectionLng}
                                    onChange={(e) => setNewCollectionLng(e.target.value)}
                                    placeholder="Kinh độ"
                                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                                />

                                <button
                                    onClick={() => void handleCreateCollectionPoint()}
                                    className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                                >
                                    Tạo điểm tập kết
                                </button>
                            </div>

                            <div className="space-y-3">
                                {collectionPoints.map((item) => (
                                    <div
                                        key={item.collectionId}
                                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                                    >
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.name}</p>
                                            <p className="text-sm text-slate-500">{item.addressLine}</p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Vĩ độ: {item.latitude} · Kinh độ: {item.longitude}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => void handleDeleteCollectionPoint(item.collectionId)}
                                            className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}

                                {!loading && collectionPoints.length === 0 && (
                                    <p className="text-sm text-slate-500">Chưa có điểm tập kết nào.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "parameters" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Tham số hệ thống</h2>
                                <p className="text-sm text-slate-500">
                                    Chỉnh sửa giá trị cấu hình theo từng mã tham số
                                </p>
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
                                    <p className="text-sm text-slate-500">Chưa có tham số nào.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "units" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Đơn vị tính</h2>
                                <p className="text-sm text-slate-500">
                                    Quản lý tên đơn vị, nhóm đơn vị và ký hiệu hiển thị
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <input
                                    value={newUnit.name}
                                    onChange={(e) =>
                                        setNewUnit((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="Tên đơn vị"
                                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                                />
                                <input
                                    value={newUnit.type}
                                    onChange={(e) =>
                                        setNewUnit((prev) => ({ ...prev, type: e.target.value }))
                                    }
                                    placeholder="Nhóm đơn vị"
                                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                                />
                                <input
                                    value={newUnit.symbol}
                                    onChange={(e) =>
                                        setNewUnit((prev) => ({ ...prev, symbol: e.target.value }))
                                    }
                                    placeholder="Ký hiệu"
                                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                                />
                                <button
                                    onClick={() => void handleCreateUnit()}
                                    className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                                >
                                    Tạo đơn vị
                                </button>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Tên</th>
                                            <th className="px-4 py-3 text-left">Nhóm</th>
                                            <th className="px-4 py-3 text-left">Ký hiệu</th>
                                            <th className="px-4 py-3 text-left">Cập nhật</th>
                                            <th className="px-4 py-3 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {units.map((item) => (
                                            <tr key={item.unitId} className="border-t border-slate-200">
                                                <td className="px-4 py-3">{item.name}</td>
                                                <td className="px-4 py-3">{item.type}</td>
                                                <td className="px-4 py-3">{item.symbol}</td>
                                                <td className="px-4 py-3">{formatDateTime(item.updatedAt)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => void handleDeleteUnit(item.unitId)}
                                                        className="rounded-xl border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50"
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && units.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                                                    Chưa có đơn vị nào.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === "promotions" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Khuyến mãi</h2>
                                <p className="text-sm text-slate-500">
                                    Tạo và quản lý các chương trình ưu đãi
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
                                <div className="mb-4">
                                    <h3 className="text-base font-semibold text-slate-900">
                                        Tạo chương trình khuyến mãi mới
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Nhập đầy đủ thông tin để khởi tạo chương trình
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <input
                                        value={newPromotion.code}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                code: e.target.value,
                                            }))
                                        }
                                        placeholder="Mã khuyến mãi"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        value={newPromotion.categoryId}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                categoryId: e.target.value,
                                            }))
                                        }
                                        placeholder="Mã danh mục"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        value={newPromotion.name}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="Tên chương trình"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <select
                                        value={newPromotion.discountType}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                discountType: e.target.value,
                                            }))
                                        }
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    >
                                        <option value="Percentage">Giảm theo phần trăm</option>
                                        <option value="FixedAmount">Giảm số tiền cố định</option>
                                    </select>

                                    <input
                                        type="number"
                                        value={newPromotion.discountValue}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                discountValue: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Giá trị giảm"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="number"
                                        value={newPromotion.minOrderAmount}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                minOrderAmount: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Giá trị đơn tối thiểu"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="number"
                                        value={newPromotion.maxDiscountAmount}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                maxDiscountAmount: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Mức giảm tối đa"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="number"
                                        value={newPromotion.maxUsage}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                maxUsage: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Tổng số lượt sử dụng"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="number"
                                        value={newPromotion.perUserLimit}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                perUserLimit: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Số lần dùng tối đa mỗi người"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="datetime-local"
                                        value={newPromotion.startDate}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                startDate: e.target.value,
                                            }))
                                        }
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="datetime-local"
                                        value={newPromotion.endDate}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                endDate: e.target.value,
                                            }))
                                        }
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <select
                                        value={newPromotion.status}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                status: e.target.value,
                                            }))
                                        }
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    >
                                        <option value="Draft">Bản nháp</option>
                                        <option value="Active">Đang áp dụng</option>
                                        <option value="Expired">Đã hết hạn</option>
                                        <option value="Disabled">Đã tắt</option>
                                    </select>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => void handleCreatePromotion()}
                                        className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        Tạo khuyến mãi
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {promotions.map((item) => (
                                    <div
                                        key={item.promotionId}
                                        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-base font-semibold text-slate-900">
                                                        {item.name}
                                                    </p>
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${getPromotionStatusClass(
                                                            item.status
                                                        )}`}
                                                    >
                                                        {getPromotionStatusLabel(item.status)}
                                                    </span>
                                                </div>

                                                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-500 md:grid-cols-2">
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Mã khuyến mãi:
                                                        </span>{" "}
                                                        {item.code}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Mã danh mục:
                                                        </span>{" "}
                                                        {item.categoryId}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Hình thức giảm:
                                                        </span>{" "}
                                                        {getDiscountTypeLabel(item.discountType)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Giá trị giảm:
                                                        </span>{" "}
                                                        {item.discountType === "FixedAmount"
                                                            ? formatMoney(item.discountValue)
                                                            : `${formatNumber(item.discountValue)}%`}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Giá trị đơn tối thiểu:
                                                        </span>{" "}
                                                        {formatMoney(item.minOrderAmount)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Mức giảm tối đa:
                                                        </span>{" "}
                                                        {formatMoney(item.maxDiscountAmount)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Tổng số lượt sử dụng:
                                                        </span>{" "}
                                                        {formatNumber(item.maxUsage)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Đã sử dụng:
                                                        </span>{" "}
                                                        {formatNumber(item.usedCount)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Mỗi người được dùng:
                                                        </span>{" "}
                                                        {formatNumber(item.perUserLimit)} lần
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Thời gian áp dụng:
                                                        </span>{" "}
                                                        {formatDateTime(item.startDate)} →{" "}
                                                        {formatDateTime(item.endDate)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={item.status}
                                                    onChange={(e) =>
                                                        void handleUpdatePromotionStatus(
                                                            item.promotionId,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                                                >
                                                    <option value="Draft">Bản nháp</option>
                                                    <option value="Active">Đang áp dụng</option>
                                                    <option value="Expired">Đã hết hạn</option>
                                                    <option value="Disabled">Đã tắt</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {!loading && promotions.length === 0 && (
                                    <p className="text-sm text-slate-500">Chưa có khuyến mãi nào.</p>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

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

    useEffect(() => {
        setValue(configValue)
    }, [configValue])

    return (
        <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{configKey}</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Cập nhật: {formatDateTime(updatedAt)}
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2 lg:w-[520px] lg:flex-row">
                    <input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                    />
                    <button
                        onClick={() => void onSave(configKey, value)}
                        className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AdminSettings
