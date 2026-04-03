import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Loader2,
    XCircle,
} from "lucide-react"

import {
    confirmPaymentWithRetry,
    type ConfirmPaymentResponse,
} from "@/services/payment.service"
import { cartStorage } from "@/utils/orderStorage"
import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const panel =
    "rounded-[24px] border border-slate-200/70 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
const secondaryBtn =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
const muted = "text-slate-500"

type PageState =
    | { kind: "loading" }
    | { kind: "success"; orderCode: string }
    | { kind: "failed"; reason: string }
    | { kind: "cancelled" }

const PaymentReturnPage: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [state, setState] = useState<PageState>({ kind: "loading" })

    const breadcrumbs = useMemo(
        () => getBreadcrumbsByPath(location.pathname),
        [location.pathname],
    )

    const runConfirmWithRetry = useCallback(async (orderCode: string) => {
        try {
            const result: ConfirmPaymentResponse =
                await confirmPaymentWithRetry(orderCode)

            if (result.success) {
                cartStorage.clear()
                setState({ kind: "success", orderCode })
            } else {
                setState({
                    kind: "failed",
                    reason:
                        result.message ||
                        `Thanh toán chưa hoàn tất (trạng thái: ${result.payOsStatus ?? "unknown"}).`,
                })
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Xác nhận thanh toán thất bại"
            setState({ kind: "failed", reason: message })
        }
    }, [])

    // Parse query theo chuỗi search để effect chỉ chạy lại khi URL query đổi (tránh lặp với PayOS redirect)
    const { search } = location
    useEffect(() => {
        const q = new URLSearchParams(search)
        const code = q.get("code")
        const payStatus = q.get("status")
        const cancel = q.get("cancel")
        const orderCode = q.get("orderCode")

        if (cancel === "true" || payStatus === "CANCELLED") {
            setState({ kind: "cancelled" })
            return
        }

        if (code === "00" && payStatus === "PAID" && orderCode) {
            void runConfirmWithRetry(orderCode)
            return
        }

        setState({
            kind: "failed",
            reason:
                "Giao dịch không thành công hoặc thiếu thông tin từ cổng thanh toán.",
        })
    }, [search, runConfirmWithRetry])

    const breadcrumbRow = (
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
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
                        className={
                            index === breadcrumbs.length - 1
                                ? "font-medium text-slate-800"
                                : "text-slate-500"
                        }
                    >
                        {crumb}
                    </span>
                </Fragment>
            ))}
        </div>
    )

    if (state.kind === "loading") {
        return (
            <div className="min-h-screen bg-slate-50/70 py-8">
                <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
                    <div className="space-y-6">
                        {breadcrumbRow}
                        <section className={cn(panel, "mx-auto max-w-4xl p-5 sm:p-6")}>
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                                <div className="text-base font-semibold text-slate-900">
                                    Đang xác nhận thanh toán...
                                </div>
                            </div>
                            <p className={cn("mt-3 text-[13px] leading-relaxed", muted)}>
                                Hệ thống đang đồng bộ với PayOS (có thể thử lại vài lần nếu
                                redirect nhanh hơn webhook).
                            </p>
                        </section>
                    </div>
                </main>
            </div>
        )
    }

    if (state.kind === "cancelled") {
        return (
            <div className="min-h-screen bg-slate-50/70 py-8">
                <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
                    <div className="space-y-6">
                        {breadcrumbRow}
                        <section className={cn(panel, "p-5 sm:p-6")}>
                            <div className="flex items-center gap-3">
                                <XCircle className="text-amber-500" />
                                <div className="text-base font-semibold text-slate-900">
                                    Bạn đã hủy thanh toán
                                </div>
                            </div>
                            <p className={cn("mt-2 text-[13px]", muted)}>
                                Giao dịch đã bị hủy. Đơn hàng vẫn đang chờ thanh toán, bạn có thể
                                thử lại.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    className={secondaryBtn}
                                    onClick={() => navigate("/checkout")}
                                >
                                    Quay lại thanh toán
                                </button>
                                <button
                                    type="button"
                                    className={primaryBtn}
                                    onClick={() => navigate("/cart")}
                                >
                                    Về giỏ hàng
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        )
    }

    if (state.kind === "failed") {
        return (
            <div className="min-h-screen bg-slate-50/70 py-8">
                <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
                    <div className="space-y-6">
                        {breadcrumbRow}
                        <section className={cn(panel, "p-5 sm:p-6")}>
                            <div className="flex items-center gap-3">
                                <XCircle className="text-rose-600" />
                                <div className="text-base font-semibold text-slate-900">
                                    Thanh toán không thành công
                                </div>
                            </div>
                            <p className={cn("mt-2 text-[13px]", muted)}>{state.reason}</p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    className={secondaryBtn}
                                    onClick={() => navigate("/checkout")}
                                >
                                    Quay lại thanh toán
                                </button>
                                <button
                                    type="button"
                                    className={primaryBtn}
                                    onClick={() => navigate("/cart")}
                                >
                                    Về giỏ hàng
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/70 py-8">
            <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
                <div className="space-y-5">
                    {breadcrumbRow}

                    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-5 py-5 md:px-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                        <CheckCircle2 className="h-7 w-7" />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-[22px] font-bold text-slate-900">
                                                Thanh toán thành công
                                            </h1>

                                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700">
                                                PayOS đã xác nhận
                                            </span>
                                        </div>

                                        <p className="mt-1 text-[13px] text-slate-500">
                                            Đơn hàng đã được thanh toán và đang chờ hệ thống xử lý.
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left lg:text-right">
                                    <div className={cn("text-[11px]", muted)}>Mã giao dịch PayOS</div>
                                    <div className="mt-1 text-base font-bold text-slate-900">
                                        {state.orderCode}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={cn(panel, "p-4 sm:p-5")}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-[13px] font-semibold text-slate-900">
                                Thông tin thanh toán
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] text-sky-700 ring-1 ring-sky-100">
                                <CreditCard size={14} />
                                PayOS — Đã thanh toán
                            </div>
                        </div>

                        <p className={cn("mt-4 text-[13px] leading-relaxed", muted)}>
                            Bạn có thể xem chi tiết đơn trong mục đơn hàng của tôi.
                        </p>

                        <div className="mt-5 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                className={secondaryBtn}
                                onClick={() => navigate("/orders")}
                            >
                                Xem đơn hàng của tôi
                            </button>
                            <button
                                type="button"
                                className={primaryBtn}
                                onClick={() => navigate("/")}
                            >
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default PaymentReturnPage
