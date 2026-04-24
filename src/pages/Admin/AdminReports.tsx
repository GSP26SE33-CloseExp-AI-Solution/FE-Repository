import { useMemo, useState } from "react"
import {
  CalendarRange,
  Download,
  FileSpreadsheet,
  FileText,
  PackageSearch,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Truck,
  Users,
} from "lucide-react"
import * as XLSX from "xlsx"

import { adminService } from "@/services/admin.service"
import type {
  AdminOrder,
  AdminSupermarketItem,
  AdminUser,
  DeliveryStaffBoardItem,
  RevenueTrendItem,
  SlaAlertItem,
} from "@/types/admin.type"
import { showError, showSuccess } from "@/utils/toast"

type ReportTab = "quick" | "custom"
type ExportFormat = "excel" | "csv"

type QuickReportType =
  | "revenue"
  | "orders"
  | "delivery"
  | "sla"
  | "users"
  | "supermarkets"

type SheetKey =
  | "summary"
  | "revenue"
  | "orders"
  | "delivery"
  | "sla"
  | "users"
  | "supermarkets"

type CellValue = string | number | boolean | null
type SheetRow = Record<string, CellValue>

type SheetDefinition = {
  key: SheetKey
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  columns: string[]
}

type QuickReportOption = {
  id: QuickReportType
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  suggestedFileName: string
  defaultSheets: SheetKey[]
}

type ReportDataBundle = {
  revenueTrend?: RevenueTrendItem[]
  orders?: AdminOrder[]
  deliveryBoard?: DeliveryStaffBoardItem[]
  slaAlerts?: SlaAlertItem[]
  users?: AdminUser[]
  supermarkets?: AdminSupermarketItem[]
}

const quickRanges = [
  { id: "7d", label: "7 ngày gần đây" },
  { id: "30d", label: "30 ngày gần đây" },
  { id: "month", label: "Tháng này" },
  { id: "prev-month", label: "Tháng trước" },
]

const sheetDefinitions: SheetDefinition[] = [
  {
    key: "summary",
    title: "Tổng hợp",
    description: "Tóm tắt nhanh các chỉ số chính từ những nhóm dữ liệu đã chọn.",
    icon: Sparkles,
    columns: [
      "Chỉ số",
      "Giá trị",
      "Ghi chú",
      "Từ ngày",
      "Đến ngày",
      "Ngày tạo báo cáo",
    ],
  },
  {
    key: "revenue",
    title: "Doanh thu",
    description: "Doanh thu và số đơn theo từng ngày trong giai đoạn đã chọn.",
    icon: ReceiptText,
    columns: [
      "Ngày ghi nhận",
      "Doanh thu",
      "Số đơn hàng",
      "Giá trị đơn trung bình",
    ],
  },
  {
    key: "orders",
    title: "Đơn hàng",
    description: "Danh sách đơn hàng lấy từ hệ thống quản trị.",
    icon: PackageSearch,
    columns: [
      "Mã đơn",
      "Ngày đặt",
      "Khách hàng",
      "Trạng thái",
      "Hình thức nhận hàng",
      "Tổng tiền",
      "Giảm giá",
      "Phí giao hàng",
      "Siêu thị",
      "Khung giờ",
    ],
  },
  {
    key: "delivery",
    title: "Giao hàng",
    description: "Hiệu suất giao hàng theo từng nhân sự giao hàng.",
    icon: Truck,
    columns: [
      "Nhân sự giao hàng",
      "Email",
      "Số điện thoại",
      "Tổng nhóm giao",
      "Nhóm nháp",
      "Nhóm đang hoạt động",
      "Nhóm hoàn tất",
      "Nhóm thất bại",
      "Nhóm đang giao",
      "Nhóm chờ xử lý",
      "Ngày giao gần nhất",
    ],
  },
  {
    key: "sla",
    title: "Cảnh báo SLA",
    description: "Các đơn hàng đang vượt ngưỡng chậm xử lý.",
    icon: ShieldAlert,
    columns: [
      "Mã đơn",
      "Trạng thái",
      "Ngày đặt",
      "Số phút quá hạn",
      "Hình thức nhận hàng",
      "Mã người dùng",
    ],
  },
  {
    key: "users",
    title: "Người dùng",
    description: "Danh sách tài khoản hiện có trong hệ thống.",
    icon: Users,
    columns: [
      "Họ tên",
      "Email",
      "Số điện thoại",
      "Vai trò",
      "Trạng thái",
      "Ngày tạo",
      "Cập nhật lần cuối",
    ],
  },
  {
    key: "supermarkets",
    title: "Siêu thị",
    description: "Danh sách đối tác siêu thị đang có trong hệ thống.",
    icon: FileText,
    columns: [
      "Tên siêu thị",
      "Địa chỉ",
      "Số điện thoại",
      "Email",
      "Trạng thái",
      "Ngày tham gia",
      "Cập nhật lần cuối",
    ],
  },
]

const quickReportOptions: QuickReportOption[] = [
  {
    id: "revenue",
    title: "Báo cáo doanh thu",
    description: "Tập trung vào phần tổng hợp và doanh thu theo ngày.",
    icon: ReceiptText,
    suggestedFileName: "bao-cao-doanh-thu",
    defaultSheets: ["summary", "revenue"],
  },
  {
    id: "orders",
    title: "Báo cáo đơn hàng",
    description: "Phù hợp để đối soát đơn hàng trong giai đoạn chọn.",
    icon: PackageSearch,
    suggestedFileName: "bao-cao-don-hang",
    defaultSheets: ["summary", "orders"],
  },
  {
    id: "delivery",
    title: "Báo cáo giao hàng",
    description: "Theo dõi năng suất giao hàng và SLA.",
    icon: Truck,
    suggestedFileName: "bao-cao-giao-hang",
    defaultSheets: ["summary", "delivery", "sla"],
  },
  {
    id: "sla",
    title: "Báo cáo SLA",
    description: "Chỉ xuất nhóm dữ liệu cảnh báo chậm xử lý.",
    icon: ShieldAlert,
    suggestedFileName: "bao-cao-sla",
    defaultSheets: ["summary", "sla"],
  },
  {
    id: "users",
    title: "Báo cáo người dùng",
    description: "Xuất danh sách người dùng và thông tin cơ bản.",
    icon: Users,
    suggestedFileName: "bao-cao-nguoi-dung",
    defaultSheets: ["summary", "users"],
  },
  {
    id: "supermarkets",
    title: "Báo cáo siêu thị",
    description: "Xuất danh sách siêu thị và tình trạng hoạt động.",
    icon: FileSpreadsheet,
    suggestedFileName: "bao-cao-sieu-thi",
    defaultSheets: ["summary", "supermarkets"],
  },
]

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDateTime = (value?: string | null) => {
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

const formatDateDisplay = (value?: string | null) => {
  if (!value) return "--"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--"

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

const formatUserStatus = (status?: number) => {
  switch (status) {
    case 0:
      return "Chưa xác thực"
    case 1:
      return "Chờ duyệt"
    case 2:
      return "Đang hoạt động"
    case 3:
      return "Đã từ chối"
    case 4:
      return "Đã khóa"
    case 5:
      return "Bị cấm"
    case 6:
      return "Đã xóa"
    case 7:
      return "Ẩn"
    default:
      return status == null ? "--" : String(status)
  }
}

const formatSupermarketStatus = (status?: number) => {
  switch (status) {
    case 0:
      return "Chờ duyệt"
    case 1:
      return "Đang hoạt động"
    case 2:
      return "Tạm ngưng"
    case 3:
      return "Đã đóng"
    case 4:
      return "Đã từ chối"
    default:
      return status == null ? "--" : String(status)
  }
}

const formatOrderStatus = (status?: string) => {
  const normalized = String(status ?? "").trim().toLowerCase()

  switch (normalized) {
    case "pending":
      return "Chờ xác nhận"
    case "paid":
    case "paidprocessing":
    case "paid_processing":
      return "Đã thanh toán"
    case "processing":
      return "Đang xử lý"
    case "confirmed":
      return "Đã xác nhận"
    case "assigned":
      return "Đã phân công"
    case "packed":
      return "Đã đóng gói"
    case "readytoship":
    case "ready_to_ship":
      return "Sẵn sàng giao"
    case "shipping":
    case "intransit":
    case "in_transit":
      return "Đang giao"
    case "delivered":
      return "Đã giao"
    case "completed":
      return "Hoàn tất"
    case "cancelled":
      return "Đã hủy"
    case "failed":
      return "Thất bại"
    default:
      return status || "--"
  }
}

const formatDeliveryType = (value?: string) => {
  const normalized = String(value ?? "").trim().toLowerCase()

  switch (normalized) {
    case "delivery":
    case "homedelivery":
    case "home_delivery":
    case "home-delivery":
      return "Giao tận nơi"
    case "pickup":
    case "pick_up":
    case "pick-up":
      return "Nhận tại điểm tập kết"
    default:
      return value || "--"
  }
}

const formatRoleName = (value?: string) => value || "--"

const compareText = (left?: string, right?: string) =>
  (left ?? "").localeCompare(right ?? "", "vi", {
    sensitivity: "base",
    numeric: true,
  })

const toUtcStart = (dateText: string) => {
  const date = new Date(`${dateText}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const toUtcEnd = (dateText: string) => {
  const date = new Date(`${dateText}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const diffDaysInclusive = (fromDate: string, toDate: string) => {
  if (!fromDate || !toDate) return 14

  const from = new Date(`${fromDate}T00:00:00`)
  const to = new Date(`${toDate}T00:00:00`)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 14

  const diff = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
  return Math.max(1, diff + 1)
}

const filterRevenueTrendByRange = (
  items: RevenueTrendItem[],
  fromDate: string,
  toDate: string
) => {
  if (!fromDate && !toDate) return items

  const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null
  const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null

  return items.filter((item) => {
    const time = new Date(item.date).getTime()
    if (Number.isNaN(time)) return false
    if (from != null && time < from) return false
    if (to != null && time > to) return false
    return true
  })
}

const getSheetByKey = (key: SheetKey) =>
  sheetDefinitions.find((item) => item.key === key) ?? sheetDefinitions[0]

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const withEmptyFallback = (rows: SheetRow[]) =>
  rows.length > 0 ? rows : [{ "Thông báo": "Không có dữ liệu phù hợp trong giai đoạn đã chọn" }]

const filterRowByColumns = (row: SheetRow, allowedColumns: string[]) => {
  const filtered: SheetRow = {}
  allowedColumns.forEach((column) => {
    filtered[column] = row[column] ?? ""
  })
  return filtered
}

const buildSummaryRows = (
  bundle: ReportDataBundle,
  fromDate: string,
  toDate: string
): SheetRow[] => {
  const revenueRows = bundle.revenueTrend ?? []
  const orders = bundle.orders ?? []
  const deliveryBoard = bundle.deliveryBoard ?? []
  const slaRows = bundle.slaAlerts ?? []
  const users = bundle.users ?? []
  const supermarkets = bundle.supermarkets ?? []

  const totalRevenue = revenueRows.reduce((sum, item) => sum + (item.revenue ?? 0), 0)
  const totalOrdersFromTrend = revenueRows.reduce(
    (sum, item) => sum + (item.orderCount ?? 0),
    0
  )
  const avgOrderValue = totalOrdersFromTrend > 0 ? totalRevenue / totalOrdersFromTrend : 0

  return [
    {
      "Chỉ số": "Tổng doanh thu trong giai đoạn",
      "Giá trị": totalRevenue,
      "Ghi chú": "Tính từ dữ liệu doanh thu theo ngày",
      "Từ ngày": fromDate || "--",
      "Đến ngày": toDate || "--",
      "Ngày tạo báo cáo": formatDateTime(new Date().toISOString()),
    },
    {
      "Chỉ số": "Tổng số đơn từ biểu đồ doanh thu",
      "Giá trị": totalOrdersFromTrend,
      "Ghi chú": "Tổng số đơn gắn với dữ liệu doanh thu",
      "Từ ngày": fromDate || "--",
      "Đến ngày": toDate || "--",
      "Ngày tạo báo cáo": formatDateTime(new Date().toISOString()),
    },
    {
      "Chỉ số": "Giá trị đơn trung bình",
      "Giá trị": avgOrderValue,
      "Ghi chú": "Doanh thu chia cho số đơn từ biểu đồ doanh thu",
      "Từ ngày": fromDate || "--",
      "Đến ngày": toDate || "--",
      "Ngày tạo báo cáo": formatDateTime(new Date().toISOString()),
    },
    {
      "Chỉ số": "Số đơn hàng đã lấy",
      "Giá trị": orders.length,
      "Ghi chú": "Lấy từ API danh sách đơn hàng",
      "Từ ngày": fromDate || "--",
      "Đến ngày": toDate || "--",
      "Ngày tạo báo cáo": formatDateTime(new Date().toISOString()),
    },
    {
      "Chỉ số": "Số cảnh báo SLA",
      "Giá trị": slaRows.length,
      "Ghi chú": "Các đơn đang vượt ngưỡng SLA đã chọn",
      "Từ ngày": fromDate || "--",
      "Đến ngày": toDate || "--",
      "Ngày tạo báo cáo": formatDateTime(new Date().toISOString()),
    },
    {
      "Chỉ số": "Số người dùng",
      "Giá trị": users.length,
      "Ghi chú": "Tổng tài khoản lấy từ hệ thống",
      "Từ ngày": fromDate || "--",
      "Đến ngày": toDate || "--",
      "Ngày tạo báo cáo": formatDateTime(new Date().toISOString()),
    },
    {
      "Chỉ số": "Số siêu thị",
      "Giá trị": supermarkets.length,
      "Ghi chú": "Tổng đối tác siêu thị hiện có",
      "Từ ngày": fromDate || "--",
      "Đến ngày": toDate || "--",
      "Ngày tạo báo cáo": formatDateTime(new Date().toISOString()),
    },
    {
      "Chỉ số": "Số nhân sự giao hàng",
      "Giá trị": deliveryBoard.length,
      "Ghi chú": "Tổng nhân sự giao hàng lấy được từ hệ thống",
      "Từ ngày": fromDate || "--",
      "Đến ngày": toDate || "--",
      "Ngày tạo báo cáo": formatDateTime(new Date().toISOString()),
    },
  ]
}

const buildRevenueRows = (items: RevenueTrendItem[]): SheetRow[] =>
  items
    .slice()
    .sort((a, b) => compareText(a.date, b.date))
    .map((item) => {
      const avgOrderValue =
        (item.orderCount ?? 0) > 0 ? (item.revenue ?? 0) / (item.orderCount ?? 0) : 0

      return {
        "Ngày ghi nhận": formatDateDisplay(item.date),
        "Doanh thu": item.revenue ?? 0,
        "Số đơn hàng": item.orderCount ?? 0,
        "Giá trị đơn trung bình": avgOrderValue,
      }
    })

const buildOrderRows = (items: AdminOrder[]): SheetRow[] =>
  items
    .slice()
    .sort((a, b) => compareText(b.orderDate, a.orderDate))
    .map((item) => ({
      "Mã đơn": item.orderCode || item.orderId,
      "Ngày đặt": formatDateTime(item.orderDate),
      "Khách hàng": item.userName || item.userId || "--",
      "Trạng thái": formatOrderStatus(item.status),
      "Hình thức nhận hàng": formatDeliveryType(item.deliveryType),
      "Tổng tiền": item.finalAmount ?? item.totalAmount ?? 0,
      "Giảm giá": item.discountAmount ?? 0,
      "Phí giao hàng": item.deliveryFee ?? 0,
      "Siêu thị": item.collectionPointName || "--",
      "Khung giờ": item.timeSlotDisplay || "--",
    }))

const buildDeliveryRows = (items: DeliveryStaffBoardItem[]): SheetRow[] =>
  items
    .slice()
    .sort((a, b) => compareText(a.deliveryStaffName, b.deliveryStaffName))
    .map((item) => ({
      "Nhân sự giao hàng": item.deliveryStaffName || "--",
      "Email": item.email || "--",
      "Số điện thoại": item.phone || "--",
      "Tổng nhóm giao": item.totalAssignedGroups ?? 0,
      "Nhóm nháp": item.draftGroups ?? 0,
      "Nhóm đang hoạt động": item.activeGroups ?? 0,
      "Nhóm hoàn tất": item.completedGroups ?? 0,
      "Nhóm thất bại": item.failedGroups ?? 0,
      "Nhóm đang giao": item.inTransitGroups ?? 0,
      "Nhóm chờ xử lý": item.pendingGroups ?? 0,
      "Ngày giao gần nhất": formatDateTime(item.latestAssignedGroupDate),
    }))

const buildSlaRows = (items: SlaAlertItem[]): SheetRow[] =>
  items
    .slice()
    .sort((a, b) => (b.minutesLate ?? 0) - (a.minutesLate ?? 0))
    .map((item) => ({
      "Mã đơn": item.orderCode || item.orderId,
      "Trạng thái": formatOrderStatus(item.status),
      "Ngày đặt": formatDateTime(item.orderDate),
      "Số phút quá hạn": item.minutesLate ?? 0,
      "Hình thức nhận hàng": formatDeliveryType(item.deliveryType),
      "Mã người dùng": item.userId || "--",
    }))

const buildUserRows = (items: AdminUser[]): SheetRow[] =>
  items
    .slice()
    .sort((a, b) => compareText(a.fullName, b.fullName))
    .map((item) => ({
      "Họ tên": item.fullName || "--",
      "Email": item.email || "--",
      "Số điện thoại": item.phone || "--",
      "Vai trò": formatRoleName(item.roleName),
      "Trạng thái": formatUserStatus(item.status),
      "Ngày tạo": formatDateTime(item.createdAt),
      "Cập nhật lần cuối": formatDateTime(item.updatedAt),
    }))

const buildSupermarketRows = (items: AdminSupermarketItem[]): SheetRow[] =>
  items
    .slice()
    .sort((a, b) => compareText(a.name, b.name))
    .map((item) => ({
      "Tên siêu thị": item.name || "--",
      "Địa chỉ": item.address || "--",
      "Số điện thoại": item.contactPhone || "--",
      "Email": item.contactEmail || "--",
      "Trạng thái": formatSupermarketStatus(item.status),
      "Ngày tham gia": formatDateTime(item.createdAt),
      "Cập nhật lần cuối": formatDateTime(item.updatedAt),
    }))

const SectionCard = ({
  title,
  description,
  right,
  children,
}: {
  title: string
  description?: string
  right?: React.ReactNode
  children: React.ReactNode
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

const AdminReports = () => {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)

  const [tab, setTab] = useState<ReportTab>("quick")
  const [quickReport, setQuickReport] = useState<QuickReportType>("revenue")
  const [format, setFormat] = useState<ExportFormat>("excel")
  const [fromDate, setFromDate] = useState(formatDateForInput(sevenDaysAgo))
  const [toDate, setToDate] = useState(formatDateForInput(today))
  const [exporting, setExporting] = useState(false)

  const [selectedSheets, setSelectedSheets] = useState<SheetKey[]>([
    "summary",
    "revenue",
  ])
  const [sheetColumnMap, setSheetColumnMap] = useState<Record<SheetKey, string[]>>(
    () => {
      return sheetDefinitions.reduce(
        (acc, sheet) => {
          acc[sheet.key] = [...sheet.columns]
          return acc
        },
        {} as Record<SheetKey, string[]>
      )
    }
  )

  const [sheetSearch, setSheetSearch] = useState("")
  const [activeSheet, setActiveSheet] = useState<SheetKey>("summary")

  const activeQuickReport = useMemo(
    () => quickReportOptions.find((item) => item.id === quickReport) ?? quickReportOptions[0],
    [quickReport]
  )

  const availableSheets = useMemo(() => {
    const keyword = sheetSearch.trim().toLowerCase()
    if (!keyword) return sheetDefinitions

    return sheetDefinitions.filter(
      (sheet) =>
        sheet.title.toLowerCase().includes(keyword) ||
        sheet.description.toLowerCase().includes(keyword)
    )
  }, [sheetSearch])

  const activeSheetDef = useMemo(() => getSheetByKey(activeSheet), [activeSheet])

  const selectedSheetDefs = useMemo(
    () => selectedSheets.map((sheet) => getSheetByKey(sheet)),
    [selectedSheets]
  )

  const generatedFileName = useMemo(() => {
    const ext = format === "excel" ? "xlsx" : "csv"
    const baseName =
      tab === "quick" ? activeQuickReport.suggestedFileName : "bao-cao-tuy-chinh"
    const from = fromDate || "tu-ngay"
    const to = toDate || "den-ngay"
    return `${baseName}_${from}_${to}.${ext}`
  }, [activeQuickReport, format, fromDate, toDate, tab])

  const totalSelectedColumns = useMemo(() => {
    return selectedSheets.reduce((sum, sheetKey) => {
      return sum + (sheetColumnMap[sheetKey]?.length ?? 0)
    }, 0)
  }, [selectedSheets, sheetColumnMap])

  const applyQuickTemplate = (reportId: QuickReportType) => {
    const found =
      quickReportOptions.find((item) => item.id === reportId) ?? quickReportOptions[0]
    setQuickReport(reportId)
    setSelectedSheets(found.defaultSheets)
    setActiveSheet(found.defaultSheets[0] ?? "summary")
    setTab("quick")
  }

  const handleQuickRange = (rangeId: string) => {
    const now = new Date()

    if (rangeId === "7d") {
      const start = new Date(now)
      start.setDate(now.getDate() - 6)
      setFromDate(formatDateForInput(start))
      setToDate(formatDateForInput(now))
      return
    }

    if (rangeId === "30d") {
      const start = new Date(now)
      start.setDate(now.getDate() - 29)
      setFromDate(formatDateForInput(start))
      setToDate(formatDateForInput(now))
      return
    }

    if (rangeId === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      setFromDate(formatDateForInput(start))
      setToDate(formatDateForInput(now))
      return
    }

    if (rangeId === "prev-month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      setFromDate(formatDateForInput(start))
      setToDate(formatDateForInput(end))
    }
  }

  const toggleSheet = (sheetKey: SheetKey) => {
    setTab("custom")
    setSelectedSheets((prev) => {
      const exists = prev.includes(sheetKey)
      const next = exists ? prev.filter((item) => item !== sheetKey) : [...prev, sheetKey]
      return next.length > 0 ? next : [sheetKey]
    })
    setActiveSheet(sheetKey)
  }

  const toggleColumn = (sheetKey: SheetKey, column: string) => {
    setSheetColumnMap((prev) => {
      const current = prev[sheetKey] ?? []
      const exists = current.includes(column)
      const next = exists
        ? current.filter((item) => item !== column)
        : [...current, column]

      return {
        ...prev,
        [sheetKey]: next.length > 0 ? next : [column],
      }
    })
  }

  const getRowsForSheet = (
    sheetKey: SheetKey,
    bundle: ReportDataBundle,
    from: string,
    to: string
  ): SheetRow[] => {
    switch (sheetKey) {
      case "summary":
        return buildSummaryRows(bundle, from, to)
      case "revenue":
        return buildRevenueRows(bundle.revenueTrend ?? [])
      case "orders":
        return buildOrderRows(bundle.orders ?? [])
      case "delivery":
        return buildDeliveryRows(bundle.deliveryBoard ?? [])
      case "sla":
        return buildSlaRows(bundle.slaAlerts ?? [])
      case "users":
        return buildUserRows(bundle.users ?? [])
      case "supermarkets":
        return buildSupermarketRows(bundle.supermarkets ?? [])
      default:
        return []
    }
  }

  const fetchDataBundle = async (sheetKeys: SheetKey[]) => {
    const needRevenue = sheetKeys.includes("summary") || sheetKeys.includes("revenue")
    const needOrders = sheetKeys.includes("summary") || sheetKeys.includes("orders")
    const needDelivery = sheetKeys.includes("summary") || sheetKeys.includes("delivery")
    const needSla = sheetKeys.includes("summary") || sheetKeys.includes("sla")
    const needUsers = sheetKeys.includes("summary") || sheetKeys.includes("users")
    const needSupermarkets =
      sheetKeys.includes("summary") || sheetKeys.includes("supermarkets")

    const fromUtc = fromDate ? toUtcStart(fromDate) : undefined
    const toUtc = toDate ? toUtcEnd(toDate) : undefined
    const revenueDays = diffDaysInclusive(fromDate, toDate)

    const [
      revenueTrend,
      ordersResult,
      deliveryBoard,
      slaAlerts,
      usersResult,
      supermarketsResult,
    ] = await Promise.all([
      needRevenue
        ? adminService.getRevenueTrend({ days: revenueDays })
        : Promise.resolve<RevenueTrendItem[]>([]),
      needOrders
        ? adminService.getOrders({
          pageNumber: 1,
          pageSize: 99999,
          fromUtc,
          toUtc,
          sortBy: "OrderDate",
          sortDir: "desc",
        })
        : Promise.resolve({ items: [] as AdminOrder[] }),
      needDelivery
        ? adminService.getDeliveryStaffBoard()
        : Promise.resolve<DeliveryStaffBoardItem[]>([]),
      needSla
        ? adminService.getSlaAlerts({ thresholdMinutes: 120, top: 500 })
        : Promise.resolve<SlaAlertItem[]>([]),
      needUsers
        ? adminService.getUsers({ pageNumber: 1, pageSize: 99999 })
        : Promise.resolve({ items: [] as AdminUser[] }),
      needSupermarkets
        ? adminService.getSupermarkets({ pageNumber: 1, pageSize: 99999 })
        : Promise.resolve({ items: [] as AdminSupermarketItem[] }),
    ])

    return {
      revenueTrend: filterRevenueTrendByRange(revenueTrend ?? [], fromDate, toDate),
      orders: ordersResult.items ?? [],
      deliveryBoard: deliveryBoard ?? [],
      slaAlerts: slaAlerts ?? [],
      users: usersResult.items ?? [],
      supermarkets: supermarketsResult.items ?? [],
    } satisfies ReportDataBundle
  }

  const handleExport = async () => {
    try {
      if (!selectedSheets.length) {
        showError("Vui lòng chọn ít nhất một sheet để xuất")
        return
      }

      if (fromDate && toDate && fromDate > toDate) {
        showError("Ngày bắt đầu không được sau ngày kết thúc")
        return
      }

      setExporting(true)

      const exportSheetKeys = format === "csv" ? [activeSheet] : selectedSheets
      const bundle = await fetchDataBundle(exportSheetKeys)

      const preparedSheets = exportSheetKeys.map((sheetKey) => {
        const rows = withEmptyFallback(
          getRowsForSheet(sheetKey, bundle, fromDate, toDate)
        )
        const selectedColumns =
          sheetColumnMap[sheetKey]?.length > 0
            ? sheetColumnMap[sheetKey]
            : Object.keys(rows[0] ?? {})

        return {
          key: sheetKey,
          title: getSheetByKey(sheetKey).title,
          rows: rows.map((row) => filterRowByColumns(row, selectedColumns)),
          columns: selectedColumns,
        }
      })

      if (format === "excel") {
        const workbook = XLSX.utils.book_new()

        preparedSheets.forEach((sheet) => {
          const worksheet = XLSX.utils.json_to_sheet(sheet.rows, {
            header: sheet.columns,
          })

          const maxColumnCount = sheet.columns.length
          worksheet["!cols"] = Array.from({ length: maxColumnCount }).map((_, index) => {
            const columnName = sheet.columns[index]
            const maxLength = Math.max(
              columnName.length,
              ...sheet.rows.map((row) => String(row[columnName] ?? "").length)
            )
            return { wch: Math.min(Math.max(maxLength + 2, 14), 40) }
          })

          XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            sheet.title.slice(0, 31)
          )
        })

        const buffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        })

        downloadBlob(
          new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
          generatedFileName
        )

        showSuccess("Đã xuất file Excel")
        return
      }

      const csvSheet = preparedSheets[0]
      const worksheet = XLSX.utils.json_to_sheet(csvSheet.rows, {
        header: csvSheet.columns,
      })
      const csvText = XLSX.utils.sheet_to_csv(worksheet)
      downloadBlob(
        new Blob(["\uFEFF" + csvText], { type: "text/csv;charset=utf-8;" }),
        generatedFileName
      )

      showSuccess(`Đã xuất file CSV từ sheet ${csvSheet.title.toLowerCase()}`)
    } catch (error) {
      console.error("[AdminReports] export error:", error)
      showError("Không thể tạo file báo cáo")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-sky-950 via-cyan-900 to-teal-800 text-white shadow-sm">
        <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Xuất báo cáo tổng hợp từ hệ thống
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              Tạo file Excel hoặc CSV tùy chỉnh
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-300">Chế độ</p>
              <p className="mt-2 text-sm font-semibold text-white">Nhanh / Tùy chỉnh</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-300">Định dạng</p>
              <p className="mt-2 text-sm font-semibold text-white">Excel / CSV</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-300">Phạm vi</p>
              <p className="mt-2 text-sm font-semibold text-white">Theo khoảng ngày</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <SectionCard
            title="Chế độ tạo báo cáo"
            description="Chọn mẫu nhanh để thao tác gọn hơn, hoặc dùng cấu hình tùy chỉnh nếu bạn muốn tự chọn nhiều sheet."
          >
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab("quick")}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  tab === "quick"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                Báo cáo nhanh
              </button>
              <button
                type="button"
                onClick={() => setTab("custom")}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  tab === "custom"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                Báo cáo tùy chỉnh
              </button>
            </div>
          </SectionCard>

          {tab === "quick" ? (
            <SectionCard
              title="Mẫu báo cáo nhanh"
              description="Mỗi mẫu sẽ tự chọn sẵn những sheet hợp lý để bạn xuất nhanh hơn."
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {quickReportOptions.map((item) => {
                  const Icon = item.icon
                  const isActive = quickReport === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => applyQuickTemplate(item.id)}
                      className={[
                        "rounded-2xl border px-4 py-3 text-left transition",
                        isActive
                          ? "border-cyan-900 bg-cyan-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "rounded-xl p-2",
                            isActive ? "bg-cyan-900 text-white" : "bg-slate-100 text-slate-700",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.defaultSheets.map((sheet) => getSheetByKey(sheet).title).join(" • ")}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Khoảng thời gian và định dạng file"
            description="Chọn khoảng ngày cần lấy dữ liệu và định dạng file muốn xuất."
            right={
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                <CalendarRange className="h-4 w-4" />
                Bộ lọc ngày
              </div>
            }
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {quickRanges.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleQuickRange(item.id)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Định dạng file
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFromDate("")
                  setToDate("")
                }}
                className="self-end rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Xóa bộ lọc
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {format === "csv"
                ? "CSV chỉ xuất một sheet tại một thời điểm. Hệ thống sẽ dùng sheet đang được chọn ở phần preview."
                : "Excel có thể xuất nhiều sheet trong cùng một file."}
            </div>
          </SectionCard>

          <SectionCard
            title="Chọn sheet cần xuất"
            description="Danh sách sheet gọn, dễ chọn và dễ nhìn hơn."
            right={
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                <FileSpreadsheet className="h-4 w-4" />
                {selectedSheets.length} sheet đã chọn
              </div>
            }
          >
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={sheetSearch}
                onChange={(e) => setSheetSearch(e.target.value)}
                placeholder="Tìm sheet..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              {availableSheets.map((sheet, index) => {
                const Icon = sheet.icon
                const isSelected = selectedSheets.includes(sheet.key)
                const isActive = activeSheet === sheet.key

                return (
                  <div
                    key={sheet.key}
                    className={[
                      "flex items-center gap-3 px-4 py-3",
                      index !== 0 ? "border-t border-slate-200" : "",
                      isActive ? "bg-cyan-50" : "bg-white",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSheet(sheet.key)}
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    <button
                      type="button"
                      onClick={() => setActiveSheet(sheet.key)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className={[
                          "rounded-xl p-2",
                          isActive ? "bg-cyan-900 text-white" : "bg-slate-100 text-slate-700",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{sheet.title}</p>
                        <p className="truncate text-xs text-slate-500">{sheet.description}</p>
                      </div>
                    </button>

                    {isActive ? (
                      <span className="rounded-full bg-cyan-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                        Đang xem
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSheetDefs.map((sheet) => (
                <button
                  key={sheet.key}
                  type="button"
                  onClick={() => setActiveSheet(sheet.key)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    activeSheet === sheet.key
                      ? "border-cyan-900 bg-cyan-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {sheet.title}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Chọn cột dữ liệu"
            description="Bỏ bớt những cột không cần thiết để file gọn và dễ đọc hơn."
            right={
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                <Settings2 className="h-4 w-4" />
                {activeSheetDef.title}
              </div>
            }
          >
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3">
                <p className="font-semibold text-slate-900">{activeSheetDef.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {activeSheetDef.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {activeSheetDef.columns.map((column) => {
                  const checked = (sheetColumnMap[activeSheetDef.key] ?? []).includes(
                    column
                  )

                  return (
                    <label
                      key={column}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColumn(activeSheetDef.key, column)}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{column}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Cột này sẽ được đưa vào sheet{" "}
                          {activeSheetDef.title.toLowerCase()}.
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <SectionCard
            title="Tóm tắt cấu hình hiện tại"
            description="Kiểm tra nhanh trước khi tạo file."
          >
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Chế độ</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {tab === "quick" ? "Báo cáo nhanh" : "Báo cáo tùy chỉnh"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Khoảng thời gian</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {fromDate || "--"} đến {toDate || "--"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Định dạng</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {format === "excel" ? "Excel (.xlsx)" : "CSV (.csv)"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Số sheet đã chọn</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedSheets.length} sheet
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Tổng số cột được xuất</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {totalSelectedColumns} cột
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Tên file dự kiến</p>
                <p className="mt-1 break-all font-semibold text-slate-900">
                  {generatedFileName}
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {format === "csv"
                  ? `Sheet sẽ được xuất: ${getSheetByKey(activeSheet).title}`
                  : "File Excel sẽ chứa toàn bộ các sheet đang được chọn."}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? "Đang tạo file..." : "Tạo và tải báo cáo"}
            </button>
          </SectionCard>

          <SectionCard
            title="Preview các sheet sẽ tạo"
            description="Đây là cấu trúc sheet và cột sẽ được dùng khi export."
          >
            <div className="space-y-3">
              {selectedSheetDefs.map((sheet) => (
                <div key={sheet.key} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{sheet.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {sheet.description}
                      </p>
                    </div>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {(sheetColumnMap[sheet.key] ?? []).length} cột
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(sheetColumnMap[sheet.key] ?? []).map((column) => (
                      <span
                        key={column}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {column}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default AdminReports
