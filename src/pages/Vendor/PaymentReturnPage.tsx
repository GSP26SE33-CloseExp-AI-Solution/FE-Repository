import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Loader2,
    ReceiptText,
    XCircle,
} from "lucide-react"

import { orderService } from "@/services/order.service"
import type { ConfirmPaymentResponse } from "@/types/order.type"
import { cartStorage } from "@/utils/orderStorage"
import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99]"
const secondaryBtn =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
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
                await orderService.confirmPaymentWithRetry(orderCode)

            if (result.success) {
                cartStorage.clear()
                setState({ kind: "success", orderCode })
            } else {
                setState({
                    kind: "failed",
                    reason:
                        result.message ||
                        `Thanh toán chưa hoàn tất (trạng thái: ${result.payOsStatus ?? "unknown"
                        }).`,
                })
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Xác nhận thanh toán không thành công"
            setState({ kind: "failed", reason: message })
        }
    }, [])

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
                            index === breadcrumbs.length - 1
                                ? "font-medium text-slate-800"
                                : "text-slate-500",
                        )}
                    >
                        {crumb}
                    </span>
                </Fragment>
            ))}
        </div>
    )

    if (state.kind === "loading") {
        return (
            <div className="min-h-screen bg-slate-50">
                <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-5 lg:px-6">
                    {breadcrumbRow}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>

                            <div>
                                <div className="text-base font-semibold text-slate-950">
                                    Đang xác nhận thanh toán...
                                </div>
                                <p className="mt-1 text-[13px] text-slate-500">
                                    Hệ thống đang đối soát trạng thái thanh toán
                                    từ PayOS. Bạn chờ một chút nha.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    if (state.kind === "cancelled") {
        return (
            <div className="min-h-screen bg-slate-50">
                <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-5 lg:px-6">
                    {breadcrumbRow}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                                <XCircle size={21} />
                            </div>

                            <div>
                                <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                    Đã hủy thanh toán
                                </div>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                                    Bạn đã hủy thanh toán
                                </h1>

                                <p className={cn("mt-1 text-[13px] leading-6", muted)}>
                                    Giao dịch đã bị hủy. Đơn hàng vẫn đang chờ
                                    thanh toán, bạn có thể thử lại từ trang
                                    checkout.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                type="button"
                                className={primaryBtn}
                                onClick={() => navigate("/checkout")}
                            >
                                Quay lại thanh toán
                            </button>

                            <button
                                type="button"
                                className={secondaryBtn}
                                onClick={() => navigate("/cart")}
                            >
                                Về giỏ hàng
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    if (state.kind === "failed") {
        return (
            <div className="min-h-screen bg-slate-50">
                <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-5 lg:px-6">
                    {breadcrumbRow}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                                <XCircle size={21} />
                            </div>

                            <div>
                                <div className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                                    Thanh toán thất bại
                                </div>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                                    Thanh toán không thành công
                                </h1>

                                <p className={cn("mt-1 text-[13px] leading-6", muted)}>
                                    {state.reason}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                type="button"
                                className={primaryBtn}
                                onClick={() => navigate("/checkout")}
                            >
                                Quay lại thanh toán
                            </button>

                            <button
                                type="button"
                                className={secondaryBtn}
                                onClick={() => navigate("/cart")}
                            >
                                Về giỏ hàng
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-5 lg:px-6">
                {breadcrumbRow}

                <section className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                <CheckCircle2 size={22} />
                            </div>

                            <div>
                                <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                    PayOS đã xác nhận
                                </div>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                                    Thanh toán thành công
                                </h1>

                                <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-500">
                                    Đơn hàng đã được thanh toán và đang chờ hệ
                                    thống xử lý.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:text-right">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Mã giao dịch PayOS
                            </div>
                            <div className="mt-0.5 text-[14px] font-bold text-slate-900">
                                {state.orderCode}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Thanh toán
                            </div>
                            <h2 className="mt-1 text-lg font-bold text-slate-950">
                                Thông tin thanh toán
                            </h2>
                        </div>

                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                            <CreditCard size={17} />
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex items-start gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sky-700 ring-1 ring-slate-200">
                                <ReceiptText size={16} />
                            </div>

                            <div>
                                <div className="text-[13px] font-bold text-slate-950">
                                    PayOS — Đã thanh toán
                                </div>
                                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                                    Bạn có thể xem chi tiết đơn trong mục đơn
                                    hàng của tôi.
                                </p>
                            </div>
                        </div>
                    </div>

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
            </main>
        </div>
    )
}

export default PaymentReturnPage
