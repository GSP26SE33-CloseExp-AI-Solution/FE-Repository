import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    AlertCircle,
    ArrowRight,
    Building2,
    CheckCircle2,
    Loader2,
    Mail,
    MapPin,
    Navigation,
    Phone,
    Search,
} from "lucide-react"

import Logo from "@/assets/logo.png"
import PartnerPolicyGate from "./PartnerPolicyGate"
import PartnerRegisterGuide from "./PartnerRegisterGuide"
import { supermarketService } from "@/services/supermarket.service"
import type {
    CreateSupermarketApplicationPayload,
    GeocodeItem,
    MySupermarketApplication,
} from "@/types/supermarket.type"
import { showError, showSuccess } from "@/utils/toast"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type FormState = CreateSupermarketApplicationPayload

const EMPTY_FORM: FormState = {
    name: "",
    address: "",
    latitude: 0,
    longitude: 0,
    contactPhone: "",
    contactEmail: "",
}

const toNumber = (value: unknown): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN

    if (typeof value === "string") {
        const trimmed = value.trim()
        if (!trimmed) return NaN
        const parsed = Number(trimmed)
        return Number.isFinite(parsed) ? parsed : NaN
    }

    return NaN
}

const formatCoordinate = (value: unknown) => {
    const parsed = toNumber(value)
    return Number.isFinite(parsed) ? parsed.toFixed(6) : "--"
}

const formatDateTime = (value?: string | null) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date)
}

const getStatusMeta = (status?: number) => {
    switch (status) {
        case 0:
            return {
                label: "Chờ xét duyệt",
                className: "border-amber-200 bg-amber-50 text-amber-700",
                description:
                    "Hồ sơ của bạn đã được gửi thành công và đang chờ quản trị viên xét duyệt.",
            }
        case 1:
            return {
                label: "Đang hoạt động",
                className: "border-emerald-200 bg-emerald-50 text-emerald-700",
                description:
                    "Siêu thị của bạn đã được kích hoạt. Bạn có thể tiếp tục các bước vận hành trên hệ thống.",
            }
        case 2:
            return {
                label: "Tạm ngưng",
                className: "border-rose-200 bg-rose-50 text-rose-700",
                description:
                    "Hồ sơ hoặc siêu thị của bạn đang ở trạng thái tạm ngưng. Hãy kiểm tra ghi chú từ quản trị viên nếu có.",
            }
        case 3:
            return {
                label: "Đã đóng",
                className: "border-slate-200 bg-slate-100 text-slate-700",
                description:
                    "Hồ sơ này đã ở trạng thái đóng. Bạn có thể liên hệ quản trị viên nếu cần hỗ trợ thêm.",
            }
        default:
            return {
                label: "Không xác định",
                className: "border-slate-200 bg-slate-50 text-slate-600",
                description: "Hiện chưa xác định được trạng thái hồ sơ của bạn.",
            }
    }
}

const pickLatestApplication = (items: MySupermarketApplication[]) => {
    if (!items?.length) return null

    return [...items].sort((a, b) => {
        const timeA = new Date(
            a.submittedAt || a.createdAt || a.reviewedAt || 0
        ).getTime()
        const timeB = new Date(
            b.submittedAt || b.createdAt || b.reviewedAt || 0
        ).getTime()

        return timeB - timeA
    })[0]
}

const PartnerRegister = () => {
    const navigate = useNavigate()

    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [addressKeyword, setAddressKeyword] = useState("")
    const [addressSuggestions, setAddressSuggestions] = useState<GeocodeItem[]>([])
    const [searchingAddress, setSearchingAddress] = useState(false)
    const [resolvingLocation, setResolvingLocation] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [checkingStatus, setCheckingStatus] = useState(false)
    const [initialChecking, setInitialChecking] = useState(true)
    const [submittedApplication, setSubmittedApplication] =
        useState<MySupermarketApplication | null>(null)
    const [loadStatusError, setLoadStatusError] = useState("")
    const [policyConfirmed, setPolicyConfirmed] = useState(false)

    const canSubmit = useMemo(() => {
        const latitude = toNumber(form.latitude)
        const longitude = toNumber(form.longitude)

        return Boolean(
            form.name.trim() &&
            form.address.trim() &&
            form.contactPhone.trim() &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
        )
    }, [form])

    const statusMeta = getStatusMeta(submittedApplication?.status)

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    useEffect(() => {
        let mounted = true

        const bootstrapMyApplication = async () => {
            try {
                setInitialChecking(true)
                setLoadStatusError("")

                const items = await supermarketService.getMyApplications()

                console.log("[PartnerRegister][bootstrap][getMyApplications] items =", items)

                if (!mounted) return

                const latest = pickLatestApplication(items ?? [])

                if (latest) {
                    setSubmittedApplication(latest)
                }
            } catch (error: any) {
                console.error("[PartnerRegister][bootstrap][getMyApplications] error =", error)
                console.error(
                    "[PartnerRegister][bootstrap][getMyApplications] backend =",
                    error?.response?.data
                )
            } finally {
                if (mounted) {
                    setInitialChecking(false)
                }
            }
        }

        void bootstrapMyApplication()

        return () => {
            mounted = false
        }
    }, [])

    const handleSearchAddress = async () => {
        const keyword = addressKeyword.trim()

        if (keyword.length < 3) {
            setAddressSuggestions([])
            showError("Vui lòng nhập ít nhất 3 ký tự để tìm địa chỉ")
            return
        }

        try {
            setSearchingAddress(true)
            const items = await supermarketService.suggestGeocode(keyword, 5)
            console.log("[PartnerRegister][suggestGeocode] items =", items)
            setAddressSuggestions(items ?? [])
        } catch (error: any) {
            console.error("[PartnerRegister][suggestGeocode] error =", error)
            console.error("[PartnerRegister][suggestGeocode] backend =", error?.response?.data)
            setAddressSuggestions([])
            showError("Không thể tìm gợi ý địa chỉ")
        } finally {
            setSearchingAddress(false)
        }
    }

    const handlePickSuggestion = (item: GeocodeItem) => {
        const latitude = toNumber(item.latitude)
        const longitude = toNumber(item.longitude)

        setField("address", item.fullAddress ?? "")
        setField("latitude", Number.isFinite(latitude) ? latitude : 0)
        setField("longitude", Number.isFinite(longitude) ? longitude : 0)
        setAddressKeyword(item.fullAddress ?? "")
        setAddressSuggestions([])
    }

    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation) {
            showError("Trình duyệt không hỗ trợ định vị")
            return
        }

        setResolvingLocation(true)

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude

                try {
                    console.log("[PartnerRegister][geolocation] coords =", { lat, lng })

                    setField("latitude", lat)
                    setField("longitude", lng)

                    const result = await supermarketService.reverseGeocode(lat, lng)
                    console.log("[PartnerRegister][reverseGeocode] result =", result)

                    const resolvedAddress = result?.fullAddress?.trim() || `${lat}, ${lng}`

                    setField("address", resolvedAddress)
                    setAddressKeyword(resolvedAddress)
                    setAddressSuggestions([])
                } catch (error: any) {
                    console.error("[PartnerRegister][reverseGeocode] error =", error)
                    console.error("[PartnerRegister][reverseGeocode] backend =", error?.response?.data)
                    showError("Không thể lấy địa chỉ từ vị trí hiện tại")
                } finally {
                    setResolvingLocation(false)
                }
            },
            (geoError) => {
                console.error("[PartnerRegister][geolocation] error =", geoError)
                showError("Không thể lấy vị trí hiện tại")
                setResolvingLocation(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
            }
        )
    }

    const validateForm = () => {
        if (!form.name.trim() || !form.address.trim() || !form.contactPhone.trim()) {
            showError("Vui lòng điền đầy đủ thông tin bắt buộc")
            return false
        }

        const latitude = toNumber(form.latitude)
        const longitude = toNumber(form.longitude)

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            showError("Vui lòng chọn địa chỉ hợp lệ")
            return false
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            showError("Tọa độ địa chỉ không hợp lệ")
            return false
        }

        if (!policyConfirmed) {
            showError("Vui lòng đọc và xác nhận đồng ý với chính sách hệ thống trước")
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        if (submittedApplication) {
            showError("Bạn đã có hồ sơ đăng ký đối tác. Vui lòng theo dõi trạng thái hồ sơ hiện tại.")
            return
        }

        if (!validateForm()) return

        try {
            setSubmitting(true)
            setLoadStatusError("")

            const payload: CreateSupermarketApplicationPayload = {
                name: form.name.trim(),
                address: form.address.trim(),
                latitude: toNumber(form.latitude),
                longitude: toNumber(form.longitude),
                contactPhone: form.contactPhone.trim(),
                contactEmail: form.contactEmail?.trim() || undefined,
            }

            console.log("[PartnerRegister][submitApplication] payload =", payload)

            const created = await supermarketService.submitApplication(payload)

            console.log("[PartnerRegister][submitApplication] created =", created)

            setSubmittedApplication(created)
            showSuccess("Đã gửi đơn đăng ký thành công! Vui lòng đợi quản trị viên xét duyệt.")
        } catch (error: any) {
            console.error("[PartnerRegister][submitApplication] error =", error)
            console.error("[PartnerRegister][submitApplication] backend =", error?.response?.data)

            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.errors?.[0] ||
                error?.message

            console.error("[PartnerRegister][submitApplication] backendMessage =", backendMessage)

            if (
                typeof backendMessage === "string" &&
                /already|exist|đã tồn tại|đã đăng ký|existing/i.test(backendMessage)
            ) {
                try {
                    const items = await supermarketService.getMyApplications()
                    console.log(
                        "[PartnerRegister][submitApplication][fallback getMyApplications] items =",
                        items
                    )
                    const latest = pickLatestApplication(items ?? [])
                    if (latest) {
                        setSubmittedApplication(latest)
                    }
                } catch (fallbackError: any) {
                    console.error(
                        "[PartnerRegister][submitApplication][fallback getMyApplications] error =",
                        fallbackError
                    )
                    console.error(
                        "[PartnerRegister][submitApplication][fallback getMyApplications] backend =",
                        fallbackError?.response?.data
                    )
                }

                showError("Bạn đã có hồ sơ đăng ký trước đó. Hệ thống đang chuyển sang trạng thái hồ sơ hiện tại.")
                return
            }

            showError("Gửi đơn đăng ký không thành công. Vui lòng thử lại.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleCheckMyApplication = async () => {
        try {
            setCheckingStatus(true)
            setLoadStatusError("")

            const items = await supermarketService.getMyApplications()

            console.log("[PartnerRegister][getMyApplications] items =", items)

            if (!items?.length) {
                setLoadStatusError("Chưa tìm thấy hồ sơ đăng ký nào của bạn.")
                setSubmittedApplication(null)
                return
            }

            const latest = pickLatestApplication(items)
            setSubmittedApplication(latest)
            showSuccess("Đã cập nhật trạng thái hồ sơ mới nhất")
        } catch (error: any) {
            console.error("[PartnerRegister][getMyApplications] error =", error)
            console.error("[PartnerRegister][getMyApplications] backend =", error?.response?.data)

            setLoadStatusError("Không thể tải trạng thái hồ sơ lúc này. Vui lòng thử lại sau.")
        } finally {
            setCheckingStatus(false)
        }
    }

    if (initialChecking) {
        return (
            <div className="eco-animated-bg relative min-h-screen overflow-hidden px-4 py-10">
                <div className="bg-glow" />

                <div className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
                    <div className="rounded-3xl border border-white/40 bg-white/85 px-8 py-10 text-center shadow-2xl backdrop-blur-xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-slate-900">
                            Đang kiểm tra hồ sơ đối tác
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Hệ thống đang kiểm tra xem bạn đã từng tạo hồ sơ đăng ký hay chưa.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="eco-animated-bg relative min-h-screen overflow-hidden px-4 py-10">
            <div className="bg-glow" />

            <div className="relative z-10 mx-auto w-full max-w-6xl">
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="transition hover:text-slate-800"
                    >
                        Trang chủ
                    </button>
                    <span>/</span>
                    <span className="font-medium text-slate-800">
                        {submittedApplication ? "Trạng thái hồ sơ đối tác" : "Đăng ký thành đối tác"}
                    </span>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
                    <section className="rounded-2xl border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur-xl animate-[fadeInUp_0.6s_ease-out]">
                        <div className="text-center">
                            <Link to="/" className="group inline-flex flex-col items-center">
                                <div className="mx-auto h-20 w-28 overflow-hidden">
                                    <img
                                        src={Logo}
                                        alt="CloseExp AI"
                                        className="h-full w-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                                    />
                                </div>

                                <h1 className="mt-2 text-2xl font-bold text-gray-800 transition-all duration-300 group-hover:text-emerald-600">
                                    {submittedApplication
                                        ? "Trạng thái hồ sơ đối tác CloseExp AI"
                                        : "Đăng ký đối tác CloseExp AI"}
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    {submittedApplication
                                        ? "Theo dõi tiến độ xét duyệt hồ sơ siêu thị của bạn"
                                        : "Gửi hồ sơ mở siêu thị để tham gia hệ thống"}
                                </p>
                            </Link>
                        </div>

                        {!submittedApplication ? (
                            <div className="mt-8 space-y-5">
                                <Field label="Tên siêu thị / đối tác" required htmlFor="partner-store-name">
                                    <div className="relative">
                                        <Building2
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={16}
                                        />
                                        <input
                                            id="partner-store-name"
                                            name="partnerStoreName"
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setField("name", e.target.value)}
                                            placeholder="Ví dụ: Siêu thị Xanh Quận 7"
                                            className="mt-1 w-full rounded-lg border py-2 pl-9 pr-4 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-300"
                                        />
                                    </div>
                                </Field>

                                <Field label="Địa chỉ gợi ý" htmlFor="partner-address-search">
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                size={16}
                                            />
                                            <input
                                                id="partner-address-search"
                                                name="partnerAddressSearch"
                                                type="text"
                                                value={addressKeyword}
                                                onChange={(e) => setAddressKeyword(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        void handleSearchAddress()
                                                    }
                                                }}
                                                placeholder="Nhập địa chỉ để tìm gợi ý"
                                                className="mt-1 w-full rounded-lg border py-2 pl-9 pr-4 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-300"
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => void handleSearchAddress()}
                                                disabled={searchingAddress}
                                                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {searchingAddress ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Đang tìm...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="h-4 w-4" />
                                                        Tìm địa chỉ
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => void handleUseCurrentLocation()}
                                                disabled={resolvingLocation}
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {resolvingLocation ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Đang lấy vị trí...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Navigation className="h-4 w-4" />
                                                        Dùng vị trí hiện tại
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {addressSuggestions.length > 0 && (
                                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                                {addressSuggestions.map((item, index) => (
                                                    <button
                                                        key={`${item.fullAddress}-${index}`}
                                                        type="button"
                                                        onClick={() => handlePickSuggestion(item)}
                                                        className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                                                    >
                                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-slate-900">
                                                                {item.placeName || item.fullAddress}
                                                            </p>
                                                            <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                                                {item.fullAddress}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Field>

                                <Field label="Địa chỉ siêu thị" required htmlFor="partner-address">
                                    <>
                                        <textarea
                                            id="partner-address"
                                            name="partnerAddress"
                                            value={form.address}
                                            onChange={(e) => setField("address", e.target.value)}
                                            rows={3}
                                            placeholder="Nhập địa chỉ đầy đủ"
                                            className="mt-1 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-300"
                                        />
                                        <p className="mt-2 text-xs leading-5 text-slate-500">
                                            Tọa độ đã chọn:{" "}
                                            <span className="font-medium text-slate-700">
                                                Lat {formatCoordinate(form.latitude)}
                                            </span>
                                            {" · "}
                                            <span className="font-medium text-slate-700">
                                                Lng {formatCoordinate(form.longitude)}
                                            </span>
                                        </p>
                                    </>
                                </Field>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Số điện thoại liên hệ" required htmlFor="partner-phone">
                                        <div className="relative">
                                            <Phone
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                size={16}
                                            />
                                            <input
                                                id="partner-phone"
                                                name="partnerPhone"
                                                autoComplete="tel"
                                                type="text"
                                                value={form.contactPhone}
                                                onChange={(e) => setField("contactPhone", e.target.value)}
                                                placeholder="Nhập số điện thoại"
                                                className="mt-1 w-full rounded-lg border py-2 pl-9 pr-4 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-300"
                                            />
                                        </div>
                                    </Field>

                                    <Field label="Email liên hệ" htmlFor="partner-email">
                                        <div className="relative">
                                            <Mail
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                size={16}
                                            />
                                            <input
                                                id="partner-email"
                                                name="partnerEmail"
                                                autoComplete="email"
                                                type="email"
                                                value={form.contactEmail}
                                                onChange={(e) => setField("contactEmail", e.target.value)}
                                                placeholder="email@example.com"
                                                className="mt-1 w-full rounded-lg border py-2 pl-9 pr-4 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-300"
                                            />
                                        </div>
                                    </Field>
                                </div>

                                <PartnerPolicyGate
                                    confirmed={policyConfirmed}
                                    onConfirmedChange={setPolicyConfirmed}
                                />

                                <button
                                    type="button"
                                    onClick={() => void handleSubmit()}
                                    disabled={!canSubmit || !policyConfirmed || submitting}
                                    className="w-full rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 py-2.5 font-semibold text-white shadow-md transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {submitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" size={18} />
                                            Đang gửi hồ sơ...
                                        </span>
                                    ) : (
                                        "Gửi hồ sơ đăng ký"
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="mt-8 space-y-5">
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-white p-2 text-emerald-600 shadow-sm">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900">
                                                Hồ sơ đối tác của bạn
                                            </h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">
                                                Hồ sơ hiện tại
                                            </p>
                                            <h3 className="mt-1 text-xl font-bold text-slate-900">
                                                {submittedApplication.name}
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {statusMeta.description}
                                            </p>
                                        </div>

                                        <span
                                            className={cn(
                                                "inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold",
                                                statusMeta.className
                                            )}
                                        >
                                            {statusMeta.label}
                                        </span>
                                    </div>

                                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                        <InfoCard
                                            icon={<Building2 className="h-4 w-4" />}
                                            label="Mã hồ sơ"
                                            value={submittedApplication.applicationReference || "--"}
                                        />
                                        <InfoCard
                                            icon={<Phone className="h-4 w-4" />}
                                            label="Số điện thoại"
                                            value={submittedApplication.contactPhone || "--"}
                                        />
                                        <InfoCard
                                            icon={<Mail className="h-4 w-4" />}
                                            label="Email liên hệ"
                                            value={submittedApplication.contactEmail || "--"}
                                        />
                                        <InfoCard
                                            icon={<MapPin className="h-4 w-4" />}
                                            label="Địa chỉ siêu thị"
                                            value={submittedApplication.address || "--"}
                                        />
                                        <InfoCard
                                            icon={<CheckCircle2 className="h-4 w-4" />}
                                            label="Ngày gửi hồ sơ"
                                            value={formatDateTime(
                                                submittedApplication.submittedAt ||
                                                submittedApplication.createdAt
                                            )}
                                        />
                                        <InfoCard
                                            icon={<AlertCircle className="h-4 w-4" />}
                                            label="Ngày cập nhật"
                                            value={formatDateTime(submittedApplication.reviewedAt)}
                                        />
                                    </div>

                                    {submittedApplication.adminReviewNote ? (
                                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                            <div className="mb-1 flex items-center gap-2 font-semibold">
                                                <AlertCircle className="h-4 w-4" />
                                                Ghi chú từ quản trị viên
                                            </div>
                                            <p className="leading-6">
                                                {submittedApplication.adminReviewNote}
                                            </p>
                                        </div>
                                    ) : null}

                                    {loadStatusError ? (
                                        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                            {loadStatusError}
                                        </div>
                                    ) : null}

                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => void handleCheckMyApplication()}
                                            disabled={checkingStatus}
                                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 active:scale-95 disabled:opacity-70"
                                        >
                                            {checkingStatus ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Đang kiểm tra...
                                                </>
                                            ) : (
                                                <>
                                                    Kiểm tra trạng thái hồ sơ
                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => navigate("/")}
                                            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Quay về trang chủ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="mt-6 text-center text-xs text-gray-400">
                            © {new Date().getFullYear()} CloseExp AI Việt Nam
                        </p>
                    </section>

                    <aside className="space-y-6">
                        <PartnerRegisterGuide />
                    </aside>
                </div>
            </div>
        </div>
    )
}

const Field = ({
    label,
    required,
    children,
    htmlFor,
}: {
    label: string
    required?: boolean
    children: ReactNode
    htmlFor?: string
}) => {
    return (
        <label htmlFor={htmlFor} className="block">
            <div className="text-sm font-medium text-gray-600">
                {label} {required ? <span className="text-rose-500">*</span> : null}
            </div>
            {children}
        </label>
    )
}

const InfoCard = ({
    icon,
    label,
    value,
}: {
    icon: ReactNode
    label: string
    value: string
}) => {
    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-2 text-slate-500">
                {icon}
                <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-900">
                {value}
            </p>
        </div>
    )
}

export default PartnerRegister
