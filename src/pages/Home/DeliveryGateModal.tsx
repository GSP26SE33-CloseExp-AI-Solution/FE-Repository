import { useEffect, useMemo, useState } from "react"
import {
    Building2,
    Check,
    ChevronRight,
    LocateFixed,
    MapPin,
    Navigation,
    PackageCheck,
    Pencil,
    Search,
    Truck,
    X,
} from "lucide-react"

import MapboxLocationPicker from "./MapboxLocationPicker"
import {
    forwardGeocode,
    reverseGeocode,
    type GeocodeItem,
} from "@/services/mapbox.service"

export type DeliveryMethodId = "DELIVERY" | "PICKUP"

export type Supermarket = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    distanceKm?: number
}

export type DeliveryContext = {
    deliveryMethodId?: DeliveryMethodId

    locationSource?: "gps" | "search" | "map"
    lat?: number
    lng?: number
    addressText?: string

    pickupPointId?: string
    pickupPointName?: string
    pickupPointAddress?: string
    pickupLat?: number
    pickupLng?: number

    nearbySupermarkets?: Supermarket[]
}

type PickupPoint = {
    pickupPointId: string
    name: string
    address: string
    lat: number
    lng: number
}

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const primaryBtn =
    "bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-xl shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"

const secondaryBtn =
    "rounded-xl border border-sky-200 bg-white text-sky-700 transition hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"

const googleMapsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`

const toRad = (value: number) => (value * Math.PI) / 180

const haversineKm = (
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
) => {
    const R = 6371
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)

    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) *
        Math.cos(toRad(b.lat)) *
        Math.sin(dLng / 2) ** 2

    return 2 * R * Math.asin(Math.sqrt(x))
}

const fetchPickupPointsFromBE = async (): Promise<PickupPoint[]> => {
    console.log("[Pickup] fetching pickup points from BE ...")

    await new Promise((resolve) => setTimeout(resolve, 500))

    const data: PickupPoint[] = [
        {
            pickupPointId: "PP_Q1_BT",
            name: "Điểm tập kết Bến Thành",
            address: "48 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
            lat: 10.7722,
            lng: 106.6983,
        },
        {
            pickupPointId: "PP_Q3_VTS",
            name: "Điểm tập kết Võ Thị Sáu",
            address: "220 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP.HCM",
            lat: 10.7842,
            lng: 106.6897,
        },
        {
            pickupPointId: "PP_BT_HHT",
            name: "Điểm tập kết Bình Thạnh",
            address: "135 Hai Bà Trưng, Phường 6, Bình Thạnh, TP.HCM",
            lat: 10.8019,
            lng: 106.7092,
        },
        {
            pickupPointId: "PP_TD_TDM",
            name: "Điểm tập kết Thủ Đức",
            address: "10 Võ Văn Ngân, Linh Chiểu, TP. Thủ Đức, TP.HCM",
            lat: 10.8497,
            lng: 106.7716,
        },
        {
            pickupPointId: "PP_Q7_PMH",
            name: "Điểm tập kết Phú Mỹ Hưng",
            address: "105 Tôn Dật Tiên, Tân Phú, Quận 7, TP.HCM",
            lat: 10.7296,
            lng: 106.7217,
        },
        {
            pickupPointId: "PP_TB",
            name: "Điểm tập kết Tân Bình",
            address: "15 Cộng Hòa, Phường 4, Tân Bình, TP.HCM",
            lat: 10.8014,
            lng: 106.6527,
        },
    ]

    console.log("[Pickup] BE result:", data)
    return data
}

const mockNearbySupermarkets = async (
    center: { lat: number; lng: number },
    mode: DeliveryMethodId
): Promise<Supermarket[]> => {
    console.log("[NearbySupermarket] request:", { center, mode })

    await new Promise((resolve) => setTimeout(resolve, 700))

    const result = [
        {
            supermarketId: "SM_001",
            name: mode === "DELIVERY" ? "FreshMart Bến Thành" : "PickupMart Central",
            address: "Bến Thành, Quận 1, TP.HCM",
            latitude: center.lat + 0.0021,
            longitude: center.lng + 0.0018,
            distanceKm: 1.2,
        },
        {
            supermarketId: "SM_002",
            name: "GreenBasket HCM",
            address: "Võ Thị Sáu, Quận 3, TP.HCM",
            latitude: center.lat + 0.003,
            longitude: center.lng - 0.002,
            distanceKm: 2.8,
        },
        {
            supermarketId: "SM_003",
            name: "CloseSave Market",
            address: "Bình Thạnh, TP.HCM",
            latitude: center.lat - 0.0015,
            longitude: center.lng + 0.0022,
            distanceKm: 3.9,
        },
    ]

    console.log("[NearbySupermarket] response:", result)
    return result
}

type Props = {
    open: boolean
    initialValue?: DeliveryContext
    onDone: (value: DeliveryContext) => void
    onClose: () => void
}

const DeliveryGateModal = ({
    open,
    initialValue,
    onDone,
    onClose,
}: Props) => {
    const [step, setStep] = useState<1 | 2>(1)

    const [deliveryMethodId, setDeliveryMethodId] = useState<DeliveryMethodId | "">(
        initialValue?.deliveryMethodId ?? ""
    )

    const [lat, setLat] = useState<number | null>(initialValue?.lat ?? null)
    const [lng, setLng] = useState<number | null>(initialValue?.lng ?? null)
    const [addressText, setAddressText] = useState(initialValue?.addressText ?? "")
    const [locationSource, setLocationSource] = useState<"gps" | "search" | "map">(
        initialValue?.locationSource ?? "gps"
    )

    const [searchText, setSearchText] = useState(initialValue?.addressText ?? "")
    const [searching, setSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<GeocodeItem[]>([])

    const [pickupPointId, setPickupPointId] = useState(initialValue?.pickupPointId ?? "")
    const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
    const [pickupLoading, setPickupLoading] = useState(false)
    const [pickupError, setPickupError] = useState("")
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

    const [submitting, setSubmitting] = useState(false)
    const [submitInfo, setSubmitInfo] = useState("")
    const [error, setError] = useState("")
    const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle")

    useEffect(() => {
        if (!open) return

        console.log("[DeliveryGate] modal open with initialValue:", initialValue)

        if (initialValue?.deliveryMethodId) {
            setDeliveryMethodId(initialValue.deliveryMethodId)
            setStep(2)
        } else {
            setStep(1)
        }

        setLat(initialValue?.lat ?? null)
        setLng(initialValue?.lng ?? null)
        setAddressText(initialValue?.addressText ?? "")
        setSearchText(initialValue?.addressText ?? "")
        setPickupPointId(initialValue?.pickupPointId ?? "")
        setLocationSource(initialValue?.locationSource ?? "gps")

        setSearchResults([])
        setError("")
        setPickupError("")
        setSubmitInfo("")
        setMapStatus("idle")
    }, [open, initialValue])

    useEffect(() => {
        if (!open) return
        if (step !== 2 || deliveryMethodId !== "PICKUP") return

            ; (async () => {
                try {
                    setPickupLoading(true)
                    setPickupError("")
                    const items = await fetchPickupPointsFromBE()
                    setPickupPoints(items)
                } catch (e: any) {
                    console.error("[Pickup] load error:", e)
                    setPickupError(e?.message ?? "Không tải được điểm tập kết.")
                } finally {
                    setPickupLoading(false)
                }
            })()
    }, [open, step, deliveryMethodId])

    const selectedPickupPoint = useMemo(
        () => pickupPoints.find((item) => item.pickupPointId === pickupPointId),
        [pickupPoints, pickupPointId]
    )

    const pickupPointsSorted = useMemo(() => {
        if (!currentLocation) return pickupPoints

        return [...pickupPoints]
            .map((item) => ({
                ...item,
                distanceKm: haversineKm(currentLocation, { lat: item.lat, lng: item.lng }),
            }))
            .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    }, [pickupPoints, currentLocation])

    const requestCurrentLocation = () => {
        setError("")
        setSubmitInfo("")
        setSearchResults([])

        console.log("[Delivery] requestCurrentLocation called")

        if (!navigator.geolocation) {
            setError("Trình duyệt không hỗ trợ định vị.")
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const nextLat = pos.coords.latitude
                    const nextLng = pos.coords.longitude

                    console.log("[Delivery] GPS result:", { lat: nextLat, lng: nextLng })

                    setLat(nextLat)
                    setLng(nextLng)
                    setLocationSource("gps")

                    const rev = await reverseGeocode(nextLat, nextLng)
                    console.log("[Delivery] reverseGeocode result from GPS:", rev)

                    if (rev) {
                        setAddressText(rev.addressText)
                        setSearchText(rev.addressText)
                    } else {
                        setAddressText(`${nextLat.toFixed(6)}, ${nextLng.toFixed(6)}`)
                    }
                } catch (e: any) {
                    console.error("[Delivery] GPS reverse error:", e)
                    setError(e?.message ?? "Không lấy được địa chỉ từ GPS.")
                }
            },
            (geoErr) => {
                console.error("[Delivery] GPS permission/error:", geoErr)
                setError("Bạn chưa cấp quyền truy cập vị trí hoặc thiết bị không lấy được GPS.")
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const handleSearchAddress = async () => {
        try {
            setError("")
            setSubmitInfo("")
            setSearching(true)

            console.log("[Delivery] forwardGeocode searchText:", searchText)

            const items = await forwardGeocode(searchText)
            console.log("[Delivery] forwardGeocode results:", items)

            setSearchResults(items)

            if (!items.length) {
                setError("Không tìm thấy địa chỉ phù hợp.")
            }
        } catch (e: any) {
            console.error("[Delivery] search error:", e)
            setError(e?.message ?? "Không tìm được địa chỉ.")
        } finally {
            setSearching(false)
        }
    }

    const handleSelectSearchResult = (item: GeocodeItem) => {
        console.log("[Delivery] selected search result:", item)

        setLat(item.lat)
        setLng(item.lng)
        setAddressText(item.addressText)
        setSearchText(item.addressText)
        setLocationSource("search")
        setSearchResults([])
        setError("")
        setSubmitInfo("")
    }

    const handlePickOnMap = async (value: { lat: number; lng: number }) => {
        console.log("[Delivery] picked on map:", value)

        setLat(value.lat)
        setLng(value.lng)
        setLocationSource("map")
        setError("")
        setSubmitInfo("")

        try {
            const rev = await reverseGeocode(value.lat, value.lng)
            console.log("[Delivery] reverseGeocode result from map:", rev)

            if (rev) {
                setAddressText(rev.addressText)
                setSearchText(rev.addressText)
            }
        } catch (e) {
            console.error("[Delivery] reverse from map failed:", e)
        }
    }

    const requestCurrentLocationForPickupSort = () => {
        setPickupError("")

        console.log("[Pickup] requestCurrentLocationForPickupSort called")

        if (!navigator.geolocation) {
            setPickupError("Trình duyệt không hỗ trợ định vị.")
            return
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                }

                console.log("[Pickup] current location:", next)
                setCurrentLocation(next)
            },
            (geoErr) => {
                console.error("[Pickup] get current location failed:", geoErr)
                setPickupError("Không lấy được vị trí hiện tại để sắp xếp khoảng cách.")
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const handleContinueStep1 = () => {
        if (!deliveryMethodId) return

        console.log("[DeliveryGate] continue step 1 with method:", deliveryMethodId)

        setError("")
        setSubmitInfo("")
        setStep(2)
    }

    const handleSubmit = async () => {
        try {
            setError("")
            setSubmitInfo("")
            setSubmitting(true)

            console.log("[DeliveryGate] submit start", {
                deliveryMethodId,
                lat,
                lng,
                addressText,
                pickupPointId,
                selectedPickupPoint,
            })

            if (!deliveryMethodId) {
                setError("Bạn chưa chọn phương thức nhận hàng.")
                return
            }

            if (deliveryMethodId === "DELIVERY") {
                if (lat == null || lng == null) {
                    setError("Bạn chưa có tọa độ giao hàng. Hãy dùng GPS, tìm địa chỉ, hoặc chọn trên bản đồ.")
                    return
                }

                if (!addressText.trim()) {
                    setError("Bạn chưa có địa chỉ giao hàng.")
                    return
                }

                setSubmitInfo("Đang tìm siêu thị phục vụ gần vị trí của bạn...")

                const supermarkets = await mockNearbySupermarkets({ lat, lng }, "DELIVERY")

                if (!supermarkets.length) {
                    setError("Không tìm thấy siêu thị phù hợp trong bán kính phục vụ.")
                    return
                }

                onDone({
                    deliveryMethodId: "DELIVERY",
                    locationSource,
                    lat,
                    lng,
                    addressText,
                    pickupPointId: "",
                    pickupPointName: "",
                    pickupPointAddress: "",
                    pickupLat: undefined,
                    pickupLng: undefined,
                    nearbySupermarkets: supermarkets,
                })
                return
            }

            if (!selectedPickupPoint) {
                setError("Bạn chưa chọn điểm tập kết.")
                return
            }

            setSubmitInfo("Đang tải các siêu thị phục vụ quanh điểm tập kết...")

            const supermarkets = await mockNearbySupermarkets(
                { lat: selectedPickupPoint.lat, lng: selectedPickupPoint.lng },
                "PICKUP"
            )

            if (!supermarkets.length) {
                setError("Không tìm thấy siêu thị phù hợp quanh điểm tập kết đã chọn.")
                return
            }

            onDone({
                deliveryMethodId: "PICKUP",
                pickupPointId: selectedPickupPoint.pickupPointId,
                pickupPointName: selectedPickupPoint.name,
                pickupPointAddress: selectedPickupPoint.address,
                pickupLat: selectedPickupPoint.lat,
                pickupLng: selectedPickupPoint.lng,
                lat: undefined,
                lng: undefined,
                addressText: undefined,
                locationSource: undefined,
                nearbySupermarkets: supermarkets,
            })
        } catch (e: any) {
            console.error("[DeliveryGate] submit error:", e)
            setError(e?.message ?? "Có lỗi xảy ra khi hoàn tất. Mở Console để xem log chi tiết.")
        } finally {
            setSubmitting(false)
            setSubmitInfo("")
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm">
            <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-6">
                <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                    <div className="border-b border-sky-100 px-6 py-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700">
                                    <MapPin size={14} />
                                    Thiết lập vị trí mua hàng trước khi xem sản phẩm
                                </div>

                                <h2 className="mt-3 text-xl font-semibold text-slate-900">
                                    Chọn phương thức nhận hàng và vị trí mong muốn
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Bạn có thể đóng màn hình này. Nhưng nếu chưa thiết lập xong thì hệ thống sẽ chưa hiển thị sản phẩm theo bán kính.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                                aria-label="Đóng"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                            <div
                                className={cn(
                                    "rounded-2xl border px-4 py-3",
                                    step === 1 ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"
                                )}
                            >
                                <div className="font-semibold text-slate-900">Bước 1</div>
                                <div className="text-slate-500">Chọn phương thức</div>
                            </div>

                            <div
                                className={cn(
                                    "rounded-2xl border px-4 py-3",
                                    step === 2 ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"
                                )}
                            >
                                <div className="font-semibold text-slate-900">Bước 2</div>
                                <div className="text-slate-500">Chọn vị trí / điểm nhận</div>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        {step === 1 && (
                            <div className="grid gap-4">
                                <button
                                    type="button"
                                    onClick={() => setDeliveryMethodId("DELIVERY")}
                                    className={cn(
                                        "rounded-2xl border p-5 text-left transition",
                                        deliveryMethodId === "DELIVERY"
                                            ? "border-sky-300 bg-sky-50"
                                            : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 rounded-xl bg-sky-100 p-2 text-sky-700">
                                            <Truck size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">Giao tận nơi</div>
                                            <div className="mt-1 text-sm text-slate-500">
                                                Lấy GPS hoặc tìm địa chỉ, sau đó có thể chỉnh vị trí lại trên bản đồ.
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDeliveryMethodId("PICKUP")}
                                    className={cn(
                                        "rounded-2xl border p-5 text-left transition",
                                        deliveryMethodId === "PICKUP"
                                            ? "border-sky-300 bg-sky-50"
                                            : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 rounded-xl bg-sky-100 p-2 text-sky-700">
                                            <PackageCheck size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">Tự lấy tại điểm tập kết</div>
                                            <div className="mt-1 text-sm text-slate-500">
                                                Chọn một điểm nhận hàng có sẵn trong hệ thống.
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleContinueStep1}
                                        disabled={!deliveryMethodId}
                                        className={cn(primaryBtn, "inline-flex items-center gap-2 px-5 py-2.5")}
                                    >
                                        Tiếp tục
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && deliveryMethodId === "DELIVERY" && (
                            <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900">Vị trí giao hàng</div>
                                                <div className="text-sm text-slate-500">
                                                    Dùng GPS, tìm địa chỉ hoặc chỉnh tay trên map
                                                </div>
                                            </div>
                                            <Truck size={18} className="text-sky-600" />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={requestCurrentLocation}
                                            className={cn(
                                                secondaryBtn,
                                                "mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5"
                                            )}
                                        >
                                            <LocateFixed size={16} />
                                            Dùng vị trí hiện tại
                                        </button>

                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-slate-500">Tìm địa chỉ</div>
                                            <div className="mt-2 flex gap-2">
                                                <input
                                                    value={searchText}
                                                    onChange={(e) => setSearchText(e.target.value)}
                                                    placeholder="Ví dụ: 12 Nguyễn Trãi, Quận 1"
                                                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSearchAddress}
                                                    disabled={searching || !searchText.trim()}
                                                    className={cn(primaryBtn, "inline-flex items-center gap-2 px-4 py-2")}
                                                >
                                                    <Search size={15} />
                                                    {searching ? "Đang tìm" : "Tìm"}
                                                </button>
                                            </div>
                                        </div>

                                        {!!searchResults.length && (
                                            <div className="mt-3 max-h-52 overflow-y-auto rounded-2xl border border-sky-100 bg-sky-50/40 p-2">
                                                <div className="grid gap-2">
                                                    {searchResults.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => handleSelectSearchResult(item)}
                                                            className="rounded-xl bg-white p-3 text-left text-sm ring-1 ring-slate-100 transition hover:ring-sky-200"
                                                        >
                                                            <div className="font-medium text-slate-900">{item.addressText}</div>
                                                            <div className="mt-1 text-xs text-slate-500">
                                                                {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                                            <div className="text-xs font-medium text-slate-500">Địa chỉ hiện tại</div>
                                            <div className="mt-1 text-sm text-slate-900">
                                                {addressText || "Chưa có địa chỉ"}
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                                <div className="rounded-xl bg-white px-3 py-2">
                                                    <div className="font-medium">Lat</div>
                                                    <div>{lat != null ? lat.toFixed(6) : "—"}</div>
                                                </div>
                                                <div className="rounded-xl bg-white px-3 py-2">
                                                    <div className="font-medium">Lng</div>
                                                    <div>{lng != null ? lng.toFixed(6) : "—"}</div>
                                                </div>
                                            </div>

                                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-slate-600">
                                                <Pencil size={12} />
                                                Nguồn vị trí: {locationSource}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className={cn(secondaryBtn, "px-4 py-2.5")}
                                        >
                                            Quay lại bước 1
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className={cn(primaryBtn, "inline-flex items-center gap-2 px-5 py-2.5")}
                                        >
                                            {submitting ? "Đang xử lý..." : "Hoàn tất"}
                                            <Check size={16} />
                                        </button>
                                    </div>

                                    {submitInfo ? <div className="text-sm text-sky-600">{submitInfo}</div> : null}
                                    {error ? <div className="text-sm text-red-500">{error}</div> : null}
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900">Chọn vị trí trên bản đồ</div>
                                                <div className="text-sm text-slate-500">
                                                    Click bản đồ hoặc kéo marker để chỉnh vị trí chính xác
                                                </div>
                                            </div>
                                            <Navigation size={18} className="text-sky-600" />
                                        </div>

                                        {lat != null && lng != null ? (
                                            <>
                                                <MapboxLocationPicker
                                                    lat={lat}
                                                    lng={lng}
                                                    onPick={handlePickOnMap}
                                                    onMapStatusChange={(status) => {
                                                        console.log("[Mapbox] status:", status)
                                                        setMapStatus(status)
                                                    }}
                                                />

                                                <div className="mt-3 text-xs text-slate-500">
                                                    Trạng thái bản đồ:{" "}
                                                    <span className="font-medium">
                                                        {mapStatus === "idle" && "Chưa khởi tạo"}
                                                        {mapStatus === "loading" && "Đang tải"}
                                                        {mapStatus === "loaded" && "Đã kết nối Mapbox"}
                                                        {mapStatus === "error" && "Lỗi kết nối Mapbox"}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="grid h-[320px] place-items-center rounded-2xl border border-dashed border-sky-200 bg-sky-50 text-center">
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        Chưa có tọa độ để hiển thị bản đồ
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        Hãy dùng GPS hoặc tìm địa chỉ trước nha
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl bg-sky-50 p-4 text-sm text-slate-600">
                                        Sau khi bấm hoàn tất, FE sẽ lấy tọa độ này để gửi sang BE tìm siêu thị trong
                                        bán kính 5km.
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && deliveryMethodId === "PICKUP" && (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-slate-900">Chọn điểm tập kết</div>
                                            <div className="text-sm text-slate-500">
                                                Danh sách điểm tập kết được lấy từ hệ thống
                                            </div>
                                        </div>
                                        <Building2 size={18} className="text-sky-600" />
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={requestCurrentLocationForPickupSort}
                                            className={cn(secondaryBtn, "px-4 py-2.5")}
                                        >
                                            Sắp xếp gần tôi
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className={cn(secondaryBtn, "px-4 py-2.5")}
                                        >
                                            Quay lại bước 1
                                        </button>
                                    </div>

                                    {pickupLoading ? (
                                        <div className="mt-4 text-sm text-slate-500">Đang tải điểm tập kết...</div>
                                    ) : null}

                                    {pickupError ? (
                                        <div className="mt-4 text-sm text-red-500">{pickupError}</div>
                                    ) : null}

                                    <div className="mt-4 grid gap-3">
                                        {pickupPointsSorted.map((item: PickupPoint & { distanceKm?: number }) => {
                                            const active = item.pickupPointId === pickupPointId

                                            return (
                                                <button
                                                    key={item.pickupPointId}
                                                    type="button"
                                                    onClick={() => {
                                                        console.log("[Pickup] selected point:", item)
                                                        setPickupPointId(item.pickupPointId)
                                                        setError("")
                                                        setSubmitInfo("")
                                                    }}
                                                    className={cn(
                                                        "rounded-2xl border p-4 text-left transition",
                                                        active
                                                            ? "border-sky-300 bg-sky-50"
                                                            : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-slate-900">{item.name}</div>
                                                            <div className="mt-1 text-sm text-slate-500">{item.address}</div>

                                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                                <span>
                                                                    {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                                                                </span>

                                                                {typeof item.distanceKm === "number" ? (
                                                                    <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">
                                                                        Cách bạn {item.distanceKm.toFixed(1)} km
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>

                                                        <a
                                                            href={googleMapsUrl(item.lat, item.lng)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="shrink-0 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-sky-700 hover:bg-sky-50"
                                                        >
                                                            Xem đường đi
                                                        </a>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={submitting || !selectedPickupPoint}
                                        className={cn(primaryBtn, "inline-flex items-center gap-2 px-5 py-2.5")}
                                    >
                                        {submitting ? "Đang xử lý..." : "Hoàn tất"}
                                        <Check size={16} />
                                    </button>
                                </div>

                                {submitInfo ? <div className="text-sm text-sky-600">{submitInfo}</div> : null}
                                {error ? <div className="text-sm text-red-500">{error}</div> : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeliveryGateModal
