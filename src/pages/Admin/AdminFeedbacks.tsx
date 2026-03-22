import { useEffect, useMemo, useState } from "react"
import {
  MessageSquare,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  UserRound,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { FeedbackItem } from "@/types/admin.type"

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
            className={`h-4 w-4 ${active
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
              }`}
          />
        )
      })}
    </div>
  )
}

const FeedbackDetailCard = ({
  item,
  deletingId,
  onDelete,
}: {
  item: FeedbackItem
  deletingId: string
  onDelete: (feedbackId: string) => Promise<void>
}) => {
  const isDeleting = deletingId === item.feedbackId

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">
              {item.userName || "Người dùng ẩn danh"}
            </h3>
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1">
              {renderStars(item.rating)}
              <span className="text-xs font-semibold text-amber-700">
                {item.rating ?? 0}/5
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Feedback ID
              </p>
              <p className="mt-1 break-all text-sm font-medium text-slate-900">
                {item.feedbackId || "--"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                User ID
              </p>
              <p className="mt-1 break-all text-sm font-medium text-slate-900">
                {item.userId || "--"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Order ID
              </p>
              <p className="mt-1 break-all text-sm font-medium text-slate-900">
                {item.orderId || "--"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Cập nhật lúc
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {formatDateTime(item.updatedAt || item.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Nội dung phản hồi
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
              {item.comment || "Không có nội dung phản hồi."}
            </p>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-auto">
          <button
            type="button"
            onClick={() => void onDelete(item.feedbackId)}
            disabled={isDeleting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Đang xoá..." : "Xoá feedback"}
          </button>
        </div>
      </div>
    </div>
  )
}

const AdminFeedbacks = () => {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState("")
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [keyword, setKeyword] = useState("")
  const [ratingFilter, setRatingFilter] = useState("")

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalResult, setTotalResult] = useState(0)

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return items.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        item.userName?.toLowerCase().includes(normalizedKeyword) ||
        item.comment?.toLowerCase().includes(normalizedKeyword) ||
        item.orderId?.toLowerCase().includes(normalizedKeyword) ||
        item.feedbackId?.toLowerCase().includes(normalizedKeyword)

      const matchesRating =
        !ratingFilter || String(item.rating ?? "") === ratingFilter

      return Boolean(matchesKeyword && matchesRating)
    })
  }, [items, keyword, ratingFilter])

  const totalPages = useMemo(() => {
    const total = Math.ceil(totalResult / pageSize)
    return total > 0 ? total : 1
  }, [pageSize, totalResult])

  const averageRating = useMemo(() => {
    if (!filteredItems.length) return 0
    const total = filteredItems.reduce((sum, item) => sum + (item.rating ?? 0), 0)
    return total / filteredItems.length
  }, [filteredItems])

  const loadFeedbacks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const response = await adminService.getFeedbacks({
        pageNumber: page,
        pageSize,
      })

      setItems(response.items ?? [])
      setTotalResult(response.totalResult ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể tải danh sách feedback.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadFeedbacks()
  }, [page])

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKeyword(search.trim())
  }

  const handleDelete = async (feedbackId: string) => {
    try {
      setDeletingId(feedbackId)
      setError("")
      await adminService.deleteFeedback(feedbackId)
      await loadFeedbacks(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Xoá feedback thất bại.")
    } finally {
      setDeletingId("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Feedbacks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi phản hồi từ người dùng và xử lý các nội dung không phù hợp.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Feedback hiện có</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {filteredItems.length}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Số feedback sau khi áp dụng bộ lọc
              </p>
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
              <p className="mt-2 text-sm text-slate-500">
                Đánh giá trung bình của feedback đang hiển thị
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Trang hiện tại</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{page}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Dữ liệu đang xem theo phân trang
              </p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-3">
              <UserRound className="h-5 w-5 text-sky-700" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng số trang</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {totalPages}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Tính theo dữ liệu từ API
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3">
              <MessageSquare className="h-5 w-5 text-violet-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 xl:grid-cols-4"
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
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="">Tất cả số sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <MessageSquare className="h-7 w-7 text-slate-500" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            Không có feedback phù hợp
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Chưa tìm thấy phản hồi nào khớp với điều kiện lọc hiện tại.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => (
              <FeedbackDetailCard
                key={item.feedbackId}
                item={item}
                deletingId={deletingId}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Hiển thị{" "}
              <span className="font-semibold text-slate-900">
                {filteredItems.length}
              </span>{" "}
              /{" "}
              <span className="font-semibold text-slate-900">
                {totalResult}
              </span>{" "}
              feedback
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
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page >= totalPages}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminFeedbacks
