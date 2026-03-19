import { useEffect, useMemo, useState } from "react"
import {
    Building2,
    Check,
    ChevronRight,
    LocateFixed,
    MapPin,
    PackageCheck,
    Search,
    Truck,
    X,
} from "lucide-react"

import axiosClient from "@/utils/axiosClient"
import MapboxLocationPicker from "./MapboxLocationPicker"
import {
    supermarketService,
    type PickupPoint,
} from "@/services/supermarket.service"
import {
    administrativeService,
    type AdministrativeDistrict,
    type AdministrativeWard,
} from "@/services/administrative.service"
import {
    nominatimService,
    type NominatimReverseResult,
    type NominatimSearchItem,
} from "@/services/nominatim.service"

export type DeliveryMethodId = "DELIVERY" | "PICKUP"

export type Supermarket = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone?: string
    status?: number
    createdAt?: string
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

type SupermarketApiItem = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    status: number
    createdAt: string
}

type SupermarketsResponse = {
    success: boolean
    message: string
    data?: {
        items?: SupermarketApiItem[]
        totalResult?: number
        page?: number
        pageSize?: number
    }
    errors?: string[] | null
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

type Props = {
    open: boolean
    initialValue?: DeliveryContext
    onDone: (value: DeliveryContext) => void
    onClose: () => void
}

const HCMC_NAME = "Thành phố Hồ Chí Minh"

const normalizeText = (value?: string) =>
    (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()

const locationSourceLabel: Record<
    NonNullable<DeliveryContext["locationSource"]>,
    string
> = {
    gps: "GPS hiện tại",
    search: "Tìm kiếm địa chỉ",
    map: "Chỉnh trên bản đồ",
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

    const [districts, setDistricts] = useState<AdministrativeDistrict[]>([])
    const [wards, setWards] = useState<AdministrativeWard[]>([])
    const [districtCode, setDistrictCode] = useState<number | "">("")
    const [wardCode, setWardCode] = useState<number | "">("")
    const [streetLine, setStreetLine] = useState("")

    const [searching, setSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<NominatimSearchItem[]>([])
    const [administrativeLoading, setAdministrativeLoading] = useState(false)

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

        if (initialValue?.deliveryMethodId) {
            setDeliveryMethodId(initialValue.deliveryMethodId)
            setStep(2)
        } else {
            setStep(1)
        }

        setLat(initialValue?.lat ?? null)
        setLng(initialValue?.lng ?? null)
        setAddressText(initialValue?.addressText ?? "")
        setPickupPointId(initialValue?.pickupPointId ?? "")
        setLocationSource(initialValue?.locationSource ?? "gps")

        setDistrictCode("")
        setWardCode("")
        setStreetLine("")
        setWards([])
        setSearchResults([])
        setError("")
        setPickupError("")
        setSubmitInfo("")
        setMapStatus("idle")
    }, [open, initialValue])

    useEffect(() => {
        if (!open) return
        if (step !== 2 || deliveryMethodId !== "DELIVERY") return

            ; (async () => {
                try {
                    setAdministrativeLoading(true)
                    const items = await administrativeService.getHcmDistricts()
                    setDistricts(items)
                } catch (e: any) {
                    setError(e?.message ?? "Không tải được danh sách quận/huyện.")
                } finally {
                    setAdministrativeLoading(false)
                }
            })()
    }, [open, step, deliveryMethodId])

    useEffect(() => {
        if (!open) return
        if (!districtCode) {
            setWards([])
            setWardCode("")
            return
        }

        ; (async () => {
            try {
                setAdministrativeLoading(true)
                const items = await administrativeService.getWardsByDistrictCode(Number(districtCode))
                setWards(items)
            } catch (e: any) {
                setError(e?.message ?? "Không tải được danh sách phường/xã.")
            } finally {
                setAdministrativeLoading(false)
            }
        })()
    }, [open, districtCode])

    useEffect(() => {
        if (!open) return
        if (step !== 2 || deliveryMethodId !== "PICKUP") return

            ; (async () => {
                try {
                    setPickupLoading(true)
                    setPickupError("")
                    const items = await supermarketService.getPickupPoints()
                    setPickupPoints(items)
                } catch (e: any) {
                    setPickupError(
                        e?.response?.data?.message ??
                        e?.message ??
                        "Không tải được điểm tập kết."
                    )
                } finally {
                    setPickupLoading(false)
                }
            })()
    }, [open, step, deliveryMethodId])

    const selectedDistrict = useMemo(
        () => districts.find((item) => item.code === Number(districtCode)),
        [districts, districtCode]
    )

    const selectedWard = useMemo(
        () => wards.find((item) => item.code === Number(wardCode)),
        [wards, wardCode]
    )

    const selectedPickupPoint = useMemo(
        () => pickupPoints.find((item) => item.pickupPointId === pickupPointId),
        [pickupPoints, pickupPointId]
    )

    const hasResolvedLocation = lat != null && lng != null && !!addressText.trim()

    const pickupPointsSorted = useMemo(() => {
        if (!currentLocation) return pickupPoints

        return [...pickupPoints]
            .map((item) => ({
                ...item,
                distanceKm: haversineKm(currentLocation, { lat: item.lat, lng: item.lng }),
            }))
            .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    }, [pickupPoints, currentLocation])

    const syncAdministrativeFromReverse = async (item: NominatimReverseResult) => {
        try {
            const districtKeyword = normalizeText(item.district)
            const wardKeyword = normalizeText(item.ward)

            const districtList =
                districts.length > 0 ? districts : await administrativeService.getHcmDistricts()

            if (!districts.length) {
                setDistricts(districtList)
            }

            const matchedDistrict = districtList.find((d) => {
                const name = normalizeText(d.name)
                return districtKeyword && (name.includes(districtKeyword) || districtKeyword.includes(name))
            })

            if (!matchedDistrict) return

            setDistrictCode(matchedDistrict.code)

            const wardList = await administrativeService.getWardsByDistrictCode(matchedDistrict.code)
            setWards(wardList)

            const matchedWard = wardList.find((w) => {
                const name = normalizeText(w.name)
                return wardKeyword && (name.includes(wardKeyword) || wardKeyword.includes(name))
            })

            setWardCode(matchedWard?.code ?? "")
        } catch {
            // không block flow nếu map tên hành chính không khớp hoàn hảo
        }
    }

    const applyReverseGeocodeToForm = async (
        nextLat: number,
        nextLng: number,
        source: "gps" | "search" | "map"
    ) => {
        setLat(nextLat)
        setLng(nextLng)
        setLocationSource(source)
        setError("")
        setSubmitInfo("")
        setSearchResults([])

        try {
            const reverse = await nominatimService.reverseGeocode(nextLat, nextLng)

            const prettyAddress =
                nominatimService.buildPrettyAddressFromReverse(reverse) || reverse.displayName

            setAddressText(prettyAddress)

            const nextStreetLine = nominatimService.buildStreetLineFromReverse(reverse)
            if (nextStreetLine) {
                setStreetLine(nextStreetLine)
            }

            await syncAdministrativeFromReverse(reverse)
        } catch {
            setAddressText(`${nextLat.toFixed(6)}, ${nextLng.toFixed(6)}`)
        }
    }

    const requestCurrentLocation = () => {
        setError("")
        setSubmitInfo("")
        setSearchResults([])

        if (!navigator.geolocation) {
            setError("Trình duyệt không hỗ trợ định vị.")
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                await applyReverseGeocodeToForm(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    "gps"
                )
            },
            () => {
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
            setSearchResults([])

            if (!districtCode || !selectedDistrict) {
                setError("Bạn hãy chọn quận/huyện trước.")
                return
            }

            if (!streetLine.trim()) {
                setError("Bạn hãy nhập số nhà và tên đường.")
                return
            }

            const results = await nominatimService.searchStructuredAddress({
                streetLine: streetLine.trim(),
                wardName: selectedWard?.name,
                districtName: selectedDistrict.name,
                city: HCMC_NAME,
                country: "Việt Nam",
                limit: 5,
            })

            setSearchResults(results)

            if (!results.length) {
                setError("Không tìm thấy địa chỉ phù hợp. Bạn thử nhập chi tiết hơn hoặc chỉnh trên bản đồ nhé.")
            }
        } catch (e: any) {
            setError(e?.message ?? "Không tìm được địa chỉ.")
        } finally {
            setSearching(false)
        }
    }

    const handleSelectSearchResult = async (item: NominatimSearchItem) => {
        await applyReverseGeocodeToForm(item.lat, item.lng, "search")
        setSearchResults([])
    }

    const handlePickOnMap = async (value: { lat: number; lng: number }) => {
        await applyReverseGeocodeToForm(value.lat, value.lng, "map")
    }

    const requestCurrentLocationForPickupSort = () => {
        setPickupError("")

        if (!navigator.geolocation) {
            setPickupError("Trình duyệt không hỗ trợ định vị.")
            return
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCurrentLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                })
            },
            () => {
                setPickupError("Không lấy được vị trí hiện tại để sắp xếp khoảng cách.")
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const handleContinueStep1 = () => {
        if (!deliveryMethodId) return
        setError("")
        setSubmitInfo("")
        setStep(2)
    }

    const getNearbySupermarketsByClientFilter = async ({
        lat,
        lng,
        radiusKm,
    }: {
        lat: number
        lng: number
        radiusKm: number
    }): Promise<Supermarket[]> => {
        const res = await axiosClient.get<SupermarketsResponse>("/api/Supermarkets", {
            params: {
                pageNumber: 1,
                pageSize: 100,
            },
        })

        const items = res.data?.data?.items ?? []

        return items
            .map((item) => {
                const distanceKm = haversineKm(
                    { lat, lng },
                    { lat: item.latitude, lng: item.longitude }
                )

                return {
                    supermarketId: item.supermarketId,
                    name: item.name,
                    address: item.address,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    contactPhone: item.contactPhone,
                    status: item.status,
                    createdAt: item.createdAt,
                    distanceKm,
                }
            })
            .filter((item) => item.distanceKm <= radiusKm)
            .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    }

    const handleSubmit = async () => {
        try {
            setError("")
            setSubmitInfo("")
            setSubmitting(true)

            if (!deliveryMethodId) {
                setError("Bạn chưa chọn phương thức nhận hàng.")
                return
            }

            if (deliveryMethodId === "DELIVERY") {
                if (lat == null || lng == null) {
                    setError("Bạn chưa có tọa độ giao hàng. Hãy dùng GPS, tìm địa chỉ hoặc chọn trên bản đồ.")
                    return
                }

                if (!addressText.trim()) {
                    setError("Bạn chưa có địa chỉ giao hàng.")
                    return
                }

                setSubmitInfo("Đang tìm siêu thị phục vụ gần vị trí của bạn...")

                const supermarkets = await getNearbySupermarketsByClientFilter({
                    lat,
                    lng,
                    radiusKm: 5,
                })

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
                    nearbySupermarkets: supermarkets ?? [],
                })
                return
            }

            if (!selectedPickupPoint) {
                setError("Bạn chưa chọn điểm tập kết.")
                return
            }

            setSubmitInfo("Đang tải các siêu thị phục vụ quanh điểm tập kết...")

            const supermarkets = await getNearbySupermarketsByClientFilter({
                lat: selectedPickupPoint.lat,
                lng: selectedPickupPoint.lng,
                radiusKm: 5,
            })

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
                nearbySupermarkets: supermarkets ?? [],
            })
        } catch (e: any) {
            setError(
                e?.response?.data?.message ??
                e?.message ??
                "Có lỗi xảy ra khi hoàn tất."
            )
        } finally {
            setSubmitting(false)
            setSubmitInfo("")
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-6">
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
                                    Hệ thống sẽ dùng vị trí cuối cùng bạn xác nhận để lọc siêu thị trong bán kính phù hợp.
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
                                <div className="text-slate-500">Xác nhận vị trí / điểm nhận</div>
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
                                                Dùng GPS, tìm kiếm địa chỉ hoặc chỉnh lại vị trí trên bản đồ.
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
                            <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900">
                                                    Cách xác định vị trí
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    Chọn một trong các cách bên dưới. Kết quả cuối sẽ hiển thị ở cột bên phải.
                                                </div>
                                            </div>
                                            <Truck size={18} className="text-sky-600" />
                                        </div>

                                        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
                                            <div className="text-sm font-medium text-slate-900">
                                                1. Chọn nhanh bằng vị trí hiện tại
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Phù hợp khi bạn muốn hệ thống tự lấy vị trí hiện tại rồi tự điền địa chỉ gần đúng.
                                            </div>

                                            <button
                                                type="button"
                                                onClick={requestCurrentLocation}
                                                className={cn(
                                                    secondaryBtn,
                                                    "mt-3 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5"
                                                )}
                                            >
                                                <LocateFixed size={16} />
                                                Dùng vị trí hiện tại
                                            </button>
                                        </div>

                                        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                                            <div className="text-sm font-medium text-slate-900">
                                                2. Tìm theo địa chỉ
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Chọn khu vực hành chính rồi nhập số nhà, tên đường để tìm vị trí chính xác hơn.
                                            </div>

                                            <div className="mt-4 grid gap-3">
                                                <div>
                                                    <div className="text-xs font-medium text-slate-500">Thành phố</div>
                                                    <input
                                                        value={HCMC_NAME}
                                                        disabled
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="text-xs font-medium text-slate-500">Quận / Huyện</div>
                                                    <select
                                                        value={districtCode}
                                                        onChange={(e) =>
                                                            setDistrictCode(e.target.value ? Number(e.target.value) : "")
                                                        }
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300"
                                                    >
                                                        <option value="">Chọn quận / huyện</option>
                                                        {districts.map((item) => (
                                                            <option key={item.code} value={item.code}>
                                                                {item.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <div className="text-xs font-medium text-slate-500">Phường / Xã</div>
                                                    <select
                                                        value={wardCode}
                                                        onChange={(e) =>
                                                            setWardCode(e.target.value ? Number(e.target.value) : "")
                                                        }
                                                        disabled={!districtCode}
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 disabled:bg-slate-100"
                                                    >
                                                        <option value="">Chọn phường / xã</option>
                                                        {wards.map((item) => (
                                                            <option key={item.code} value={item.code}>
                                                                {item.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <div className="text-xs font-medium text-slate-500">Số nhà, tên đường</div>
                                                    <input
                                                        value={streetLine}
                                                        onChange={(e) => setStreetLine(e.target.value)}
                                                        placeholder="Ví dụ: 7 Đường số 10"
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleSearchAddress}
                                                disabled={searching || administrativeLoading}
                                                className={cn(
                                                    primaryBtn,
                                                    "mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5"
                                                )}
                                            >
                                                <Search size={15} />
                                                {searching ? "Đang tìm" : "Tìm vị trí"}
                                            </button>

                                            {!!searchResults.length && (
                                                <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-sky-100 bg-white p-2">
                                                    <div className="mb-2 px-1 text-xs font-medium text-slate-500">
                                                        Chọn một kết quả phù hợp
                                                    </div>

                                                    <div className="grid gap-2">
                                                        {searchResults.map((item) => (
                                                            <button
                                                                key={item.placeId}
                                                                type="button"
                                                                onClick={() => void handleSelectSearchResult(item)}
                                                                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-left text-sm transition hover:border-sky-200 hover:bg-sky-50"
                                                            >
                                                                <div className="font-medium text-slate-900">
                                                                    {item.displayName}
                                                                </div>
                                                                <div className="mt-1 text-xs text-slate-500">
                                                                    {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {submitInfo ? <div className="text-sm text-sky-600">{submitInfo}</div> : null}
                                    {error ? <div className="text-sm text-red-500">{error}</div> : null}
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-semibold text-slate-900">
                                                    Vị trí đã xác nhận
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    Hệ thống sẽ dùng đúng vị trí này để lọc siêu thị phục vụ.
                                                </div>
                                            </div>

                                            <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                                                {hasResolvedLocation
                                                    ? locationSourceLabel[locationSource]
                                                    : "Chưa xác nhận"}
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                                            <div className="text-sm font-medium text-slate-900">
                                                {addressText || "Chưa có vị trí nào được xác nhận"}
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                    <div className="font-medium">Lat</div>
                                                    <div>{lat != null ? lat.toFixed(6) : "—"}</div>
                                                </div>

                                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                    <div className="font-medium">Lng</div>
                                                    <div>{lng != null ? lng.toFixed(6) : "—"}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900">
                                                    3. Tinh chỉnh trên bản đồ
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    Click bản đồ hoặc kéo ghim để chỉnh vị trí chính xác hơn.
                                                    Mỗi lần chỉnh, địa chỉ xác nhận sẽ tự cập nhật.
                                                </div>
                                            </div>
                                            <MapPin size={18} className="text-sky-600" />
                                        </div>

                                        {lat != null && lng != null ? (
                                            <>
                                                <MapboxLocationPicker
                                                    lat={lat}
                                                    lng={lng}
                                                    onPick={(value) => void handlePickOnMap(value)}
                                                    onMapStatusChange={(status) => setMapStatus(status)}
                                                />

                                                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                                                    <span>
                                                        Trạng thái bản đồ:{" "}
                                                        <span className="font-medium">
                                                            {mapStatus === "idle" && "Chưa khởi tạo"}
                                                            {mapStatus === "loading" && "Đang tải"}
                                                            {mapStatus === "loaded" && "Đã kết nối Mapbox"}
                                                            {mapStatus === "error" && "Lỗi kết nối Mapbox"}
                                                        </span>
                                                    </span>

                                                    {lat != null && lng != null ? (
                                                        <a
                                                            href={googleMapsUrl(lat, lng)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-medium text-sky-700 hover:underline"
                                                        >
                                                            Mở Google Maps
                                                        </a>
                                                    ) : null}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="grid h-[320px] place-items-center rounded-2xl border border-dashed border-sky-200 bg-sky-50 text-center">
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        Chưa có tọa độ để hiển thị bản đồ
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        Hãy dùng GPS hoặc tìm địa chỉ trước, rồi bạn có thể tinh chỉnh lại trên bản đồ.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl bg-sky-50 p-4 text-sm text-slate-600">
                                        Sau khi bấm hoàn tất, hệ thống sẽ tìm siêu thị trong bán kính 5km từ vị trí đã xác nhận ở trên. Nếu chưa có siêu thị phù hợp, địa chỉ vẫn sẽ được lưu để bạn ra trang chủ bình thường.
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
                                            disabled={submitting || !hasResolvedLocation}
                                            className={cn(
                                                primaryBtn,
                                                "inline-flex min-w-[140px] items-center justify-center gap-2 px-5 py-2.5"
                                            )}
                                        >
                                            {submitting ? "Đang xử lý..." : "Hoàn tất"}
                                            <Check size={16} />
                                        </button>
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
                                                            <div className="font-semibold text-slate-900">
                                                                {item.name}
                                                            </div>
                                                            <div className="mt-1 text-sm text-slate-500">
                                                                {item.address}
                                                            </div>

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
