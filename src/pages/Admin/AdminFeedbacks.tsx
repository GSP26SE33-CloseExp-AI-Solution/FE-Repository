import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import axios from "axios"
import {
  MessageSquare,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  UserRound,
} from "lucide-react"

import axiosClient from "@/utils/axiosClient"

type FeedbackItem = {
  feedbackId: string
  userId: string
  userName: string
  orderId: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
}

type FeedbackListResponse = FeedbackItem[]

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  errors?: string[] | Record<string, unknown> | string | null
}

const PAGE_SIZE = 10
const DEBUG_SCOPE = "[AdminFeedbacks]"

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

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

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const isApiResponse = <T,>(value: unknown): value is ApiResponse<T> =>
  isObject(value) &&
  "success" in value &&
  "message" in value &&
  "data" in value

const extractErrorText = (errors: ApiResponse<unknown>["errors"]) => {
  if (Array.isArray(errors)) {
    return errors.filter(Boolean).join(", ")
  }

  if (typeof errors === "string") {
    return errors
  }

  if (isObject(errors)) {
    return Object.values(errors)
      .flatMap((value) => (Array.isArray(value) ? value : [String(value)]))
      .filter(Boolean)
      .join(", ")
  }

  return ""
}

const unwrapResponse = <T,>(payload: unknown): T => {
  console.log(`${DEBUG_SCOPE} unwrapResponse -> raw payload:`, payload)

  if (isApiResponse<T>(payload)) {
    if (!payload.success) {
      throw new Error(
        extractErrorText(payload.errors) ||
        payload.message ||
        "Yêu cầu không thành công"
      )
    }

    return payload.data
  }

  if (isObject(payload) && "data" in payload) {
    const nestedData = (payload as { data?: unknown }).data

    if (isApiResponse<T>(nestedData)) {
      if (!nestedData.success) {
        throw new Error(
          extractErrorText(nestedData.errors) ||
          nestedData.message ||
          "Yêu cầu không thành công"
        )
      }

      return nestedData.data
    }

    if (Array.isArray(nestedData)) {
      return nestedData as T
    }

    if (typeof nestedData === "boolean") {
      return nestedData as T
    }

    if (isObject(nestedData)) {
      return nestedData as T
    }
  }

  if (Array.isArray(payload)) {
    return payload as T
  }

  if (typeof payload === "boolean") {
    return payload as T
  }

  if (isObject(payload)) {
    return payload as T
  }

  throw new Error("Không nhận được dữ liệu phản hồi hợp lệ từ máy chủ")
}

const extractApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as unknown

    console.error(`${DEBUG_SCOPE} axios error:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      params: error.config?.params,
      requestData: error.config?.data,
    })

    if (isApiResponse<unknown>(responseData)) {
      return (
        extractErrorText(responseData.errors) ||
        responseData.message ||
        fallback
      )
    }

    if (isObject(responseData) && "message" in responseData) {
      const message = responseData.message
      if (typeof message === "string" && message.trim()) {
        return message
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    console.error(`${DEBUG_SCOPE} unknown error:`, error)
    return error.message
  }

  console.error(`${DEBUG_SCOPE} unknown error:`, error)
  return fallback
}

const feedbackApi = {
  async getAll() {
    const response = await axiosClient.get("/feedback")
    console.log(`${DEBUG_SCOPE} feedbackApi.getAll -> response:`, response)
    return unwrapResponse<FeedbackListResponse>(response)
  },

  async deleteById(feedbackId: string) {
    const response = await axiosClient.delete(`/feedback/${feedbackId}`)
    console.log(`${DEBUG_SCOPE} feedbackApi.deleteById -> response:`, response)
    return unwrapResponse<boolean>(response)
  },
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
            className={cn(
              "h-4 w-4",
              active ? "fill-amber-400 text-amber-400" : "text-slate-300"
            )}
          />
        )
      })}
    </div>
  )
}

const AdminFeedbacks = () => {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const [search, setSearch] = useState("")
  const [keyword, setKeyword] = useState("")
  const [ratingFilter, setRatingFilter] = useState("")

  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState("")
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

      console.log(`${DEBUG_SCOPE} loadFeedbacks -> start`)

      const response = await feedbackApi.getAll()

      console.log(`${DEBUG_SCOPE} loadFeedbacks -> normalized response:`, response)

      const safeItems = Array.isArray(response) ? response : []

      const sorted = [...safeItems].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      )

      setItems(sorted)

      setSelectedId((prev) => {
        if (prev && sorted.some((item) => item.feedbackId === prev)) return prev
        return sorted[0]?.feedbackId ?? ""
      })
    } catch (err) {
      setError(extractApiErrorMessage(err, "Không thể tải danh sách phản hồi."))
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

    return items.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        item.userName?.toLowerCase().includes(normalizedKeyword) ||
        item.comment?.toLowerCase().includes(normalizedKeyword) ||
        item.orderId?.toLowerCase().includes(normalizedKeyword) ||
        item.feedbackId?.toLowerCase().includes(normalizedKeyword) ||
        item.userId?.toLowerCase().includes(normalizedKeyword)

      const matchesRating =
        !ratingFilter || String(item.rating ?? "") === ratingFilter

      return Boolean(matchesKeyword && matchesRating)
    })
  }, [items, keyword, ratingFilter])

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
    return items.find((item) => item.feedbackId === selectedId) ?? null
  }, [items, selectedId])

  useEffect(() => {
    if (!selectedItem && filteredItems.length > 0) {
      setSelectedId(filteredItems[0].feedbackId)
    }
  }, [selectedItem, filteredItems])

  const averageRating = useMemo(() => {
    if (!filteredItems.length) return 0
    const total = filteredItems.reduce((sum, item) => sum + (item.rating ?? 0), 0)
    return total / filteredItems.length
  }, [filteredItems])

  const lowRatingCount = useMemo(
    () => filteredItems.filter((item) => (item.rating ?? 0) <= 2).length,
    [filteredItems]
  )

  const noCommentCount = useMemo(
    () => filteredItems.filter((item) => !item.comment?.trim()).length,
    [filteredItems]
  )

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKeyword(search.trim())
    setPage(1)
  }

  const handleDeleteFeedback = async () => {
    if (!selectedItem) return

    try {
      setDeletingId(selectedItem.feedbackId)
      setError("")
      setNotice("")

      console.log(`${DEBUG_SCOPE} handleDeleteFeedback -> deleting:`, selectedItem)

      await feedbackApi.deleteById(selectedItem.feedbackId)

      const deletedId = selectedItem.feedbackId

      setItems((prev) => prev.filter((item) => item.feedbackId !== deletedId))

      setSelectedId((prevSelectedId) => {
        if (prevSelectedId !== deletedId) return prevSelectedId

        const remaining = items.filter((item) => item.feedbackId !== deletedId)
        return remaining[0]?.feedbackId ?? ""
      })

      setNotice("Đã xoá phản hồi thành công.")
    } catch (err) {
      setError(extractApiErrorMessage(err, "Xoá phản hồi không thành công."))
    } finally {
      setDeletingId("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý phản hồi</h1>
        </div>

        <button
          type="button"
          onClick={() => void loadFeedbacks(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Làm mới
        </button>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
              <p className="text-sm font-medium text-slate-500">Đánh giá thấp</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{lowRatingCount}</h3>
              <p className="mt-2 text-sm text-slate-500">Feedback 1-2 sao</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3">
              <Star className="h-5 w-5 text-rose-700" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Không có phản hồi</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{noCommentCount}</h3>
              <p className="mt-2 text-sm text-slate-500">Chỉ có rating</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <UserRound className="h-5 w-5 text-slate-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          <div className="relative xl:col-span-3">
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

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Tìm kiếm
          </button>
        </form>
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
                    className={cn(
                      "w-full rounded-3xl border p-5 text-left shadow-sm transition",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold">
                            {item.userName || "Người dùng ẩn danh"}
                          </h3>

                          <p
                            className={cn(
                              "mt-1 text-sm",
                              isActive ? "text-slate-200" : "text-slate-500"
                            )}
                          >
                            {item.feedbackId}
                          </p>
                        </div>

                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            isActive
                              ? "bg-white/10 text-white"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {item.rating ?? 0}/5 sao
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {renderStars(item.rating)}
                      </div>

                      <p
                        className={cn(
                          "line-clamp-3 text-sm leading-6",
                          isActive ? "text-slate-100" : "text-slate-700"
                        )}
                      >
                        {item.comment || "Không có nội dung phản hồi."}
                      </p>

                      <div
                        className={cn(
                          "grid grid-cols-1 gap-2 text-sm md:grid-cols-3",
                          isActive ? "text-slate-200" : "text-slate-500"
                        )}
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
                  Chọn một phản hồi ở danh sách bên trái để xem chi tiết.
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
                    <Trash2 className="h-4 w-4 text-rose-700" />
                    <h3 className="text-sm font-bold text-slate-900">Thao tác</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => void handleDeleteFeedback()}
                      disabled={deletingId === selectedItem.feedbackId}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === selectedItem.feedbackId
                        ? "Đang xoá..."
                        : "Xoá phản hồi"}
                    </button>
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
