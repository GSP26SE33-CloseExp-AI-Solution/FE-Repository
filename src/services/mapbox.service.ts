const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || ""

export type LatLng = {
    lat: number
    lng: number
}

type MapboxFeature = {
    id: string
    place_name?: string
    center?: [number, number] // [lng, lat]
}

type MapboxGeocodingResponse = {
    features?: MapboxFeature[]
}

export type GeocodeItem = {
    id: string
    addressText: string
    lat: number
    lng: number
}

const ensureToken = () => {
    if (!MAPBOX_TOKEN) {
        throw new Error("Thiếu REACT_APP_MAPBOX_TOKEN trong file .env")
    }
}

export async function forwardGeocode(query: string): Promise<GeocodeItem[]> {
    ensureToken()

    const trimmed = query.trim()
    if (!trimmed) return []

    const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?` +
        new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            country: "vn",
            language: "vi",
            limit: "5",
            autocomplete: "true",
        }).toString()

    const res = await fetch(url)
    if (!res.ok) {
        throw new Error("Không tìm được địa chỉ bằng Mapbox")
    }

    const data = (await res.json()) as MapboxGeocodingResponse

    return (data.features ?? [])
        .filter((item) => item.center && item.center.length >= 2)
        .map((item) => ({
            id: item.id,
            addressText: item.place_name ?? "",
            lng: item.center![0],
            lat: item.center![1],
        }))
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeItem | null> {
    ensureToken()

    const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            language: "vi",
            limit: "1",
        }).toString()

    const res = await fetch(url)
    if (!res.ok) {
        throw new Error("Không lấy được địa chỉ từ tọa độ")
    }

    const data = (await res.json()) as MapboxGeocodingResponse
    const first = data.features?.[0]

    if (!first?.center) return null

    return {
        id: first.id,
        addressText: first.place_name ?? `${lat}, ${lng}`,
        lng: first.center[0],
        lat: first.center[1],
    }
}
