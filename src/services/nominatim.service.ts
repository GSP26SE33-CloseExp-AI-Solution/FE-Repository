export type NominatimSearchItem = {
    placeId: string
    displayName: string
    lat: number
    lng: number
}

export type NominatimReverseResult = {
    displayName: string
    lat: number
    lng: number
    houseNumber?: string
    road?: string
    ward?: string
    district?: string
    city?: string
    province?: string
}

type NominatimSearchResponseItem = {
    place_id: number | string
    display_name: string
    lat: string
    lon: string
}

type NominatimReverseResponse = {
    display_name: string
    lat: string
    lon: string
    address?: {
        house_number?: string
        road?: string
        neighbourhood?: string
        suburb?: string
        quarter?: string
        city_district?: string
        district?: string
        borough?: string
        city?: string
        town?: string
        county?: string
        state?: string
        postcode?: string
        country?: string
    }
}

const USER_AGENT = "CloseExp-AI-FE/1.0"

const buildStreet = (streetLine: string) => streetLine.trim()

const buildStreetLineFromReverse = (item: NominatimReverseResult) =>
    [item.houseNumber, item.road].filter(Boolean).join(" ").trim()

const buildPrettyAddressFromReverse = (item: NominatimReverseResult) => {
    const streetLine = buildStreetLineFromReverse(item)

    return [
        streetLine || undefined,
        item.ward,
        item.district,
        item.city || item.province,
    ]
        .filter(Boolean)
        .join(", ")
}

export const nominatimService = {
    async searchStructuredAddress(params: {
        streetLine: string
        wardName?: string
        districtName: string
        city?: string
        country?: string
        limit?: number
    }): Promise<NominatimSearchItem[]> {
        const query = new URLSearchParams({
            street: buildStreet(params.streetLine),
            city: params.city ?? "Thành phố Hồ Chí Minh",
            country: params.country ?? "Việt Nam",
            format: "jsonv2",
            addressdetails: "1",
            limit: String(params.limit ?? 5),
            "accept-language": "vi",
        })

        if (params.wardName?.trim()) {
            query.set("county", `${params.wardName.trim()}, ${params.districtName.trim()}`)
        } else {
            query.set("county", params.districtName.trim())
        }

        const res = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`, {
            headers: {
                Accept: "application/json",
                "Accept-Language": "vi",
            },
        })

        if (!res.ok) {
            throw new Error("Không tìm được địa chỉ từ OSM.")
        }

        const data = (await res.json()) as NominatimSearchResponseItem[]

        return (data ?? [])
            .map((item) => ({
                placeId: String(item.place_id),
                displayName: item.display_name,
                lat: Number(item.lat),
                lng: Number(item.lon),
            }))
            .filter(
                (item) =>
                    item.displayName &&
                    Number.isFinite(item.lat) &&
                    Number.isFinite(item.lng)
            )
    },

    async reverseGeocode(lat: number, lng: number): Promise<NominatimReverseResult> {
        const query = new URLSearchParams({
            lat: String(lat),
            lon: String(lng),
            format: "jsonv2",
            addressdetails: "1",
            "accept-language": "vi",
        })

        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
            headers: {
                Accept: "application/json",
                "Accept-Language": "vi",
            },
        })

        if (!res.ok) {
            throw new Error("Không lấy được địa chỉ từ tọa độ.")
        }

        const data = (await res.json()) as NominatimReverseResponse
        const address = data.address ?? {}

        return {
            displayName: data.display_name,
            lat: Number(data.lat),
            lng: Number(data.lon),
            houseNumber: address.house_number,
            road: address.road,
            ward: address.suburb || address.quarter || address.neighbourhood,
            district: address.city_district || address.district || address.county,
            city: address.city || address.town,
            province: address.state,
        }
    },

    buildStreetLineFromReverse,
    buildPrettyAddressFromReverse,
}
