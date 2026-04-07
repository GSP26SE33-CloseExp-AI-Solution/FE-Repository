import React, { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react"

import MapboxLocationPicker from "@/pages/Home/MapboxLocationPicker"
import { customerAddressService } from "@/services/customer-address.service"
import { supermarketService } from "@/services/supermarket.service"
import type {
    CustomerAddress,
    CreateCustomerAddressPayload,
    UpdateCustomerAddressPayload,
} from "@/types/order.type"
import { showError, showSuccess } from "@/utils/toast"

const HCMC_LAT = 10.776889
const HCMC_LNG = 106.700806

type ModalMode = "closed" | "create" | "edit"

type Props = {
    /** Dùng làm gợi ý khi thêm địa chỉ mới */
    defaultRecipientName: string
    defaultPhone: string
}

const CustomerAddressesPanel: React.FC<Props> = ({
    defaultRecipientName,
    defaultPhone,
}) => {
    const [addresses, setAddresses] = useState<CustomerAddress[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState("")
    const [modalMode, setModalMode] = useState<ModalMode>("closed")
    const [saving, setSaving] = useState(false)
    const [mapStatus, setMapStatus] = useState<
        "idle" | "loading" | "loaded" | "error"
    >("idle")

    const [formRecipient, setFormRecipient] = useState("")
    const [formPhone, setFormPhone] = useState("")
    const [formAddressLine, setFormAddressLine] = useState("")
    const [formLat, setFormLat] = useState(HCMC_LAT)
    const [formLng, setFormLng] = useState(HCMC_LNG)
    const [formIsDefault, setFormIsDefault] = useState(false)
    const [addressResolving, setAddressResolving] = useState(false)
    const skipForwardGeocodeRef = useRef(false)

    const loadAddresses = async () => {
        try {
            setLoading(true)
            const list = await customerAddressService.listAddresses()
            setAddresses(list)
            setSelectedId((prev) => {
                if (prev && list.some((a) => a.customerAddressId === prev)) {
                    return prev
                }
                const def = list.find((a) => a.isDefault)
                return def?.customerAddressId ?? list[0]?.customerAddressId ?? ""
            })
        } catch (e) {
            showError(e instanceof Error ? e.message : "Không tải được địa chỉ.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadAddresses()
    }, [])

    const selected = useMemo(
        () => addresses.find((a) => a.customerAddressId === selectedId),
        [addresses, selectedId]
    )

    const resetFormFromAddress = (addr?: CustomerAddress | null) => {
        if (addr) {
            setFormRecipient(addr.recipientName)
            setFormPhone(addr.phone)
            setFormAddressLine(addr.addressLine)
            setFormLat(Number(addr.latitude))
            setFormLng(Number(addr.longitude))
            setFormIsDefault(addr.isDefault)
        } else {
            setFormRecipient(defaultRecipientName.trim() || "")
            setFormPhone(defaultPhone.trim() || "")
            setFormAddressLine("")
            setFormLat(HCMC_LAT)
            setFormLng(HCMC_LNG)
            setFormIsDefault(addresses.length === 0)
        }
        setMapStatus("idle")
    }

    const openCreate = () => {
        resetFormFromAddress(null)
        setModalMode("create")
    }

    const openEdit = () => {
        if (!selected) {
            showError("Chọn một địa chỉ để sửa.")
            return
        }
        resetFormFromAddress(selected)
        setModalMode("edit")
    }

    const closeModal = () => {
        setModalMode("closed")
    }

    const applyReverseForForm = async (lat: number, lng: number) => {
        setFormLat(lat)
        setFormLng(lng)
        skipForwardGeocodeRef.current = true
        try {
            const reverse = await supermarketService.reverseGeocode(lat, lng)
            const pretty =
                reverse?.fullAddress?.trim() ||
                reverse?.placeName?.trim() ||
                `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            setFormAddressLine(pretty)
        } catch {
            setFormAddressLine(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        }
    }

    const handleMapPick = (value: { lat: number; lng: number }) => {
        void applyReverseForForm(value.lat, value.lng)
    }

    useEffect(() => {
        if (modalMode === "closed") return

        const query = formAddressLine.trim()
        if (!query || query.length < 8) return

        if (skipForwardGeocodeRef.current) {
            skipForwardGeocodeRef.current = false
            return
        }

        let cancelled = false

        const timer = window.setTimeout(() => {
            ;(async () => {
                try {
                    setAddressResolving(true)
                    const forward =
                        (await supermarketService.forwardGeocode(query)) ??
                        (await supermarketService.forwardGeocode(
                            `${query}, Thành phố Hồ Chí Minh`
                        ))

                    if (cancelled || !forward) return
                    setFormLat(Number(forward.latitude))
                    setFormLng(Number(forward.longitude))
                } catch {
                    // Không bắt buộc phải geocode lại thành công
                } finally {
                    if (!cancelled) {
                        setAddressResolving(false)
                    }
                }
            })()
        }, 1500)

        return () => {
            cancelled = true
            window.clearTimeout(timer)
            setAddressResolving(false)
        }
    }, [formAddressLine, modalMode])

    const handleSaveModal = async () => {
        const name = formRecipient.trim()
        const phone = formPhone.trim()
        const line = formAddressLine.trim()

        if (!name || !phone || !line) {
            showError("Vui lòng nhập đủ tên người nhận, SĐT và địa chỉ.")
            return
        }

        try {
            setSaving(true)

            if (modalMode === "create") {
                const payload: CreateCustomerAddressPayload = {
                    recipientName: name,
                    phone,
                    addressLine: line,
                    latitude: formLat,
                    longitude: formLng,
                    isDefault: formIsDefault,
                }
                await customerAddressService.createAddress(payload)
                showSuccess("Đã thêm địa chỉ.")
            } else if (modalMode === "edit" && selected) {
                const payload: UpdateCustomerAddressPayload = {
                    recipientName: name,
                    phone,
                    addressLine: line,
                    latitude: formLat,
                    longitude: formLng,
                }
                await customerAddressService.updateAddress(
                    selected.customerAddressId,
                    payload
                )
                showSuccess("Đã cập nhật địa chỉ.")
            }

            await loadAddresses()
            closeModal()
        } catch (e) {
            showError(e instanceof Error ? e.message : "Không lưu được địa chỉ.")
        } finally {
            setSaving(false)
        }
    }

    const handleSetDefault = async () => {
        if (!selected) return
        try {
            setSaving(true)
            await customerAddressService.setDefaultAddress(selected.customerAddressId)
            showSuccess("Đã đặt làm địa chỉ mặc định.")
            await loadAddresses()
        } catch (e) {
            showError(e instanceof Error ? e.message : "Thao tác thất bại.")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selected) return
        const ok = window.confirm(
            "Xóa địa chỉ này? Bạn có thể thêm lại sau trong mục địa chỉ giao hàng."
        )
        if (!ok) return

        try {
            setSaving(true)
            await customerAddressService.deleteAddress(selected.customerAddressId)
            showSuccess("Đã xóa địa chỉ.")
            await loadAddresses()
        } catch (e) {
            showError(e instanceof Error ? e.message : "Không xóa được địa chỉ.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-900">
                        Địa chỉ giao hàng
                    </h2>
                    <p className="mt-1 text-[13px] text-slate-500">
                        Chọn địa chỉ mặc định cho đơn giao tận nơi; có thể chỉnh vị trí
                        trên bản đồ giống bước chọn khu vực ở trang chủ.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm địa chỉ
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-[13px] text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải danh sách địa chỉ...
                </div>
            ) : addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-600">
                    Chưa có địa chỉ đã lưu. Thêm ít nhất một địa chỉ để đặt mặc định
                    và thanh toán nhanh hơn.
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-[13px] font-medium text-slate-700">
                            Chọn địa chỉ
                        </label>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-[13px] text-slate-800 outline-none focus:border-slate-300"
                        >
                            {addresses.map((a) => (
                                <option key={a.customerAddressId} value={a.customerAddressId}>
                                    {(a.isDefault ? "★ " : "") +
                                        a.addressLine.slice(0, 72) +
                                        (a.addressLine.length > 72 ? "…" : "")}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selected ? (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                            <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>
                                    {selected.latitude.toFixed(5)},{" "}
                                    {selected.longitude.toFixed(5)}
                                </span>
                                {selected.isDefault ? (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                        Mặc định
                                    </span>
                                ) : null}
                            </div>
                            <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-800">
                                {selected.addressLine}
                            </p>
                            <p className="mt-1 text-[12px] text-slate-600">
                                {selected.recipientName} · {selected.phone}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {!selected.isDefault ? (
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() => void handleSetDefault()}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
                                    >
                                        <Star className="h-3.5 w-3.5" />
                                        Đặt làm mặc định
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={openEdit}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Sửa
                                </button>
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => void handleDelete()}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {modalMode !== "closed" ? (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-3 py-6 backdrop-blur-[2px]">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-bold text-slate-900">
                                {modalMode === "create"
                                    ? "Thêm địa chỉ giao hàng"
                                    : "Sửa địa chỉ giao hàng"}
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg px-2 py-1 text-[13px] text-slate-500 hover:bg-slate-100"
                            >
                                Đóng
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-[12px] font-medium text-slate-700">
                                    Tên người nhận
                                </label>
                                <input
                                    value={formRecipient}
                                    onChange={(e) => setFormRecipient(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[12px] font-medium text-slate-700">
                                    Số điện thoại
                                </label>
                                <input
                                    value={formPhone}
                                    onChange={(e) => setFormPhone(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[12px] font-medium text-slate-700">
                                    Địa chỉ
                                </label>
                                <textarea
                                    value={formAddressLine}
                                    onChange={(e) => setFormAddressLine(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-slate-300"
                                />
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Khi bạn ngừng nhập khoảng ngắn, hệ thống sẽ tự
                                    cập nhật lại vị trí bản đồ theo địa chỉ
                                </p>
                                {addressResolving ? (
                                    <p className="mt-1 text-[11px] font-medium text-sky-600">
                                        Đang đồng bộ vị trí từ địa chỉ...
                                    </p>
                                ) : null}
                            </div>

                            {modalMode === "create" ? (
                                <label className="flex items-center gap-2 text-[13px] text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formIsDefault}
                                        onChange={(e) => setFormIsDefault(e.target.checked)}
                                    />
                                    Đặt làm địa chỉ mặc định
                                </label>
                            ) : null}

                            <div>
                                <p className="mb-2 text-[12px] font-medium text-slate-600">
                                    Chỉnh vị trí trên bản đồ (kéo ghim hoặc click)
                                </p>
                                <MapboxLocationPicker
                                    lat={formLat}
                                    lng={formLng}
                                    onPick={handleMapPick}
                                    onMapStatusChange={(s) => setMapStatus(s)}
                                />
                                <p className="mt-2 text-[11px] text-slate-500">
                                    Trạng thái bản đồ: {mapStatus}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => void handleSaveModal()}
                                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                            >
                                {saving ? "Đang lưu..." : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default CustomerAddressesPanel
