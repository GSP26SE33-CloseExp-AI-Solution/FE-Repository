import React, { Fragment, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Loader2,
    MessageSquare,
    Star,
} from "lucide-react"

import { useAuthContext } from "@/contexts/AuthContext"
import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"
import { feedbackService } from "@/services/feedback.service"
import { orderService } from "@/services/order.service"
import type { FeedbackItem } from "@/types/feedback.type"
import type { OrderDetails } from "@/types/order.type"
import { showError, showSuccess } from "@/utils/toast"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
const secondaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"

const RATING_LABELS: Record<number, string> = {
    1: "Rất không hài lòng",
    2: "Không hài lòng",
    3: "Bình thường",
    4: "Hài lòng",
    5: "Rất hài lòng",
}

const isOrderCompleted = (status?: string) =>
    (status || "").toLowerCase() === "completed"

type StarRatingInputProps = {
    value: number
    onChange: (value: number) => void
    disabled?: boolean
}

const StarRatingInput = ({ value, onChange, disabled }: StarRatingInputProps) => {
    const [hover, setHover] = useState(0)
    const active = hover || value

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={disabled}
                        onMouseEnter={() => !disabled && setHover(star)}
                        onMouseLeave={() => !disabled && setHover(0)}
                        onClick={() => onChange(star)}
                        className="rounded-lg p-1 transition hover:bg-amber-50 disabled:cursor-not-allowed"
                        aria-label={`${star} sao`}
                    >
                        <Star
                            size={32}
                            className={cn(
                                "transition",
                                star <= active
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300",
                            )}
                        />
                    </button>
                ))}
            </div>
            {active > 0 ? (
                <span className="text-sm font-medium text-amber-700">
                    {RATING_LABELS[active]}
                </span>
            ) : (
                <span className="text-sm text-slate-500">
                    Chọn số sao từ 1 đến 5
                </span>
            )}
        </div>
    )
}

const OrderFeedbackPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuthContext()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [order, setOrder] = useState<OrderDetails | null>(null)
    const [existingFeedback, setExistingFeedback] = useState<FeedbackItem | null>(
        null,
    )
    const [pageError, setPageError] = useState<string | null>(null)

    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState("")
    const [isEditing, setIsEditing] = useState(false)

    const breadcrumbs = useMemo(
        () =>
            getBreadcrumbsByPath(location.pathname, {
                dynamicLabel: "Đánh giá dịch vụ",
            }),
        [location.pathname],
    )

    useEffect(() => {
        if (!orderId) {
            setPageError("Thiếu mã đơn hàng.")
            setLoading(false)
            return
        }

        let mounted = true

        const run = async () => {
            try {
                setLoading(true)
                setPageError(null)

                const [orderRes, feedbacks] = await Promise.all([
                    orderService.getOrderDetails(orderId),
                    feedbackService.getByOrderId(orderId),
                ])

                if (!mounted) return

                if (!isOrderCompleted(orderRes.status)) {
                    setOrder(orderRes)
                    setPageError(
                        "Chỉ có thể đánh giá khi đơn hàng đã hoàn tất (Completed).",
                    )
                    return
                }

                const mine = feedbacks.find(
                    (item) => item.userId === user?.userId,
                )

                setOrder(orderRes)
                setExistingFeedback(mine ?? null)

                if (mine) {
                    setRating(mine.rating)
                    setComment(mine.comment ?? "")
                }
            } catch (err) {
                if (!mounted) return
                const message =
                    err instanceof Error
                        ? err.message
                        : "Không thể tải thông tin đánh giá."
                setPageError(message)
                setOrder(null)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        void run()

        return () => {
            mounted = false
        }
    }, [orderId, user?.userId])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!orderId || !order || submitting) return

        if (rating < 1 || rating > 5) {
            showError("Vui lòng chọn đánh giá từ 1 đến 5 sao")
            return
        }

        const trimmedComment = comment.trim()

        try {
            setSubmitting(true)

            if (existingFeedback && isEditing) {
                const updated = await feedbackService.update(
                    existingFeedback.feedbackId,
                    {
                        rating,
                        comment: trimmedComment || null,
                    },
                )
                setExistingFeedback(updated)
                setIsEditing(false)
                showSuccess("Đã cập nhật đánh giá của bạn")
                return
            }

            if (existingFeedback) return

            const created = await feedbackService.create({
                orderId,
                rating,
                comment: trimmedComment || null,
            })

            setExistingFeedback(created)
            showSuccess("Cảm ơn bạn đã đánh giá dịch vụ!")
        } catch (err) {
            showError(
                err instanceof Error ? err.message : "Gửi đánh giá thất bại",
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <main className="mx-auto w-full max-w-[720px] px-4 py-8">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                        <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                        Đang tải...
                    </div>
                </main>
            </div>
        )
    }

    if (pageError && !order) {
        return (
            <div className="min-h-screen bg-slate-50">
                <main className="mx-auto w-full max-w-[720px] px-4 py-8">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                            <div>
                                <p className="font-semibold text-rose-800">
                                    Không thể mở trang đánh giá
                                </p>
                                <p className="mt-1 text-sm text-rose-700">
                                    {pageError}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/orders")}
                            className={cn(secondaryBtn, "mt-4")}
                        >
                            <ArrowLeft size={14} />
                            Quay lại đơn hàng
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    const showReadOnly =
        Boolean(existingFeedback) && !isEditing && !pageError

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="mx-auto w-full max-w-[720px] px-4 py-6 sm:px-5">
                <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="transition hover:text-slate-800"
                    >
                        Trang chủ
                    </button>
                    {breadcrumbs.map((crumb, index) => (
                        <Fragment key={`${crumb}-${index}`}>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span
                                className={cn(
                                    index === breadcrumbs.length - 1 &&
                                    "font-medium text-slate-800",
                                )}
                            >
                                {crumb}
                            </span>
                        </Fragment>
                    ))}
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-sky-50 px-5 py-5">
                        <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-amber-600 shadow-sm ring-1 ring-amber-100">
                                <MessageSquare size={22} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-950">
                                    Đánh giá dịch vụ
                                </h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    Đơn{" "}
                                    <span className="font-semibold text-slate-900">
                                        {order?.orderCode || orderId}
                                    </span>
                                    {order?.finalAmount != null ? (
                                        <>
                                            {" "}
                                            · Tổng{" "}
                                            {new Intl.NumberFormat("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                            }).format(order.finalAmount)}
                                        </>
                                    ) : null}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5">
                        {pageError ? (
                            <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                {pageError}
                            </div>
                        ) : null}

                        {showReadOnly && existingFeedback ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                    <CheckCircle2 size={18} />
                                    Bạn đã đánh giá đơn hàng này
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Điểm đánh giá
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={24}
                                                className={cn(
                                                    star <= existingFeedback.rating
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-slate-200",
                                                )}
                                            />
                                        ))}
                                        <span className="text-sm font-medium text-slate-700">
                                            {RATING_LABELS[existingFeedback.rating]}
                                        </span>
                                    </div>
                                </div>

                                {existingFeedback.comment ? (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Nhận xét
                                        </p>
                                        <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                                            {existingFeedback.comment}
                                        </p>
                                    </div>
                                ) : null}

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className={secondaryBtn}
                                    >
                                        Chỉnh sửa đánh giá
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(`/orders/${orderId}`)
                                        }
                                        className={primaryBtn}
                                    >
                                        Xem chi tiết đơn
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {existingFeedback && isEditing ? (
                                    <p className="text-sm text-slate-600">
                                        Cập nhật đánh giá đã gửi trước đó.
                                    </p>
                                ) : (
                                    <p className="text-sm leading-6 text-slate-600">
                                        Trải nghiệm của bạn giúp chúng tôi cải thiện
                                        chất lượng giao hàng, đóng gói và hỗ trợ
                                        khách hàng.
                                    </p>
                                )}

                                <div>
                                    <label className="text-sm font-semibold text-slate-800">
                                        Mức độ hài lòng{" "}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="mt-3">
                                        <StarRatingInput
                                            value={rating}
                                            onChange={setRating}
                                            disabled={submitting || Boolean(pageError)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="feedback-comment"
                                        className="text-sm font-semibold text-slate-800"
                                    >
                                        Nhận xét thêm (tuỳ chọn)
                                    </label>
                                    <textarea
                                        id="feedback-comment"
                                        rows={5}
                                        maxLength={1000}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        disabled={submitting || Boolean(pageError)}
                                        placeholder="Chia sẻ chi tiết về chất lượng sản phẩm, giao hàng hoặc dịch vụ..."
                                        className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
                                    />
                                    <p className="mt-1 text-right text-xs text-slate-400">
                                        {comment.length}/1000
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="submit"
                                        disabled={
                                            submitting ||
                                            Boolean(pageError) ||
                                            rating < 1
                                        }
                                        className={primaryBtn}
                                    >
                                        {submitting ? (
                                            <Loader2
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : null}
                                        {existingFeedback && isEditing
                                            ? "Lưu thay đổi"
                                            : "Gửi đánh giá"}
                                    </button>

                                    {isEditing ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (existingFeedback) {
                                                    setRating(existingFeedback.rating)
                                                    setComment(
                                                        existingFeedback.comment ?? "",
                                                    )
                                                }
                                                setIsEditing(false)
                                            }}
                                            className={secondaryBtn}
                                        >
                                            Huỷ
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(`/orders/${orderId}`)
                                            }
                                            className={secondaryBtn}
                                        >
                                            <ArrowLeft size={14} />
                                            Quay lại đơn
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}

export default OrderFeedbackPage
