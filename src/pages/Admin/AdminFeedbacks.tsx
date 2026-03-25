import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  MessageSquare,
  RefreshCcw,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  UserRound,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { FeedbackItem } from "@/types/admin.type"

type ModerationStatus = "all" | "new" | "reviewing" | "resolved" | "hidden" | "flagged"
type SeverityLevel = "low" | "medium" | "high"

type FeedbackAdminRow = FeedbackItem & {
  moderationStatus: Exclude<ModerationStatus, "all">
  severity: SeverityLevel
  adminNote: string
  isPinned: boolean
  isDeleted: boolean
  flaggedReason?: string
}

const PAGE_SIZE = 10

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

const renderStars = (rating?: number) => {
  const safeRating = Math.max(0, Math.min(5, rating ?? 0))

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < safeRating
        return (
          <Star
            key={index}
            className={`h-4 w-4 ${
              active ? "fill-amber-400 text-amber-400" : "text-slate-300"
            }`}
          />
        )
      })}
    </div>
  )
}

const getSeverityClasses = (severity: SeverityLevel) => {
  switch (severity) {
    case "high":
      return "bg-rose-50 text-rose-700 border-rose-200"
    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
}

const getModerationClasses = (status: FeedbackAdminRow["moderationStatus"]) => {
  switch (status) {
    case "flagged":
      return "bg-rose-50 text-rose-700 border-rose-200"
    case "hidden":
      return "bg-slate-100 text-slate-700 border-slate-200"
    case "resolved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "reviewing":
      return "bg-sky-50 text-sky-700 border-sky-200"
    default:
      return "bg-violet-50 text-violet-700 border-violet-200"
  }
}

const toSeverity = (rating?: number): SeverityLevel => {
  if ((rating ?? 0) <= 2) return "high"
  if ((rating ?? 0) === 3) return "medium"
  return "low"
}

const toInitialModerationStatus = (
  rating?: number
): FeedbackAdminRow["moderationStatus"] => {
  if ((rating ?? 0) <= 2) return "flagged"
  return "new"
}

const mapFeedbackToAdminRow = (item: FeedbackItem): FeedbackAdminRow => ({
  ...item,
  moderationStatus: toInitialModerationStatus(item.rating),
  severity: toSeverity(item.rating),
  adminNote: "",
  isPinned: false,
  isDeleted: false,
  flaggedReason:
    (item.rating ?? 0) <= 2 ? "Đánh giá thấp, cần kiểm tra nội dung." : "",
})

const statusLabelMap: Record<ModerationStatus, string> = {
  all: "Tất cả",
  new: "Mới",
  reviewing: "Đang xử lý",
  resolved: "Đã xử lý",
  hidden: "Đã ẩn",
  flagged: "Bị gắn cờ",
}

const severityLabelMap: Record<SeverityLevel, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
}

const AdminFeedbacks = () => {
  const [items, setItems] = useState<FeedbackAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const [search, setSearch] = useState("")
  const [keyword, setKeyword] = useState("")
  const [ratingFilter, setRatingFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<ModerationStatus>("all")
  const [severityFilter, setSeverityFilter] = useState<"all" | SeverityLevel>("all")

  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState("")

  const [draftStatus, setDraftStatus] =
    useState<FeedbackAdminRow["moderationStatus"]>("new")
  const [draftSeverity, setDraftSeverity] = useState<SeverityLevel>("low")
  const [draftPinned, setDraftPinned] = useState(false)
  const [draftFlagReason, setDraftFlagReason] = useState("")
  const [draftAdminNote, setDraftAdminNote] = useState("")
  const [savingAction, setSavingAction] = useState(false)
  const [deletingId, setDeletingId] = useState("")

  const loadFeedbacks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")
      setNotice("")

      const response = await adminService.getFeedbacks({
        pageNumber: 1,
        pageSize: 9999,
      })

      const mapped = (response.items ?? []).map(mapFeedbackToAdminRow)
      setItems(mapped)

      if (!selectedId && mapped.length > 0) {
        setSelectedId(mapped[0].feedbackId)
      }

      if (selectedId && !mapped.some((item) => item.feedbackId === selectedId)) {
        setSelectedId(mapped[0]?.feedbackId ?? "")
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể tải danh sách phản hồi.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadFeedbacks()
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return items
      .filter((item) => !item.isDeleted)
      .filter((item) => {
        const matchesKeyword =
          !normalizedKeyword ||
          item.userName?.toLowerCase().includes(normalizedKeyword) ||
          item.comment?.toLowerCase().includes(normalizedKeyword) ||
          item.orderId?.toLowerCase().includes(normalizedKeyword) ||
          item.feedbackId?.toLowerCase().includes(normalizedKeyword) ||
          item.userId?.toLowerCase().includes(normalizedKeyword)

        const matchesRating =
          !ratingFilter || String(item.rating ?? "") === ratingFilter

        const matchesStatus =
          statusFilter === "all" || item.moderationStatus === statusFilter

        const matchesSeverity =
          severityFilter === "all" || item.severity === severityFilter

        return Boolean(
          matchesKeyword && matchesRating && matchesStatus && matchesSeverity
        )
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
        return (
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
        )
      })
  }, [items, keyword, ratingFilter, statusFilter, severityFilter])

  const totalResult = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalResult / PAGE_SIZE))

  const pagedItems = useMemo(() => {
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, page, totalPages])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const selectedItem = useMemo(() => {
    return (
      items.find((item) => item.feedbackId === selectedId && !item.isDeleted) ?? null
    )
  }, [items, selectedId])

  useEffect(() => {
    if (!selectedItem) return
    setDraftStatus(selectedItem.moderationStatus)
    setDraftSeverity(selectedItem.severity)
    setDraftPinned(selectedItem.isPinned)
    setDraftFlagReason(selectedItem.flaggedReason ?? "")
    setDraftAdminNote(selectedItem.adminNote ?? "")
  }, [selectedItem])

  const averageRating = useMemo(() => {
    if (!filteredItems.length) return 0
    const total = filteredItems.reduce((sum, item) => sum + (item.rating ?? 0), 0)
    return total / filteredItems.length
  }, [filteredItems])

  const flaggedCount = useMemo(
    () => filteredItems.filter((item) => item.moderationStatus === "flagged").length,
    [filteredItems]
  )

  const hiddenCount = useMemo(
    () => filteredItems.filter((item) => item.moderationStatus === "hidden").length,
    [filteredItems]
  )

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKeyword(search.trim())
    setPage(1)
  }

  const patchLocalItem = (
    feedbackId: string,
    updater: (item: FeedbackAdminRow) => FeedbackAdminRow
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.feedbackId === feedbackId ? updater(item) : item))
    )
  }

  const placeholderApiNotice = (actionName: string, endpoint: string, payload?: unknown) => {
    const payloadText =
      payload && Object.keys(payload as Record<string, unknown>).length > 0
        ? ` Payload: ${JSON.stringify(payload)}`
        : ""

    setNotice(
      `[Placeholder BE] Chưa có API thật cho thao tác "${actionName}". Gợi ý endpoint: ${endpoint}.${payloadText}`
    )
  }

  const handleApplyModeration = async () => {
    if (!selectedItem) return

    try {
      setSavingAction(true)
      setError("")
      setNotice("")

      patchLocalItem(selectedItem.feedbackId, (item) => ({
        ...item,
        moderationStatus: draftStatus,
        severity: draftSeverity,
        adminNote: draftAdminNote,
        isPinned: draftPinned,
        flaggedReason: draftFlagReason,
      }))

      placeholderApiNotice(
        "Lưu xử lý phản hồi",
        `PATCH /api/admin/feedbacks/${selectedItem.feedbackId}/moderation`,
        {
          moderationStatus: draftStatus,
          severity: draftSeverity,
          adminNote: draftAdminNote,
          isPinned: draftPinned,
          flaggedReason: draftFlagReason,
        }
      )
    } finally {
      setSavingAction(false)
    }
  }

  const handleDeleteFeedback = async () => {
    if (!selectedItem) return

    try {
      setDeletingId(selectedItem.feedbackId)
      setError("")
      setNotice("")

      await adminService.deleteFeedback(selectedItem.feedbackId)

      setItems((prev) =>
        prev.filter((item) => item.feedbackId !== selectedItem.feedbackId)
      )

      const remaining = items.filter(
        (item) => item.feedbackId !== selectedItem.feedbackId && !item.isDeleted
      )
      setSelectedId(remaining[0]?.feedbackId ?? "")

      setNotice("Đã xoá phản hồi thành công.")
    } catch (err: any) {
      setError(err?.response?.data?.message || "Xoá phản hồi thất bại.")
    } finally {
      setDeletingId("")
    }
  }

  const handleQuickAction = async (
    action: "mark_reviewing" | "mark_resolved" | "flag" | "hide" | "restore"
  ) => {
    if (!selectedItem) return

    const feedbackId = selectedItem.feedbackId

    switch (action) {
      case "mark_reviewing":
        patchLocalItem(feedbackId, (item) => ({
          ...item,
          moderationStatus: "reviewing",
        }))
        placeholderApiNotice(
          "Đánh dấu đang xử lý",
          `PATCH /api/admin/feedbacks/${feedbackId}/status`,
          { moderationStatus: "reviewing" }
        )
        break

      case "mark_resolved":
        patchLocalItem(feedbackId, (item) => ({
          ...item,
          moderationStatus: "resolved",
        }))
        placeholderApiNotice(
          "Đánh dấu đã xử lý",
          `PATCH /api/admin/feedbacks/${feedbackId}/status`,
          { moderationStatus: "resolved" }
        )
        break

      case "flag":
        patchLocalItem(feedbackId, (item) => ({
          ...item,
          moderationStatus: "flagged",
          flaggedReason:
            item.flaggedReason || "Nội dung cần admin kiểm tra thêm.",
        }))
        placeholderApiNotice(
          "Gắn cờ phản hồi",
          `PATCH /api/admin/feedbacks/${feedbackId}/flag`,
          { flagged: true }
        )
        break

      case "hide":
        patchLocalItem(feedbackId, (item) => ({
          ...item,
          moderationStatus: "hidden",
        }))
        placeholderApiNotice(
          "Ẩn phản hồi",
          `PATCH /api/admin/feedbacks/${feedbackId}/visibility`,
          { isHidden: true }
        )
        break

      case "restore":
        patchLocalItem(feedbackId, (item) => ({
          ...item,
          moderationStatus: "reviewing",
        }))
        placeholderApiNotice(
          "Khôi phục phản hồi",
          `PATCH /api/admin/feedbacks/${feedbackId}/visibility`,
          { isHidden: false }
        )
        break
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý phản hồi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi đánh giá, xem chi tiết, xoá phản hồi và giữ chỗ cho luồng xử lý admin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadFeedbacks(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Phản hồi đang hiển thị</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{totalResult}</h3>
              <p className="mt-2 text-sm text-slate-500">Sau khi áp dụng bộ lọc</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <MessageSquare className="h-5 w-5 text-slate-700" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Điểm trung bình</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {averageRating.toFixed(1)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">Theo danh sách đang xem</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Bị gắn cờ</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{flaggedCount}</h3>
              <p className="mt-2 text-sm text-slate-500">Ưu tiên kiểm tra nội dung</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3">
              <ShieldAlert className="h-5 w-5 text-rose-700" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Đã ẩn</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{hiddenCount}</h3>
              <p className="mt-2 text-sm text-slate-500">Đang là trạng thái nội bộ FE</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <EyeOff className="h-5 w-5 text-slate-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 xl:grid-cols-5"
        >
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo người dùng, nội dung, mã đơn, feedback ID..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="">Tất cả số sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ModerationStatus)
              setPage(1)
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="new">Mới</option>
            <option value="reviewing">Đang xử lý</option>
            <option value="resolved">Đã xử lý</option>
            <option value="flagged">Bị gắn cờ</option>
            <option value="hidden">Đã ẩn</option>
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value as "all" | SeverityLevel)
              setPage(1)
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 xl:col-start-4"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="high">Mức độ cao</option>
            <option value="medium">Mức độ trung bình</option>
            <option value="low">Mức độ thấp</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <MessageSquare className="h-7 w-7 text-slate-500" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            Không có phản hồi phù hợp
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Chưa tìm thấy phản hồi nào khớp với điều kiện lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {pagedItems.map((item) => {
                const isActive = selectedId === item.feedbackId

                return (
                  <button
                    key={item.feedbackId}
                    type="button"
                    onClick={() => setSelectedId(item.feedbackId)}
                    className={`w-full rounded-3xl border p-5 text-left shadow-sm transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold">
                              {item.userName || "Người dùng ẩn danh"}
                            </h3>

                            {item.isPinned ? (
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isActive
                                    ? "bg-white/15 text-white"
                                    : "bg-violet-50 text-violet-700"
                                }`}
                              >
                                Ghim
                              </span>
                            ) : null}
                          </div>

                          <p
                            className={`mt-1 text-sm ${
                              isActive ? "text-slate-200" : "text-slate-500"
                            }`}
                          >
                            {item.feedbackId}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              isActive
                                ? "border-white/20 bg-white/10 text-white"
                                : getModerationClasses(item.moderationStatus)
                            }`}
                          >
                            {statusLabelMap[item.moderationStatus]}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              isActive
                                ? "border-white/20 bg-white/10 text-white"
                                : getSeverityClasses(item.severity)
                            }`}
                          >
                            Mức độ {severityLabelMap[item.severity]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {renderStars(item.rating)}
                        <span
                          className={`text-sm font-semibold ${
                            isActive ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {item.rating ?? 0}/5
                        </span>
                      </div>

                      <p
                        className={`line-clamp-3 text-sm leading-6 ${
                          isActive ? "text-slate-100" : "text-slate-700"
                        }`}
                      >
                        {item.comment || "Không có nội dung phản hồi."}
                      </p>

                      <div
                        className={`grid grid-cols-1 gap-2 text-sm md:grid-cols-3 ${
                          isActive ? "text-slate-200" : "text-slate-500"
                        }`}
                      >
                        <p>
                          <span className="font-medium">User:</span> {item.userId || "--"}
                        </p>
                        <p>
                          <span className="font-medium">Order:</span> {item.orderId || "--"}
                        </p>
                        <p>
                          <span className="font-medium">Cập nhật:</span>{" "}
                          {formatDateTime(item.updatedAt || item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Hiển thị{" "}
                <span className="font-semibold text-slate-900">{pagedItems.length}</span> /{" "}
                <span className="font-semibold text-slate-900">{totalResult}</span> phản hồi
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
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedItem ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <MessageSquare className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Chưa chọn phản hồi
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Chọn một phản hồi ở danh sách bên trái để xem chi tiết và thao tác quản trị.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedItem.userName || "Người dùng ẩn danh"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Feedback ID: {selectedItem.feedbackId}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderStars(selectedItem.rating)}
                      <span className="text-sm font-semibold text-slate-700">
                        {selectedItem.rating ?? 0}/5
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      User ID
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                      {selectedItem.userId || "--"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Order ID
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                      {selectedItem.orderId || "--"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Tạo lúc
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatDateTime(selectedItem.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Cập nhật lúc
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatDateTime(selectedItem.updatedAt || selectedItem.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Nội dung phản hồi
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                    {selectedItem.comment || "Không có nội dung phản hồi."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">Thông tin xử lý admin</h3>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Trạng thái xử lý
                      </label>
                      <select
                        value={draftStatus}
                        onChange={(e) =>
                          setDraftStatus(
                            e.target.value as FeedbackAdminRow["moderationStatus"]
                          )
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      >
                        <option value="new">Mới</option>
                        <option value="reviewing">Đang xử lý</option>
                        <option value="resolved">Đã xử lý</option>
                        <option value="flagged">Bị gắn cờ</option>
                        <option value="hidden">Đã ẩn</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Mức độ ưu tiên
                      </label>
                      <select
                        value={draftSeverity}
                        onChange={(e) => setDraftSeverity(e.target.value as SeverityLevel)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      >
                        <option value="low">Thấp</option>
                        <option value="medium">Trung bình</option>
                        <option value="high">Cao</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Lý do gắn cờ
                      </label>
                      <input
                        value={draftFlagReason}
                        onChange={(e) => setDraftFlagReason(e.target.value)}
                        placeholder="Ví dụ: Nội dung công kích, spam, ngôn từ không phù hợp..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Ghi chú xử lý nội bộ
                      </label>
                      <textarea
                        value={draftAdminNote}
                        onChange={(e) => setDraftAdminNote(e.target.value)}
                        rows={5}
                        placeholder="Ghi rõ hướng xử lý, người phụ trách, kết quả kiểm tra, hướng phản hồi cho khách hàng..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={draftPinned}
                        onChange={(e) => setDraftPinned(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Ghim phản hồi này lên đầu danh sách admin
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => void handleApplyModeration()}
                      disabled={savingAction}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {savingAction ? "Đang lưu..." : "Lưu xử lý"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">Tác vụ nhanh</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void handleQuickAction("mark_reviewing")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      <Eye className="h-4 w-4" />
                      Chuyển sang đang xử lý
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleQuickAction("mark_resolved")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Đánh dấu đã xử lý
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleQuickAction("flag")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      <Flag className="h-4 w-4" />
                      Gắn cờ kiểm tra
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleQuickAction(
                          selectedItem.moderationStatus === "hidden" ? "restore" : "hide"
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      {selectedItem.moderationStatus === "hidden" ? (
                        <>
                          <Eye className="h-4 w-4" />
                          Khôi phục hiển thị
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Ẩn phản hồi
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteFeedback()}
                      disabled={deletingId === selectedItem.feedbackId}
                      className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === selectedItem.feedbackId
                        ? "Đang xoá..."
                        : "Xoá phản hồi"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Gợi ý API backend nên bổ sung
                    </h3>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>
                      1. <span className="font-semibold text-slate-900">GET /api/admin/feedbacks</span>{" "}
                      với filter: keyword, rating, moderationStatus, severity, fromDate, toDate, pageNumber, pageSize
                    </p>
                    <p>
                      2. <span className="font-semibold text-slate-900">PATCH /api/admin/feedbacks/{selectedItem.feedbackId}/moderation</span>{" "}
                      để lưu trạng thái, mức độ, ghi chú, cờ ghim
                    </p>
                    <p>
                      3. <span className="font-semibold text-slate-900">PATCH /api/admin/feedbacks/{selectedItem.feedbackId}/visibility</span>{" "}
                      với <code>isHidden</code>
                    </p>
                    <p>
                      4. <span className="font-semibold text-slate-900">PATCH /api/admin/feedbacks/{selectedItem.feedbackId}/flag</span>{" "}
                      với lý do gắn cờ
                    </p>
                    <p>
                      5. <span className="font-semibold text-slate-900">GET /api/admin/feedbacks/stats</span>{" "}
                      cho số liệu dashboard feedback
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFeedbacks
