import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/auth.types"
import type {
  GeocodeItem,
  PickupPoint,
  PickupPointApiItem,
  Supermarket,
  SupermarketApiItem,
  SupermarketsPageResponse,
} from "@/types/supermarket.type"

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

const isFiniteCoordinate = (value: unknown) => Number.isFinite(toNumber(value))

const isValidLatLng = (lat: unknown, lng: unknown) => {
  const nextLat = toNumber(lat)
  const nextLng = toNumber(lng)

  if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return false
  if (nextLat < -90 || nextLat > 90) return false
  if (nextLng < -180 || nextLng > 180) return false

  return true
}

const extractArray = <T>(raw: unknown): T[] => {
  if (Array.isArray(raw)) return raw as T[]

  if (raw && typeof raw === "object") {
    const candidate = raw as {
      items?: unknown
      data?: unknown
      results?: unknown
      value?: unknown
    }

    if (Array.isArray(candidate.items)) return candidate.items as T[]
    if (Array.isArray(candidate.data)) return candidate.data as T[]
    if (Array.isArray(candidate.results)) return candidate.results as T[]
    if (Array.isArray(candidate.value)) return candidate.value as T[]
  }

  return []
}

const mapSupermarket = (item: Partial<SupermarketApiItem> & Record<string, any>): Supermarket => {
  const latitude = toNumber(item.latitude ?? item.lat)
  const longitude = toNumber(item.longitude ?? item.lng)

  const mapped: Supermarket = {
    supermarketId: String(item.supermarketId ?? item.id ?? ""),
    name: String(item.name ?? item.supermarketName ?? "Siêu thị"),
    address: String(item.address ?? item.addressLine ?? item.location ?? ""),
    latitude,
    longitude,
    contactPhone:
      typeof item.contactPhone === "string"
        ? item.contactPhone
        : typeof item.phone === "string"
          ? item.phone
          : undefined,
    status:
      typeof item.status === "number"
        ? item.status
        : typeof item.status === "string" && item.status.trim() !== ""
          ? Number(item.status)
          : undefined,
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : typeof item.createdDate === "string"
          ? item.createdDate
          : undefined,
  }

  console.log("[supermarketService][mapSupermarket] raw =", item)
  console.log("[supermarketService][mapSupermarket] mapped =", mapped)

  return mapped
}

const mapPickupPoint = (item: Partial<PickupPointApiItem> & Record<string, any>): PickupPoint => {
  const mapped: PickupPoint = {
    pickupPointId: String(
      item.pickupPointId ?? item.collectionPointId ?? item.collectionId ?? item.id ?? ""
    ),
    name: String(item.name ?? item.collectionPointName ?? "Điểm nhận"),
    address: String(item.address ?? item.addressLine ?? item.location ?? ""),
    lat: toNumber(item.latitude ?? item.lat),
    lng: toNumber(item.longitude ?? item.lng),
  }

  console.log("[supermarketService][mapPickupPoint] raw =", item)
  console.log("[supermarketService][mapPickupPoint] mapped =", mapped)

  return mapped
}

const logAxiosError = (label: string, error: any) => {
  console.error(`[supermarketService][${label}] message =`, error?.message)
  console.error(`[supermarketService][${label}] response =`, error?.response?.data)
  console.error(`[supermarketService][${label}] status =`, error?.response?.status)
}

export const supermarketService = {
  async getSupermarkets(params?: { pageNumber?: number; pageSize?: number }): Promise<Supermarket[]> {
    try {
      const res = await axiosClient.get<SupermarketsPageResponse>("/Supermarkets", {
        params: {
          pageNumber: params?.pageNumber ?? 1,
          pageSize: params?.pageSize ?? 100,
        },
      })

      console.log("[supermarketService][getSupermarkets] raw response =", res.data)

      const items = extractArray<SupermarketApiItem>(
        res.data?.data ?? (res.data as unknown)
      )

      console.log("[supermarketService][getSupermarkets] extracted items =", items)

      return items
        .map(mapSupermarket)
        .filter((item) => item.supermarketId && item.name)
    } catch (error) {
      logAxiosError("getSupermarkets", error)
      throw error
    }
  },

  async getAvailableSupermarkets(): Promise<Supermarket[]> {
    try {
      const res = await axiosClient.get<ApiResponse<SupermarketApiItem[] | { items?: SupermarketApiItem[] }>>(
        "/Supermarkets/available"
      )

      console.log("[supermarketService][getAvailableSupermarkets] raw response =", res.data)

      const items = extractArray<SupermarketApiItem>(
        res.data?.data ?? (res.data as unknown)
      )

      console.log("[supermarketService][getAvailableSupermarkets] extracted items =", items)

      const mapped = items
        .map(mapSupermarket)
        .filter((item) => item.supermarketId && item.name)

      console.log("[supermarketService][getAvailableSupermarkets] mapped items =", mapped)

      return mapped
    } catch (error) {
      logAxiosError("getAvailableSupermarkets", error)
      throw error
    }
  },

  async searchSupermarkets(query: string): Promise<Supermarket[]> {
    try {
      const res = await axiosClient.get<ApiResponse<SupermarketApiItem[] | { items?: SupermarketApiItem[] }>>(
        "/Supermarkets/search",
        {
          params: { query },
        }
      )

      console.log("[supermarketService][searchSupermarkets] query =", query)
      console.log("[supermarketService][searchSupermarkets] raw response =", res.data)

      const items = extractArray<SupermarketApiItem>(
        res.data?.data ?? (res.data as unknown)
      )

      console.log("[supermarketService][searchSupermarkets] extracted items =", items)

      return items
        .map(mapSupermarket)
        .filter((item) => item.supermarketId && item.name)
    } catch (error) {
      logAxiosError("searchSupermarkets", error)
      throw error
    }
  },

  async getPickupPoints(): Promise<PickupPoint[]> {
    try {
      const res = await axiosClient.get<
        ApiResponse<PickupPointApiItem[] | { items?: PickupPointApiItem[] }>
      >("/admin/system-config/collection-points")

      console.log("[supermarketService][getPickupPoints] raw response =", res.data)

      const items = extractArray<PickupPointApiItem>(
        res.data?.data ?? (res.data as unknown)
      )

      console.log("[supermarketService][getPickupPoints] extracted items =", items)

      return items
        .map(mapPickupPoint)
        .filter((item) => item.pickupPointId && item.name)
    } catch (error) {
      logAxiosError("getPickupPoints", error)
      throw error
    }
  },

  async forwardGeocode(address: string): Promise<GeocodeItem | null> {
    try {
      const res = await axiosClient.get<ApiResponse<GeocodeItem>>("/Supermarkets/geocode/forward", {
        params: { address },
      })

      console.log("[supermarketService][forwardGeocode] address =", address)
      console.log("[supermarketService][forwardGeocode] raw response =", res.data)

      return res.data?.data ?? null
    } catch (error) {
      logAxiosError("forwardGeocode", error)
      throw error
    }
  },

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeItem | null> {
    try {
      const res = await axiosClient.get<ApiResponse<GeocodeItem>>("/Supermarkets/geocode/reverse", {
        params: { lat, lng },
      })

      console.log("[supermarketService][reverseGeocode] params =", { lat, lng })
      console.log("[supermarketService][reverseGeocode] raw response =", res.data)

      return res.data?.data ?? null
    } catch (error) {
      logAxiosError("reverseGeocode", error)
      throw error
    }
  },

  async suggestGeocode(query: string, limit = 5): Promise<GeocodeItem[]> {
    try {
      const res = await axiosClient.get<ApiResponse<GeocodeItem[]>>("/Supermarkets/geocode/suggest", {
        params: { query, limit },
      })

      console.log("[supermarketService][suggestGeocode] params =", { query, limit })
      console.log("[supermarketService][suggestGeocode] raw response =", res.data)

      return extractArray<GeocodeItem>(res.data?.data ?? (res.data as unknown))
    } catch (error) {
      logAxiosError("suggestGeocode", error)
      throw error
    }
  },

  async getNearbySupermarketsByClientFilter(params: {
    lat: number
    lng: number
    radiusKm?: number
  }): Promise<Supermarket[]> {
    const radiusKm = params.radiusKm ?? 5

    console.log("[supermarketService][getNearbySupermarketsByClientFilter] input =", params)

    if (!isValidLatLng(params.lat, params.lng)) {
      console.error(
        "[supermarketService][getNearbySupermarketsByClientFilter] invalid user coordinates =",
        params
      )
      return []
    }

    const all = await this.getSupermarkets({ pageNumber: 1, pageSize: 200 })

    console.log(
      "[supermarketService][getNearbySupermarketsByClientFilter] source = /Supermarkets"
    )
    console.log(
      "[supermarketService][getNearbySupermarketsByClientFilter] source supermarkets =",
      all
    )

    const validSupermarkets = all.filter((item) => {
      const valid = isValidLatLng(item.latitude, item.longitude)

      if (!valid) {
        console.warn(
          "[supermarketService][getNearbySupermarketsByClientFilter] invalid supermarket coordinates, skipped =",
          item
        )
      }

      return valid
    })

    const withDistance = validSupermarkets.map((item) => {
      const distanceKm = haversineKm(
        { lat: params.lat, lng: params.lng },
        { lat: item.latitude, lng: item.longitude }
      )

      return {
        ...item,
        distanceKm,
      }
    })

    console.log(
      "[supermarketService][getNearbySupermarketsByClientFilter] supermarkets with distance =",
      withDistance.map((item) => ({
        supermarketId: item.supermarketId,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        distanceKm: item.distanceKm,
      }))
    )

    const filtered = withDistance
      .filter((item) => (item.distanceKm ?? Number.MAX_SAFE_INTEGER) <= radiusKm)
      .sort(
        (a, b) =>
          (a.distanceKm ?? Number.MAX_SAFE_INTEGER) -
          (b.distanceKm ?? Number.MAX_SAFE_INTEGER)
      )

    console.log(
      "[supermarketService][getNearbySupermarketsByClientFilter] filtered result =",
      {
        totalSourceItems: all.length,
        totalValidCoordinates: validSupermarkets.length,
        totalInRadius: filtered.length,
        radiusKm,
        items: filtered,
      }
    )

    return filtered
  },
}
