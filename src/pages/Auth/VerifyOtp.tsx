import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Loader2, MailCheck } from "lucide-react"

import Logo from "@/assets/logo.png"
import { useAuth } from "@/hooks/useAuth"
import { showError, showInfo, showSuccess } from "@/utils/toast"

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

const VerifyOtp = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { verifyOtp, resendOtp, loading } = useAuth()

    const initialEmail =
        (location.state?.email as string | undefined)?.trim() ?? ""

    const redirectTo =
        (location.state?.redirectTo as string | undefined) ?? "/redirect"

    const [email] = useState(initialEmail)
    const [otpCode, setOtpCode] = useState("")
    const [countdown, setCountdown] = useState(RESEND_SECONDS)

    useEffect(() => {
        if (!initialEmail) {
            navigate("/", { replace: true })
        }
    }, [initialEmail, navigate])

    useEffect(() => {
        if (countdown <= 0) return

        const timer = window.setTimeout(() => {
            setCountdown((prev) => prev - 1)
        }, 1000)

        return () => window.clearTimeout(timer)
    }, [countdown])

    const isOtpValid = useMemo(
        () => /^\d{6}$/.test(otpCode.trim()),
        [otpCode],
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        const normalizedOtp = otpCode.trim()

        if (!email) {
            showError("Không tìm thấy email cần xác thực")
            return
        }

        if (!/^\d{6}$/.test(normalizedOtp)) {
            showError("Vui lòng nhập mã OTP gồm 6 chữ số")
            return
        }

        try {
            await verifyOtp({
                email,
                otpCode: normalizedOtp,
            })

            showSuccess("Xác thực email thành công, vui lòng đăng nhập lại")
            navigate("/", {
                replace: true,
                state: {
                    redirectTo,
                    verifiedEmail: email,
                },
            })
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Xác minh OTP không thành công"
            showError(message)
        }
    }

    const handleResend = async () => {
        if (loading || countdown > 0) return

        if (!email) {
            showError("Không tìm thấy email để gửi lại OTP")
            return
        }

        try {
            await resendOtp({ email })
            setCountdown(RESEND_SECONDS)
            showInfo("Một mã OTP mới đã được gửi đến email của bạn")
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Gửi lại OTP không thành công"
            showError(message)
        }
    }

    return (
        <div className="eco-animated-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            <div className="bg-glow" />

            <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-8 space-y-6 border border-white/40 animate-[fadeInUp_0.6s_ease-out]">
                <div className="text-center">
                    <Link
                        to="/"
                        className="group inline-flex flex-col items-center"
                    >
                        <div className="mx-auto h-20 w-28 overflow-hidden">
                            <img
                                src={Logo}
                                alt="CloseExp AI"
                                className="h-full w-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                            />
                        </div>

                        <h1 className="mt-2 text-2xl font-bold text-gray-800 transition-all duration-300 group-hover:text-emerald-600 group-hover:drop-shadow-[0_2px_10px_rgba(16,185,129,0.18)]">
                            Xác thực email
                        </h1>

                        <p className="mt-1 text-sm text-gray-500 transition-all duration-300 group-hover:text-gray-600">
                            Nhập mã OTP đã được gửi về email của bạn
                        </p>
                    </Link>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <div className="flex items-start gap-3">
                        <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-medium">Email đang xác thực</p>
                            <p className="break-all">{email || "--"}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Mã OTP
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={OTP_LENGTH}
                            value={otpCode}
                            onChange={(e) =>
                                setOtpCode(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="Nhập 6 chữ số"
                            className="w-full mt-1 px-4 py-2 border rounded-lg text-center tracking-[0.35em]
                                       focus:ring-2 focus:ring-green-300
                                       focus:border-green-400 outline-none transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isOtpValid}
                        className="w-full bg-gradient-to-r from-green-400 to-emerald-500
                                   text-white font-semibold py-2.5 rounded-lg shadow-md
                                   transition-all duration-300 active:scale-95
                                   disabled:opacity-70"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" size={18} />
                                Đang xác thực...
                            </span>
                        ) : (
                            "Xác thực OTP"
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading || countdown > 0}
                        className="w-full border border-gray-200 text-gray-600
                                   font-medium py-2.5 rounded-lg hover:bg-gray-50
                                   transition disabled:opacity-50"
                    >
                        {countdown > 0
                            ? `Gửi lại OTP sau ${countdown}s`
                            : "Gửi lại OTP"}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/", { replace: true })}
                        disabled={loading}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
                    >
                        Quay về đăng nhập
                    </button>
                </form>

                <p className="text-xs text-center text-gray-400">
                    © {new Date().getFullYear()} CloseExp AI Việt Nam
                </p>
            </div>
        </div>
    )
}

export default VerifyOtp
