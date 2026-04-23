import { useEffect, useMemo, useState } from "react"
import {
    Clock3,
    Gift,
    LocateFixed,
    MapPin,
    MapPinned,
    RefreshCcw,
    Search,
    Settings2,
    Tag,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    AdminOrder,
    AdminTimeSlot,
    CollectionPoint,
    PromotionItem,
    SystemParameter,
    UnitItem,
    UpsertPromotionPayload,
    UpsertUnitPayload,
} from "@/types/admin.type"
import { showError, showSuccess } from "@/utils/toast"
import MapboxLocationPicker from "@/pages/Home/MapboxLocationPicker"
import {
    administrativeService,
    type AdministrativeDistrict,
    type AdministrativeWard,
} from "@/services/administrative.service"
import { supermarketService } from "@/services/supermarket.service"
import type { GeocodeItem } from "@/types/supermarket.type"

type TabKey =
    | "timeSlots"
    | "collectionPoints"
    | "parameters"
    | "units"
    | "promotions"

const tabs: Array<{
    key: TabKey
    label: string
    icon: React.ComponentType<{ size?: number }>
}> = [
        { key: "timeSlots", label: "Khung giờ", icon: Clock3 },
        { key: "collectionPoints", label: "Điểm tập kết", icon: MapPinned },
        { key: "parameters", label: "Tham số", icon: Settings2 },
        { key: "units", label: "Đơn vị", icon: Tag },
        { key: "promotions", label: "Khuyến mãi", icon: Gift },
    ]

type TimeSlotUsageRow = AdminTimeSlot & {
    relatedOrderCount: number
    isInUse: boolean
}

type CollectionSearchResultItem = {
    id: string
    displayName: string
    lat: number
    lng: number
}

const logApiError = (label: string, error: any) => {
    console.group(`[AdminSettings] ${label}`)
    console.log("full error:", error)
    console.log("error.response:", error?.response)
    console.log("error.response.status:", error?.response?.status)
    console.log("error.response.data:", error?.response?.data)
    console.log("error.message:", error?.message)
    console.groupEnd()
}

const logApiSuccess = (label: string, payload?: unknown, response?: unknown) => {
    console.group(`[AdminSettings] ${label}`)
    if (payload !== undefined) console.log("payload:", payload)
    if (response !== undefined) console.log("response:", response)
    console.groupEnd()
}

const hhmmFromTimeSpan = (value?: AdminTimeSlot["startTime"] | string | null) => {
    if (!value) return "--"

    if (typeof value === "string") {
        const normalized = value.trim()

        if (!normalized) return "--"

        const hhmmssMatch = normalized.match(/(\d{1,2}):(\d{2})(?::\d{2})?$/)
        if (hhmmssMatch) {
            const [, hh, mm] = hhmmssMatch
            return `${hh.padStart(2, "0")}:${mm}`
        }

        return normalized
    }

    if (typeof value.hours === "number" || typeof value.minutes === "number") {
        const hh = String(value.hours ?? 0).padStart(2, "0")
        const mm = String(value.minutes ?? 0).padStart(2, "0")
        return `${hh}:${mm}`
    }

    if (typeof value.totalHours === "number" || typeof value.totalMinutes === "number") {
        const totalMinutes = Math.round(value.totalMinutes ?? 0)
        const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
        const mm = String(totalMinutes % 60).padStart(2, "0")
        return `${hh}:${mm}`
    }

    if (typeof value.ticks === "number") {
        const totalMinutes = Math.floor(value.ticks / 10_000_000 / 60)
        const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
        const mm = String(totalMinutes % 60).padStart(2, "0")
        return `${hh}:${mm}`
    }

    return "--"
}

const formatDateTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    const year = date.getFullYear()
    if (year <= 1) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const formatNumber = (value?: number) => {
    return new Intl.NumberFormat("vi-VN").format(value ?? 0)
}

const formatMoney = (value?: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value ?? 0)
}

const getPromotionStatusLabel = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
        case "draft":
            return "Bản nháp"
        case "active":
            return "Đang áp dụng"
        case "expired":
            return "Đã hết hạn"
        case "disabled":
            return "Đã tắt"
        default:
            return status || "--"
    }
}

const getPromotionStatusClass = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
        case "draft":
            return "bg-slate-100 text-slate-700"
        case "active":
            return "bg-emerald-100 text-emerald-700"
        case "expired":
            return "bg-amber-100 text-amber-700"
        case "disabled":
            return "bg-rose-100 text-rose-700"
        default:
            return "bg-slate-100 text-slate-700"
    }
}

const getDiscountTypeLabel = (discountType?: string) => {
    switch ((discountType ?? "").toLowerCase()) {
        case "percentage":
            return "Giảm theo phần trăm"
        case "fixedamount":
            return "Giảm số tiền cố định"
        default:
            return discountType || "--"
    }
}

const getUnitTypeLabel = (type?: string) => {
    switch ((type ?? "").toLowerCase()) {
        case "count":
            return "Đếm"
        case "weight":
            return "Khối lượng"
        case "volume":
            return "Thể tích"
        case "pack":
            return "Đóng gói"
        case "portion":
            return "Khẩu phần"
        default:
            return type || "--"
    }
}

const getUnitTypeClass = (type?: string) => {
    switch ((type ?? "").toLowerCase()) {
        case "count":
            return "bg-sky-100 text-sky-700"
        case "weight":
            return "bg-amber-100 text-amber-700"
        case "volume":
            return "bg-emerald-100 text-emerald-700"
        case "pack":
            return "bg-violet-100 text-violet-700"
        case "portion":
            return "bg-rose-100 text-rose-700"
        default:
            return "bg-slate-100 text-slate-700"
    }
}

const normalizeText = (value?: string) =>
    (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()

const googleMapsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`

type UnitPreset = {
    name: string
    symbol: string
    type: string
    category: "fresh" | "drink" | "packaged" | "readyMeal"
}

const UNIT_PRESETS: UnitPreset[] = [
    { name: "Cái", symbol: "cái", type: "Count", category: "packaged" },
    { name: "Gói", symbol: "gói", type: "Pack", category: "packaged" },
    { name: "Hộp", symbol: "hộp", type: "Pack", category: "packaged" },
    { name: "Túi", symbol: "túi", type: "Pack", category: "packaged" },
    { name: "Khay", symbol: "khay", type: "Pack", category: "fresh" },
    { name: "Chai", symbol: "chai", type: "Count", category: "drink" },
    { name: "Lon", symbol: "lon", type: "Count", category: "drink" },
    { name: "Lít", symbol: "l", type: "Volume", category: "drink" },
    { name: "ml", symbol: "ml", type: "Volume", category: "drink" },
    { name: "Kg", symbol: "kg", type: "Weight", category: "fresh" },
    { name: "Gram", symbol: "g", type: "Weight", category: "fresh" },
    { name: "Bó", symbol: "bó", type: "Count", category: "fresh" },
    { name: "Quả", symbol: "quả", type: "Count", category: "fresh" },
    { name: "Trái", symbol: "trái", type: "Count", category: "fresh" },
    { name: "Con", symbol: "con", type: "Count", category: "fresh" },
    { name: "Phần", symbol: "phần", type: "Portion", category: "readyMeal" },
    { name: "Suất", symbol: "suất", type: "Portion", category: "readyMeal" },
    { name: "Miếng", symbol: "miếng", type: "Portion", category: "readyMeal" },
]

const AdminSettings = () => {
    const [tab, setTab] = useState<TabKey>("timeSlots")
    const [loading, setLoading] = useState(false)

    const [timeSlots, setTimeSlots] = useState<TimeSlotUsageRow[]>([])
    const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([])
    const [parameters, setParameters] = useState<SystemParameter[]>([])
    const [units, setUnits] = useState<UnitItem[]>([])
    const [promotions, setPromotions] = useState<PromotionItem[]>([])

    const [newSlotStart, setNewSlotStart] = useState("08:00")
    const [newSlotEnd, setNewSlotEnd] = useState("10:00")

    const [newCollectionName, setNewCollectionName] = useState("")
    const [newCollectionAddress, setNewCollectionAddress] = useState("")

    const HCMC_NAME = "Thành phố Hồ Chí Minh"

    const [districts, setDistricts] = useState<AdministrativeDistrict[]>([])
    const [wards, setWards] = useState<AdministrativeWard[]>([])
    const [districtCode, setDistrictCode] = useState<number | "">("")
    const [wardCode, setWardCode] = useState<number | "">("")
    const [streetLine, setStreetLine] = useState("")

    const [collectionSearching, setCollectionSearching] = useState(false)
    const [collectionSearchResults, setCollectionSearchResults] = useState<CollectionSearchResultItem[]>([])
    const [collectionAdministrativeLoading, setCollectionAdministrativeLoading] = useState(false)
    const [collectionMapStatus, setCollectionMapStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle")

    const [newCollectionLat, setNewCollectionLat] = useState<number | null>(null)
    const [newCollectionLng, setNewCollectionLng] = useState<number | null>(null)

    const [newUnit, setNewUnit] = useState<UpsertUnitPayload>({
        name: "",
        type: "Count",
        symbol: "",
    })

    const [newPromotion, setNewPromotion] = useState<UpsertPromotionPayload>({
        code: "",
        categoryId: "",
        name: "",
        discountType: "Percentage",
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        maxUsage: 0,
        perUserLimit: 0,
        startDate: "",
        endDate: "",
        status: "Draft",
    })

    const activeTabLabel = useMemo(
        () => tabs.find((item) => item.key === tab)?.label ?? "",
        [tab]
    )

    const selectedDistrict = useMemo(
        () => districts.find((item) => item.code === Number(districtCode)),
        [districts, districtCode]
    )

    const selectedWard = useMemo(
        () => wards.find((item) => item.code === Number(wardCode)),
        [wards, wardCode]
    )

    const hasResolvedCollectionLocation =
        newCollectionLat != null &&
        newCollectionLng != null &&
        !!newCollectionAddress.trim()

    const fetchAll = async () => {
        try {
            setLoading(true)

            const [slotRes, cpRes, unitRes, orderRes] = await Promise.all([
                adminService.getTimeSlots(),
                adminService.getCollectionPoints(),
                adminService.getUnits(),
                adminService.getOrders({ pageNumber: 1, pageSize: 1000 }),
            ])

            logApiSuccess("fetchAll - getTimeSlots", undefined, slotRes)
            logApiSuccess("fetchAll - getCollectionPoints", undefined, cpRes)
            logApiSuccess("fetchAll - getUnits", undefined, unitRes)
            logApiSuccess("fetchAll - getOrders", { pageNumber: 1, pageSize: 1000 }, orderRes)

            const orders = orderRes?.items ?? []

            const mappedTimeSlots: TimeSlotUsageRow[] = (slotRes ?? []).map((slot) => {
                const relatedOrderCount = orders.filter(
                    (order: AdminOrder) => order.timeSlotId === slot.timeSlotId
                ).length

                return {
                    ...slot,
                    relatedOrderCount,
                    isInUse: relatedOrderCount > 0,
                }
            })

            setTimeSlots(mappedTimeSlots)
            setCollectionPoints(cpRes ?? [])
            setUnits(unitRes ?? [])

            console.group("[AdminSettings] fetchAll - timeSlots inspect")
            console.log("timeSlots response:", slotRes)
            console.table(
                mappedTimeSlots.map((item) => ({
                    timeSlotId: item.timeSlotId,
                    startTimeRaw: item.startTime,
                    endTimeRaw: item.endTime,
                    startTimeDisplay: hhmmFromTimeSpan(item.startTime),
                    endTimeDisplay: hhmmFromTimeSpan(item.endTime),
                    relatedOrderCount: item.relatedOrderCount,
                    isInUse: item.isInUse,
                }))
            )
            console.groupEnd()

            setParameters([])
            setPromotions([])
        } catch (error: any) {
            logApiError("fetchAll", error)
            showError("Không tải được cấu hình hệ thống")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadTabData = async () => {
            try {
                setLoading(true)

                if (tab === "parameters") {
                    const res = await adminService.getSystemParameters()
                    logApiSuccess("loadTabData - getSystemParameters", undefined, res)
                    setParameters(res ?? [])
                }

                if (tab === "promotions") {
                    const res = await adminService.getPromotions()
                    logApiSuccess("loadTabData - getPromotions", undefined, res)
                    setPromotions(res ?? [])
                }
            } catch (error: any) {
                logApiError(`loadTabData - ${tab}`, error)
                showError(`Không tải được dữ liệu mục ${activeTabLabel.toLowerCase()}`)
            } finally {
                setLoading(false)
            }
        }

        if (tab === "parameters" || tab === "promotions") {
            void loadTabData()
        }
    }, [tab, activeTabLabel])

    useEffect(() => {
        void fetchAll()
    }, [])

    useEffect(() => {
        if (tab !== "collectionPoints") return

            ; (async () => {
                try {
                    setCollectionAdministrativeLoading(true)
                    const res = await administrativeService.getHcmDistricts()
                    console.group("[AdminSettings] collectionPoints - getHcmDistricts")
                    console.log("response:", res)
                    console.groupEnd()
                    setDistricts(res ?? [])
                } catch (error: any) {
                    logApiError("collectionPoints - getHcmDistricts", error)
                } finally {
                    setCollectionAdministrativeLoading(false)
                }
            })()
    }, [tab])

    useEffect(() => {
        if (tab !== "collectionPoints") return

        if (!districtCode) {
            setWards([])
            setWardCode("")
            return
        }

        ; (async () => {
            try {
                setCollectionAdministrativeLoading(true)
                const res = await administrativeService.getWardsByDistrictCode(Number(districtCode))
                console.group("[AdminSettings] collectionPoints - getWardsByDistrictCode")
                console.log("districtCode:", districtCode)
                console.log("response:", res)
                console.groupEnd()
                setWards(res ?? [])
            } catch (error: any) {
                logApiError("collectionPoints - getWardsByDistrictCode", error)
            } finally {
                setCollectionAdministrativeLoading(false)
            }
        })()
    }, [tab, districtCode])

    const handleCreateTimeSlot = async () => {
        const parseMinutes = (value: string) => {
            const [hourText, minuteText] = value.split(":")
            const hour = Number(hourText)
            const minute = Number(minuteText)

            if (
                Number.isNaN(hour) ||
                Number.isNaN(minute) ||
                hour < 0 ||
                hour > 23 ||
                minute < 0 ||
                minute > 59
            ) {
                return null
            }

            return hour * 60 + minute
        }

        if (!newSlotStart || !newSlotEnd) {
            showError("Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc")
            return
        }

        const startMinutes = parseMinutes(newSlotStart)
        const endMinutes = parseMinutes(newSlotEnd)

        if (startMinutes === null) {
            showError("Giờ bắt đầu không hợp lệ")
            return
        }

        if (endMinutes === null) {
            showError("Giờ kết thúc không hợp lệ")
            return
        }

        if (endMinutes <= startMinutes) {
            showError("Giờ kết thúc phải lớn hơn giờ bắt đầu")
            return
        }

        const payload = adminService.toTimeSlotPayload(newSlotStart, newSlotEnd)

        try {
            logApiSuccess("handleCreateTimeSlot - request", payload)

            const res = await adminService.createTimeSlot(payload)

            logApiSuccess("handleCreateTimeSlot - response", payload, res)

            showSuccess(`Đã tạo khung giờ ${newSlotStart} - ${newSlotEnd}`)
            setNewSlotStart("08:00")
            setNewSlotEnd("10:00")
            await fetchAll()
        } catch (error: any) {
            logApiError("handleCreateTimeSlot", error)
            showError(`Không thể tạo khung giờ ${newSlotStart} - ${newSlotEnd}`)
        }
    }

    const handleDeleteTimeSlot = async (timeSlotId: string) => {
        const targetTimeSlot = timeSlots.find((item) => item.timeSlotId === timeSlotId)

        if (targetTimeSlot?.isInUse) {
            console.group("[AdminSettings] handleDeleteTimeSlot - blocked")
            console.log("timeSlotId:", timeSlotId)
            console.log("targetTimeSlot:", targetTimeSlot)
            console.groupEnd()

            showError("Không thể xóa khung giờ đang được đơn hàng sử dụng")
            return
        }

        try {
            logApiSuccess("handleDeleteTimeSlot - request", { timeSlotId })

            const res = await adminService.deleteTimeSlot(timeSlotId)

            logApiSuccess("handleDeleteTimeSlot - response", { timeSlotId }, res)

            showSuccess("Đã xóa khung giờ")
            await fetchAll()
        } catch (error: any) {
            logApiError("handleDeleteTimeSlot", error)
            showError("Không thể xóa khung giờ này")
        }
    }

    const syncAdministrativeFromReverse = async (params: {
        district?: string
        region?: string
    }) => {
        try {
            const districtKeyword = normalizeText(params.district)
            const regionKeyword = normalizeText(params.region)

            const districtList =
                districts.length > 0 ? districts : await administrativeService.getHcmDistricts()

            if (!districts.length) {
                setDistricts(districtList)
            }

            const matchedDistrict = districtList.find((d) => {
                const name = normalizeText(d.name)
                return (
                    (districtKeyword && (name.includes(districtKeyword) || districtKeyword.includes(name))) ||
                    (regionKeyword && (name.includes(regionKeyword) || regionKeyword.includes(name)))
                )
            })

            if (!matchedDistrict) return

            setDistrictCode(matchedDistrict.code)

            const wardList = await administrativeService.getWardsByDistrictCode(matchedDistrict.code)
            setWards(wardList)
        } catch (error: any) {
            logApiError("collectionPoints - syncAdministrativeFromReverse", error)
        }
    }

    const applyReverseGeocodeToCollectionPoint = async (
        lat: number,
        lng: number,
        source: "gps" | "search" | "map"
    ) => {
        console.group("[AdminSettings] collectionPoints - applyReverseGeocode")
        console.log("source:", source)
        console.log("lat:", lat)
        console.log("lng:", lng)
        console.groupEnd()

        setNewCollectionLat(lat)
        setNewCollectionLng(lng)
        setCollectionSearchResults([])

        try {
            const reverse = await supermarketService.reverseGeocode(lat, lng)

            console.group("[AdminSettings] collectionPoints - reverseGeocode response")
            console.log("response:", reverse)
            console.groupEnd()

            const prettyAddress =
                reverse?.fullAddress?.trim() ||
                reverse?.placeName?.trim() ||
                `${lat.toFixed(6)}, ${lng.toFixed(6)}`

            setNewCollectionAddress(prettyAddress)

            await syncAdministrativeFromReverse({
                district: reverse?.district,
                region: reverse?.region,
            })
        } catch (error: any) {
            logApiError("collectionPoints - reverseGeocode", error)
            setNewCollectionAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        }
    }

    const requestCurrentLocationForCollectionPoint = () => {
        if (!navigator.geolocation) {
            showError("Trình duyệt không hỗ trợ định vị")
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                console.group("[AdminSettings] collectionPoints - current position")
                console.log("coords:", pos.coords)
                console.groupEnd()

                await applyReverseGeocodeToCollectionPoint(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    "gps"
                )
            },
            (error) => {
                console.group("[AdminSettings] collectionPoints - current position error")
                console.log("error:", error)
                console.groupEnd()
                showError("Không lấy được vị trí hiện tại")
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const handleSearchCollectionAddress = async () => {
        try {
            setCollectionSearching(true)
            setCollectionSearchResults([])

            const parts = [streetLine, selectedWard?.name, selectedDistrict?.name, HCMC_NAME]
                .map((item) => item?.trim())
                .filter(Boolean)

            if (!parts.length) {
                showError("Bạn hãy nhập ít nhất một phần địa chỉ")
                return
            }

            const query = parts.join(", ")

            const suggestions = await supermarketService.suggestGeocode(query, 5)

            console.group("[AdminSettings] collectionPoints - suggestGeocode")
            console.log("districtCode:", districtCode)
            console.log("wardCode:", wardCode)
            console.log("streetLine:", streetLine)
            console.log("response:", suggestions)
            console.groupEnd()

            const mappedResults: CollectionSearchResultItem[] = suggestions.map(
                (item: GeocodeItem, index: number) => ({
                    id: `${item.latitude}-${item.longitude}-${index}`,
                    displayName: item.fullAddress || item.placeName || query,
                    lat: Number(item.latitude),
                    lng: Number(item.longitude),
                })
            )

            if (mappedResults.length) {
                setCollectionSearchResults(mappedResults)
                return
            }

            const forward = await supermarketService.forwardGeocode(query)

            console.group("[AdminSettings] collectionPoints - forwardGeocode")
            console.log("query:", query)
            console.log("response:", forward)
            console.groupEnd()

            if (forward) {
                setCollectionSearchResults([
                    {
                        id: `${forward.latitude}-${forward.longitude}-0`,
                        displayName: forward.fullAddress || forward.placeName || query,
                        lat: Number(forward.latitude),
                        lng: Number(forward.longitude),
                    },
                ])
                return
            }

            showError("Không tìm thấy địa chỉ phù hợp")
        } catch (error: any) {
            logApiError("collectionPoints - handleSearchCollectionAddress", error)
            showError(
                error?.response?.data?.message ??
                error?.message ??
                "Không tìm được địa chỉ"
            )
        } finally {
            setCollectionSearching(false)
        }
    }

    const handleSelectCollectionSearchResult = async (item: CollectionSearchResultItem) => {
        console.group("[AdminSettings] collectionPoints - select search result")
        console.log("item:", item)
        console.groupEnd()

        await applyReverseGeocodeToCollectionPoint(item.lat, item.lng, "search")
    }

    const handlePickCollectionPointOnMap = async (value: { lat: number; lng: number }) => {
        console.group("[AdminSettings] collectionPoints - pick on map")
        console.log("value:", value)
        console.groupEnd()

        await applyReverseGeocodeToCollectionPoint(value.lat, value.lng, "map")
    }

    const handleCreateCollectionPoint = async () => {
        if (!newCollectionName.trim()) {
            showError("Vui lòng nhập tên điểm tập kết")
            return
        }

        if (!newCollectionAddress.trim()) {
            showError("Vui lòng chọn địa chỉ điểm tập kết")
            return
        }

        if (newCollectionLat == null || newCollectionLng == null) {
            showError("Vui lòng chọn vị trí trên bản đồ hoặc bằng tìm kiếm")
            return
        }

        const payload = {
            name: newCollectionName.trim(),
            addressLine: newCollectionAddress.trim(),
            latitude: newCollectionLat,
            longitude: newCollectionLng,
        }

        try {
            logApiSuccess("handleCreateCollectionPoint - request", payload)

            const res = await adminService.createCollectionPoint(payload)

            logApiSuccess("handleCreateCollectionPoint - response", payload, res)

            showSuccess("Đã tạo điểm tập kết")
            setNewCollectionName("")
            setNewCollectionAddress("")
            setNewCollectionLat(null)
            setNewCollectionLng(null)
            setDistrictCode("")
            setWardCode("")
            setStreetLine("")
            setCollectionSearchResults([])
            await fetchAll()
        } catch (error: any) {
            logApiError("handleCreateCollectionPoint", error)
            showError("Không thể tạo điểm tập kết")
        }
    }

    const handleDeleteCollectionPoint = async (collectionId: string) => {
        try {
            logApiSuccess("handleDeleteCollectionPoint - request", { collectionId })

            const res = await adminService.deleteCollectionPoint(collectionId)

            logApiSuccess("handleDeleteCollectionPoint - response", { collectionId }, res)

            showSuccess("Đã xóa điểm tập kết")
            await fetchAll()
        } catch (error: any) {
            logApiError("handleDeleteCollectionPoint", error)
            showError("Không thể xóa điểm tập kết này")
        }
    }

    const handleUpdateParameter = async (configKey: string, configValue: string) => {
        const payload = { configValue }

        try {
            logApiSuccess("handleUpdateParameter - request", { configKey, ...payload })

            const res = await adminService.updateSystemParameter(configKey, payload)

            logApiSuccess(
                "handleUpdateParameter - response",
                { configKey, ...payload },
                res
            )

            showSuccess("Đã cập nhật tham số")
            await fetchAll()
        } catch (error: any) {
            logApiError("handleUpdateParameter", error)
            showError("Không thể cập nhật tham số")
        }
    }

    const handleApplyUnitPreset = (preset: UnitPreset) => {
        console.group("[AdminSettings] handleApplyUnitPreset")
        console.log("preset:", preset)
        console.groupEnd()

        setNewUnit({
            name: preset.name,
            type: preset.type,
            symbol: preset.symbol,
        })
    }

    const handleCreateUnit = async () => {
        if (!newUnit.name.trim()) {
            showError("Vui lòng nhập tên đơn vị")
            return
        }

        if (!newUnit.type.trim()) {
            showError("Vui lòng chọn nhóm đơn vị")
            return
        }

        const payload = {
            name: newUnit.name.trim(),
            type: newUnit.type.trim(),
            symbol: newUnit.symbol.trim() || newUnit.name.trim(),
        }

        try {
            logApiSuccess("handleCreateUnit - request", payload)

            const res = await adminService.createUnit(payload)

            logApiSuccess("handleCreateUnit - response", payload, res)

            showSuccess("Đã tạo đơn vị")
            setNewUnit({ name: "", type: "Count", symbol: "" })
            await fetchAll()
        } catch (error: any) {
            logApiError("handleCreateUnit", error)
            showError("Không thể tạo đơn vị")
        }
    }

    const handleDeleteUnit = async (unitId: string) => {
        try {
            logApiSuccess("handleDeleteUnit - request", { unitId })

            const res = await adminService.deleteUnit(unitId)

            logApiSuccess("handleDeleteUnit - response", { unitId }, res)

            showSuccess("Đã xóa đơn vị")
            await fetchAll()
        } catch (error: any) {
            logApiError("handleDeleteUnit", error)
            showError("Không thể xóa đơn vị")
        }
    }

    const handleCreatePromotion = async () => {
        if (!newPromotion.code.trim()) {
            showError("Vui lòng nhập mã khuyến mãi")
            return
        }

        if (!newPromotion.categoryId.trim()) {
            showError("Vui lòng nhập mã danh mục")
            return
        }

        if (!newPromotion.name.trim()) {
            showError("Vui lòng nhập tên chương trình")
            return
        }

        if (!newPromotion.startDate) {
            showError("Vui lòng chọn thời gian bắt đầu")
            return
        }

        if (!newPromotion.endDate) {
            showError("Vui lòng chọn thời gian kết thúc")
            return
        }

        if (new Date(newPromotion.endDate).getTime() <= new Date(newPromotion.startDate).getTime()) {
            showError("Thời gian kết thúc phải sau thời gian bắt đầu")
            return
        }

        if (newPromotion.discountValue <= 0) {
            showError("Giá trị giảm phải lớn hơn 0")
            return
        }

        if (newPromotion.minOrderAmount < 0) {
            showError("Giá trị đơn tối thiểu không được âm")
            return
        }

        if (newPromotion.maxDiscountAmount < 0) {
            showError("Mức giảm tối đa không được âm")
            return
        }

        if (newPromotion.maxUsage < 0) {
            showError("Tổng số lượt sử dụng không được âm")
            return
        }

        if (newPromotion.perUserLimit < 0) {
            showError("Số lần dùng tối đa mỗi người không được âm")
            return
        }

        const payload = { ...newPromotion }

        try {
            logApiSuccess("handleCreatePromotion - request", payload)

            const res = await adminService.createPromotion(payload)

            logApiSuccess("handleCreatePromotion - response", payload, res)

            showSuccess("Đã tạo khuyến mãi")

            setNewPromotion({
                code: "",
                categoryId: "",
                name: "",
                discountType: "Percentage",
                discountValue: 0,
                minOrderAmount: 0,
                maxDiscountAmount: 0,
                maxUsage: 0,
                perUserLimit: 0,
                startDate: "",
                endDate: "",
                status: "Draft",
            })

            await fetchAll()
        } catch (error: any) {
            logApiError("handleCreatePromotion", error)
            showError("Không thể tạo khuyến mãi")
        }
    }

    const handleUpdatePromotionStatus = async (
        promotionId: string,
        status: string
    ) => {
        const payload = { promotionId, status }

        try {
            logApiSuccess("handleUpdatePromotionStatus - request", payload)

            const res = await adminService.updatePromotionStatus(promotionId, status)

            logApiSuccess("handleUpdatePromotionStatus - response", payload, res)

            showSuccess("Đã cập nhật trạng thái khuyến mãi")
            await fetchAll()
        } catch (error: any) {
            logApiError("handleUpdatePromotionStatus", error)
            showError("Không thể cập nhật trạng thái khuyến mãi")
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Thiết lập quản trị</p>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Cấu hình hệ thống
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Đang xem: {activeTabLabel}
                        </p>
                    </div>

                    <button
                        onClick={() => void fetchAll()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        <RefreshCcw size={16} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_1fr]">
                <aside className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                    <div className="space-y-1">
                        {tabs.map((item) => {
                            const Icon = item.icon
                            const active = tab === item.key

                            return (
                                <button
                                    key={item.key}
                                    onClick={() => setTab(item.key)}
                                    className={[
                                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                                        active
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-700 hover:bg-slate-100",
                                    ].join(" ")}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </button>
                            )
                        })}
                    </div>
                </aside>

                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    {tab === "timeSlots" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Khung giờ</h2>
                                <p className="text-sm text-slate-500">
                                    Tạo và quản lý khung giờ giao hoặc nhận hàng
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <input
                                    type="time"
                                    value={newSlotStart}
                                    onChange={(e) => setNewSlotStart(e.target.value)}
                                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                                />
                                <input
                                    type="time"
                                    value={newSlotEnd}
                                    onChange={(e) => setNewSlotEnd(e.target.value)}
                                    className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                                />
                                <button
                                    onClick={() => void handleCreateTimeSlot()}
                                    className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                                >
                                    Tạo khung giờ
                                </button>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Bắt đầu</th>
                                            <th className="px-4 py-3 text-left">Kết thúc</th>
                                            <th className="px-4 py-3 text-left">Đang sử dụng</th>
                                            <th className="px-4 py-3 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeSlots.map((item) => (
                                            <tr key={item.timeSlotId} className="border-t border-slate-200">
                                                <td className="px-4 py-3">
                                                    {hhmmFromTimeSpan(item.startTime)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {hhmmFromTimeSpan(item.endTime)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={[
                                                            "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                                                            item.isInUse
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-emerald-100 text-emerald-700",
                                                        ].join(" ")}
                                                    >
                                                        {item.isInUse
                                                            ? `Có • ${formatNumber(item.relatedOrderCount)} đơn`
                                                            : "Không"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => void handleDeleteTimeSlot(item.timeSlotId)}
                                                        disabled={item.isInUse}
                                                        title={
                                                            item.isInUse
                                                                ? "Khung giờ này đang được đơn hàng sử dụng nên không thể xóa"
                                                                : "Xóa khung giờ"
                                                        }
                                                        className={[
                                                            "rounded-xl border px-3 py-1.5 font-medium transition",
                                                            item.isInUse
                                                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                                                : "border-red-200 text-red-600 hover:bg-red-50",
                                                        ].join(" ")}
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && timeSlots.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                                                    Chưa có khung giờ nào.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === "collectionPoints" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Điểm tập kết</h2>
                                <p className="text-sm text-slate-500">
                                    Tạo điểm nhận hàng thông minh bằng GPS, tìm địa chỉ hoặc chọn trực tiếp trên bản đồ.
                                </p>
                            </div>

                            <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                                <div className="space-y-4">
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                                        <div className="mb-4">
                                            <h3 className="text-base font-semibold text-slate-900">
                                                Tạo điểm tập kết mới
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Nhập tên điểm, sau đó chọn địa chỉ bằng cách nhanh và chính xác hơn.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500">
                                                    Tên điểm tập kết
                                                </div>
                                                <input
                                                    value={newCollectionName}
                                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                                    placeholder="Ví dụ: Điểm nhận hàng Quận 1"
                                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                                />
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    1. Dùng vị trí hiện tại
                                                </div>
                                                <div className="mt-1 text-xs leading-5 text-slate-500">
                                                    Phù hợp khi bạn đang đứng ngay điểm muốn tạo.
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={requestCurrentLocationForCollectionPoint}
                                                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    <LocateFixed size={16} />
                                                    Dùng vị trí hiện tại
                                                </button>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    2. Tìm theo địa chỉ
                                                </div>
                                                <div className="mt-1 text-xs leading-5 text-slate-500">
                                                    Chọn quận, phường rồi nhập số nhà tên đường để tìm nhanh.
                                                </div>

                                                <div className="mt-4 grid gap-3">
                                                    <div>
                                                        <div className="text-xs font-semibold text-slate-500">Thành phố</div>
                                                        <input
                                                            value={HCMC_NAME}
                                                            disabled
                                                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                                                        />
                                                    </div>

                                                    <div>
                                                        <div className="text-xs font-semibold text-slate-500">Quận / Huyện</div>
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
                                                        <div className="text-xs font-semibold text-slate-500">Phường / Xã</div>
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
                                                        <div className="text-xs font-semibold text-slate-500">Số nhà, tên đường</div>
                                                        <input
                                                            value={streetLine}
                                                            onChange={(e) => setStreetLine(e.target.value)}
                                                            placeholder="Ví dụ: 45 Lê Lợi"
                                                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => void handleSearchCollectionAddress()}
                                                    disabled={collectionSearching || collectionAdministrativeLoading}
                                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <Search size={15} />
                                                    {collectionSearching ? "Đang tìm" : "Tìm địa chỉ"}
                                                </button>

                                                {!!collectionSearchResults.length && (
                                                    <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                                                        <div className="mb-2 px-1 text-xs font-semibold text-slate-500">
                                                            Chọn một kết quả phù hợp
                                                        </div>

                                                        <div className="grid gap-2">
                                                            {collectionSearchResults.map((item) => (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() => void handleSelectCollectionSearchResult(item)}
                                                                    className="rounded-2xl border border-slate-100 bg-white p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                                                                >
                                                                    <div className="text-sm font-semibold text-slate-900">
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

                                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">
                                                            Điểm đã chọn
                                                        </div>
                                                        <div className="mt-1 text-xs leading-5 text-slate-500">
                                                            Địa chỉ và tọa độ này sẽ được dùng để tạo điểm tập kết.
                                                        </div>
                                                    </div>

                                                    <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                                        {hasResolvedCollectionLocation ? "Đã xác nhận" : "Chưa chọn"}
                                                    </div>
                                                </div>

                                                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                                                    <div className="text-sm font-semibold leading-6 text-slate-900">
                                                        {newCollectionAddress || "Chưa có địa chỉ nào được chọn"}
                                                    </div>

                                                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                                                        <div className="rounded-2xl bg-white px-3 py-2.5">
                                                            <div className="font-semibold">Vĩ độ</div>
                                                            <div>{newCollectionLat != null ? newCollectionLat.toFixed(6) : "—"}</div>
                                                        </div>

                                                        <div className="rounded-2xl bg-white px-3 py-2.5">
                                                            <div className="font-semibold">Kinh độ</div>
                                                            <div>{newCollectionLng != null ? newCollectionLng.toFixed(6) : "—"}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => void handleCreateCollectionPoint()}
                                                    className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                                >
                                                    Tạo điểm tập kết
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <div className="text-base font-semibold text-slate-900">
                                                    Chỉnh lại trên bản đồ
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500">
                                                    Click hoặc kéo ghim để đặt chính xác vị trí điểm tập kết.
                                                </div>
                                            </div>
                                            <MapPin size={18} className="text-slate-700" />
                                        </div>

                                        {newCollectionLat != null && newCollectionLng != null ? (
                                            <>
                                                <MapboxLocationPicker
                                                    lat={newCollectionLat}
                                                    lng={newCollectionLng}
                                                    onPick={(value) => void handlePickCollectionPointOnMap(value)}
                                                    onMapStatusChange={(status) => setCollectionMapStatus(status)}
                                                />

                                                <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
                                                    <span>
                                                        Bản đồ:{" "}
                                                        <span className="font-semibold">
                                                            {collectionMapStatus === "idle" && "Chưa khởi tạo"}
                                                            {collectionMapStatus === "loading" && "Đang tải"}
                                                            {collectionMapStatus === "loaded" && "Sẵn sàng"}
                                                            {collectionMapStatus === "error" && "Kết nối lỗi"}
                                                        </span>
                                                    </span>

                                                    <a
                                                        href={googleMapsUrl(newCollectionLat, newCollectionLng)}
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
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        Hãy dùng GPS hoặc tìm địa chỉ trước, rồi tinh chỉnh tiếp trên bản đồ.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                        <div className="mb-4">
                                            <h3 className="text-base font-semibold text-slate-900">
                                                Danh sách điểm tập kết
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Các điểm đã tạo sẽ được dùng cho luồng nhận hàng tại điểm hẹn.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {collectionPoints.map((item) => (
                                                <div
                                                    key={item.collectionId}
                                                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                                                >
                                                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                                                <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-700">
                                                                    Điểm nhận
                                                                </span>
                                                            </div>

                                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                                {item.addressLine}
                                                            </p>

                                                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                                                <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                                                                    Vĩ độ: {item.latitude.toFixed(6)}
                                                                </span>
                                                                <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                                                                    Kinh độ: {item.longitude.toFixed(6)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={googleMapsUrl(item.latitude, item.longitude)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                Xem bản đồ
                                                            </a>

                                                            <button
                                                                onClick={() => void handleDeleteCollectionPoint(item.collectionId)}
                                                                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {!loading && collectionPoints.length === 0 && (
                                                <p className="text-sm text-slate-500">Chưa có điểm tập kết nào.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "parameters" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Tham số hệ thống</h2>
                                <p className="text-sm text-slate-500">
                                    Chỉnh sửa giá trị cấu hình theo từng mã tham số
                                </p>
                            </div>

                            <div className="space-y-3">
                                {parameters.map((item) => (
                                    <ParameterRow
                                        key={item.configKey}
                                        configKey={item.configKey}
                                        configValue={item.configValue}
                                        updatedAt={item.updatedAt}
                                        onSave={handleUpdateParameter}
                                    />
                                ))}

                                {!loading && parameters.length === 0 && (
                                    <p className="text-sm text-slate-500">Chưa có tham số nào.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "units" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Đơn vị tính</h2>
                                <p className="text-sm text-slate-500">
                                    Quản lý tên đơn vị, nhóm đơn vị và ký hiệu hiển thị
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                                    <div className="mb-4">
                                        <h3 className="text-base font-semibold text-slate-900">
                                            Tạo đơn vị mới
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Admin có thể tự cấu hình đơn vị, nhưng vẫn có gợi ý thông minh để nhập nhanh và đồng nhất dữ liệu.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                        <input
                                            value={newUnit.name}
                                            onChange={(e) =>
                                                setNewUnit((prev) => ({ ...prev, name: e.target.value }))
                                            }
                                            placeholder="Ví dụ: Kg, Chai, Gói"
                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                        />

                                        <input
                                            value={newUnit.symbol}
                                            onChange={(e) =>
                                                setNewUnit((prev) => ({ ...prev, symbol: e.target.value }))
                                            }
                                            placeholder="Ví dụ: kg, chai, gói"
                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                        />

                                        <select
                                            value={newUnit.type}
                                            onChange={(e) =>
                                                setNewUnit((prev) => ({ ...prev, type: e.target.value }))
                                            }
                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                        >
                                            <option value="Count">Đếm</option>
                                            <option value="Weight">Khối lượng</option>
                                            <option value="Volume">Thể tích</option>
                                            <option value="Pack">Đóng gói</option>
                                            <option value="Portion">Khẩu phần</option>
                                        </select>

                                        <button
                                            onClick={() => void handleCreateUnit()}
                                            className="rounded-2xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800"
                                        >
                                            Tạo đơn vị
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                    <div className="mb-4">
                                        <h3 className="text-base font-semibold text-slate-900">
                                            Mẫu thường dùng
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Bấm vào mẫu để điền nhanh form, sau đó admin vẫn có thể chỉnh lại trước khi lưu.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <UnitPresetGroup
                                            title="Thực phẩm tươi sống"
                                            items={UNIT_PRESETS.filter((item) => item.category === "fresh")}
                                            onPick={handleApplyUnitPreset}
                                        />

                                        <UnitPresetGroup
                                            title="Đồ uống"
                                            items={UNIT_PRESETS.filter((item) => item.category === "drink")}
                                            onPick={handleApplyUnitPreset}
                                        />

                                        <UnitPresetGroup
                                            title="Hàng đóng gói"
                                            items={UNIT_PRESETS.filter((item) => item.category === "packaged")}
                                            onPick={handleApplyUnitPreset}
                                        />

                                        <UnitPresetGroup
                                            title="Chế biến sẵn"
                                            items={UNIT_PRESETS.filter((item) => item.category === "readyMeal")}
                                            onPick={handleApplyUnitPreset}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Tên</th>
                                            <th className="px-4 py-3 text-left">Nhóm</th>
                                            <th className="px-4 py-3 text-left">Ký hiệu</th>
                                            <th className="px-4 py-3 text-left">Cập nhật</th>
                                            <th className="px-4 py-3 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {units.map((item) => (
                                            <tr key={item.unitId} className="border-t border-slate-200">
                                                <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>

                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getUnitTypeClass(
                                                            item.type
                                                        )}`}
                                                    >
                                                        {getUnitTypeLabel(item.type)}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                        {item.symbol?.trim() || item.name || "--"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-slate-500">
                                                    {formatDateTime(item.updatedAt || item.createdAt)}
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleApplyUnitPreset({
                                                                    name: item.name,
                                                                    symbol: item.symbol?.trim() || item.name,
                                                                    type: item.type,
                                                                    category: "packaged",
                                                                })
                                                            }
                                                            className="rounded-xl border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                                                        >
                                                            Dùng lại
                                                        </button>

                                                        <button
                                                            onClick={() => void handleDeleteUnit(item.unitId)}
                                                            className="rounded-xl border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && units.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                                                    Chưa có đơn vị nào.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === "promotions" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Khuyến mãi</h2>
                                <p className="text-sm text-slate-500">
                                    Tạo và quản lý các chương trình ưu đãi
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
                                <div className="mb-4">
                                    <h3 className="text-base font-semibold text-slate-900">
                                        Tạo chương trình khuyến mãi mới
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Nhập đầy đủ thông tin để khởi tạo chương trình
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <input
                                        value={newPromotion.code}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                code: e.target.value,
                                            }))
                                        }
                                        placeholder="Mã khuyến mãi"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        value={newPromotion.categoryId}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                categoryId: e.target.value,
                                            }))
                                        }
                                        placeholder="Mã danh mục"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        value={newPromotion.name}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="Tên chương trình"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <select
                                        value={newPromotion.discountType}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                discountType: e.target.value,
                                            }))
                                        }
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    >
                                        <option value="Percentage">Giảm theo phần trăm</option>
                                        <option value="FixedAmount">Giảm số tiền cố định</option>
                                    </select>

                                    <input
                                        type="number"
                                        value={newPromotion.discountValue}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                discountValue: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Giá trị giảm"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="number"
                                        value={newPromotion.minOrderAmount}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                minOrderAmount: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Giá trị đơn tối thiểu"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="number"
                                        value={newPromotion.maxDiscountAmount}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                maxDiscountAmount: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Mức giảm tối đa"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="number"
                                        value={newPromotion.maxUsage}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                maxUsage: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Tổng số lượt sử dụng"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="number"
                                        value={newPromotion.perUserLimit}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                perUserLimit: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Số lần dùng tối đa mỗi người"
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="datetime-local"
                                        value={newPromotion.startDate}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                startDate: e.target.value,
                                            }))
                                        }
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <input
                                        type="datetime-local"
                                        value={newPromotion.endDate}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                endDate: e.target.value,
                                            }))
                                        }
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    />

                                    <select
                                        value={newPromotion.status}
                                        onChange={(e) =>
                                            setNewPromotion((prev) => ({
                                                ...prev,
                                                status: e.target.value,
                                            }))
                                        }
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                    >
                                        <option value="Draft">Bản nháp</option>
                                        <option value="Active">Đang áp dụng</option>
                                        <option value="Expired">Đã hết hạn</option>
                                        <option value="Disabled">Đã tắt</option>
                                    </select>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => void handleCreatePromotion()}
                                        className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        Tạo khuyến mãi
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {promotions.map((item) => (
                                    <div
                                        key={item.promotionId}
                                        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-base font-semibold text-slate-900">
                                                        {item.name}
                                                    </p>
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${getPromotionStatusClass(
                                                            item.status
                                                        )}`}
                                                    >
                                                        {getPromotionStatusLabel(item.status)}
                                                    </span>
                                                </div>

                                                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-500 md:grid-cols-2">
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Mã khuyến mãi:
                                                        </span>{" "}
                                                        {item.code}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Mã danh mục:
                                                        </span>{" "}
                                                        {item.categoryId}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Hình thức giảm:
                                                        </span>{" "}
                                                        {getDiscountTypeLabel(item.discountType)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Giá trị giảm:
                                                        </span>{" "}
                                                        {item.discountType === "FixedAmount"
                                                            ? formatMoney(item.discountValue)
                                                            : `${formatNumber(item.discountValue)}%`}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Giá trị đơn tối thiểu:
                                                        </span>{" "}
                                                        {formatMoney(item.minOrderAmount)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Mức giảm tối đa:
                                                        </span>{" "}
                                                        {formatMoney(item.maxDiscountAmount)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Tổng số lượt sử dụng:
                                                        </span>{" "}
                                                        {formatNumber(item.maxUsage)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Đã sử dụng:
                                                        </span>{" "}
                                                        {formatNumber(item.usedCount)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Mỗi người được dùng:
                                                        </span>{" "}
                                                        {formatNumber(item.perUserLimit)} lần
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-700">
                                                            Thời gian áp dụng:
                                                        </span>{" "}
                                                        {formatDateTime(item.startDate)} →{" "}
                                                        {formatDateTime(item.endDate)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={item.status}
                                                    onChange={(e) =>
                                                        void handleUpdatePromotionStatus(
                                                            item.promotionId,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                                                >
                                                    <option value="Draft">Bản nháp</option>
                                                    <option value="Active">Đang áp dụng</option>
                                                    <option value="Expired">Đã hết hạn</option>
                                                    <option value="Disabled">Đã tắt</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {!loading && promotions.length === 0 && (
                                    <p className="text-sm text-slate-500">Chưa có khuyến mãi nào.</p>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

type ParameterRowProps = {
    configKey: string
    configValue: string
    updatedAt?: string
    onSave: (configKey: string, configValue: string) => Promise<void>
}

const ParameterRow = ({
    configKey,
    configValue,
    updatedAt,
    onSave,
}: ParameterRowProps) => {
    const [value, setValue] = useState(configValue)

    useEffect(() => {
        setValue(configValue)
    }, [configValue])

    return (
        <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{configKey}</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Cập nhật: {formatDateTime(updatedAt)}
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2 lg:w-[520px] lg:flex-row">
                    <input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                    />
                    <button
                        onClick={() => void onSave(configKey, value)}
                        className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    )
}

type UnitPresetGroupProps = {
    title: string
    items: UnitPreset[]
    onPick: (preset: UnitPreset) => void
}

const UnitPresetGroup = ({ title, items, onPick }: UnitPresetGroupProps) => {
    return (
        <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>
            <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                    <button
                        key={`${title}-${item.name}-${item.symbol}`}
                        type="button"
                        onClick={() => onPick(item)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                        {item.name}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default AdminSettings
