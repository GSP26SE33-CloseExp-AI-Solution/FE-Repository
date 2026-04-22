import { useEffect, useMemo, useState } from "react"
import { LocateFixed, MapPin, Search } from "lucide-react"

import type { UpsertCollectionPointPayload } from "@/types/admin.type"
import { adminService } from "@/services/admin.service"
import {
    administrativeService,
    type AdministrativeDistrict,
    type AdministrativeWard,
} from "@/services/administrative.service"
import { supermarketService } from "@/services/supermarket.service"
import type { GeocodeItem } from "@/types/supermarket.type"
import { showError, showSuccess } from "@/utils/toast"
import MapboxLocationPicker from "@/pages/Home/MapboxLocationPicker"

import {
    googleMapsUrl,
    logApiError,
    logApiSuccess,
    normalizeText,
    parseCoordinate,
    type CollectionSearchResultItem,
    type CollectionUsageRow,
    type EditableCollectionForm,
} from "./Shared"

type Props = {
    loading: boolean
    collectionPoints: CollectionUsageRow[]
    onRefresh: () => Promise<void>
}

const HCMC_NAME = "Thành phố Hồ Chí Minh"

const AdminSettingsCollectionPoints = ({
    loading,
    collectionPoints,
    onRefresh,
}: Props) => {
    const [newCollectionName, setNewCollectionName] = useState("")
    const [newCollectionAddress, setNewCollectionAddress] = useState("")

    const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
    const [editCollection, setEditCollection] = useState<EditableCollectionForm>({
        name: "",
        addressLine: "",
        latitude: "",
        longitude: "",
    })

    const [districts, setDistricts] = useState<AdministrativeDistrict[]>([])
    const [wards, setWards] = useState<AdministrativeWard[]>([])
    const [districtCode, setDistrictCode] = useState<number | "">("")
    const [wardCode, setWardCode] = useState<number | "">("")
    const [streetLine, setStreetLine] = useState("")

    const [collectionSearching, setCollectionSearching] = useState(false)
    const [collectionSearchResults, setCollectionSearchResults] = useState<
        CollectionSearchResultItem[]
    >([])
    const [collectionAdministrativeLoading, setCollectionAdministrativeLoading] =
        useState(false)
    const [collectionMapStatus, setCollectionMapStatus] = useState<
        "idle" | "loading" | "loaded" | "error"
    >("idle")

    const [newCollectionLat, setNewCollectionLat] = useState<number | null>(null)
    const [newCollectionLng, setNewCollectionLng] = useState<number | null>(null)

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

    const resetEditing = () => {
        setEditingCollectionId(null)
        setEditCollection({
            name: "",
            addressLine: "",
            latitude: "",
            longitude: "",
        })
    }

    useEffect(() => {
        ; (async () => {
            try {
                setCollectionAdministrativeLoading(true)
                const res = await administrativeService.getHcmDistricts()
                setDistricts(res ?? [])
            } catch (error) {
                logApiError("collectionPoints - getHcmDistricts", error)
            } finally {
                setCollectionAdministrativeLoading(false)
            }
        })()
    }, [])

    useEffect(() => {
        if (!districtCode) {
            setWards([])
            setWardCode("")
            return
        }

        ; (async () => {
            try {
                setCollectionAdministrativeLoading(true)
                const res = await administrativeService.getWardsByDistrictCode(
                    Number(districtCode)
                )
                setWards(res ?? [])
            } catch (error) {
                logApiError("collectionPoints - getWardsByDistrictCode", error)
            } finally {
                setCollectionAdministrativeLoading(false)
            }
        })()
    }, [districtCode])

    const syncAdministrativeFromReverse = async (params: {
        district?: string
        region?: string
    }) => {
        try {
            const districtKeyword = normalizeText(params.district)
            const regionKeyword = normalizeText(params.region)

            const districtList =
                districts.length > 0
                    ? districts
                    : await administrativeService.getHcmDistricts()

            if (!districts.length) setDistricts(districtList)

            const matchedDistrict = districtList.find((d) => {
                const name = normalizeText(d.name)
                return (
                    (districtKeyword &&
                        (name.includes(districtKeyword) ||
                            districtKeyword.includes(name))) ||
                    (regionKeyword &&
                        (name.includes(regionKeyword) || regionKeyword.includes(name)))
                )
            })

            if (!matchedDistrict) return

            setDistrictCode(matchedDistrict.code)
            const wardList = await administrativeService.getWardsByDistrictCode(
                matchedDistrict.code
            )
            setWards(wardList)
        } catch (error) {
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
            const prettyAddress =
                reverse?.fullAddress?.trim() ||
                reverse?.placeName?.trim() ||
                `${lat.toFixed(6)}, ${lng.toFixed(6)}`

            setNewCollectionAddress(prettyAddress)

            await syncAdministrativeFromReverse({
                district: reverse?.district,
                region: reverse?.region,
            })
        } catch (error) {
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
        } catch (error) {
            logApiError("collectionPoints - handleSearchCollectionAddress", error)
            showError("Không tìm được địa chỉ")
        } finally {
            setCollectionSearching(false)
        }
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

        const payload: UpsertCollectionPointPayload = {
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
            await onRefresh()
        } catch (error) {
            logApiError("handleCreateCollectionPoint", error, payload)
            showError("Không thể tạo điểm tập kết")
        }
    }

    const handleStartEdit = (item: CollectionUsageRow) => {
        if (item.isInUse) {
            showError("Không thể sửa điểm tập kết đang được đơn hàng sử dụng")
            return
        }

        setEditingCollectionId(item.collectionId)
        setEditCollection({
            name: item.name ?? "",
            addressLine: item.addressLine ?? "",
            latitude: String(item.latitude ?? ""),
            longitude: String(item.longitude ?? ""),
        })
    }

    const handleUpdateCollectionPoint = async (collectionId: string) => {
        const target = collectionPoints.find((item) => item.collectionId === collectionId)

        if (target?.isInUse) {
            showError("Không thể sửa điểm tập kết đang được đơn hàng sử dụng")
            resetEditing()
            return
        }

        if (!editCollection.name.trim()) {
            showError("Vui lòng nhập tên điểm tập kết")
            return
        }

        if (!editCollection.addressLine.trim()) {
            showError("Vui lòng nhập địa chỉ điểm tập kết")
            return
        }

        const latitude = parseCoordinate(editCollection.latitude)
        const longitude = parseCoordinate(editCollection.longitude)

        if (latitude === null || longitude === null) {
            showError("Vĩ độ hoặc kinh độ không hợp lệ")
            return
        }

        const payload: UpsertCollectionPointPayload = {
            name: editCollection.name.trim(),
            addressLine: editCollection.addressLine.trim(),
            latitude,
            longitude,
        }

        try {
            logApiSuccess("handleUpdateCollectionPoint - request", {
                collectionId,
                payload,
            })
            const res = await adminService.updateCollectionPoint(collectionId, payload)
            logApiSuccess(
                "handleUpdateCollectionPoint - response",
                { collectionId, payload },
                res
            )

            showSuccess("Đã cập nhật điểm tập kết")
            resetEditing()
            await onRefresh()
        } catch (error) {
            logApiError("handleUpdateCollectionPoint", error, {
                collectionId,
                payload,
            })
            showError("Không thể cập nhật điểm tập kết")
        }
    }

    const handleDeleteCollectionPoint = async (collectionId: string) => {
        const target = collectionPoints.find((item) => item.collectionId === collectionId)

        if (target?.isInUse) {
            showError("Không thể xóa điểm tập kết đang được đơn hàng sử dụng")
            return
        }

        try {
            logApiSuccess("handleDeleteCollectionPoint - request", { collectionId })
            const res = await adminService.deleteCollectionPoint(collectionId)
            logApiSuccess("handleDeleteCollectionPoint - response", { collectionId }, res)

            showSuccess("Đã xóa điểm tập kết")
            await onRefresh()
        } catch (error) {
            logApiError("handleDeleteCollectionPoint", error, { collectionId })
            showError("Không thể xóa điểm tập kết này")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Điểm tập kết</h2>
                <p className="text-sm text-slate-500">
                    Tạo điểm nhận hàng thông minh bằng GPS, tìm địa chỉ hoặc chọn trực
                    tiếp trên bản đồ.
                </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-slate-900">
                                Tạo điểm tập kết mới
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <input
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                placeholder="Tên điểm tập kết"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                            />

                            <button
                                type="button"
                                onClick={requestCurrentLocationForCollectionPoint}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <LocateFixed size={16} />
                                Dùng vị trí hiện tại
                            </button>

                            <div className="grid gap-3">
                                <input
                                    value={HCMC_NAME}
                                    disabled
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                                />

                                <select
                                    value={districtCode}
                                    onChange={(e) =>
                                        setDistrictCode(
                                            e.target.value ? Number(e.target.value) : ""
                                        )
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                >
                                    <option value="">Chọn quận / huyện</option>
                                    {districts.map((item) => (
                                        <option key={item.code} value={item.code}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={wardCode}
                                    onChange={(e) =>
                                        setWardCode(
                                            e.target.value ? Number(e.target.value) : ""
                                        )
                                    }
                                    disabled={!districtCode}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
                                >
                                    <option value="">Chọn phường / xã</option>
                                    {wards.map((item) => (
                                        <option key={item.code} value={item.code}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    value={streetLine}
                                    onChange={(e) => setStreetLine(e.target.value)}
                                    placeholder="Số nhà, tên đường"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleSearchCollectionAddress()}
                                disabled={
                                    collectionSearching ||
                                    collectionAdministrativeLoading
                                }
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Search size={15} />
                                {collectionSearching ? "Đang tìm" : "Tìm địa chỉ"}
                            </button>

                            {!!collectionSearchResults.length && (
                                <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                                    <div className="grid gap-2">
                                        {collectionSearchResults.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() =>
                                                    void applyReverseGeocodeToCollectionPoint(
                                                        item.lat,
                                                        item.lng,
                                                        "search"
                                                    )
                                                }
                                                className="rounded-2xl border border-slate-100 bg-white p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                                            >
                                                <div className="text-sm font-semibold text-slate-900">
                                                    {item.displayName}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {item.lat.toFixed(6)},{" "}
                                                    {item.lng.toFixed(6)}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="text-sm font-semibold text-slate-900">
                                    {newCollectionAddress || "Chưa có địa chỉ nào được chọn"}
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                                    <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                                        Vĩ độ:{" "}
                                        {newCollectionLat != null
                                            ? newCollectionLat.toFixed(6)
                                            : "—"}
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                                        Kinh độ:{" "}
                                        {newCollectionLng != null
                                            ? newCollectionLng.toFixed(6)
                                            : "—"}
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
                            </div>
                            <MapPin size={18} className="text-slate-700" />
                        </div>

                        {newCollectionLat != null && newCollectionLng != null ? (
                            <>
                                <MapboxLocationPicker
                                    lat={newCollectionLat}
                                    lng={newCollectionLng}
                                    onPick={(value) =>
                                        void applyReverseGeocodeToCollectionPoint(
                                            value.lat,
                                            value.lng,
                                            "map"
                                        )
                                    }
                                    onMapStatusChange={(status) =>
                                        setCollectionMapStatus(status)
                                    }
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
                                        Xem Google Maps
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
                                        Hãy dùng GPS hoặc tìm địa chỉ trước.
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
                        </div>

                        <div className="space-y-3">
                            {collectionPoints.map((item) => {
                                const isEditing = editingCollectionId === item.collectionId

                                return (
                                    <div
                                        key={item.collectionId}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                                    >
                                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0 flex-1">
                                                {isEditing ? (
                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                        <input
                                                            value={editCollection.name}
                                                            onChange={(e) =>
                                                                setEditCollection((prev) => ({
                                                                    ...prev,
                                                                    name: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Tên điểm"
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                                        />
                                                        <input
                                                            value={editCollection.addressLine}
                                                            onChange={(e) =>
                                                                setEditCollection((prev) => ({
                                                                    ...prev,
                                                                    addressLine:
                                                                        e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Địa chỉ"
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                                        />
                                                        <input
                                                            value={editCollection.latitude}
                                                            onChange={(e) =>
                                                                setEditCollection((prev) => ({
                                                                    ...prev,
                                                                    latitude: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Vĩ độ"
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                                        />
                                                        <input
                                                            value={editCollection.longitude}
                                                            onChange={(e) =>
                                                                setEditCollection((prev) => ({
                                                                    ...prev,
                                                                    longitude: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Kinh độ"
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {item.name}
                                                            </p>
                                                            {item.isInUse && (
                                                                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
                                                                    Đang dùng •{" "}
                                                                    {item.relatedOrderCount ?? 0} đơn
                                                                </span>
                                                            )}
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
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                void handleUpdateCollectionPoint(
                                                                    item.collectionId
                                                                )
                                                            }
                                                            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                                                        >
                                                            Lưu
                                                        </button>
                                                        <button
                                                            onClick={resetEditing}
                                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <a
                                                            href={googleMapsUrl(
                                                                item.latitude,
                                                                item.longitude
                                                            )}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Xem bản đồ
                                                        </a>

                                                        <button
                                                            onClick={() => handleStartEdit(item)}
                                                            disabled={item.isInUse}
                                                            title={
                                                                item.isInUse
                                                                    ? "Điểm tập kết này đang có đơn nên không thể sửa"
                                                                    : "Sửa điểm tập kết"
                                                            }
                                                            className={[
                                                                "rounded-xl border px-3 py-2 text-sm font-medium transition",
                                                                item.isInUse
                                                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                                            ].join(" ")}
                                                        >
                                                            Sửa
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                void handleDeleteCollectionPoint(
                                                                    item.collectionId
                                                                )
                                                            }
                                                            disabled={item.isInUse}
                                                            title={
                                                                item.isInUse
                                                                    ? "Điểm tập kết này đang có đơn nên không thể xóa"
                                                                    : "Xóa điểm tập kết"
                                                            }
                                                            className={[
                                                                "rounded-xl border px-3 py-2 text-sm font-medium transition",
                                                                item.isInUse
                                                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                                                    : "border-red-200 text-red-600 hover:bg-red-50",
                                                            ].join(" ")}
                                                        >
                                                            Xóa
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {!loading && collectionPoints.length === 0 && (
                                <p className="text-sm text-slate-500">
                                    Chưa có điểm tập kết nào.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {!hasResolvedCollectionLocation && false}
        </div>
    )
}

export default AdminSettingsCollectionPoints
