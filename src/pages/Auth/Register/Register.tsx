import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import {
    Eye,
    EyeOff,
    User,
    Mail,
    Phone,
    Lock,
    Loader2,
    Briefcase,
    Building2,
    MapPin,
    ShieldCheck,
    Store,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { showSuccess, showError } from "@/utils/toast"
import { isAuthenticated } from "@/utils/authStorage"
import { RegistrationType, RegisterPayload } from "@/types/auth.types"
import Logo from "@/assets/logo.png"

type RegisterStep = "form" | "otp" | "done"

const OTP_RESEND_SECONDS = 300
const OTP_LENGTH = 6

const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const validateVietnamPhone = (value: string) => {
    const cleaned = value.replace(/\s+/g, "")
    return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(cleaned)
}

const validateStrongPassword = (value: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.$!%*?&])[A-Za-z\d@.$!%*?&]{8,}$/.test(value)
}

const getPasswordError = (value: string) => {
    if (!value) return "Vui lòng nhập mật khẩu"
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

const Register = () => {
    const navigate = useNavigate()
    const { register, verifyOtp, resendOtp, loading } = useAuth()

    const [step, setStep] = useState<RegisterStep>("form")
    const [selectedRole, setSelectedRole] = useState<RegistrationType>("Vendor")

    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""))
    const [otpCountdown, setOtpCountdown] = useState(OTP_RESEND_SECONDS)
    const otpRefs = useRef<Array<HTMLInputElement | null>>([])

    // SupplierStaff only
    const [position, setPosition] = useState("")
    const [marketName, setMarketName] = useState("")
    const [marketAddress, setMarketAddress] = useState("")
    const [latitude, setLatitude] = useState("")
    const [longitude, setLongitude] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [contactEmail, setContactEmail] = useState("")

    const isSupplier = selectedRole === "SupplierStaff"
    const otp = otpDigits.join("")

    useEffect(() => {
        if (step !== "otp") return
        if (otpCountdown <= 0) return

        const timer = window.setInterval(() => {
            setOtpCountdown((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [step, otpCountdown])

    useEffect(() => {
        if (step === "otp") {
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        }
    }, [step])

    const passwordError = useMemo(() => getPasswordError(password), [password])

    const fieldErrors = useMemo(() => {
        return {
            fullName: !fullName.trim() ? "Vui lòng nhập họ và tên" : "",
            email:
                !email.trim()
                    ? "Vui lòng nhập email"
                    : !validateEmail(email.trim())
                        ? "Email không đúng định dạng"
                        : "",
            phone:
                !phone.trim()
                    ? "Vui lòng nhập số điện thoại"
                    : !validateVietnamPhone(phone.trim())
                        ? "Số điện thoại Việt Nam không hợp lệ"
                        : "",
            password: password ? passwordError : "",
            position: isSupplier && !position.trim() ? "Vui lòng nhập chức vụ" : "",
            marketName: isSupplier && !marketName.trim() ? "Vui lòng nhập tên siêu thị" : "",
            marketAddress: isSupplier && !marketAddress.trim() ? "Vui lòng nhập địa chỉ siêu thị" : "",
            latitude:
                isSupplier && !latitude.trim()
                    ? "Vui lòng nhập vĩ độ"
                    : isSupplier && Number.isNaN(Number(latitude))
                        ? "Vĩ độ phải là số hợp lệ"
                        : "",
            longitude:
                isSupplier && !longitude.trim()
                    ? "Vui lòng nhập kinh độ"
                    : isSupplier && Number.isNaN(Number(longitude))
                        ? "Kinh độ phải là số hợp lệ"
                        : "",
            contactPhone:
                isSupplier && !contactPhone.trim()
                    ? "Vui lòng nhập số điện thoại liên hệ"
                    : isSupplier && !validateVietnamPhone(contactPhone.trim())
                        ? "Số điện thoại liên hệ không hợp lệ"
                        : "",
            contactEmail:
                isSupplier && !contactEmail.trim()
                    ? "Vui lòng nhập email liên hệ"
                    : isSupplier && !validateEmail(contactEmail.trim())
                        ? "Email liên hệ không đúng định dạng"
                        : "",
        }
    }, [
        fullName,
        email,
        phone,
        password,
        passwordError,
        isSupplier,
        position,
        marketName,
        marketAddress,
        latitude,
        longitude,
        contactPhone,
        contactEmail,
    ])

    const canSubmit = useMemo(() => {
        const basicOk =
            fullName.trim() &&
            email.trim() &&
            phone.trim() &&
            password.trim() &&
            validateEmail(email.trim()) &&
            validateVietnamPhone(phone.trim()) &&
            validateStrongPassword(password)

        if (!basicOk) return false
        if (!isSupplier) return true

        return Boolean(
            position.trim() &&
            marketName.trim() &&
            marketAddress.trim() &&
            latitude.trim() &&
            longitude.trim() &&
            contactPhone.trim() &&
            contactEmail.trim() &&
            !Number.isNaN(Number(latitude)) &&
            !Number.isNaN(Number(longitude)) &&
            validateVietnamPhone(contactPhone.trim()) &&
            validateEmail(contactEmail.trim())
        )
    }, [
        fullName,
        email,
        phone,
        password,
        isSupplier,
        position,
        marketName,
        marketAddress,
        latitude,
        longitude,
        contactPhone,
        contactEmail,
    ])

    if (isAuthenticated()) {
        return <Navigate to="/" replace />
    }

    const buildPayload = (): RegisterPayload => {
        if (!isSupplier) {
            return {
                fullName: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
                registrationType: "Vendor",
            }
        }

        const lat = Number(latitude)
        const lng = Number(longitude)

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            throw new Error("Vĩ độ và kinh độ phải là số hợp lệ")
        }

        return {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            registrationType: "SupplierStaff",
            position: position.trim(),
            newSupermarket: {
                name: marketName.trim(),
                address: marketAddress.trim(),
                latitude: lat,
                longitude: lng,
                contactPhone: contactPhone.trim(),
                contactEmail: contactEmail.trim(),
            },
        }
    }

    const resetOtpInputs = () => {
        setOtpDigits(Array(OTP_LENGTH).fill(""))
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        if (!canSubmit) {
            showError("Vui lòng kiểm tra lại thông tin đăng ký")
            return
        }

        try {
            const payload = buildPayload()
            const res = await register(payload)

            showSuccess(res.message || "Vui lòng kiểm tra email để xác minh tài khoản")
            resetOtpInputs()
            setOtpCountdown(OTP_RESEND_SECONDS)
            setStep("otp")
        } catch (err: any) {
            showError(
                err?.response?.data?.message ||
                err?.response?.data?.errors?.[0] ||
                err?.message ||
                "Đăng ký thất bại"
            )
        }
    }

    const onVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        if (otp.length !== OTP_LENGTH) {
            showError("Vui lòng nhập đầy đủ 6 số OTP")
            return
        }

        try {
            await verifyOtp({
                email: email.trim(),
                otpCode: otp,
            })

            showSuccess(
                isSupplier
                    ? "Xác minh OTP thành công. Tài khoản của bạn đã được gửi đăng ký và đang chờ quản trị viên phê duyệt."
                    : "Xác minh tài khoản thành công."
            )

            setStep("done")
        } catch (err: any) {
            showError(
                err?.response?.data?.message ||
                err?.response?.data?.errors?.[0] ||
                err?.message ||
                "Xác minh OTP thất bại"
            )
        }
    }

    const onResendOtp = async () => {
        if (loading || otpCountdown > 0) return

        try {
            const res = await resendOtp({ email: email.trim() })
            showSuccess(res.message || "Đã gửi lại mã OTP")
            resetOtpInputs()
            setOtpCountdown(OTP_RESEND_SECONDS)
        } catch (err: any) {
            showError(
                err?.response?.data?.message ||
                err?.response?.data?.errors?.[0] ||
                err?.message ||
                "Gửi lại OTP thất bại"
            )
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
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH)
        if (!pasted) return

        const next = Array(OTP_LENGTH).fill("")
        pasted.split("").forEach((char, idx) => {
            next[idx] = char
        })

        setOtpDigits(next)

        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
        otpRefs.current[focusIndex]?.focus()
    }

    const formatCountdown = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainSeconds = seconds % 60
        return `${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`
    }

    return (
        <div className="eco-animated-bg min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
            <div className="bg-glow" />

            <div className="relative z-10 w-full max-w-3xl backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-8 space-y-6 border border-white/40">
                <div className="text-center space-y-2">
                    <img src={Logo} alt="CloseExp AI" className="w-14 h-14 mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-800">
                        {step === "form" && "Tạo tài khoản"}
                        {step === "otp" && "Xác minh OTP"}
                        {step === "done" && "Đăng ký thành công"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {step === "form" && "Chọn loại tài khoản và điền thông tin đăng ký"}
                        {step === "otp" && "Nhập mã OTP đã được gửi về email của bạn"}
                        {step === "done" &&
                            (isSupplier
                                ? "Tài khoản của bạn đã được gửi đăng ký thành công. Vui lòng chờ quản trị viên phê duyệt để kích hoạt hoạt động."
                                : "Tài khoản của bạn đã được xác minh thành công. Bạn có thể đăng nhập để tiếp tục.")}
                    </p>
                </div>

                {step === "form" && (
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RoleCard
                                active={selectedRole === "Vendor"}
                                title="Khách hàng"
                                subtitle="Vendor"
                                icon={<Store size={18} />}
                                onClick={() => setSelectedRole("Vendor")}
                            />
                            <RoleCard
                                active={selectedRole === "SupplierStaff"}
                                title="Đối tác"
                                subtitle="SupplierStaff"
                                icon={<Building2 size={18} />}
                                onClick={() => setSelectedRole("SupplierStaff")}
                            />
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-800">Thông tin tài khoản</h2>
                                    <p className="text-sm text-gray-500">
                                        Điền thông tin cơ bản để tạo tài khoản
                                    </p>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                                    {selectedRole === "Vendor" ? "Khách hàng" : "Đối tác"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    icon={<User size={16} />}
                                    label="Họ và tên"
                                    value={fullName}
                                    setValue={setFullName}
                                    error={fieldErrors.fullName}
                                />
                                <Input
                                    icon={<Mail size={16} />}
                                    label="Email"
                                    type="email"
                                    value={email}
                                    setValue={setEmail}
                                    error={fieldErrors.email}
                                />
                                <Input
                                    icon={<Phone size={16} />}
                                    label="Số điện thoại"
                                    value={phone}
                                    setValue={setPhone}
                                    error={fieldErrors.phone}
                                />
                                <PasswordInput
                                    label="Mật khẩu"
                                    value={password}
                                    setValue={setPassword}
                                    show={showPassword}
                                    setShow={setShowPassword}
                                    error={fieldErrors.password}
                                    hint="Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và 1 ký hiệu trong nhóm @ . $ ! % * ? &"
                                />
                            </div>
                        </div>

                        {isSupplier && (
                            <div className="space-y-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-5">
                                <div className="border-b border-emerald-100 pb-4">
                                    <h2 className="text-base font-semibold text-emerald-800">
                                        Thông tin đối tác & siêu thị
                                    </h2>
                                    <p className="text-sm text-emerald-700 mt-1">
                                        Phần này chỉ hiển thị khi bạn chọn loại tài khoản Đối tác
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        icon={<Briefcase size={16} />}
                                        label="Chức vụ"
                                        value={position}
                                        setValue={setPosition}
                                        error={fieldErrors.position}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            Thông tin siêu thị mới
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Các trường này sẽ được gửi trong <code>newSupermarket</code>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            icon={<Building2 size={16} />}
                                            label="Tên siêu thị"
                                            value={marketName}
                                            setValue={setMarketName}
                                            error={fieldErrors.marketName}
                                        />
                                        <Input
                                            icon={<Phone size={16} />}
                                            label="Số điện thoại liên hệ"
                                            value={contactPhone}
                                            setValue={setContactPhone}
                                            error={fieldErrors.contactPhone}
                                        />
                                        <Input
                                            icon={<Mail size={16} />}
                                            label="Email liên hệ"
                                            type="email"
                                            value={contactEmail}
                                            setValue={setContactEmail}
                                            error={fieldErrors.contactEmail}
                                        />
                                        <Input
                                            icon={<MapPin size={16} />}
                                            label="Địa chỉ"
                                            value={marketAddress}
                                            setValue={setMarketAddress}
                                            error={fieldErrors.marketAddress}
                                        />
                                        <Input
                                            label="Latitude"
                                            type="number"
                                            value={latitude}
                                            setValue={setLatitude}
                                            error={fieldErrors.latitude}
                                        />
                                        <Input
                                            label="Longitude"
                                            type="number"
                                            value={longitude}
                                            setValue={setLongitude}
                                            error={fieldErrors.longitude}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !canSubmit}
                            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold py-2.5 rounded-lg disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" size={18} />
                                    Đang xử lý...
                                </span>
                            ) : (
                                "Đăng ký"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="w-full border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50"
                        >
                            Quay lại đăng nhập
                        </button>
                    </form>
                )}

                {step === "otp" && (
                    <form onSubmit={onVerifyOtp} className="space-y-6">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="text-emerald-600 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold text-emerald-800">Kiểm tra email của bạn</p>
                                    <p className="text-sm text-emerald-700 mt-1">
                                        Chúng tôi đã gửi mã OTP đến <span className="font-medium">{email}</span>.
                                        Vui lòng nhập mã để xác minh tài khoản đăng ký.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-600">Mã OTP</label>
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
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={handleOtpPaste}
                                        className="h-14 w-12 sm:h-16 sm:w-14 rounded-2xl border border-gray-200 bg-white text-center text-xl font-bold text-gray-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                    />
                                ))}
                            </div>
                            <p className="text-center text-xs text-gray-500">
                                Vui lòng nhập đủ 6 chữ số được gửi về email
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                            {otpCountdown > 0 ? (
                                <>
                                    Bạn có thể gửi lại mã sau{" "}
                                    <span className="font-semibold">{formatCountdown(otpCountdown)}</span>
                                </>
                            ) : (
                                <>Bạn đã có thể gửi lại mã OTP</>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== OTP_LENGTH}
                            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold py-2.5 rounded-lg disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" size={18} />
                                    Đang xác minh...
                                </span>
                            ) : (
                                "Xác minh OTP"
                            )}
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={onResendOtp}
                                disabled={loading || otpCountdown > 0}
                                className="w-full border border-emerald-200 text-emerald-700 font-medium py-2.5 rounded-lg hover:bg-emerald-50 disabled:opacity-60"
                            >
                                Gửi lại mã OTP
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("form")}
                                disabled={loading}
                                className="w-full border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50"
                            >
                                Quay lại chỉnh thông tin
                            </button>
                        </div>
                    </form>
                )}

                {step === "done" && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6 text-center">
                            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                                <ShieldCheck className="text-emerald-600" size={24} />
                            </div>

                            <h2 className="mt-4 text-xl font-bold text-gray-800">
                                {isSupplier
                                    ? "Đã gửi đăng ký thành công"
                                    : "Xác minh tài khoản thành công"}
                            </h2>

                            <p className="mt-2 text-sm text-gray-600">
                                {isSupplier
                                    ? "Tài khoản của bạn đã được ghi nhận. Vui lòng chờ quản trị viên phê duyệt để bắt đầu sử dụng hệ thống."
                                    : "Email của bạn đã được xác minh. Bây giờ bạn có thể đăng nhập vào hệ thống."}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold py-2.5 rounded-lg"
                        >
                            Đi đến đăng nhập
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

type InputProps = {
    icon?: React.ReactNode
    label: string
    type?: string
    value: string
    setValue: (value: string) => void
    error?: string
    hint?: string
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
    maxLength?: number
}

const Input = ({
    icon,
    label,
    type = "text",
    value,
    setValue,
    error,
    hint,
    inputMode,
    maxLength,
}: InputProps) => (
    <div>
        <label className="text-sm font-medium text-gray-600">{label}</label>
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
            <input
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                inputMode={inputMode}
                maxLength={maxLength}
                className={`w-full mt-1 ${icon ? "pl-9" : "pl-4"} pr-4 py-2 border rounded-lg focus:ring-2 ${error ? "border-red-300 focus:ring-red-200" : "focus:ring-green-300"
                    }`}
            />
        </div>
        {error ? (
            <p className="mt-1 text-xs text-red-500">{error}</p>
        ) : hint ? (
            <p className="mt-1 text-xs text-gray-500">{hint}</p>
        ) : null}
    </div>
)

type PasswordInputProps = {
    label: string
    value: string
    setValue: (value: string) => void
    show: boolean
    setShow: (value: boolean) => void
    error?: string
    hint?: string
}

const PasswordInput = ({
    label,
    value,
    setValue,
    show,
    setShow,
    error,
    hint,
}: PasswordInputProps) => (
    <div>
        <label className="text-sm font-medium text-gray-600">{label}</label>
        <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                className={`w-full mt-1 pl-9 pr-10 py-2 border rounded-lg focus:ring-2 ${error ? "border-red-300 focus:ring-red-200" : "focus:ring-green-300"
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
        {error ? (
            <p className="mt-1 text-xs text-red-500">{error}</p>
        ) : hint ? (
            <p className="mt-1 text-xs text-gray-500">{hint}</p>
        ) : null}
    </div>
)

type RoleCardProps = {
    active: boolean
    title: string
    subtitle: string
    icon: React.ReactNode
    onClick: () => void
}

const RoleCard = ({ active, title, subtitle, icon, onClick }: RoleCardProps) => (
    <button
        type="button"
        onClick={onClick}
        className={`text-left rounded-2xl border p-4 transition ${active
            ? "border-emerald-400 bg-emerald-50 shadow-sm"
            : "border-gray-200 bg-white hover:border-emerald-200"
            }`}
    >
        <div className="flex items-start gap-3">
            <div
                className={`mt-0.5 rounded-xl p-2 ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}
            >
                {icon}
            </div>
            <div>
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
        </div>
    </button>
)

export default Register
