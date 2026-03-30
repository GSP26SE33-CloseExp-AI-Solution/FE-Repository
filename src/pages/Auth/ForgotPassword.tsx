import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    Eye,
    EyeOff,
    Lock,
    Loader2,
    Mail,
    ShieldCheck,
} from "lucide-react"

import Logo from "@/assets/logo.png"
import { showError, showSuccess } from "@/utils/toast"
import {
    forgotPasswordApi,
    resetPasswordApi,
} from "@/services/auth.service"

type ForgotPasswordStep = "request" | "reset" | "done"

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const validateResetPassword = (value: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.$!%*?&])[A-Za-z\d@.$!%*?&]{8,}$/.test(
        value
    )
}

const getResetPasswordError = (value: string) => {
    if (!value) return "Vui lòng nhập mật khẩu mới"
    if (value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự"
    if (!/[A-Z]/.test(value)) return "Mật khẩu phải có ít nhất 1 chữ hoa"
    if (!/[a-z]/.test(value)) return "Mật khẩu phải có ít nhất 1 chữ thường"
    if (!/\d/.test(value)) return "Mật khẩu phải có ít nhất 1 số"
    if (!/[@.$!%*?&]/.test(value)) {
        return "Mật khẩu phải có ít nhất 1 ký hiệu đặc biệt: @ . $ ! % * ? &"
    }
    if (/[^A-Za-z\d@.$!%*?&]/.test(value)) {
        return "Mật khẩu chỉ được chứa ký tự đặc biệt thuộc nhóm: @ . $ ! % * ? &"
    }
    return ""
}

const ForgotPassword = () => {
    const navigate = useNavigate()

    const [step, setStep] = useState<ForgotPasswordStep>("request")
    const [loading, setLoading] = useState(false)

    const [email, setEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""))
    const otpRefs = useRef<Array<HTMLInputElement | null>>([])

    const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS)

    const otpCode = otpDigits.join("")
    const passwordError = useMemo(
        () => getResetPasswordError(newPassword),
        [newPassword]
    )

    useEffect(() => {
        if (step !== "reset") return
        if (resendCountdown <= 0) return

        const timer = window.setInterval(() => {
            setResendCountdown((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [step, resendCountdown])

    useEffect(() => {
        if (step === "reset") {
            window.setTimeout(() => otpRefs.current[0]?.focus(), 100)
        }
    }, [step])

    const canSubmitRequest = useMemo(() => {
        return Boolean(email.trim() && validateEmail(email.trim()))
    }, [email])

    const canSubmitReset = useMemo(() => {
        return Boolean(
            email.trim() &&
            validateEmail(email.trim()) &&
            otpCode.length === OTP_LENGTH &&
            validateResetPassword(newPassword) &&
            confirmPassword === newPassword
        )
    }, [email, otpCode, newPassword, confirmPassword])

    const formatCountdown = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainSeconds = seconds % 60
        return `${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`
    }

    const resetOtpInputs = () => {
        setOtpDigits(Array(OTP_LENGTH).fill(""))
        window.setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        if (!canSubmitRequest) {
            showError("Vui lòng nhập email hợp lệ")
            return
        }

        try {
            setLoading(true)

            const res = await forgotPasswordApi({
                email: email.trim(),
            })

            showSuccess(
                res.message ||
                "Vui lòng kiểm tra email, mã OTP đã được gửi đến email của bạn."
            )

            resetOtpInputs()
            setResendCountdown(RESEND_SECONDS)
            setStep("reset")
        } catch (error) {
            console.error("forgot password error", error)
            showError(
                error instanceof Error
                    ? error.message
                    : "Không thể gửi mã đặt lại mật khẩu"
            )
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        if (otpCode.length !== OTP_LENGTH) {
            showError("Vui lòng nhập đầy đủ 6 số OTP")
            return
        }

        if (!validateResetPassword(newPassword)) {
            showError(passwordError || "Mật khẩu mới không hợp lệ")
            return
        }

        if (confirmPassword !== newPassword) {
            showError("Mật khẩu xác nhận không khớp")
            return
        }

        try {
            setLoading(true)

            const res = await resetPasswordApi({
                email: email.trim(),
                otpCode,
                newPassword,
            })

            showSuccess(res.message || "Đặt lại mật khẩu thành công")
            setStep("done")
        } catch (error) {
            console.error("reset password error", error)
            showError(
                error instanceof Error ? error.message : "Đặt lại mật khẩu không thành công"
            )
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (loading || resendCountdown > 0) return

        try {
            setLoading(true)

            const res = await forgotPasswordApi({
                email: email.trim(),
            })

            showSuccess(
                res.message ||
                "Vui lòng kiểm tra email, mã OTP đã được gửi lại."
            )
            resetOtpInputs()
            setResendCountdown(RESEND_SECONDS)
        } catch (error) {
            console.error("resend forgot password otp error", error)
            showError(
                error instanceof Error
                    ? error.message
                    : "Không thể gửi lại mã OTP"
            )
        } finally {
            setLoading(false)
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1)
        const next = [...otpDigits]
        next[index] = digit
        setOtpDigits(next)

        if (digit && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace") {
            if (otpDigits[index]) {
                const next = [...otpDigits]
                next[index] = ""
                setOtpDigits(next)
                return
            }

            if (index > 0) {
                otpRefs.current[index - 1]?.focus()
                const next = [...otpDigits]
                next[index - 1] = ""
                setOtpDigits(next)
            }
        }

        if (e.key === "ArrowLeft" && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }

        if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, OTP_LENGTH)

        if (!pasted) return

        const next = Array(OTP_LENGTH).fill("")
        pasted.split("").forEach((char, idx) => {
            next[idx] = char
        })

        setOtpDigits(next)

        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
        otpRefs.current[focusIndex]?.focus()
    }

    return (
        <div className="eco-animated-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
            <div className="bg-glow" />

            <div className="relative z-10 w-full max-w-2xl space-y-6 rounded-2xl border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
                <div className="text-center space-y-2">
                    <Link to="/" className="group inline-flex flex-col items-center">
                        <div className="mx-auto h-20 w-28 overflow-hidden">
                            <img
                                src={Logo}
                                alt="CloseExp AI"
                                className="h-full w-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_24px_rgba(16,185,129,0.4)]"
                            />
                        </div>
                    </Link>

                    <h1 className="pt-1 text-2xl font-bold text-gray-800">
                        {step === "request" && "Quên mật khẩu"}
                        {step === "reset" && "Đặt lại mật khẩu"}
                        {step === "done" && "Hoàn tất"}
                    </h1>

                    <p className="text-sm text-gray-500">
                        {step === "request" &&
                            "Nhập email để nhận mã OTP đặt lại mật khẩu"}
                        {step === "reset" &&
                            "Nhập mã OTP và tạo mật khẩu mới cho tài khoản"}
                        {step === "done" &&
                            "Mật khẩu của bạn đã được cập nhật thành công"}
                    </p>
                </div>

                {step === "request" && (
                    <form onSubmit={handleRequestOtp} className="space-y-6">
                        <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 space-y-4">
                            <div>
                                <h2 className="text-base font-semibold text-gray-800">
                                    Xác nhận email
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Chúng tôi sẽ gửi mã OTP đến email bạn đã đăng ký
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={16}
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        placeholder="banlatoi@email.com"
                                        className="mt-1 w-full rounded-lg border py-2 pl-9 pr-4 focus:border-green-400 focus:ring-2 focus:ring-green-300 outline-none transition"
                                    />
                                </div>
                                {!!email.trim() && !validateEmail(email.trim()) && (
                                    <p className="mt-1 text-xs text-red-500">
                                        Email không đúng định dạng
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !canSubmitRequest}
                            className="w-full rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 py-2.5 font-semibold text-white disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" size={18} />
                                    Đang gửi mã...
                                </span>
                            ) : (
                                "Gửi mã OTP"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            disabled={loading}
                            className="w-full rounded-lg border border-gray-200 py-2.5 font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                        >
                            Quay lại đăng nhập
                        </button>
                    </form>
                )}

                {step === "reset" && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-0.5 text-emerald-600" size={20} />
                                <div>
                                    <p className="font-semibold text-emerald-800">
                                        Kiểm tra email của bạn
                                    </p>
                                    <p className="mt-1 text-sm text-emerald-700">
                                        Vui lòng kiểm tra email của bạn, mã OTP đã được gửi đến{" "}
                                        <span className="font-medium">{email}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-600">
                                Mã OTP
                            </label>

                            <div className="flex items-center justify-center gap-2 sm:gap-3">
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            otpRefs.current[index] = el
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handleOtpChange(index, e.target.value)
                                        }
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={handleOtpPaste}
                                        className="h-14 w-12 rounded-2xl border border-gray-200 bg-white text-center text-xl font-bold text-gray-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:h-16 sm:w-14"
                                    />
                                ))}
                            </div>

                            <p className="text-center text-xs text-gray-500">
                                Vui lòng nhập đủ 6 chữ số được gửi về email
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <PasswordField
                                label="Mật khẩu mới"
                                value={newPassword}
                                setValue={setNewPassword}
                                show={showPassword}
                                setShow={setShowPassword}
                                error={newPassword ? passwordError : ""}
                                hint="Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và 1 ký hiệu trong nhóm @ . $ ! % * ? &"
                            />

                            <PasswordField
                                label="Xác nhận mật khẩu mới"
                                value={confirmPassword}
                                setValue={setConfirmPassword}
                                show={showConfirmPassword}
                                setShow={setShowConfirmPassword}
                                error={
                                    confirmPassword && confirmPassword !== newPassword
                                        ? "Mật khẩu xác nhận không khớp"
                                        : ""
                                }
                                disablePaste
                            />
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                            {resendCountdown > 0 ? (
                                <>
                                    Bạn có thể gửi lại mã sau{" "}
                                    <span className="font-semibold">
                                        {formatCountdown(resendCountdown)}
                                    </span>
                                </>
                            ) : (
                                <>Bạn đã có thể gửi lại mã OTP</>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !canSubmitReset}
                            className="w-full rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 py-2.5 font-semibold text-white disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" size={18} />
                                    Đang cập nhật...
                                </span>
                            ) : (
                                "Đặt lại mật khẩu"
                            )}
                        </button>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={loading || resendCountdown > 0}
                                className="w-full rounded-lg border border-emerald-200 py-2.5 font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                            >
                                Gửi lại mã OTP
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("request")}
                                disabled={loading}
                                className="w-full rounded-lg border border-gray-200 py-2.5 font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Đổi email
                            </button>
                        </div>
                    </form>
                )}

                {step === "done" && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                                <ShieldCheck className="text-emerald-600" size={24} />
                            </div>

                            <h2 className="mt-4 text-xl font-bold text-gray-800">
                                Đặt lại mật khẩu thành công
                            </h2>

                            <p className="mt-2 text-sm text-gray-600">
                                Bạn có thể đăng nhập lại bằng mật khẩu mới ngay bây giờ.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="w-full rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 py-2.5 font-semibold text-white"
                        >
                            Đi đến đăng nhập
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

type PasswordFieldProps = {
    label: string
    value: string
    setValue: (value: string) => void
    show: boolean
    setShow: (value: boolean) => void
    error?: string
    hint?: string
    disablePaste?: boolean
}

const PasswordField = ({
    label,
    value,
    setValue,
    show,
    setShow,
    error,
    hint,
    disablePaste = false,
}: PasswordFieldProps) => (
    <div>
        <label className="text-sm font-medium text-gray-600">{label}</label>
        <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onPaste={disablePaste ? (e) => e.preventDefault() : undefined}
                onCopy={disablePaste ? (e) => e.preventDefault() : undefined}
                onCut={disablePaste ? (e) => e.preventDefault() : undefined}
                onDrop={disablePaste ? (e) => e.preventDefault() : undefined}
                required
                className={`mt-1 w-full rounded-lg border py-2 pl-9 pr-10 focus:ring-2 ${error ? "border-red-300 focus:ring-red-200" : "focus:ring-green-300"
                    }`}
            />
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>

        {disablePaste && !error}

        {error ? (
            <p className="mt-1 text-xs text-red-500">{error}</p>
        ) : hint ? (
            <p className="mt-1 text-xs text-gray-500">{hint}</p>
        ) : null}
    </div>
)

export default ForgotPassword
