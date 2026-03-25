import { useMemo, useState } from "react"
import {
  CalendarRange,
  Check,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Mail,
  PackageSearch,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react"

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

type ExportHistoryItem = {
  id: string
  name: string
  type: string
  createdAt: string
  format: "Excel" | "CSV"
  status: "Thành công" | "Đang xử lý" | "Thất bại"
  receiver?: string
  fileSize?: string
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
    description: "Sheet tổng quan chỉ số chính của báo cáo.",
    icon: Sparkles,
    columns: [
      "Chỉ số",
      "Giá trị",
      "So sánh kỳ trước",
      "Ghi chú",
      "Ngày tạo báo cáo",
    ],
  },
  {
    key: "revenue",
    title: "Doanh thu",
    description: "Dữ liệu doanh thu theo ngày hoặc theo giai đoạn.",
    icon: ReceiptText,
    columns: [
      "Ngày ghi nhận",
      "Doanh thu",
      "Số đơn hàng",
      "Giá trị đơn trung bình",
      "Tổng giảm giá",
      "Phí giao hàng",
      "Doanh thu thuần",
    ],
  },
  {
    key: "orders",
    title: "Đơn hàng",
    description: "Danh sách đơn hàng trong khoảng thời gian đã chọn.",
    icon: PackageSearch,
    columns: [
      "Mã đơn",
      "Ngày đặt",
      "Khách hàng",
      "Trạng thái",
      "Hình thức nhận hàng",
      "Tổng tiền",
      "Siêu thị",
      "Nhân sự xử lý",
    ],
  },
  {
    key: "delivery",
    title: "Giao hàng",
    description: "Hiệu suất giao hàng và thống kê vận hành.",
    icon: Truck,
    columns: [
      "Nhân sự giao hàng",
      "Tổng nhóm giao",
      "Tổng đơn",
      "Đơn hoàn tất",
      "Đơn thất bại",
      "Đơn đang giao",
      "Tỷ lệ hoàn tất",
    ],
  },
  {
    key: "sla",
    title: "Cảnh báo SLA",
    description: "Các đơn hàng chậm xử lý hoặc vượt ngưỡng cảnh báo.",
    icon: ShieldAlert,
    columns: [
      "Mã đơn",
      "Trạng thái",
      "Ngày đặt",
      "Số phút quá hạn",
      "Hình thức nhận hàng",
      "Người dùng",
      "Nhân sự phụ trách",
    ],
  },
  {
    key: "users",
    title: "Người dùng",
    description: "Danh sách tài khoản và trạng thái hoạt động.",
    icon: Users,
    columns: [
      "Họ tên",
      "Email",
      "Số điện thoại",
      "Vai trò",
      "Trạng thái",
      "Ngày tạo",
      "Lần đăng nhập cuối",
    ],
  },
  {
    key: "supermarkets",
    title: "Siêu thị",
    description: "Thông tin siêu thị và trạng thái vận hành.",
    icon: FileText,
    columns: [
      "Tên siêu thị",
      "Địa chỉ",
      "Số điện thoại",
      "Email",
      "Trạng thái",
      "Ngày tham gia",
      "Số lượng nhân sự",
    ],
  },
]

const quickReportOptions: QuickReportOption[] = [
  {
    id: "revenue",
    title: "Báo cáo doanh thu",
    description: "Mẫu nhanh cho doanh thu và phần tổng hợp chỉ số liên quan.",
    icon: ReceiptText,
    suggestedFileName: "bao-cao-doanh-thu",
    defaultSheets: ["summary", "revenue"],
  },
  {
    id: "orders",
    title: "Báo cáo đơn hàng",
    description: "Mẫu nhanh để xuất đơn hàng và phần tổng hợp chung.",
    icon: PackageSearch,
    suggestedFileName: "bao-cao-don-hang",
    defaultSheets: ["summary", "orders"],
  },
  {
    id: "delivery",
    title: "Báo cáo giao hàng",
    description: "Mẫu nhanh cho hiệu suất giao hàng và vận hành.",
    icon: Truck,
    suggestedFileName: "bao-cao-giao-hang",
    defaultSheets: ["summary", "delivery"],
  },
  {
    id: "sla",
    title: "Báo cáo SLA",
    description: "Mẫu nhanh cho các đơn hàng chậm xử lý.",
    icon: ShieldAlert,
    suggestedFileName: "bao-cao-sla",
    defaultSheets: ["summary", "sla"],
  },
  {
    id: "users",
    title: "Báo cáo người dùng",
    description: "Mẫu nhanh để xuất dữ liệu tài khoản hệ thống.",
    icon: Users,
    suggestedFileName: "bao-cao-nguoi-dung",
    defaultSheets: ["summary", "users"],
  },
  {
    id: "supermarkets",
    title: "Báo cáo siêu thị",
    description: "Mẫu nhanh để xuất dữ liệu siêu thị và vận hành.",
    icon: FileSpreadsheet,
    suggestedFileName: "bao-cao-sieu-thi",
    defaultSheets: ["summary", "supermarkets"],
  },
]

const internalEmailSuggestions = [
  "admin@closeexp.vn",
  "ops@closeexp.vn",
  "finance@closeexp.vn",
  "delivery@closeexp.vn",
  "reporting@closeexp.vn",
]

const mockHistory: ExportHistoryItem[] = [
  {
    id: "EXP-001",
    name: "bao-cao-doanh-thu_2026-03-01_2026-03-24.xlsx",
    type: "Báo cáo doanh thu",
    createdAt: "24/03/2026 09:15",
    format: "Excel",
    status: "Thành công",
    receiver: "finance@closeexp.vn",
    fileSize: "286 KB",
  },
  {
    id: "EXP-002",
    name: "bao-cao-don-hang_2026-03-10_2026-03-24.xlsx",
    type: "Báo cáo đơn hàng",
    createdAt: "24/03/2026 09:42",
    format: "Excel",
    status: "Đang xử lý",
    receiver: "ops@closeexp.vn",
  },
  {
    id: "EXP-003",
    name: "bao-cao-sla_2026-03-17_2026-03-24.csv",
    type: "Báo cáo SLA",
    createdAt: "24/03/2026 10:05",
    format: "CSV",
    status: "Thất bại",
  },
]

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const today = new Date()
const sevenDaysAgo = new Date(today)
sevenDaysAgo.setDate(today.getDate() - 6)

const getSheetByKey = (key: SheetKey) =>
  sheetDefinitions.find((item) => item.key === key) ?? sheetDefinitions[0]

const StatusBadge = ({
  status,
}: {
  status: ExportHistoryItem["status"]
}) => {
  const cls =
    status === "Thành công"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Đang xử lý"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700"

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  )
}

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
  const [tab, setTab] = useState<ReportTab>("quick")
  const [quickReport, setQuickReport] = useState<QuickReportType>("revenue")
  const [format, setFormat] = useState<ExportFormat>("excel")
  const [fromDate, setFromDate] = useState(formatDateForInput(sevenDaysAgo))
  const [toDate, setToDate] = useState(formatDateForInput(today))
  const [exporting, setExporting] = useState(false)

  const [selectedSheets, setSelectedSheets] = useState<SheetKey[]>(["summary", "revenue"])
  const [sheetColumnMap, setSheetColumnMap] = useState<Record<SheetKey, string[]>>(() => {
    return sheetDefinitions.reduce(
      (acc, sheet) => {
        acc[sheet.key] = [...sheet.columns]
        return acc
      },
      {} as Record<SheetKey, string[]>
    )
  })

  const [sheetSearch, setSheetSearch] = useState("")
  const [activeSheet, setActiveSheet] = useState<SheetKey>("summary")

  const [sendByEmail, setSendByEmail] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [emailRecipients, setEmailRecipients] = useState<string[]>(["reporting@closeexp.vn"])
  const [emailNote, setEmailNote] = useState("")

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

      if (next.length === 0) {
        return [sheetKey]
      }

      return next
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

  const addRecipient = (email: string) => {
    const normalized = email.trim().toLowerCase()
    if (!normalized) return
    if (emailRecipients.includes(normalized)) return
    setEmailRecipients((prev) => [...prev, normalized])
    setEmailInput("")
  }

  const removeRecipient = (email: string) => {
    setEmailRecipients((prev) => prev.filter((item) => item !== email))
  }

  const handleExport = async () => {
    try {
      setExporting(true)

      await new Promise((resolve) => setTimeout(resolve, 900))

      const summary = [
        `Loại cấu hình: ${tab === "quick" ? "Báo cáo nhanh" : "Báo cáo tùy chỉnh"}`,
        `Tên file: ${generatedFileName}`,
        `Số sheet: ${selectedSheets.length}`,
        `Số cột được chọn: ${totalSelectedColumns}`,
        sendByEmail
          ? `Gửi email nội bộ: ${emailRecipients.join(", ")}`
          : "Không gửi qua email nội bộ",
      ].join("\n")

      window.alert(`Đã tạo yêu cầu xuất báo cáo.\n\n${summary}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
        <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Trung tâm xuất báo cáo
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              Tạo file báo cáo Excel hoặc CSV theo nhu cầu quản trị
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Màn này tập trung vào việc xuất file thay vì hiển thị dashboard. Có thể dùng mẫu
              nhanh hoặc tự cấu hình nhiều sheet, chọn cột xuất và gửi file qua email nội bộ.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">Chế độ</p>
              <p className="mt-2 text-sm font-semibold text-white">Nhanh / Tùy chỉnh</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">Sheet</p>
              <p className="mt-2 text-sm font-semibold text-white">Nhiều sheet Excel</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">Cột xuất</p>
              <p className="mt-2 text-sm font-semibold text-white">Tùy chọn linh hoạt</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">Gửi nội bộ</p>
              <p className="mt-2 text-sm font-semibold text-white">Email nội bộ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-6">
          <SectionCard
            title="Chế độ tạo báo cáo"
            description="Chọn mẫu nhanh để thao tác gọn hơn hoặc dùng cấu hình tùy chỉnh nếu cần nhiều sheet và nhiều nhóm dữ liệu."
          >
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab("quick")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === "quick"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Báo cáo nhanh
              </button>
              <button
                type="button"
                onClick={() => setTab("custom")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === "custom"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Báo cáo tùy chỉnh
              </button>
            </div>
          </SectionCard>

          {tab === "quick" ? (
            <SectionCard
              title="Mẫu báo cáo nhanh"
              description="Dùng khi muốn xuất nhanh theo các mẫu phổ biến, hệ thống sẽ tự chọn sẵn sheet phù hợp."
              right={
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  <Sparkles className="h-4 w-4" />
                  {quickReportOptions.length} mẫu có sẵn
                </div>
              }
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
                      className={`rounded-[24px] border p-4 text-left transition ${isActive
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`rounded-2xl p-3 ${isActive ? "bg-white/10" : "bg-slate-100"}`}>
                          <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-700"}`} />
                        </div>

                        {isActive ? (
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                            Đang chọn
                          </span>
                        ) : null}
                      </div>

                      <h3 className={`mt-4 font-bold ${isActive ? "text-white" : "text-slate-900"}`}>
                        {item.title}
                      </h3>

                      <p className={`mt-2 text-sm leading-6 ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                        {item.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.defaultSheets.map((sheet) => (
                          <span
                            key={sheet}
                            className={`rounded-full px-3 py-1 text-xs font-medium ${isActive
                                ? "border border-white/15 bg-white/10 text-white"
                                : "border border-slate-200 bg-slate-50 text-slate-700"
                              }`}
                          >
                            {getSheetByKey(sheet).title}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Khoảng thời gian và định dạng file"
            description="Chọn mốc thời gian cần thống kê và định dạng muốn xuất."
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
                <label className="mb-2 block text-sm font-medium text-slate-700">Từ ngày</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Đến ngày</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Định dạng</label>
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
          </SectionCard>

          <SectionCard
            title="Chọn sheet cho file Excel"
            description="Bạn có thể gom nhiều nhóm dữ liệu vào cùng một file Excel. Với CSV, giao diện vẫn cho cấu hình trước để BE xử lý sau."
            right={
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                <FileSpreadsheet className="h-4 w-4" />
                {selectedSheets.length} sheet được chọn
              </div>
            }
          >
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={sheetSearch}
                onChange={(e) => setSheetSearch(e.target.value)}
                placeholder="Tìm sheet cần thêm..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {availableSheets.map((sheet) => {
                const Icon = sheet.icon
                const isSelected = selectedSheets.includes(sheet.key)

                return (
                  <button
                    key={sheet.key}
                    type="button"
                    onClick={() => toggleSheet(sheet.key)}
                    className={`rounded-[24px] border p-4 text-left transition ${isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`rounded-2xl p-3 ${isSelected ? "bg-white/10" : "bg-slate-100"}`}>
                        <Icon className={`h-5 w-5 ${isSelected ? "text-white" : "text-slate-700"}`} />
                      </div>

                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${isSelected
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-slate-200 bg-white text-slate-500"
                          }`}
                      >
                        {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      </span>
                    </div>

                    <h3 className={`mt-4 font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                      {sheet.title}
                    </h3>

                    <p className={`mt-2 text-sm leading-6 ${isSelected ? "text-slate-200" : "text-slate-500"}`}>
                      {sheet.description}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {selectedSheetDefs.map((sheet) => (
                <button
                  key={sheet.key}
                  type="button"
                  onClick={() => setActiveSheet(sheet.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${activeSheet === sheet.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {sheet.title}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Chọn cột dữ liệu được xuất"
            description="Tùy chỉnh chi tiết từng cột để file gọn hơn, đúng nhu cầu hơn."
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
                <p className="mt-1 text-sm text-slate-500">{activeSheetDef.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {activeSheetDef.columns.map((column) => {
                  const checked = (sheetColumnMap[activeSheetDef.key] ?? []).includes(column)

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
                          Cột này sẽ xuất trong sheet {activeSheetDef.title.toLowerCase()}.
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Gửi file qua email nội bộ"
            description="Có thể cấu hình để sau khi export xong, hệ thống gửi file hoặc link tải về cho các email nội bộ."
            right={
              <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={sendByEmail}
                  onChange={(e) => setSendByEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Bật gửi email
              </label>
            }
          >
            <div className={`${sendByEmail ? "opacity-100" : "opacity-60"} space-y-4 transition`}>
              <div className="flex flex-wrap gap-2">
                {internalEmailSuggestions.map((email) => (
                  <button
                    key={email}
                    type="button"
                    disabled={!sendByEmail}
                    onClick={() => addRecipient(email)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    {email}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email người nhận
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      disabled={!sendByEmail}
                      placeholder="Nhập email nội bộ rồi bấm Thêm"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!sendByEmail}
                  onClick={() => addRecipient(emailInput)}
                  className="self-end rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
                >
                  Thêm
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {emailRecipients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Chưa có email nội bộ nào được chọn.
                  </div>
                ) : (
                  emailRecipients.map((email) => (
                    <div
                      key={email}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      {email}
                      <button type="button" onClick={() => removeRecipient(email)}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ghi chú đi kèm email
                </label>
                <textarea
                  value={emailNote}
                  onChange={(e) => setEmailNote(e.target.value)}
                  disabled={!sendByEmail}
                  rows={4}
                  placeholder="Ví dụ: Nhờ anh/chị kiểm tra và đối soát số liệu trong file đính kèm."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="xl:col-span-4 space-y-6">
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
                <p className="text-sm text-slate-500">Số sheet được chọn</p>
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
                <p className="mt-1 break-all font-semibold text-slate-900">{generatedFileName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? "Đang tạo file..." : "Tạo và xuất báo cáo"}
            </button>
          </SectionCard>

          <SectionCard
            title="Preview sheet sẽ được tạo"
            description="Chỉ là preview cấu trúc, BE sẽ nối dữ liệu thật sau."
            right={
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                <ChevronRight className="h-4 w-4" />
                {selectedSheets.length} sheet
              </div>
            }
          >
            <div className="space-y-3">
              {selectedSheetDefs.map((sheet) => (
                <div key={sheet.key} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{sheet.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{sheet.description}</p>
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

          <SectionCard
            title="Lịch sử export gần đây"
            description="Dành sẵn chỗ để nối API lấy lịch sử export sau."
          >
            <div className="space-y-3">
              {mockHistory.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.type}</p>
                      <p className="mt-1 break-all text-sm text-slate-500">{item.name}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Thời điểm tạo</p>
                      <p className="mt-1 font-semibold text-slate-900">{item.createdAt}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Định dạng</p>
                      <p className="mt-1 font-semibold text-slate-900">{item.format}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    {item.receiver ? `Người nhận: ${item.receiver}` : "Không gửi qua email nội bộ"}
                    {item.fileSize ? ` • Kích thước: ${item.fileSize}` : ""}
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
