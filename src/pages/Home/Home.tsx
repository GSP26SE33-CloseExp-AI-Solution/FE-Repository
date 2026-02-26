import React, { useEffect, useMemo, useState } from "react"
import {
  Search,
  ShoppingCart,
  AlarmClock,
  Clock,
  Utensils,
  Leaf,
  Tag,
  MapPin,
  Navigation,
  ChevronRight,
  LocateFixed,
  Pencil,
  Check,
  Building2,
  PackageCheck,
  Truck,
} from "lucide-react"

/* =========================================================
   ✅ CUSTOMER LOCATION + SUPERMARKET(5km) + DELIVERY GATE
   Flow:
   (1) Chọn vị trí (GPS hoặc nhập địa chỉ HCMC-only, có thể edit)
   (2) FE tự query OSM: list siêu thị trong bán kính 5km
   (3) Chọn siêu thị
   (4) Chọn hình thức giao hàng (Delivery / Pickup)
   (5) Nếu Pickup -> chọn điểm tập kết (mock theo siêu thị)
========================================================= */

/* ================= Helpers ================= */

const cn = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(" ")

type LatLng = { lat: number; lng: number }

const toRad = (v: number) => (v * Math.PI) / 180
const haversineKm = (a: LatLng, b: LatLng) => {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s1 = Math.sin(dLat / 2) ** 2
  const s2 =
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * (Math.sin(dLng / 2) ** 2)
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(s1 + s2)))
  return R * c
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

const cacheGet = <T,>(key: string): T | null => {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { ts: number; data: T }
    if (!parsed?.ts) return null
    if (Date.now() - parsed.ts > ONE_DAY_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

const cacheSet = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
}

const googleMapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps?q=${lat},${lng}`

/* ================= Constants ================= */

const HCMC_CITY_LABEL = "Thành phố Hồ Chí Minh"
const HCMC_PROVINCE_CODE = 79

/* ================= Provinces Open API v2 (wards only) ================= */

type ProvinceV2Ward = { code: number; name: string }
type ProvinceV2Province = { code: number; name: string; wards?: ProvinceV2Ward[] }

const PROVINCES_V2_CACHE_KEY = "provinces_hcm_v2_depth2_cache"

async function fetchHcmWardsCached(): Promise<ProvinceV2Ward[]> {
  const cached = cacheGet<ProvinceV2Ward[]>(PROVINCES_V2_CACHE_KEY)
  if (cached) return cached

  const url = `https://provinces.open-api.vn/api/v2/p/${HCMC_PROVINCE_CODE}?depth=2`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Không tải được danh sách phường/xã (v2)")

  const data = (await res.json()) as ProvinceV2Province
  const wards = Array.isArray(data?.wards) ? data.wards : []
  cacheSet(PROVINCES_V2_CACHE_KEY, wards)
  return wards
}

/* ================= OSM (Nominatim + Overpass) - FE demo only ================= */

type OSMPlace = {
  display_name: string
  lat?: string
  lon?: string
}

type OSMShop = {
  id: string
  name: string
  type: "node" | "way" | "relation"
  lat: number
  lon: number
  address?: string
  brand?: string
  tags?: Record<string, string>
}

const normalizeAddressLine = (tags?: Record<string, string>) => {
  if (!tags) return ""
  const hn = tags["addr:housenumber"]
  const street = tags["addr:street"]
  const ward = tags["addr:suburb"]
  const city = tags["addr:city"]
  const parts = [hn, street, ward, city].filter(Boolean)
  return parts.join(", ")
}

// Geocode address text -> lat/lng (cache 1 day)
async function nominatimGeocodeLatLng(addressQuery: string): Promise<LatLng | null> {
  const key = `osm_nominatim_geocode_${encodeURIComponent(addressQuery)}`
  const cached = cacheGet<LatLng>(key)
  if (cached) return cached

  const url =
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: addressQuery,
      format: "jsonv2",
      limit: "1",
      countrycodes: "vn",
      addressdetails: "1",
    }).toString()

  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) throw new Error("Nominatim lỗi (không geocode được địa chỉ)")

  const arr = (await res.json()) as OSMPlace[]
  const lat = Number(arr?.[0]?.lat)
  const lon = Number(arr?.[0]?.lon)
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null

  const ll = { lat, lng: lon }
  cacheSet(key, ll)
  return ll
}

/* ================= Nominatim Reverse (lat/lng -> address) ================= */

type NominatimReverse = {
  display_name?: string
  address?: {
    house_number?: string
    road?: string
    suburb?: string
    neighbourhood?: string
    quarter?: string
    city?: string
    town?: string
    county?: string
    state?: string
  }
}

// cache 1 day như geocode
async function nominatimReverseAddress(lat: number, lng: number): Promise<NominatimReverse | null> {
  const key = `osm_nominatim_reverse_${lat.toFixed(6)}_${lng.toFixed(6)}`
  const cached = cacheGet<NominatimReverse>(key)
  if (cached) return cached

  const url =
    `https://nominatim.openstreetmap.org/reverse?` +
    new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
      addressdetails: "1",
      zoom: "18",
    }).toString()

  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) return null

  const data = (await res.json()) as NominatimReverse
  cacheSet(key, data)
  return data
}

/* normalize ward strings for matching */
const normalizeWardName = (s: string) =>
  s
    .toLowerCase()
    .replace(/^phường\s+/i, "")
    .replace(/^xã\s+/i, "")
    .replace(/^thị\s+trấn\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()

// Overpass: query supermarkets within radius around point (cache 1 day)
async function overpassFetchSupermarketsAround(
  center: LatLng,
  radiusMeters = 5000
): Promise<OSMShop[]> {
  const key = `osm_overpass_around_${center.lat.toFixed(5)}_${center.lng.toFixed(
    5
  )}_${radiusMeters}`
  const cached = cacheGet<OSMShop[]>(key)
  if (cached) return cached

  const query = `
    [out:json][timeout:25];
    (
      nwr["shop"="supermarket"](around:${radiusMeters},${center.lat},${center.lng});
      nwr["shop"="convenience"](around:${radiusMeters},${center.lat},${center.lng});
      nwr["amenity"="marketplace"](around:${radiusMeters},${center.lat},${center.lng});
    );
    out center tags;
  `.trim()

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: `data=${encodeURIComponent(query)}`,
  })
  if (!res.ok) throw new Error("Overpass lỗi (không query được trong bán kính)")

  const json = await res.json()
  const elements = (json?.elements ?? []) as any[]

  const items: OSMShop[] = elements
    .map((el) => {
      const type = el.type as "node" | "way" | "relation"
      const tags = (el.tags ?? {}) as Record<string, string>
      const name = tags.name || tags.brand || "Không tên"
      const lat = typeof el.lat === "number" ? el.lat : el.center?.lat
      const lon = typeof el.lon === "number" ? el.lon : el.center?.lon
      if (typeof lat !== "number" || typeof lon !== "number") return null

      return {
        id: String(el.id),
        type,
        name,
        lat,
        lon,
        brand: tags.brand,
        address: normalizeAddressLine(tags),
        tags,
      } as OSMShop
    })
    .filter((x): x is OSMShop => x !== null)

  cacheSet(key, items)
  return items
}

/* ================= Storage ================= */

const KEY = "customer_checkout_context_v2"

type DeliveryMethodId = "DELIVERY" | "PICKUP"

type Supermarket = {
  supermarketId: string
  name: string
  address: string
  latitude: number
  longitude: number
  distanceKm?: number
}

type CustomerContext = {
  deliveryMethodId?: DeliveryMethodId

  // delivery home
  locationSource?: "gps" | "manual"
  lat?: number
  lng?: number
  addressText?: string

  // pickup point
  pickupPointId?: string
  pickupPointName?: string
  pickupPointAddress?: string
  pickupLat?: number
  pickupLng?: number

  // system internal result (NOT show to customer)
  supermarketsWithin5Km?: Supermarket[]
}

const ctxStorage = {
  get(): CustomerContext {
    const raw = localStorage.getItem(KEY)
    try {
      return raw ? (JSON.parse(raw) as CustomerContext) : {}
    } catch {
      return {}
    }
  },
  set(next: CustomerContext) {
    localStorage.setItem(KEY, JSON.stringify(next))
  },
  clear() {
    localStorage.removeItem(KEY)
  },
  isReady(ctx?: CustomerContext) {
    const c = ctx ?? this.get()
    const okMethod = !!c.deliveryMethodId

    const okDeliveryLoc =
      c.deliveryMethodId !== "DELIVERY" ||
      (typeof c.lat === "number" && typeof c.lng === "number" && !!c.addressText)

    const okPickupLoc =
      c.deliveryMethodId !== "PICKUP" ||
      (!!c.pickupPointId &&
        !!c.pickupPointName &&
        typeof c.pickupLat === "number" &&
        typeof c.pickupLng === "number")

    return okMethod && okDeliveryLoc && okPickupLoc
  },
}

/* ================= Cart Storage (mock) ================= */

const CART_KEY = "customer_cart_v1"

type CartItem = {
  productId: string
  supermarketId: string
  name: string
  price: number
  qty: number
}

const cartStorage = {
  get(): CartItem[] {
    const raw = localStorage.getItem(CART_KEY)
    try {
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  },
  set(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  },
  clear() {
    localStorage.removeItem(CART_KEY)
  },
  add(item: Omit<CartItem, "qty">, qty = 1) {
    const items = this.get()
    const found = items.find((x) => x.productId === item.productId)
    if (found) found.qty += qty
    else items.push({ ...item, qty })
    this.set(items)
    return items
  },
  getTotalQty() {
    return this.get().reduce((sum, it) => sum + it.qty, 0)
  },
}

/* ================= BE Mock fallback (optional) ================= */

// fallback nếu OSM rỗng / fail
const mockSupermarketsMaster: Supermarket[] = [
  {
    supermarketId: "SM_001",
    name: "FreshMart Bến Thành",
    address: "Bến Thành, TP.HCM",
    latitude: 10.7722,
    longitude: 106.6983,
  },
  {
    supermarketId: "SM_002",
    name: "GreenCorner Võ Thị Sáu",
    address: "Võ Thị Sáu, TP.HCM",
    latitude: 10.7842,
    longitude: 106.6897,
  },
  {
    supermarketId: "SM_003",
    name: "DailyMart Bình Thạnh",
    address: "Bình Thạnh, TP.HCM",
    latitude: 10.8019,
    longitude: 106.7092,
  },
]

async function mockBE_FindSupermarketsWithin5Km(input: {
  lat: number
  lng: number
  addressText: string
}) {
  await new Promise((r) => setTimeout(r, 250))
  const center = { lat: input.lat, lng: input.lng }
  const items = mockSupermarketsMaster
    .map((s) => ({
      ...s,
      distanceKm: haversineKm(center, { lat: s.latitude, lng: s.longitude }),
    }))
    .filter((s) => (s.distanceKm ?? 999) <= 5)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))

  return { success: true, message: "OK", data: { radiusKm: 5, items } }
}

/* ================= Mock products by supermarket ================= */

type MockProduct = {
  productId: string
  supermarketId: string
  name: string
  subtitle: string
  originalPrice: number
  price: number
  discountLabel: string
  timeLeft: string
  bestBeforeTitle: string
  bestBeforeValue: string
  imageVariant?: "milk" | "bread" | "beef" | "avocado"
}

const makeProductsForSupermarket = (sm: Supermarket): MockProduct[] => {
  // seed theo id để mỗi siêu thị ra list khác nhau
  const seed = sm.supermarketId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const bump = (n: number) => ((seed % 7) + 1) * n

  return [
    {
      productId: `${sm.supermarketId}_P_MILK`,
      supermarketId: sm.supermarketId,
      name: "Sữa tươi tiệt trùng 1L",
      subtitle: `Tại ${sm.name}`,
      originalPrice: 42000 + bump(200),
      price: 19000 + bump(100),
      discountLabel: "-55%",
      timeLeft: "Còn 01:20:10",
      bestBeforeTitle: "Sử dụng tốt nhất trước",
      bestBeforeValue: "Ngày mai, 10:00",
      imageVariant: "milk",
    },
    {
      productId: `${sm.supermarketId}_P_BREAD`,
      supermarketId: sm.supermarketId,
      name: "Bánh mì sandwich 750g",
      subtitle: `Tại ${sm.name}`,
      originalPrice: 60000 + bump(150),
      price: 21000 + bump(80),
      discountLabel: "-65%",
      timeLeft: "Còn 00:55:40",
      bestBeforeTitle: "Sử dụng tốt nhất trước",
      bestBeforeValue: "Tối nay, 20:00",
      imageVariant: "bread",
    },
    {
      productId: `${sm.supermarketId}_P_BEEF`,
      supermarketId: sm.supermarketId,
      name: "Thịt bò 450g",
      subtitle: `Tại ${sm.name}`,
      originalPrice: 120000 + bump(500),
      price: 69000 + bump(250),
      discountLabel: "-40%",
      timeLeft: "Còn 03:10:05",
      bestBeforeTitle: "Sử dụng tốt nhất trước",
      bestBeforeValue: "Ngày mai, 18:00",
      imageVariant: "beef",
    },
    {
      productId: `${sm.supermarketId}_P_AVO`,
      supermarketId: sm.supermarketId,
      name: "Bơ sáp (3 quả)",
      subtitle: `Tại ${sm.name}`,
      originalPrice: 55000 + bump(120),
      price: 32000 + bump(70),
      discountLabel: "-42%",
      timeLeft: "Còn 05:05:30",
      bestBeforeTitle: "Sử dụng tốt nhất trước",
      bestBeforeValue: "Hôm nay, 18:00",
      imageVariant: "avocado",
    },
  ]
}

const buildMockProductsFromContext = (ctx: CustomerContext): MockProduct[] => {
  const sms = ctx.supermarketsWithin5Km ?? []
  if (!sms.length) return []
  // gom sản phẩm từ tất cả siêu thị trong 5km
  return sms.flatMap(makeProductsForSupermarket)
}

/* ================= Pickup points (mock TP.HCM) ================= */

type PickupPoint = {
  pickupPointId: string
  name: string
  address: string // địa chỉ đầy đủ
  lat: number
  lng: number
}

// phủ đều TP.HCM để “gần như ở đâu cũng có 1 điểm <= ~10km”
const HCMC_PICKUP_POINTS: PickupPoint[] = [
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
    address: "135 Hai Bà Trưng, Phường 6, Quận Bình Thạnh, TP.HCM",
    lat: 10.8019,
    lng: 106.7092,
  },
  {
    pickupPointId: "PP_TD_TDM",
    name: "Điểm tập kết Thủ Đức",
    address: "10 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM",
    lat: 10.8497,
    lng: 106.7716,
  },
  {
    pickupPointId: "PP_Q7_PMH",
    name: "Điểm tập kết Phú Mỹ Hưng",
    address: "105 Tôn Dật Tiên, Phường Tân Phú, Quận 7, TP.HCM",
    lat: 10.7296,
    lng: 106.7217,
  },
  {
    pickupPointId: "PP_Q8",
    name: "Điểm tập kết Quận 8",
    address: "240 Phạm Thế Hiển, Phường 3, Quận 8, TP.HCM",
    lat: 10.7412,
    lng: 106.6729,
  },
  {
    pickupPointId: "PP_BC",
    name: "Điểm tập kết Bình Chánh",
    address: "1 Nguyễn Hữu Trí, Thị trấn Tân Túc, H. Bình Chánh, TP.HCM",
    lat: 10.7121,
    lng: 106.5765,
  },
  {
    pickupPointId: "PP_TB",
    name: "Điểm tập kết Tân Bình",
    address: "15 Cộng Hòa, Phường 4, Quận Tân Bình, TP.HCM",
    lat: 10.8014,
    lng: 106.6527,
  },
  {
    pickupPointId: "PP_TP",
    name: "Điểm tập kết Tân Phú",
    address: "300 Lũy Bán Bích, Phường Hòa Thạnh, Quận Tân Phú, TP.HCM",
    lat: 10.7902,
    lng: 106.6273,
  },
  {
    pickupPointId: "PP_GV",
    name: "Điểm tập kết Gò Vấp",
    address: "1 Quang Trung, Phường 10, Quận Gò Vấp, TP.HCM",
    lat: 10.8387,
    lng: 106.6657,
  },
  {
    pickupPointId: "PP_HM",
    name: "Điểm tập kết Hóc Môn",
    address: "8/1 Lê Văn Khương, Xã Đông Thạnh, H. Hóc Môn, TP.HCM",
    lat: 10.8866,
    lng: 106.5927,
  },
  {
    pickupPointId: "PP_NB",
    name: "Điểm tập kết Nhà Bè",
    address: "12 Nguyễn Bình, Xã Phú Xuân, H. Nhà Bè, TP.HCM",
    lat: 10.6953,
    lng: 106.7442,
  },
]

/* ================= Wizard Modal ================= */

type WizardStep = 1 | 2 | 3

const surfaceCard =
  "backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-6 border border-white/40"
const softCard = "bg-white shadow-lg rounded-2xl border border-gray-100"

const modalShell =
  "w-full rounded-3xl bg-white/90 text-slate-800 shadow-2xl ring-1 ring-sky-100 backdrop-blur-xl"

const modalHeaderPill =
  "inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700 ring-1 ring-sky-100"

const stepChipBase =
  "rounded-2xl px-3 py-2 ring-1 transition"

const stepChipActive =
  "bg-sky-100/70 ring-sky-200 text-sky-900"

const stepChipDone =
  "bg-emerald-50 ring-emerald-200 text-emerald-900"

const stepChipIdle =
  "bg-white/60 ring-slate-200 text-slate-600"

const primaryBtn =
  "bg-gradient-to-r from-sky-400 to-cyan-400 text-white font-semibold rounded-xl shadow-md transition-all duration-300 active:scale-95 hover:brightness-105"

const secondaryBtn =
  "border border-sky-200 text-sky-700 bg-white/70 font-medium rounded-xl hover:bg-sky-50 transition disabled:opacity-50"

const card =
  "rounded-3xl bg-white/70 ring-1 ring-sky-100 shadow-sm"

const subtleCard =
  "rounded-2xl bg-sky-50/60 ring-1 ring-sky-100"

const mutedText = "text-slate-500"

function GateWizardModal({
  open,
  onDone,
}: {
  open: boolean
  onDone: () => void
}) {
  const initial = ctxStorage.get()

  const [step, setStep] = useState<WizardStep>(1)

  // method
  const [deliveryMethodId, setDeliveryMethodId] = useState<DeliveryMethodId | "">(
    initial.deliveryMethodId ?? ""
  )

  // delivery-home location states
  const [locationSource, setLocationSource] = useState<"gps" | "manual">(
    initial.locationSource ?? "gps"
  )
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string>("")
  const [lat, setLat] = useState<number | "">(typeof initial.lat === "number" ? initial.lat : "")
  const [lng, setLng] = useState<number | "">(typeof initial.lng === "number" ? initial.lng : "")
  const [addressText, setAddressText] = useState(initial.addressText ?? "")
  const [showManualEdit, setShowManualEdit] = useState(false)
  const [pendingWardName, setPendingWardName] = useState<string>("")

  // manual address (v2 wards only)
  const [wards, setWards] = useState<ProvinceV2Ward[]>([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrError, setAddrError] = useState("")
  const [wardCode, setWardCode] = useState<number | "">("")
  const [streetLine, setStreetLine] = useState("12 Nguyễn Trãi")

  // pickup
  const [pickupPointId, setPickupPointId] = useState(initial.pickupPointId ?? "")
  const [pickupSortCenter, setPickupSortCenter] = useState<LatLng | null>(null) // optional GPS to sort

  // fetching supermarkets (system internal)
  const [marketsLoading, setMarketsLoading] = useState(false)
  const [marketsError, setMarketsError] = useState("")

  // align wizard step on open
  useEffect(() => {
    if (!open) return
    const ctx = ctxStorage.get()
    if (!ctx.deliveryMethodId) setStep(1)
    else setStep(2)
  }, [open])

  // load wards v2 (only when delivery chosen & open)
  useEffect(() => {
    if (!open) return
      ; (async () => {
        try {
          setAddrError("")
          setAddrLoading(true)
          const ws = await fetchHcmWardsCached()
          setWards(ws)
          if (ws.length > 0) setWardCode((prev) => (prev === "" ? ws[0].code : prev))
        } catch (e: any) {
          setAddrError(e?.message ?? "Lỗi tải dữ liệu phường/xã")
        } finally {
          setAddrLoading(false)
        }
      })()
  }, [open])

  // apply ward khi wards vừa load
  useEffect(() => {
    if (!pendingWardName) return
    if (!wards.length) return

    const key = normalizeWardName(pendingWardName)
    const found = wards.find((w) => normalizeWardName(w.name) === key)
      ?? wards.find((w) => normalizeWardName(w.name).includes(key))
      ?? wards.find((w) => key.includes(normalizeWardName(w.name)))

    if (found) {
      setWardCode(found.code)
      setPendingWardName("")
    }
  }, [pendingWardName, wards])

  const buildManualAddressText = () => {
    const wardName = wards.find((w) => w.code === wardCode)?.name ?? ""
    return `${streetLine}, ${wardName}, ${HCMC_CITY_LABEL}`
  }

  const requestGeo = () => {
    setGeoError("")
    if (!navigator.geolocation) {
      setGeoError("Trình duyệt không hỗ trợ định vị.")
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude
        const ln = pos.coords.longitude
        setLat(la)
        setLng(ln)
        setLocationSource("gps")
        setGeoLoading(false)

          ; (async () => {
            const rev = await nominatimReverseAddress(la, ln)

            // 1) addressText
            if (rev?.display_name) {
              setAddressText(rev.display_name)
            } else {
              setAddressText(`${la.toFixed(6)}, ${ln.toFixed(6)} - ${HCMC_CITY_LABEL}`)
            }

            // 2) fill streetLine (số nhà + đường)
            const hn = rev?.address?.house_number
            const road = rev?.address?.road
            const composedStreet = [hn, road].filter(Boolean).join(" ")
            if (composedStreet) setStreetLine(composedStreet)

            // 3) cố gắng match phường/xã
            const wardGuess =
              rev?.address?.suburb ||
              rev?.address?.neighbourhood ||
              rev?.address?.quarter ||
              ""

            if (wardGuess) {
              // nếu wards đã có thì match ngay, chưa có thì lưu pending
              if (wards.length) {
                const key = normalizeWardName(wardGuess)
                const found =
                  wards.find((w) => normalizeWardName(w.name) === key) ||
                  wards.find((w) => normalizeWardName(w.name).includes(key)) ||
                  wards.find((w) => key.includes(normalizeWardName(w.name)))

                if (found) setWardCode(found.code)
                else setPendingWardName(wardGuess)
              } else {
                setPendingWardName(wardGuess)
              }
            }

            // 4) bật phần chỉnh sửa để user thấy đã được “đổ” sẵn
            setShowManualEdit(true)
          })()
      },
      () => {
        setGeoLoading(false)
        setGeoError("Bạn không cho phép truy cập vị trí. Bạn có thể nhập địa chỉ thủ công.")
        setLocationSource("manual")
      },
      { enableHighAccuracy: true, timeout: 9000 }
    )
  }

  // optional: sort pickup points by user gps (not mandatory)
  const requestGeoForPickupSort = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupSortCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        // ignore
      },
      { enableHighAccuracy: true, timeout: 9000 }
    )
  }

  const pickupPointsSorted = useMemo(() => {
    const base = [...HCMC_PICKUP_POINTS]
    if (!pickupSortCenter) return base
    return base
      .map((p) => ({
        ...p,
        _d: haversineKm(pickupSortCenter, { lat: p.lat, lng: p.lng }),
      }))
      .sort((a: any, b: any) => a._d - b._d)
      .map(({ _d, ...rest }: any) => rest)
  }, [pickupSortCenter])

  const selectedPickupPoint = useMemo(
    () => HCMC_PICKUP_POINTS.find((p) => p.pickupPointId === pickupPointId),
    [pickupPointId]
  )

  const proceedMethod = () => {
    if (!deliveryMethodId) return

    // reset location-specific fields when switching
    const next: CustomerContext = {
      ...ctxStorage.get(),
      deliveryMethodId: deliveryMethodId as DeliveryMethodId,

      // reset delivery fields
      locationSource: deliveryMethodId === "DELIVERY" ? (locationSource ?? "gps") : undefined,
      lat: deliveryMethodId === "DELIVERY" ? (typeof lat === "number" ? lat : undefined) : undefined,
      lng: deliveryMethodId === "DELIVERY" ? (typeof lng === "number" ? lng : undefined) : undefined,
      addressText: deliveryMethodId === "DELIVERY" ? addressText : undefined,

      // reset pickup fields
      pickupPointId: deliveryMethodId === "PICKUP" ? pickupPointId : "",
      pickupPointName: deliveryMethodId === "PICKUP" ? selectedPickupPoint?.name ?? "" : "",
      pickupPointAddress: deliveryMethodId === "PICKUP" ? selectedPickupPoint?.address ?? "" : "",
      pickupLat: deliveryMethodId === "PICKUP" ? selectedPickupPoint?.lat : undefined,
      pickupLng: deliveryMethodId === "PICKUP" ? selectedPickupPoint?.lng : undefined,

      supermarketsWithin5Km: [],
    }
    ctxStorage.set(next)
    setStep(2)
  }

  const fetchSupermarkets5kmAndDone = async (center: LatLng, addressLabel: string) => {
    setMarketsError("")
    setMarketsLoading(true)
    try {
      let items: Supermarket[] = []

      try {
        const osmList = await overpassFetchSupermarketsAround(center, 5000)
        items = osmList
          .map((s) => ({
            supermarketId: `OSM_${s.type}_${s.id}`,
            name: s.name,
            address: s.address || addressLabel,
            latitude: s.lat,
            longitude: s.lon,
            distanceKm: haversineKm(center, { lat: s.lat, lng: s.lon }),
          }))
          .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
          .slice(0, 50)
      } catch {
        // ignore -> fallback mock
      }

      if (items.length === 0) {
        const res = await mockBE_FindSupermarketsWithin5Km({
          lat: center.lat,
          lng: center.lng,
          addressText: addressLabel,
        })
        items = res.data.items
      }

      const curr = ctxStorage.get()
      ctxStorage.set({
        ...curr,
        supermarketsWithin5Km: items,
      })

      setStep(3)
      onDone()
    } catch (e: any) {
      setMarketsError(e?.message ?? "Không lấy được danh sách siêu thị trong 5km.")
    } finally {
      setMarketsLoading(false)
    }
  }

  const proceedLocationOrPickup = async () => {
    const method = deliveryMethodId || ctxStorage.get().deliveryMethodId
    if (!method) return

    if (method === "DELIVERY") {
      setGeoError("")
      let finalLat: number
      let finalLng: number
      let finalAddress: string
      let source: "gps" | "manual" = locationSource

      if (locationSource === "gps") {
        if (typeof lat !== "number" || typeof lng !== "number") {
          setGeoError("Chưa có vị trí GPS. Hãy bấm “Dùng vị trí hiện tại” hoặc chuyển qua nhập tay.")
          return
        }
        finalLat = lat
        finalLng = lng
        finalAddress = addressText || `${HCMC_CITY_LABEL} (GPS)`
      } else {
        const addr = buildManualAddressText()
        const geo = await nominatimGeocodeLatLng(addr)
        if (!geo) {
          setGeoError("Không geocode được địa chỉ. Thử nhập rõ hơn (số nhà + tên đường).")
          return
        }
        finalLat = geo.lat
        finalLng = geo.lng
        finalAddress = addr
        source = "manual"
        setLat(finalLat)
        setLng(finalLng)
        setAddressText(finalAddress)
      }

      ctxStorage.set({
        ...ctxStorage.get(),
        deliveryMethodId: "DELIVERY",
        locationSource: source,
        lat: finalLat,
        lng: finalLng,
        addressText: finalAddress,

        // clear pickup
        pickupPointId: "",
        pickupPointName: "",
        pickupPointAddress: "",
        pickupLat: undefined,
        pickupLng: undefined,
      })

      await fetchSupermarkets5kmAndDone({ lat: finalLat, lng: finalLng }, finalAddress)
      return
    }

    // PICKUP
    if (!pickupPointId || !selectedPickupPoint) return

    ctxStorage.set({
      ...ctxStorage.get(),
      deliveryMethodId: "PICKUP",

      pickupPointId,
      pickupPointName: selectedPickupPoint.name,
      pickupPointAddress: selectedPickupPoint.address,
      pickupLat: selectedPickupPoint.lat,
      pickupLng: selectedPickupPoint.lng,

      // clear delivery-home
      locationSource: undefined,
      lat: undefined,
      lng: undefined,
      addressText: undefined,
    })

    await fetchSupermarkets5kmAndDone(
      { lat: selectedPickupPoint.lat, lng: selectedPickupPoint.lng },
      selectedPickupPoint.address
    )
  }

  const allowClose = false
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-900/35" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-6">
        <div className={cn(modalShell, "max-h-[88vh] overflow-hidden")}>
          {/* Header fixed within modal */}
          <div className="border-b border-sky-100 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={modalHeaderPill}>
                  <MapPin size={14} />
                  Hệ thống chỉ hoạt động trong khu vực {HCMC_CITY_LABEL}
                </div>

                <h2 className="mt-3 text-xl font-semibold text-slate-900">
                  Vui lòng chọn phương thức giao hàng và vị trí mong muốn
                </h2>
              </div>

              {allowClose ? (
                <button className={cn(secondaryBtn, "px-3 py-2 text-xs")}>Đóng</button>
              ) : null}
            </div>

            {/* Stepper */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
              {[
                { s: 1, t: "Phương thức" },
                { s: 2, t: "Vị trí" },
                { s: 3, t: "Hoàn thành" },
              ].map((x) => {
                const active = step === (x.s as WizardStep)
                const done = step > (x.s as WizardStep)
                return (
                  <div
                    key={x.s}
                    className={cn(
                      stepChipBase,
                      active ? stepChipActive : done ? stepChipDone : stepChipIdle
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{x.t}</span>
                      {done ? <Check size={14} className="text-emerald-600" /> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Body scrollable */}
          <div className="max-h-[calc(88vh-160px)] overflow-y-auto px-6 py-5">
            {/* STEP 1: METHOD */}
            {step === 1 && (
              <div className={cn(card, "p-5")}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">
                    Chọn phương thức giao hàng
                  </div>
                  <Truck size={18} className="text-sky-600" />
                </div>

                <div className="mt-4 grid gap-2">
                  {[
                    {
                      id: "DELIVERY" as const,
                      title: "Giao tận nhà",
                      desc: "Cần cập nhật vị trí chính xác",
                      icon: <Truck size={18} className="text-sky-600" />,
                    },
                    {
                      id: "PICKUP" as const,
                      title: "Tự lấy tại điểm tập kết",
                      desc: "Chọn 1 điểm tập kết có sẵn mà bạn mong muốn",
                      icon: <PackageCheck size={18} className="text-sky-600" />,
                    },
                  ].map((m) => {
                    const active = deliveryMethodId === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setDeliveryMethodId(m.id)
                          if (m.id !== "PICKUP") setPickupPointId("")
                        }}
                        className={cn(
                          "rounded-2xl p-4 text-left ring-1 transition",
                          active
                            ? "bg-sky-100/60 ring-sky-200"
                            : "bg-white/60 ring-slate-200 hover:bg-sky-50 hover:ring-sky-200"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{m.icon}</div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">{m.title}</div>
                            <div className={cn("mt-1 text-xs", mutedText)}>{m.desc}</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className={cn(subtleCard, "mt-4 p-4 text-sm")}>
                  <div className="font-semibold text-slate-900">Lưu ý</div>
                  <div className={cn("mt-1 text-xs", mutedText)}>
                    Sau khi bạn chọn xong vị trí, hệ thống sẽ đề xuất các sản phẩm của các siêu thị trong bán kính 5km để phù hợp với vị trí của bạn.
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={proceedMethod}
                    disabled={!deliveryMethodId}
                    className={cn(
                      "px-5 py-2 inline-flex items-center gap-2 rounded-xl font-semibold transition",
                      deliveryMethodId ? primaryBtn : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    Tiếp tục
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="grid gap-4 lg:grid-cols-2">
                {/* LEFT: summary */}
                <div className={cn(card, "p-5")}>
                  <div className="text-sm font-semibold text-slate-900">Tóm tắt lựa chọn</div>

                  <div className={cn("mt-3 text-xs", mutedText)}>Phương thức</div>
                  <div className="mt-1 text-sm text-slate-900">
                    {deliveryMethodId === "DELIVERY"
                      ? "Giao tận nhà"
                      : deliveryMethodId === "PICKUP"
                        ? "Tự lấy tại điểm tập kết"
                        : "—"}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={cn(secondaryBtn, "mt-4 inline-flex items-center gap-2 px-3 py-2 text-xs")}
                  >
                    <Pencil size={14} />
                    Đổi phương thức
                  </button>
                </div>

                {/* RIGHT: Delivery or Pickup */}
                {deliveryMethodId === "DELIVERY" ? (
                  <div className={cn(card, "p-5")}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">Xác định vị trí giao tận nhà</div>
                      <MapPin size={18} className="text-sky-600" />
                    </div>

                    {/* GPS */}
                    <div className={cn(subtleCard, "mt-4 p-4")}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">Dùng vị trí hiện tại</div>
                        <LocateFixed size={18} className="text-sky-600" />
                      </div>

                      <button
                        type="button"
                        onClick={requestGeo}
                        disabled={geoLoading}
                        className={cn(
                          "mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl ring-1",
                          "bg-white/70 ring-sky-200 hover:bg-sky-50",
                          geoLoading && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <Navigation size={16} className="text-sky-700" />
                        {geoLoading ? "Đang định vị..." : "Dùng vị trí hiện tại"}
                      </button>

                      <div className={cn("mt-3 text-xs", mutedText)}>
                        {typeof lat === "number" && typeof lng === "number"
                          ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                          : "Chưa có tọa độ"}
                      </div>
                      <div className={cn("mt-1 text-xs", mutedText)}>
                        {addressText ? addressText : "Chưa có địa chỉ"}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowManualEdit((v) => !v)}
                        className={cn(secondaryBtn, "mt-3 inline-flex items-center gap-2 px-3 py-2 text-xs")}
                      >
                        <Pencil size={14} />
                        {showManualEdit ? "Ẩn chỉnh sửa" : "Chỉnh sửa địa chỉ"}
                      </button>

                      {geoError ? <div className="mt-2 text-xs text-red-500">{geoError}</div> : null}
                    </div>

                    {/* Manual */}
                    {showManualEdit && (
                      <div className={cn(subtleCard, "mt-4 p-4")}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-900">Sửa / nhập địa chỉ thủ công</div>
                          <Pencil size={18} className="text-sky-600" />
                        </div>

                        <div className="mt-3 grid gap-3">
                          <div>
                            <div className={cn("text-xs", mutedText)}>Phường/Xã (TP.HCM)</div>
                            {addrLoading ? (
                              <div className="mt-1 rounded-xl bg-white/60 px-3 py-2 text-sm ring-1 ring-sky-100">
                                Đang tải danh sách...
                              </div>
                            ) : (
                              <select
                                value={wardCode}
                                onChange={(e) => {
                                  setLocationSource("manual")
                                  setWardCode(Number(e.target.value))
                                }}
                                className="mt-1 w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none ring-1 ring-sky-100 focus:ring-sky-200"
                              >
                                {wards.map((w) => (
                                  <option key={w.code} value={w.code}>
                                    {w.name}
                                  </option>
                                ))}
                              </select>
                            )}
                            {addrError ? <div className="mt-2 text-xs text-red-500">{addrError}</div> : null}
                          </div>

                          <div>
                            <div className={cn("text-xs", mutedText)}>Số nhà + đường</div>
                            <input
                              value={streetLine}
                              onChange={(e) => {
                                setLocationSource("manual")
                                setStreetLine(e.target.value)
                              }}
                              placeholder="VD: 12 Nguyễn Trãi"
                              className="mt-1 w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none ring-1 ring-sky-100 focus:ring-sky-200"
                            />
                          </div>

                          <div className="rounded-xl bg-white/70 p-3 text-xs ring-1 ring-sky-100">
                            <div className={mutedText}>Preview</div>
                            <div className="mt-1 text-slate-900">{buildManualAddressText()}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={proceedLocationOrPickup}
                        disabled={marketsLoading}
                        className={cn(primaryBtn, "px-5 py-2 inline-flex items-center gap-2")}
                      >
                        {marketsLoading ? "Đang tìm siêu thị trong bán kính 5-10km..." : "Hoàn tất"}
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {marketsError ? <div className="mt-3 text-xs text-red-500">{marketsError}</div> : null}
                  </div>
                ) : (
                  <div className={cn(card, "p-5")}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">Chọn điểm tập kết (TP.HCM)</div>
                      <MapPin size={18} className="text-sky-600" />
                    </div>

                    <div className={cn("mt-2 text-xs", mutedText)}>
                      Bạn có thể bật vị trí để ưu tiên sắp xếp gần bạn (không bắt buộc).
                    </div>

                    <button
                      type="button"
                      onClick={requestGeoForPickupSort}
                      className={cn(secondaryBtn, "mt-3 inline-flex items-center gap-2 px-3 py-2 text-xs")}
                    >
                      <LocateFixed size={14} />
                      Sắp xếp gần tôi
                    </button>

                    {/* LIST: cho scroll nội bộ */}
                    <div className="mt-4 max-h-[360px] overflow-y-auto rounded-2xl ring-1 ring-sky-100 bg-white/40 p-2">
                      <div className="grid gap-2">
                        {pickupPointsSorted.map((p) => {
                          const active = p.pickupPointId === pickupPointId
                          return (
                            <button
                              key={p.pickupPointId}
                              type="button"
                              onClick={() => setPickupPointId(p.pickupPointId)}
                              className={cn(
                                "rounded-2xl p-4 text-left ring-1 transition-colors",
                                active
                                  ? "bg-sky-100/60 ring-sky-200"
                                  : "bg-white/70 ring-slate-200 hover:bg-sky-50 hover:ring-sky-200"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900">{p.name}</div>

                                  {/* địa chỉ rõ ràng */}
                                  <div className={cn("mt-1 text-xs", mutedText)}>{p.address}</div>

                                  {/* tọa độ */}
                                  <div className={cn("mt-1 text-[11px]", mutedText)}>
                                    {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
                                  </div>
                                </div>

                                {/* nút mở Google Maps */}
                                <a
                                  href={googleMapsUrl(p.lat, p.lng)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={cn(
                                    "shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold",
                                    "bg-white ring-1 ring-sky-200 text-sky-700 hover:bg-sky-50"
                                  )}
                                  title="Mở trên Google Maps"
                                >
                                  <MapPin size={14} className="text-sky-700" />
                                  Mở bản đồ
                                </a>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={proceedLocationOrPickup}
                        disabled={!pickupPointId || marketsLoading}
                        className={cn(
                          "px-5 py-2 inline-flex items-center gap-2 rounded-xl font-semibold transition",
                          pickupPointId && !marketsLoading
                            ? primaryBtn
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {marketsLoading ? "Đang tìm siêu thị 5km..." : "Hoàn tất"}
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {marketsError ? <div className="mt-3 text-xs text-red-500">{marketsError}</div> : null}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className={cn(card, "p-6 text-center")}>
                <div className="text-lg font-semibold text-slate-900">Hoàn thành</div>
                <p className={cn("mt-2 text-sm", mutedText)}>
                  Thiết lập đã được lưu. Bạn có thể vào trang chủ để lựa chọn sản phẩm.
                </p>
                <div className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Sẵn sàng mua sắm ✨
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= ORIGINAL HOME UI (yours) ================= */

type StatCard = {
  icon: "meals" | "co2" | "deals"
  title: string
  value: string
  delta: string
}

type CategoryItem = {
  icon: React.ReactNode
  label: string
}

type FlashDeal = {
  id: string
  name: string
  subtitle: string
  originalPrice: string
  price: string
  discountLabel: string
  timeLeft: string
  bestBeforeTitle: string
  bestBeforeValue: string
  imageVariant?: "milk" | "bread" | "beef" | "avocado"
}

const imageBg = (variant?: FlashDeal["imageVariant"]) => {
  switch (variant) {
    case "milk":
      return "bg-[radial-gradient(circle_at_30%_20%,rgba(52,211,153,0.35),transparent_45%),linear-gradient(135deg,#ffffff,#ecfdf5)]"
    case "bread":
      return "bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.30),transparent_45%),linear-gradient(135deg,#ffffff,#fff7ed)]"
    case "beef":
      return "bg-[radial-gradient(circle_at_30%_20%,rgba(248,113,113,0.25),transparent_45%),linear-gradient(135deg,#ffffff,#fff1f2)]"
    case "avocado":
      return "bg-[radial-gradient(circle_at_30%_20%,rgba(163,230,53,0.30),transparent_45%),linear-gradient(135deg,#ffffff,#f0fdf4)]"
    default:
      return "bg-[radial-gradient(circle_at_30%_20%,rgba(52,211,153,0.22),transparent_45%),linear-gradient(135deg,#ffffff,#f6f8f6)]"
  }
}

const StatIcon = ({ kind }: { kind: StatCard["icon"] }) => {
  const common = "text-emerald-600"
  if (kind === "meals") return <Utensils size={26} className={common} />
  if (kind === "co2") return <Leaf size={26} className={common} />
  return <Tag size={26} className={common} />
}

const ProductCard: React.FC<{ deal: MockProduct; onAdd?: (p: MockProduct) => void }> = ({
  deal,
  onAdd,
}) => {
  return (
    <div className={cn(softCard, "overflow-hidden hover:shadow-xl transition-shadow")}>
      <div className={cn("relative h-[192px] w-full", imageBg(deal.imageVariant))}>
        {/* discount badge */}
        <div className="absolute left-3 top-3 z-20 rounded-md bg-red-500 px-2 py-1 shadow-sm">
          <span className="text-[10px] font-bold text-white">{deal.discountLabel}</span>
        </div>

        {/* ✅ countdown badge: đẩy lên trên ảnh */}
        <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 shadow-sm border border-gray-100">
          <AlarmClock size={14} className="text-emerald-500" />
          <span className="text-[12px] font-semibold text-gray-800">{deal.timeLeft}</span>
        </div>

        {/* ✅ image layer: nằm dưới + không che badge */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <img
            src={`https://picsum.photos/seed/${encodeURIComponent(deal.productId)}/500/500`}
            alt={deal.name}
            className="h-[160px] w-[160px] rounded-2xl object-cover shadow-sm ring-1 ring-black/5"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[18px] font-bold text-gray-800">{deal.name}</div>
            <div className="mt-0.5 text-[12px] text-gray-500">{deal.subtitle}</div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[12px] text-red-500">{deal.originalPrice}</div>
            <div className="text-[20px] font-bold text-gray-800">{deal.price}</div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <div className="text-[10px] font-semibold text-gray-500">{deal.bestBeforeTitle}</div>
            <div
              className={cn(
                "text-[14px] font-semibold",
                deal.bestBeforeValue.includes("Ngày mai") || deal.bestBeforeValue.includes("Tối nay")
                  ? "text-red-500"
                  : "text-gray-800"
              )}
            >
              {deal.bestBeforeValue}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAdd?.(deal)}
            className={cn("h-10 w-10 grid place-items-center", primaryBtn)}
            aria-label="Thêm vào giỏ"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

const Home: React.FC = () => {
  const [cartCount, setCartCount] = useState(() => cartStorage.getTotalQty())
  const [activeCategory, setActiveCategory] = useState("Tất Cả Giảm Giá")
  const [gateOpen, setGateOpen] = useState(false)

  useEffect(() => {
    setGateOpen(!ctxStorage.isReady())
  }, [])

  useEffect(() => {
    setCartCount(cartStorage.getTotalQty())
  }, [gateOpen])

  const ctx = useMemo(() => ctxStorage.get(), [gateOpen])

  const stats: StatCard[] = useMemo(
    () => [
      { icon: "meals", title: "Bữa Ăn Đã Cứu Hôm Nay", value: "1,240", delta: "+12%" },
      { icon: "co2", title: "Lượng CO2 Giảm Thiểu", value: "350kg", delta: "+5%" },
      { icon: "deals", title: "Ưu Đãi Đang Chạy", value: "85", delta: "+20%" },
    ],
    []
  )

  const categories: CategoryItem[] = useMemo(
    () => [
      { label: "Tất Cả Giảm Giá", icon: <Tag size={18} className="text-emerald-600" /> },
      { label: "Sữa & Trứng", icon: <Leaf size={18} className="text-gray-600" /> },
      { label: "Bánh Mì", icon: <Leaf size={18} className="text-gray-600" /> },
      { label: "Nông Sản", icon: <Leaf size={18} className="text-gray-600" /> },
      { label: "Thịt & Gia Cầm", icon: <Leaf size={18} className="text-gray-600" /> },
      { label: "Gia Vị & Đồ Khô", icon: <Leaf size={18} className="text-gray-600" /> },
    ],
    []
  )

  const deals: MockProduct[] = useMemo(() => {
    const c = ctxStorage.get()
    const items = buildMockProductsFromContext(c)

    if (items.length === 0) return []

    return items
  }, [gateOpen])

  const filteredDeals = useMemo(() => {
    if (activeCategory === "Tất Cả Giảm Giá") return deals
    if (activeCategory === "Bánh Mì") return deals.filter((d) => d.name.toLowerCase().includes("bánh"))
    if (activeCategory === "Sữa & Trứng") return deals.filter((d) => d.name.toLowerCase().includes("sữa"))
    if (activeCategory === "Nông Sản") return deals.filter((d) => d.subtitle.toLowerCase().includes("farm"))
    if (activeCategory === "Thịt & Gia Cầm") return deals.filter((d) => d.name.toLowerCase().includes("thịt"))
    return deals
  }, [activeCategory, deals])

  const handleAdd = (p: MockProduct) => {
    cartStorage.add({
      productId: p.productId,
      supermarketId: p.supermarketId,
      name: p.name,
      price: p.price,
    })
    setCartCount(cartStorage.getTotalQty())
    window.dispatchEvent(new Event("cart:updated"))
  }

  return (
    <div className="min-h-[900px] w-full bg-[#F6F8F6] font-sans">
      <GateWizardModal open={gateOpen} onDone={() => setGateOpen(false)} />

      <main className="w-full px-[40px] py-[24px]">
        <div className="flex flex-col gap-10">
          <section className={cn(surfaceCard, "p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between")}>
            <div className="text-[13px] text-gray-700">
              <span className="font-semibold">Vị trí:</span>{" "}
              <span className="font-medium">{ctx.addressText ?? "Chưa chọn"}</span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="font-semibold">Giao hàng:</span>{" "}
              <span className="font-medium">
                {ctx.deliveryMethodId === "DELIVERY"
                  ? `Giao tận nơi (${ctx.addressText ?? "chưa có địa chỉ"})`
                  : ctx.deliveryMethodId === "PICKUP"
                    ? `Tự lấy (${ctx.pickupPointName ?? "chưa chọn điểm"})`
                    : "Chưa chọn"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setGateOpen(true)} className={cn(secondaryBtn, "px-4 py-2")}>
                Đổi lựa chọn
              </button>

              <button
                type="button"
                onClick={() => {
                  ctxStorage.clear()
                  setGateOpen(true)
                }}
                className={cn(secondaryBtn, "px-4 py-2")}
              >
                Reset
              </button>
            </div>
          </section>

          {/* HERO */}
          <section className={cn(surfaceCard, "overflow-hidden relative")}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.55),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.28),transparent_40%),linear-gradient(135deg,#0b1410,#143522,#2ECC71)]" />
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_60%_80%,rgba(255,255,255,0.35),transparent_45%)]" />

            <div className="relative space-y-5">
              <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1.5 backdrop-blur border border-white/15">
                <span className="text-[12px] font-bold text-white">Tiết kiệm đến 70% hôm nay</span>
              </span>

              <h1 className="text-[48px] font-extrabold leading-[1.15] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                Cứu Thực Phẩm, Tiết Kiệm Chi Phí
              </h1>

              <p className="text-[18px] text-white/90">
                Cùng chúng tôi giảm lãng phí thực phẩm. Khám phá các sản phẩm chất lượng sắp hết hạn với mức giá
                không thể tốt hơn.
              </p>

              <button type="button" className={cn(primaryBtn, "px-8 py-3")}>
                Khám Phá Ưu Đãi
              </button>
            </div>
          </section>

          {/* STATS */}
          <section className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((s) => (
              <div key={s.title} className={cn(surfaceCard, "p-5 flex items-center gap-4")}>
                <div className="h-14 w-14 rounded-xl bg-white/70 border border-white/40 shadow-md grid place-items-center">
                  <StatIcon kind={s.icon} />
                </div>
                <div>
                  <div className="text-[13px] text-gray-500">{s.title}</div>
                  <div className="mt-1 flex items-end gap-2">
                    <div className="text-[24px] font-extrabold text-gray-800">{s.value}</div>
                    <div className="text-[14px] font-semibold text-emerald-600">{s.delta}</div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* CONTENT */}
          <section className="flex w-full flex-col gap-8 lg:flex-row">
            <aside className="w-full lg:w-[256px]">
              <div className={cn(surfaceCard, "p-6")}>
                <div>
                  <div className="text-[18px] font-bold text-gray-800">Danh Mục</div>
                  <div className="text-[12px] text-gray-500">Tìm kiếm nhanh chóng</div>
                </div>

                <nav className="mt-6 flex flex-col gap-2">
                  {categories.map((c) => {
                    const active = activeCategory === c.label
                    return (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setActiveCategory(c.label)}
                        className={cn(
                          "h-[44px] w-full rounded-xl px-3 flex items-center gap-3 text-left transition border",
                          active ? "bg-green-50 border-green-200" : "bg-white/60 border-white/40 hover:bg-gray-50"
                        )}
                      >
                        <span className={cn(active ? "text-emerald-600" : "text-gray-600")}>{c.icon}</span>
                        <span className={cn("text-[15px]", active ? "font-semibold text-emerald-700" : "font-medium text-gray-700")}>
                          {c.label}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[24px] font-extrabold text-gray-800">Giảm Giá Sốc: Sắp Kết Thúc!</div>
                <div className="flex w-fit items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-2 shadow-sm">
                  <Clock size={18} className="text-emerald-600" />
                  <span className="text-[14px] font-semibold text-emerald-700">Cập nhật sau 02:45:10</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDeals.map((d) => (
                  <ProductCard key={d.productId} deal={d} onAdd={handleAdd} />
                ))}
              </div>

              <div className={cn(surfaceCard, "mt-8 p-8 text-center space-y-4")}>
                <p className="text-[16px] text-gray-500">Bạn đã xem hết các ưu đãi hiện tại trong khu vực của mình.</p>
                <button type="button" className={cn(secondaryBtn, "px-6 py-2.5")} onClick={() => console.log("refresh deals")}>
                  Làm Mới Ưu Đãi
                </button>
              </div>
            </div>
          </section>

          {/* MOBILE SEARCH */}
          <section className="md:hidden">
            <div className="w-full bg-white/80 shadow-md rounded-xl border border-white/40 flex items-center gap-3 px-4 py-3 focus-within:ring-2 focus-within:ring-green-200">
              <Search className="text-gray-400" size={18} />
              <input className="w-full bg-transparent outline-none text-gray-700 placeholder:text-gray-400" placeholder="Tìm kiếm sản phẩm tại đây" />
              <button type="button" className="relative h-10 w-10 rounded-xl bg-white shadow border border-gray-100" aria-label="Giỏ hàng">
                <div className="h-full w-full grid place-items-center">
                  <ShoppingCart className="text-gray-800" size={20} />
                </div>
                <span className="absolute -right-2 -top-2 rounded-full bg-green-400 px-2 py-0.5">
                  <span className="text-[10px] font-bold text-gray-900">{cartCount}</span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Home