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

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const primaryBtn =
    "rounded-2xl bg-slate-900 text-white font-semibold transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"

const secondaryBtn =
    "rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"

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
    gps: "Vị trí hiện tại",
    search: "Tìm theo địa chỉ",
    map: "Chỉnh trên bản đồ",
}

const normalizeNearbySupermarkets = (input: any): Supermarket[] => {
    const rawItems = Array.isArray(input)
        ? input
        : Array.isArray(input?.items)
            ? input.items
            : Array.isArray(input?.data?.items)
                ? input.data.items
                : Array.isArray(input?.data)
                    ? input.data
                    : []

    return rawItems
        .map((item: any) => ({
            supermarketId: String(item?.supermarketId ?? item?.id ?? "").trim(),
            name: item?.name ?? "",
            address: item?.address ?? "",
            latitude: Number(item?.latitude ?? item?.lat ?? 0),
            longitude: Number(item?.longitude ?? item?.lng ?? 0),
            contactPhone: item?.contactPhone,
            status: item?.status,
            createdAt: item?.createdAt,
            distanceKm:
                typeof item?.distanceKm === "number"
                    ? item.distanceKm
                    : typeof item?.distance === "number"
                        ? item.distance
                        : undefined,
        }))
        .filter((item: Supermarket) => !!item.supermarketId)
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
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(
        null
    )

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
                        "Không tải được điểm nhận hàng."
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
            //
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
                setError("Bạn chưa cấp quyền vị trí hoặc thiết bị không lấy được GPS.")
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
                setError("Mình chưa tìm thấy địa chỉ phù hợp. Bạn thử nhập chi tiết hơn hoặc chỉnh trên bản đồ nhé.")
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

    const handleSubmit = async () => {
        try {
            setError("")
            setSubmitInfo("")
            setSubmitting(true)

            if (!deliveryMethodId) {
                setError("Bạn chưa chọn cách nhận hàng.")
                return
            }

            if (deliveryMethodId === "DELIVERY") {
                if (lat == null || lng == null) {
                    setError("Bạn chưa chọn được vị trí giao hàng.")
                    return
                }

                if (!addressText.trim()) {
                    setError("Bạn chưa có địa chỉ giao hàng.")
                    return
                }

                setSubmitInfo("Đang tìm các siêu thị phù hợp gần bạn...")

                const supermarketsResponse =
                    await supermarketService.getNearbySupermarketsByClientFilter({
                        lat,
                        lng,
                        radiusKm: 5,
                    })

                const normalizedSupermarkets = normalizeNearbySupermarkets(supermarketsResponse)

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
                    nearbySupermarkets: normalizedSupermarkets,
                })
                return
            }

            if (!selectedPickupPoint) {
                setError("Bạn chưa chọn điểm nhận hàng.")
                return
            }

            setSubmitInfo("Đang tìm các siêu thị phù hợp quanh điểm nhận...")

            const supermarketsResponse =
                await supermarketService.getNearbySupermarketsByClientFilter({
                    lat: selectedPickupPoint.lat,
                    lng: selectedPickupPoint.lng,
                    radiusKm: 5,
                })

            const normalizedSupermarkets = normalizeNearbySupermarkets(supermarketsResponse)

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
                nearbySupermarkets: normalizedSupermarkets,
            })
        } catch (e: any) {
            setError(
                e?.response?.data?.message ??
                e?.message ??
                "Có lỗi xảy ra khi lưu lựa chọn."
            )
        } finally {
            setSubmitting(false)
            setSubmitInfo("")
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-6">
                <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                                    <MapPin size={14} />
                                    Chọn khu vực mua sắm
                                </div>

                                <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-slate-900">
                                    Thiết lập cách nhận hàng
                                </h2>

                                <p className="mt-1 text-[14px] font-medium leading-6 text-slate-500">
                                    Chọn cách nhận phù hợp và xác nhận khu vực để xem những ưu đãi gần bạn.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-2xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
                                aria-label="Đóng"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div
                                className={cn(
                                    "rounded-2xl border px-4 py-3",
                                    step === 1 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"
                                )}
                            >
                                <div className="text-[13px] font-semibold">Bước 1</div>
                                <div className={cn("mt-1 text-[12px]", step === 1 ? "text-white/70" : "text-slate-500")}>
                                    Chọn cách nhận
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "rounded-2xl border px-4 py-3",
                                    step === 2 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"
                                )}
                            >
                                <div className="text-[13px] font-semibold">Bước 2</div>
                                <div className={cn("mt-1 text-[12px]", step === 2 ? "text-white/70" : "text-slate-500")}>
                                    Xác nhận khu vực
                                </div>
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
                                        "rounded-[24px] border p-5 text-left transition",
                                        deliveryMethodId === "DELIVERY"
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={cn(
                                                "mt-1 rounded-2xl p-2.5",
                                                deliveryMethodId === "DELIVERY"
                                                    ? "bg-white/10 text-white"
                                                    : "bg-slate-100 text-slate-700"
                                            )}
                                        >
                                            <Truck size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[16px] font-semibold">Giao tận nơi</div>
                                            <div
                                                className={cn(
                                                    "mt-1 text-[13px] leading-6",
                                                    deliveryMethodId === "DELIVERY" ? "text-white/75" : "text-slate-500"
                                                )}
                                            >
                                                Dùng vị trí hiện tại, tìm theo địa chỉ hoặc chỉnh lại trên bản đồ.
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDeliveryMethodId("PICKUP")}
                                    className={cn(
                                        "rounded-[24px] border p-5 text-left transition",
                                        deliveryMethodId === "PICKUP"
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={cn(
                                                "mt-1 rounded-2xl p-2.5",
                                                deliveryMethodId === "PICKUP"
                                                    ? "bg-white/10 text-white"
                                                    : "bg-slate-100 text-slate-700"
                                            )}
                                        >
                                            <PackageCheck size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[16px] font-semibold">Nhận tại điểm hẹn</div>
                                            <div
                                                className={cn(
                                                    "mt-1 text-[13px] leading-6",
                                                    deliveryMethodId === "PICKUP" ? "text-white/75" : "text-slate-500"
                                                )}
                                            >
                                                Chọn một điểm nhận sẵn có để xem ưu đãi phù hợp khu vực đó.
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleContinueStep1}
                                        disabled={!deliveryMethodId}
                                        className={cn(primaryBtn, "inline-flex items-center gap-2 px-5 py-2.5 text-sm")}
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
                                    <div className="rounded-[28px] border border-slate-200 bg-white p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-[16px] font-semibold text-slate-900">
                                                    Chọn khu vực giao hàng
                                                </div>
                                                <div className="mt-1 text-[13px] font-medium leading-6 text-slate-500">
                                                    Bạn có thể chọn nhanh bằng GPS, nhập địa chỉ hoặc tinh chỉnh lại trên bản đồ.
                                                </div>
                                            </div>
                                            <Truck size={18} className="text-slate-700" />
                                        </div>

                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                                            <div className="text-[13px] font-semibold text-slate-900">
                                                1. Dùng vị trí hiện tại
                                            </div>
                                            <div className="mt-1 text-[12px] font-medium leading-5 text-slate-500">
                                                Phù hợp khi bạn muốn chọn nhanh khu vực đang đứng.
                                            </div>

                                            <button
                                                type="button"
                                                onClick={requestCurrentLocation}
                                                className={cn(
                                                    secondaryBtn,
                                                    "mt-3 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
                                                )}
                                            >
                                                <LocateFixed size={16} />
                                                Dùng vị trí hiện tại
                                            </button>
                                        </div>

                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                                            <div className="text-[13px] font-semibold text-slate-900">
                                                2. Tìm theo địa chỉ
                                            </div>
                                            <div className="mt-1 text-[12px] font-medium leading-5 text-slate-500">
                                                Nhập khu vực và số nhà, tên đường để tìm vị trí chính xác hơn.
                                            </div>

                                            <div className="mt-4 grid gap-3">
                                                <div>
                                                    <div className="text-[12px] font-semibold text-slate-500">Thành phố</div>
                                                    <input
                                                        value={HCMC_NAME}
                                                        disabled
                                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="text-[12px] font-semibold text-slate-500">Quận / Huyện</div>
                                                    <select
                                                        value={districtCode}
                                                        onChange={(e) =>
                                                            setDistrictCode(e.target.value ? Number(e.target.value) : "")
                                                        }
                                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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
                                                    <div className="text-[12px] font-semibold text-slate-500">Phường / Xã</div>
                                                    <select
                                                        value={wardCode}
                                                        onChange={(e) =>
                                                            setWardCode(e.target.value ? Number(e.target.value) : "")
                                                        }
                                                        disabled={!districtCode}
                                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
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
                                                    <div className="text-[12px] font-semibold text-slate-500">Số nhà, tên đường</div>
                                                    <input
                                                        value={streetLine}
                                                        onChange={(e) => setStreetLine(e.target.value)}
                                                        placeholder="Ví dụ: 7 Đường số 10"
                                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleSearchAddress}
                                                disabled={searching || administrativeLoading}
                                                className={cn(
                                                    primaryBtn,
                                                    "mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
                                                )}
                                            >
                                                <Search size={15} />
                                                {searching ? "Đang tìm" : "Tìm địa chỉ"}
                                            </button>

                                            {!!searchResults.length && (
                                                <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                                                    <div className="mb-2 px-1 text-[12px] font-semibold text-slate-500">
                                                        Chọn một kết quả phù hợp
                                                    </div>

                                                    <div className="grid gap-2">
                                                        {searchResults.map((item) => (
                                                            <button
                                                                key={item.placeId}
                                                                type="button"
                                                                onClick={() => void handleSelectSearchResult(item)}
                                                                className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-slate-200 hover:bg-slate-100"
                                                            >
                                                                <div className="text-[13px] font-semibold text-slate-900">
                                                                    {item.displayName}
                                                                </div>
                                                                <div className="mt-1 text-[11px] font-medium text-slate-500">
                                                                    {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {submitInfo ? (
                                        <div className="text-[13px] font-medium text-sky-700">{submitInfo}</div>
                                    ) : null}
                                    {error ? (
                                        <div className="text-[13px] font-medium text-red-600">{error}</div>
                                    ) : null}
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-[16px] font-semibold text-slate-900">
                                                    Khu vực đã chọn
                                                </div>
                                                <div className="mt-1 text-[13px] font-medium leading-6 text-slate-500">
                                                    Đây là khu vực sẽ được dùng để gợi ý các siêu thị phù hợp gần bạn.
                                                </div>
                                            </div>

                                            <div className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                                                {hasResolvedLocation ? locationSourceLabel[locationSource] : "Chưa chọn"}
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                                            <div className="text-[14px] font-semibold leading-6 text-slate-900">
                                                {addressText || "Chưa có khu vực nào được xác nhận"}
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-slate-500">
                                                <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                                                    <div className="font-semibold">Lat</div>
                                                    <div>{lat != null ? lat.toFixed(6) : "—"}</div>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                                                    <div className="font-semibold">Lng</div>
                                                    <div>{lng != null ? lng.toFixed(6) : "—"}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[28px] border border-slate-200 bg-white p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <div className="text-[16px] font-semibold text-slate-900">
                                                    Chỉnh lại trên bản đồ
                                                </div>
                                                <div className="mt-1 text-[13px] font-medium leading-6 text-slate-500">
                                                    Bạn có thể click vào bản đồ hoặc kéo ghim để chọn điểm chính xác hơn.
                                                </div>
                                            </div>
                                            <MapPin size={18} className="text-slate-700" />
                                        </div>

                                        {lat != null && lng != null ? (
                                            <>
                                                <MapboxLocationPicker
                                                    lat={lat}
                                                    lng={lng}
                                                    onPick={(value) => void handlePickOnMap(value)}
                                                    onMapStatusChange={(status) => setMapStatus(status)}
                                                />

                                                <div className="mt-3 flex items-center justify-between gap-3 text-[12px] font-medium text-slate-500">
                                                    <span>
                                                        Bản đồ:{" "}
                                                        <span className="font-semibold">
                                                            {mapStatus === "idle" && "Chưa khởi tạo"}
                                                            {mapStatus === "loading" && "Đang tải"}
                                                            {mapStatus === "loaded" && "Sẵn sàng"}
                                                            {mapStatus === "error" && "Kết nối lỗi"}
                                                        </span>
                                                    </span>

                                                    <a
                                                        href={googleMapsUrl(lat, lng)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-semibold text-slate-700 hover:underline"
                                                    >
                                                        Mở Google Maps
                                                    </a>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="grid h-[320px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                                                <div>
                                                    <div className="font-semibold text-slate-900">
                                                        Chưa có vị trí để hiển thị
                                                    </div>
                                                    <div className="mt-1 text-[13px] font-medium text-slate-500">
                                                        Hãy dùng GPS hoặc tìm địa chỉ trước, rồi bạn có thể tinh chỉnh tiếp trên bản đồ.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-4 text-[13px] font-medium leading-6 text-slate-600">
                                        Sau khi lưu lựa chọn, trang chủ sẽ hiển thị những ưu đãi phù hợp với khu vực bạn vừa chọn.
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className={cn(secondaryBtn, "px-4 py-2.5 text-sm font-semibold")}
                                        >
                                            Quay lại
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={submitting || !hasResolvedLocation}
                                            className={cn(
                                                primaryBtn,
                                                "inline-flex min-w-[140px] items-center justify-center gap-2 px-5 py-2.5 text-sm"
                                            )}
                                        >
                                            {submitting ? "Đang lưu..." : "Xác nhận"}
                                            <Check size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && deliveryMethodId === "PICKUP" && (
                            <div className="space-y-4">
                                <div className="rounded-[28px] border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[16px] font-semibold text-slate-900">Chọn điểm nhận hàng</div>
                                            <div className="mt-1 text-[13px] font-medium leading-6 text-slate-500">
                                                Chọn điểm nhận phù hợp để xem các ưu đãi quanh khu vực đó.
                                            </div>
                                        </div>
                                        <Building2 size={18} className="text-slate-700" />
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={requestCurrentLocationForPickupSort}
                                            className={cn(secondaryBtn, "px-4 py-2.5 text-sm font-semibold")}
                                        >
                                            Sắp xếp gần tôi
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className={cn(secondaryBtn, "px-4 py-2.5 text-sm font-semibold")}
                                        >
                                            Quay lại
                                        </button>
                                    </div>

                                    {pickupLoading ? (
                                        <div className="mt-4 text-[13px] font-medium text-slate-500">
                                            Đang tải điểm nhận hàng...
                                        </div>
                                    ) : null}

                                    {pickupError ? (
                                        <div className="mt-4 text-[13px] font-medium text-red-600">{pickupError}</div>
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
                                                        "rounded-[24px] border p-4 text-left transition",
                                                        active
                                                            ? "border-slate-900 bg-slate-900 text-white"
                                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <div className="text-[15px] font-semibold">
                                                                {item.name}
                                                            </div>
                                                            <div
                                                                className={cn(
                                                                    "mt-1 text-[13px] font-medium leading-6",
                                                                    active ? "text-white/75" : "text-slate-500"
                                                                )}
                                                            >
                                                                {item.address}
                                                            </div>

                                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                                                                <span className={active ? "text-white/70" : "text-slate-500"}>
                                                                    {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                                                                </span>

                                                                {typeof item.distanceKm === "number" ? (
                                                                    <span
                                                                        className={cn(
                                                                            "rounded-full px-2 py-1 text-[10px] font-semibold",
                                                                            active
                                                                                ? "bg-white/10 text-white"
                                                                                : "bg-slate-100 text-slate-700"
                                                                        )}
                                                                    >
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
                                                            className={cn(
                                                                "shrink-0 rounded-2xl border px-3 py-2 text-[11px] font-semibold",
                                                                active
                                                                    ? "border-white/15 bg-white/10 text-white"
                                                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                            )}
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
                                        className={cn(primaryBtn, "inline-flex items-center gap-2 px-5 py-2.5 text-sm")}
                                    >
                                        {submitting ? "Đang lưu..." : "Xác nhận"}
                                        <Check size={16} />
                                    </button>
                                </div>

                                {submitInfo ? (
                                    <div className="text-[13px] font-medium text-sky-700">{submitInfo}</div>
                                ) : null}
                                {error ? (
                                    <div className="text-[13px] font-medium text-red-600">{error}</div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeliveryGateModal
