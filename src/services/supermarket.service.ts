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

const mapSupermarket = (item: SupermarketApiItem): Supermarket => ({
  supermarketId: item.supermarketId,
  name: item.name,
  address: item.address,
  latitude: Number(item.latitude),
  longitude: Number(item.longitude),
  contactPhone: item.contactPhone,
  status: item.status,
  createdAt: item.createdAt,
})

const mapPickupPoint = (item: PickupPointApiItem): PickupPoint => ({
  pickupPointId:
    item.pickupPointId || item.collectionPointId || item.collectionId || "",
  name: item.name,
  address: item.address || item.addressLine || "",
  lat: Number(item.latitude),
  lng: Number(item.longitude),
})

export const supermarketService = {
  async getSupermarkets(params?: { pageNumber?: number; pageSize?: number }): Promise<Supermarket[]> {
    const res = await axiosClient.get<SupermarketsPageResponse>("/Supermarkets", {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 100,
      },
    })

    const items = res.data?.data?.items ?? []
    return items.map(mapSupermarket)
  },

  async getAvailableSupermarkets(): Promise<Supermarket[]> {
    const res = await axiosClient.get<ApiResponse<SupermarketApiItem[]>>("/Supermarkets/available")
    const items = res.data?.data ?? []
    return items.map(mapSupermarket)
  },

  async searchSupermarkets(query: string): Promise<Supermarket[]> {
    const res = await axiosClient.get<ApiResponse<SupermarketApiItem[]>>("/Supermarkets/search", {
      params: { query },
    })

    const items = res.data?.data ?? []
    return items.map(mapSupermarket)
  },

  async getPickupPoints(): Promise<PickupPoint[]> {
    const res = await axiosClient.get<
      ApiResponse<PickupPointApiItem[] | { items?: PickupPointApiItem[] }>
    >("/admin/system-config/collection-points")

    const raw = res.data?.data
    const items = Array.isArray(raw) ? raw : raw?.items ?? []

    return items.map(mapPickupPoint)
  },

  async forwardGeocode(address: string): Promise<GeocodeItem | null> {
    const res = await axiosClient.get<ApiResponse<GeocodeItem>>("/Supermarkets/geocode/forward", {
      params: { address },
    })

    return res.data?.data ?? null
  },

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeItem | null> {
    const res = await axiosClient.get<ApiResponse<GeocodeItem>>("/Supermarkets/geocode/reverse", {
      params: { lat, lng },
    })

    return res.data?.data ?? null
  },

  async suggestGeocode(query: string, limit = 5): Promise<GeocodeItem[]> {
    const res = await axiosClient.get<ApiResponse<GeocodeItem[]>>("/Supermarkets/geocode/suggest", {
      params: { query, limit },
    })

    return res.data?.data ?? []
  },

  async getNearbySupermarketsByClientFilter(params: {
    lat: number
    lng: number
    radiusKm?: number
  }): Promise<Supermarket[]> {
    const all = await this.getAvailableSupermarkets()
    const radiusKm = params.radiusKm ?? 5

    return all
      .map((item) => ({
        ...item,
        distanceKm: haversineKm(
          { lat: params.lat, lng: params.lng },
          { lat: item.latitude, lng: item.longitude }
        ),
      }))
      .filter((item) => (item.distanceKm ?? 999999) <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999))
  },
}
