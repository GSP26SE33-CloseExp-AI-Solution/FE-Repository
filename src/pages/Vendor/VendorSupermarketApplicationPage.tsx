import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import {
    getMySupermarketApplications,
    submitSupermarketApplication,
} from "@/services/supermarketApplication.service"
import type { MySupermarketApplication } from "@/types/supermarketApplication.types"
import { SupermarketState } from "@/types/supermarketApplication.types"

function statusLabel(status: number): string {
    switch (status) {
        case SupermarketState.PendingApproval:
            return "Chờ duyệt"
        case SupermarketState.Active:
            return "Đã kích hoạt"
        case SupermarketState.Suspended:
            return "Tạm ngưng"
        case SupermarketState.Closed:
            return "Đã đóng"
        case SupermarketState.Rejected:
            return "Từ chối"
        default:
            return `Trạng thái (${status})`
    }
}

export default function VendorSupermarketApplicationPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [applications, setApplications] = useState<MySupermarketApplication[]>(
        []
    )

    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [latitude, setLatitude] = useState("")
    const [longitude, setLongitude] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [contactEmail, setContactEmail] = useState("")

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const list = await getMySupermarketApplications()
            setApplications(list)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không tải được danh sách hồ sơ")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [])

    const pending = applications.find(
        (a) => a.status === SupermarketState.PendingApproval
    )
    const latestRejected = applications.find(
        (a) => a.status === SupermarketState.Rejected
    )

    const canShowForm = !pending

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        const lat = parseFloat(latitude)
        const lng = parseFloat(longitude)
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            setError("Vui lòng nhập vĩ độ / kinh độ hợp lệ.")
            setSubmitting(false)
            return
        }
        try {
            await submitSupermarketApplication({
                name: name.trim(),
                address: address.trim(),
                latitude: lat,
                longitude: lng,
                contactPhone: contactPhone.trim(),
                contactEmail: contactEmail.trim() || undefined,
            })
            await load()
            setName("")
            setAddress("")
            setLatitude("")
            setLongitude("")
            setContactPhone("")
            setContactEmail("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Nộp hồ sơ thất bại")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-600">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Đang tải…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Hồ sơ mở siêu thị
                    </h1>
                    {!pending && (
                        <Link
                            to="/vendor"
                            className="text-sm text-emerald-700 hover:underline"
                        >
                            Về trang mua hàng
                        </Link>
                    )}
                </div>

                {pending && (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-3">
                        <p className="font-medium text-amber-900">
                            Hồ sơ của bạn đang chờ Admin xét duyệt.
                        </p>
                        <p className="text-sm text-amber-900/90">
                            Mã hồ sơ:{" "}
                            <span className="font-mono font-semibold">
                                {pending.applicationReference ||
                                    pending.supermarketId.slice(0, 8).toUpperCase()}
                            </span>
                        </p>
                        <p className="text-sm text-amber-900/80">
                            Siêu thị: <strong>{pending.name}</strong> —{" "}
                            {pending.address}
                        </p>
                        {pending.submittedAt && (
                            <p className="text-xs text-amber-800/80">
                                Nộp lúc:{" "}
                                {new Date(pending.submittedAt).toLocaleString()}
                            </p>
                        )}
                        <p className="text-xs text-amber-800/70">
                            Sau khi được duyệt, vai trò sẽ chuyển sang nhân viên
                            siêu thị. Nếu bạn đang mở trang khác, hãy làm mới phiên
                            (hoặc đăng nhập lại) để vào khu vực quản lý.
                        </p>
                    </section>
                )}

                {!pending && latestRejected && (
                    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-2">
                        <p className="font-medium text-red-900">
                            Hồ sơ gần nhất bị từ chối
                        </p>
                        {latestRejected.adminReviewNote && (
                            <p className="text-sm text-red-900/90">
                                Lý do: {latestRejected.adminReviewNote}
                            </p>
                        )}
                        <p className="text-xs text-red-800/80">
                            Bạn có thể gửi hồ sơ mới bên dưới (nếu chính sách cho
                            phép).
                        </p>
                    </section>
                )}

                {applications.length > 0 && (
                    <section className="rounded-2xl border bg-white p-5 space-y-3">
                        <h2 className="font-semibold text-slate-800">
                            Lịch sử hồ sơ
                        </h2>
                        <ul className="space-y-2 text-sm">
                            {applications.map((a) => (
                                <li
                                    key={a.supermarketId}
                                    className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0"
                                >
                                    <span className="text-slate-700 truncate">
                                        {a.name}
                                    </span>
                                    <span className="shrink-0 text-slate-500">
                                        {statusLabel(a.status)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {canShowForm && (
                    <section className="rounded-2xl border bg-white p-6 shadow-sm">
                        <h2 className="font-semibold text-slate-800 mb-4">
                            {applications.length === 0
                                ? "Đăng ký mở siêu thị"
                                : "Gửi hồ sơ mới"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Tên siêu thị
                                </label>
                                <input
                                    required
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Địa chỉ
                                </label>
                                <input
                                    required
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                        Vĩ độ
                                    </label>
                                    <input
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={latitude}
                                        onChange={(e) =>
                                            setLatitude(e.target.value)
                                        }
                                        placeholder="10.7769"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                        Kinh độ
                                    </label>
                                    <input
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={longitude}
                                        onChange={(e) =>
                                            setLongitude(e.target.value)
                                        }
                                        placeholder="106.7009"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Điện thoại liên hệ
                                </label>
                                <input
                                    required
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={contactPhone}
                                    onChange={(e) =>
                                        setContactPhone(e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Email liên hệ (tuỳ chọn)
                                </label>
                                <input
                                    type="email"
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={contactEmail}
                                    onChange={(e) =>
                                        setContactEmail(e.target.value)
                                    }
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-600">{error}</p>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {submitting ? "Đang gửi…" : "Gửi hồ sơ"}
                            </button>
                        </form>
                    </section>
                )}

                {pending && (
                    <p className="text-center text-sm text-slate-500">
                        <button
                            type="button"
                            className="text-emerald-700 underline"
                            onClick={() => navigate("/redirect")}
                        >
                            Làm mới phiên / chuyển workspace
                        </button>
                    </p>
                )}
            </div>
        </div>
    )
}
