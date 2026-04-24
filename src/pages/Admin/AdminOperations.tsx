import { useMemo, useState } from "react"
import type { ComponentType, ReactNode } from "react"
import {
    AlertTriangle,
    Building2,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    MapPin,
    PackageCheck,
    RefreshCcw,
    Search,
    ShoppingBag,
    Store,
    UserRound,
    Users,
    X,
} from "lucide-react"

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
})

const formatNumber = (value?: number) => {
    return new Intl.NumberFormat("vi-VN").format(value ?? 0)
}

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type AssignmentStatus = "unassigned" | "assigned" | "overloaded"
type StaffAvailability = "ready" | "busy" | "off"
type ShiftKey = "morning" | "afternoon" | "evening"

type PackagingSupermarketRow = {
    supermarketId: string
    supermarketName: string
    area: string
    address: string
    pendingOrders: number
    peakSlot: string
    assignmentStatus: AssignmentStatus
    assignedStaffId?: string
    assignedStaffName?: string
    note?: string
    priority: "normal" | "high"
}

type PackagingStaffRow = {
    staffId: string
    staffName: string
    phone: string
    email: string
    area: string
    availability: StaffAvailability
    completedShiftsThisWeek: number
    activeSupermarketId?: string
    activeSupermarketName?: string
}

type PackagingAssignmentRow = {
    assignmentId: string
    supermarketId: string
    supermarketName: string
    staffId: string
    staffName: string
    shift: ShiftKey
    shiftLabel: string
    date: string
    status: "working" | "upcoming" | "done"
    note?: string
}

const SHIFT_OPTIONS: Array<{
    value: ShiftKey
    label: string
    time: string
}> = [
        { value: "morning", label: "Ca sáng", time: "08:00 - 12:00" },
        { value: "afternoon", label: "Ca chiều", time: "13:00 - 17:00" },
        { value: "evening", label: "Ca tối", time: "17:00 - 21:00" },
    ]

const MOCK_SUPERMARKETS: PackagingSupermarketRow[] = [
    {
        supermarketId: "sm-01",
        supermarketName: "Bách Hóa Xanh Bình Thạnh",
        area: "Bình Thạnh",
        address: "125 Xô Viết Nghệ Tĩnh, Bình Thạnh",
        pendingOrders: 31,
        peakSlot: "15:00 - 19:00",
        assignmentStatus: "overloaded",
        assignedStaffId: "ps-03",
        assignedStaffName: "Lê Hoàng Phúc",
        priority: "high",
        note: "Đơn tăng mạnh cuối ngày",
    },
    {
        supermarketId: "sm-02",
        supermarketName: "Co.opmart Quận 3",
        area: "Quận 3",
        address: "12 Nguyễn Đình Chiểu, Quận 3",
        pendingOrders: 24,
        peakSlot: "16:00 - 18:00",
        assignmentStatus: "assigned",
        assignedStaffId: "ps-01",
        assignedStaffName: "Nguyễn Minh Anh",
        priority: "normal",
    },
    {
        supermarketId: "sm-03",
        supermarketName: "WinMart Phú Nhuận",
        area: "Phú Nhuận",
        address: "88 Phan Xích Long, Phú Nhuận",
        pendingOrders: 18,
        peakSlot: "14:00 - 17:00",
        assignmentStatus: "assigned",
        assignedStaffId: "ps-02",
        assignedStaffName: "Phạm Thu Hà",
        priority: "normal",
    },
    {
        supermarketId: "sm-04",
        supermarketName: "AEON Mini Gò Vấp",
        area: "Gò Vấp",
        address: "15 Quang Trung, Gò Vấp",
        pendingOrders: 12,
        peakSlot: "10:00 - 12:00",
        assignmentStatus: "unassigned",
        priority: "normal",
    },
    {
        supermarketId: "sm-05",
        supermarketName: "Lotte Mart Tân Bình",
        area: "Tân Bình",
        address: "201 Cộng Hòa, Tân Bình",
        pendingOrders: 16,
        peakSlot: "13:00 - 16:00",
        assignmentStatus: "assigned",
        assignedStaffId: "ps-05",
        assignedStaffName: "Trần Quốc Bảo",
        priority: "normal",
    },
    {
        supermarketId: "sm-06",
        supermarketName: "GO! An Lạc",
        area: "Bình Tân",
        address: "9 Kinh Dương Vương, Bình Tân",
        pendingOrders: 22,
        peakSlot: "15:00 - 18:00",
        assignmentStatus: "overloaded",
        priority: "high",
    },
    {
        supermarketId: "sm-07",
        supermarketName: "Emart Sala",
        area: "Thủ Đức",
        address: "2 Mai Chí Thọ, Thủ Đức",
        pendingOrders: 9,
        peakSlot: "11:00 - 13:00",
        assignmentStatus: "unassigned",
        priority: "normal",
    },
    {
        supermarketId: "sm-08",
        supermarketName: "Co.opXtra Linh Trung",
        area: "Thủ Đức",
        address: "28 Hoàng Diệu 2, Thủ Đức",
        pendingOrders: 17,
        peakSlot: "16:00 - 19:00",
        assignmentStatus: "assigned",
        assignedStaffId: "ps-06",
        assignedStaffName: "Võ Khánh Linh",
        priority: "normal",
    },
]

const MOCK_STAFFS: PackagingStaffRow[] = [
    {
        staffId: "ps-01",
        staffName: "Nguyễn Minh Anh",
        phone: "0901234561",
        email: "minhanh@closeexp.ai",
        area: "Quận 3",
        availability: "ready",
        completedShiftsThisWeek: 14,
    },
    {
        staffId: "ps-02",
        staffName: "Phạm Thu Hà",
        phone: "0901234562",
        email: "thuhap@closeexp.ai",
        area: "Phú Nhuận",
        availability: "ready",
        completedShiftsThisWeek: 12,
    },
    {
        staffId: "ps-03",
        staffName: "Lê Hoàng Phúc",
        phone: "0901234563",
        email: "phuclh@closeexp.ai",
        area: "Bình Thạnh",
        availability: "busy",
        completedShiftsThisWeek: 16,
        activeSupermarketId: "sm-02",
        activeSupermarketName: "Co.opmart Quận 3",
    },
    {
        staffId: "ps-04",
        staffName: "Trần Gia Hân",
        phone: "0901234564",
        email: "giahan@closeexp.ai",
        area: "Bình Thạnh",
        availability: "ready",
        completedShiftsThisWeek: 11,
    },
    {
        staffId: "ps-05",
        staffName: "Trần Quốc Bảo",
        phone: "0901234565",
        email: "quocbao@closeexp.ai",
        area: "Tân Bình",
        availability: "busy",
        completedShiftsThisWeek: 15,
        activeSupermarketId: "sm-05",
        activeSupermarketName: "Lotte Mart Tân Bình",
    },
    {
        staffId: "ps-06",
        staffName: "Võ Khánh Linh",
        phone: "0901234566",
        email: "khanhlinh@closeexp.ai",
        area: "Thủ Đức",
        availability: "off",
        completedShiftsThisWeek: 9,
    },
    {
        staffId: "ps-07",
        staffName: "Bùi Hải Nam",
        phone: "0901234567",
        email: "hainam@closeexp.ai",
        area: "Bình Tân",
        availability: "ready",
        completedShiftsThisWeek: 10,
    },
]

const MOCK_ASSIGNMENTS: PackagingAssignmentRow[] = [
    {
        assignmentId: "as-01",
        supermarketId: "sm-02",
        supermarketName: "Co.opmart Quận 3",
        staffId: "ps-01",
        staffName: "Nguyễn Minh Anh",
        shift: "morning",
        shiftLabel: "Ca sáng 08:00 - 12:00",
        date: "2026-04-23",
        status: "working",
    },
    {
        assignmentId: "as-02",
        supermarketId: "sm-03",
        supermarketName: "WinMart Phú Nhuận",
        staffId: "ps-02",
        staffName: "Phạm Thu Hà",
        shift: "afternoon",
        shiftLabel: "Ca chiều 13:00 - 17:00",
        date: "2026-04-23",
        status: "upcoming",
    },
    {
        assignmentId: "as-03",
        supermarketId: "sm-05",
        supermarketName: "Lotte Mart Tân Bình",
        staffId: "ps-05",
        staffName: "Trần Quốc Bảo",
        shift: "morning",
        shiftLabel: "Ca sáng 08:00 - 12:00",
        date: "2026-04-23",
        status: "done",
    },
]

const StatCard = ({
    title,
    value,
    hint,
    icon: Icon,
}: {
    title: string
    value: string | number
    hint: string
    icon: ComponentType<{ className?: string }>
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

const SectionCard = ({
    title,
    description,
    children,
    right,
}: {
    title: string
    description?: string
    children: ReactNode
    right?: ReactNode
}) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    ) : null}
                </div>
                {right}
            </div>

            {children}
        </div>
    )
}

const getAssignmentStatusMeta = (status: AssignmentStatus) => {
    switch (status) {
        case "assigned":
            return {
                label: "Đã gán 1 NV",
                className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
            }
        case "overloaded":
            return {
                label: "Thiếu nhân lực",
                className: "border border-amber-200 bg-amber-50 text-amber-700",
            }
        default:
            return {
                label: "Chưa phân công",
                className: "border border-slate-200 bg-slate-100 text-slate-700",
            }
    }
}

const getAvailabilityMeta = (status: StaffAvailability) => {
    switch (status) {
        case "ready":
            return {
                label: "Sẵn sàng",
                dot: "bg-emerald-500",
                text: "text-emerald-700",
            }
        case "busy":
            return {
                label: "Đang bận",
                dot: "bg-amber-500",
                text: "text-amber-700",
            }
        default:
            return {
                label: "Ngoài ca",
                dot: "bg-slate-400",
                text: "text-slate-600",
            }
    }
}

const getCurrentAssignmentStatusMeta = (
    status: PackagingAssignmentRow["status"]
) => {
    switch (status) {
        case "working":
            return {
                label: "Đang làm",
                className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
            }
        case "upcoming":
            return {
                label: "Sắp bắt đầu",
                className: "border border-amber-200 bg-amber-50 text-amber-700",
            }
        default:
            return {
                label: "Hoàn tất ca",
                className: "border border-sky-200 bg-sky-50 text-sky-700",
            }
    }
}

const AdminOperations = () => {
    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [selectedArea, setSelectedArea] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState<"all" | AssignmentStatus>("all")
    const [selectedShift, setSelectedShift] = useState<ShiftKey>("afternoon")
    const [selectedSupermarketId, setSelectedSupermarketId] = useState<string>(
        "sm-01"
    )
    const [selectedStaffId, setSelectedStaffId] = useState<string>("ps-04")
    const [note, setNote] = useState("")
    const [drawerOpen, setDrawerOpen] = useState(true)

    const supermarkets = MOCK_SUPERMARKETS
    const staffs = MOCK_STAFFS
    const assignments = MOCK_ASSIGNMENTS

    const areaOptions = useMemo(() => {
        return Array.from(new Set(supermarkets.map((item) => item.area)))
    }, [supermarkets])

    const filteredSupermarkets = useMemo(() => {
        const normalized = keyword.trim().toLowerCase()

        return supermarkets.filter((item) => {
            const matchKeyword = !normalized
                ? true
                : [
                    item.supermarketName,
                    item.area,
                    item.address,
                    item.assignedStaffName,
                    item.peakSlot,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(normalized)
                    )

            const matchArea =
                selectedArea === "all" ? true : item.area === selectedArea

            const matchStatus =
                selectedStatus === "all"
                    ? true
                    : item.assignmentStatus === selectedStatus

            return matchKeyword && matchArea && matchStatus
        })
    }, [supermarkets, keyword, selectedArea, selectedStatus])

    const selectedSupermarket =
        supermarkets.find((item) => item.supermarketId === selectedSupermarketId) ??
        filteredSupermarkets[0] ??
        supermarkets[0]

    const candidateStaffs = useMemo(() => {
        if (!selectedSupermarket) return []

        return [...staffs].sort((a, b) => {
            const aReady = a.availability === "ready" ? 1 : 0
            const bReady = b.availability === "ready" ? 1 : 0

            if (aReady !== bReady) return bReady - aReady

            const aArea = a.area === selectedSupermarket.area ? 1 : 0
            const bArea = b.area === selectedSupermarket.area ? 1 : 0

            if (aArea !== bArea) return bArea - aArea

            return a.completedShiftsThisWeek - b.completedShiftsThisWeek
        })
    }, [staffs, selectedSupermarket])

    const selectedStaff =
        staffs.find((item) => item.staffId === selectedStaffId) ?? candidateStaffs[0]

    const stats = useMemo(() => {
        const supermarketsNeedAssignment = supermarkets.filter(
            (item) => item.assignmentStatus !== "assigned"
        ).length

        const readyStaffs = staffs.filter(
            (item) => item.availability === "ready"
        ).length

        const assignedToday = assignments.length

        const overloaded = supermarkets.filter(
            (item) => item.assignmentStatus === "overloaded"
        ).length

        return {
            supermarketsNeedAssignment,
            readyStaffs,
            assignedToday,
            overloaded,
        }
    }, [supermarkets, staffs, assignments])

    const totalPendingOrders = useMemo(() => {
        return filteredSupermarkets.reduce(
            (sum, item) => sum + (item.pendingOrders ?? 0),
            0
        )
    }, [filteredSupermarkets])

    const selectedShiftMeta =
        SHIFT_OPTIONS.find((item) => item.value === selectedShift) ?? SHIFT_OPTIONS[1]

    const handleApplySearch = () => {
        setKeyword(search.trim())
    }

    const handlePickSupermarket = (supermarketId: string) => {
        setSelectedSupermarketId(supermarketId)
        setDrawerOpen(true)

        const suggested = candidateStaffs.find((item) => item.availability === "ready")
        if (suggested) {
            setSelectedStaffId(suggested.staffId)
        }
    }

    const handleQuickAssign = (supermarketId: string, staffId: string) => {
        setSelectedSupermarketId(supermarketId)
        setSelectedStaffId(staffId)
        setDrawerOpen(true)
    }

    const handleResetFilter = () => {
        setSearch("")
        setKeyword("")
        setSelectedArea("all")
        setSelectedStatus("all")
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Điều phối đóng gói
                    </h1>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-[280px]">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm siêu thị, khu vực, nhân viên..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleApplySearch}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Tìm kiếm
                    </button>

                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Tạo phân công
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Siêu thị cần phân công"
                    value={stats.supermarketsNeedAssignment}
                    hint="Những điểm đang thiếu hoặc chưa có nhân sự phụ trách"
                    icon={Store}
                />
                <StatCard
                    title="Nhân viên sẵn sàng"
                    value={stats.readyStaffs}
                    hint="Số nhân viên có thể nhận ca mới ngay lúc này"
                    icon={Users}
                />
                <StatCard
                    title="Đã phân công hôm nay"
                    value={stats.assignedToday}
                    hint="Tổng phân công hiện hiển thị trong bảng theo dõi"
                    icon={ClipboardList}
                />
                <StatCard
                    title="Cảnh báo quá tải"
                    value={stats.overloaded}
                    hint="Siêu thị có lượng đơn cao hoặc thiếu người xử lý"
                    icon={AlertTriangle}
                />
            </div>

            <SectionCard
                title="Bộ lọc điều phối"
                description="Lọc danh sách siêu thị cần điều phối đóng gói."
                right={
                    <button
                        type="button"
                        onClick={handleResetFilter}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Đặt lại
                    </button>
                }
            >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Khu vực
                        </p>
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                        >
                            <option value="all">Tất cả</option>
                            {areaOptions.map((area) => (
                                <option key={area} value={area}>
                                    {area}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Trạng thái
                        </p>
                        <select
                            value={selectedStatus}
                            onChange={(e) =>
                                setSelectedStatus(
                                    e.target.value as "all" | AssignmentStatus
                                )
                            }
                            className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                        >
                            <option value="all">Tất cả</option>
                            <option value="unassigned">Chưa phân công</option>
                            <option value="assigned">Đã gán 1 NV</option>
                            <option value="overloaded">Thiếu nhân lực</option>
                        </select>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Tổng siêu thị hiển thị
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatNumber(filteredSupermarkets.length)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Đơn chờ đóng gói
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatNumber(totalPendingOrders)} đơn
                        </p>
                    </div>
                </div>
            </SectionCard>

            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
                <SectionCard
                    title="Siêu thị cần điều phối"
                    description="Chọn một siêu thị để mở panel phân công bên phải."
                >
                    {filteredSupermarkets.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                            Không có siêu thị phù hợp với bộ lọc hiện tại.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredSupermarkets.map((item) => {
                                const statusMeta = getAssignmentStatusMeta(
                                    item.assignmentStatus
                                )
                                const isSelected =
                                    selectedSupermarket?.supermarketId ===
                                    item.supermarketId

                                return (
                                    <button
                                        key={item.supermarketId}
                                        type="button"
                                        onClick={() =>
                                            handlePickSupermarket(item.supermarketId)
                                        }
                                        className={cn(
                                            "w-full rounded-3xl border p-4 text-left transition",
                                            isSelected
                                                ? "border-slate-900 bg-slate-50"
                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="rounded-2xl bg-slate-100 p-2">
                                                        <Building2 className="h-4 w-4 text-slate-700" />
                                                    </div>

                                                    <div>
                                                        <p className="text-base font-semibold text-slate-900">
                                                            {item.supermarketName}
                                                        </p>
                                                        <p className="mt-0.5 text-sm text-slate-500">
                                                            {item.address}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={cn(
                                                            "ml-auto inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                                            statusMeta.className
                                                        )}
                                                    >
                                                        {statusMeta.label}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-5">
                                                    <p>
                                                        <span className="font-medium text-slate-900">
                                                            Khu vực:
                                                        </span>{" "}
                                                        {item.area}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-900">
                                                            Đơn chờ:
                                                        </span>{" "}
                                                        {formatNumber(item.pendingOrders)} đơn
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-900">
                                                            Khung giờ cao điểm:
                                                        </span>{" "}
                                                        {item.peakSlot}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-900">
                                                            Nhân sự hiện tại:
                                                        </span>{" "}
                                                        {item.assignedStaffName || "--"}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-900">
                                                            Mức ưu tiên:
                                                        </span>{" "}
                                                        {item.priority === "high"
                                                            ? "Cao"
                                                            : "Bình thường"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                                                {item.assignmentStatus === "assigned"
                                                    ? "Xem chi tiết"
                                                    : "Phân công"}
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </SectionCard>

                <div className="space-y-6">
                    <SectionCard
                        title="Gợi ý phân công"
                        description="Ưu tiên nhân viên sẵn sàng và gần khu vực của siêu thị."
                    >
                        {selectedSupermarket ? (
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-2xl bg-white p-3 shadow-sm">
                                            <Store className="h-5 w-5 text-slate-700" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-bold text-slate-900">
                                                    {selectedSupermarket.supermarketName}
                                                </h3>

                                                {selectedSupermarket.priority === "high" ? (
                                                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                                                        Ưu tiên cao
                                                    </span>
                                                ) : null}
                                            </div>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {selectedSupermarket.address}
                                            </p>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                                    {formatNumber(
                                                        selectedSupermarket.pendingOrders
                                                    )}{" "}
                                                    đơn chờ
                                                </span>
                                                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                                    Peak: {selectedSupermarket.peakSlot}
                                                </span>
                                                <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                                    1 siêu thị / 1 nhân viên
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {candidateStaffs.slice(0, 4).map((staff) => {
                                        const availabilityMeta = getAvailabilityMeta(
                                            staff.availability
                                        )
                                        const isDisabled =
                                            staff.availability !== "ready"
                                        const nearby =
                                            selectedSupermarket.area === staff.area

                                        return (
                                            <div
                                                key={staff.staffId}
                                                className="rounded-3xl border border-slate-200 bg-white p-4"
                                            >
                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                                                <UserRound className="h-5 w-5 text-slate-700" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {staff.staffName}
                                                                </p>
                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    {nearby
                                                                        ? `Gần khu vực ${staff.area}`
                                                                        : `Khu vực phụ trách: ${staff.area}`}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Đã xử lý{" "}
                                                                    {
                                                                        staff.completedShiftsThisWeek
                                                                    }{" "}
                                                                    ca tuần này
                                                                </p>
                                                                {staff.activeSupermarketName ? (
                                                                    <p className="mt-1 text-xs text-amber-600">
                                                                        Đang phụ trách{" "}
                                                                        {staff.activeSupermarketName}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-start gap-3 md:items-end">
                                                        <div
                                                            className={cn(
                                                                "inline-flex items-center gap-2 text-sm font-semibold",
                                                                availabilityMeta.text
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "h-2.5 w-2.5 rounded-full",
                                                                    availabilityMeta.dot
                                                                )}
                                                            />
                                                            {availabilityMeta.label}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() =>
                                                                handleQuickAssign(
                                                                    selectedSupermarket.supermarketId,
                                                                    staff.staffId
                                                                )
                                                            }
                                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Phân công
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                Hãy chọn một siêu thị để xem gợi ý phân công.
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Phân công hiện tại"
                        description="Danh sách các phân công đang hiển thị trong giao diện mock."
                    >
                        <div className="space-y-3">
                            {assignments.map((assignment) => {
                                const statusMeta = getCurrentAssignmentStatusMeta(
                                    assignment.status
                                )

                                return (
                                    <div
                                        key={assignment.assignmentId}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                    >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {assignment.staffName} →{" "}
                                                    {assignment.supermarketName}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {assignment.shiftLabel} • {assignment.date}
                                                </p>
                                            </div>

                                            <span
                                                className={cn(
                                                    "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
                                                    statusMeta.className
                                                )}
                                            >
                                                {statusMeta.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </SectionCard>
                </div>
            </div>

            {drawerOpen && selectedSupermarket ? (
                <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/20 backdrop-blur-[1px]">
                    <div className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Tạo phân công đóng gói
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Chọn siêu thị và gán 1 nhân viên đóng gói cho 1 ca
                                        làm việc.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 px-6 py-6">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                                        <Store className="h-5 w-5 text-slate-700" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {selectedSupermarket.supermarketName}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {selectedSupermarket.address}
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                                <MapPin className="mr-1 h-3.5 w-3.5" />
                                                {selectedSupermarket.area}
                                            </span>
                                            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                                <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                                                {formatNumber(selectedSupermarket.pendingOrders)} đơn
                                                chờ
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-900">
                                        Siêu thị
                                    </label>
                                    <select
                                        value={selectedSupermarketId}
                                        onChange={(e) =>
                                            setSelectedSupermarketId(e.target.value)
                                        }
                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                    >
                                        {supermarkets.map((item) => (
                                            <option
                                                key={item.supermarketId}
                                                value={item.supermarketId}
                                            >
                                                {item.supermarketName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-900">
                                        Nhân viên đóng gói
                                    </label>
                                    <select
                                        value={selectedStaffId}
                                        onChange={(e) => setSelectedStaffId(e.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                    >
                                        {candidateStaffs.map((item) => {
                                            const meta = getAvailabilityMeta(
                                                item.availability
                                            )
                                            return (
                                                <option
                                                    key={item.staffId}
                                                    value={item.staffId}
                                                >
                                                    {item.staffName} • {meta.label} • {item.area}
                                                </option>
                                            )
                                        })}
                                    </select>

                                    {selectedStaff ? (
                                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                                                    <UserRound className="h-5 w-5 text-slate-700" />
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {selectedStaff.staffName}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {selectedStaff.email} •{" "}
                                                        {selectedStaff.phone}
                                                    </p>
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Khu vực: {selectedStaff.area} • Đã xử lý{" "}
                                                        {selectedStaff.completedShiftsThisWeek} ca
                                                        tuần này
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-900">
                                        Ca làm việc
                                    </label>
                                    <select
                                        value={selectedShift}
                                        onChange={(e) =>
                                            setSelectedShift(e.target.value as ShiftKey)
                                        }
                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                    >
                                        {SHIFT_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label} • {item.time}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                        <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                                        {selectedShiftMeta.label} • {selectedShiftMeta.time}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-900">
                                        Ghi chú
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value.slice(0, 200))}
                                        placeholder="Nhập ghi chú cho điều phối này..."
                                        className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                    />
                                    <div className="mt-2 text-right text-xs text-slate-400">
                                        {note.length}/200
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                                <p className="font-semibold">
                                    Quy tắc điều phối mock
                                </p>
                                <p className="mt-1">
                                    Mỗi nhân viên chỉ phụ trách <strong>1 siêu thị</strong> trong
                                    cùng một <strong>ca làm việc</strong>.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Tóm tắt phân công
                                </p>
                                <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p>
                                        <span className="font-medium text-slate-900">
                                            Siêu thị:
                                        </span>{" "}
                                        {selectedSupermarket.supermarketName}
                                    </p>
                                    <p>
                                        <span className="font-medium text-slate-900">
                                            Nhân viên:
                                        </span>{" "}
                                        {selectedStaff?.staffName || "--"}
                                    </p>
                                    <p>
                                        <span className="font-medium text-slate-900">
                                            Ca:
                                        </span>{" "}
                                        {selectedShiftMeta.label} • {selectedShiftMeta.time}
                                    </p>
                                    <p>
                                        <span className="font-medium text-slate-900">
                                            Ước tính tải:
                                        </span>{" "}
                                        {currency.format(
                                            (selectedSupermarket.pendingOrders || 0) * 75000
                                        )}{" "}
                                        giá trị đơn chờ
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    <PackageCheck className="h-4 w-4" />
                                    Xác nhận phân công
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default AdminOperations
