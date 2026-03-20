import React, { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2, CreditCard, Loader2, XCircle } from "lucide-react"
import { confirmPayment, ConfirmPaymentResponse } from "@/services/payment.service"

/* ========= Helpers ========= */
const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const CART_KEY = "customer_cart_v1"

/* ========= UI tokens ========= */
const surfaceCard =
    "backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-6 border border-white/40"
const primaryBtn =
    "bg-gradient-to-r from-sky-400 to-cyan-400 text-white font-semibold rounded-xl shadow-md transition-all duration-300 active:scale-95 hover:brightness-105"
const secondaryBtn =
    "border border-sky-200 text-sky-700 bg-white/70 font-medium rounded-xl hover:bg-sky-50 transition disabled:opacity-50"
const muted = "text-slate-500"

type PageState =
    | { kind: "loading" }
    | { kind: "success"; orderCode: string }
    | { kind: "failed"; reason: string }
    | { kind: "cancelled" }

const PaymentReturnPage: React.FC = () => {
    const navigate = useNavigate()
    const [params] = useSearchParams()

    const [state, setState] = useState<PageState>({ kind: "loading" })

    useEffect(() => {
        const code = params.get("code")
        const status = params.get("status")
        const cancel = params.get("cancel")
        const orderCode = params.get("orderCode")

        if (cancel === "true" || status === "CANCELLED") {
            setState({ kind: "cancelled" })
            return
        }

        if (code === "00" && status === "PAID" && orderCode) {
            handleConfirm(orderCode)
            return
        }

        setState({
            kind: "failed",
            reason: "Giao dịch không thành công hoặc thiếu thông tin từ cổng thanh toán.",
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleConfirm = async (orderCode: string) => {
        try {
            const result: ConfirmPaymentResponse = await confirmPayment(orderCode)

            if (result.success) {
                localStorage.setItem(CART_KEY, JSON.stringify([]))
                window.dispatchEvent(new Event("cart:updated"))
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
    }

    /* ─── LOADING ─── */
    if (state.kind === "loading") {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
                <div className={cn(surfaceCard, "max-w-md mx-auto text-center")}>
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-sky-500" />
                    <div className="mt-4 text-lg font-semibold text-slate-900">
                        Đang xác nhận thanh toán...
                    </div>
                    <p className={cn("mt-2 text-sm", muted)}>
                        Vui lòng chờ trong giây lát, hệ thống đang xác minh giao dịch với PayOS.
                    </p>
                </div>
            </div>
        )
    }

    /* ─── CANCELLED ─── */
    if (state.kind === "cancelled") {
        return (
            <div className="min-h-screen bg-[#FAFAFA] px-8 pt-28 pb-10">
                <div className={cn(surfaceCard, "max-w-4xl mx-auto")}>
                    <div className="flex items-center gap-3">
                        <XCircle className="text-amber-500" />
                        <div className="text-lg font-semibold text-slate-900">
                            Bạn đã huỷ thanh toán
                        </div>
                    </div>
                    <p className={cn("mt-2 text-sm", muted)}>
                        Giao dịch đã bị huỷ. Đơn hàng vẫn đang chờ thanh toán, bạn có thể thử lại.
                    </p>
                    <div className="mt-5 flex gap-2">
                        <button
                            className={cn(secondaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/checkout")}
                        >
                            Quay lại thanh toán
                        </button>
                        <button
                            className={cn(primaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/cart")}
                        >
                            Về giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    /* ─── FAILED ─── */
    if (state.kind === "failed") {
        return (
            <div className="min-h-screen bg-[#FAFAFA] px-8 pt-28 pb-10">
                <div className={cn(surfaceCard, "max-w-4xl mx-auto")}>
                    <div className="flex items-center gap-3">
                        <XCircle className="text-rose-600" />
                        <div className="text-lg font-semibold text-slate-900">
                            Thanh toán không thành công
                        </div>
                    </div>
                    <p className={cn("mt-2 text-sm", muted)}>{state.reason}</p>
                    <div className="mt-5 flex gap-2">
                        <button
                            className={cn(secondaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/checkout")}
                        >
                            Quay lại thanh toán
                        </button>
                        <button
                            className={cn(primaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/cart")}
                        >
                            Về giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    /* ─── SUCCESS ─── */
    return (
        <div className="min-h-screen bg-[#FAFAFA] px-8 pt-5 pb-10">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className={cn(surfaceCard, "flex items-start justify-between gap-4")}>
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 size={14} />
                            Thanh toán thành công
                        </div>
                        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
                            Đơn hàng đã được xác nhận
                        </h1>
                        <p className={cn("mt-2 text-sm", muted)}>
                            Thanh toán qua PayOS đã hoàn tất. Hệ thống đang xử lý đơn hàng của bạn.
                        </p>
                    </div>

                    <div className="text-right">
                        <div className={cn("text-xs", muted)}>Mã giao dịch PayOS</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                            {state.orderCode}
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl bg-white/75 ring-1 ring-sky-100 shadow-sm p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-slate-900 font-semibold">Thông tin thanh toán</div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700 ring-1 ring-sky-100">
                            <CreditCard size={14} />
                            PayOS - Đã thanh toán
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white/70 ring-1 ring-sky-100 p-4">
                        <p className={cn("text-sm", muted)}>
                            Đơn hàng của bạn đang được xử lý. Bạn sẽ nhận được thông báo khi đơn sẵn
                            sàng.
                        </p>
                    </div>

                    <div className="mt-5 flex gap-2 justify-end">
                        <button
                            className={cn(secondaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/cart")}
                        >
                            Xem giỏ hàng
                        </button>
                        <button
                            className={cn(primaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/")}
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentReturnPage
