import React, { useEffect, useMemo, useState } from "react"
import {
  AlarmClock,
  Clock,
  Leaf,
  MapPin,
  PackageCheck,
  ShoppingCart,
  Tag,
  Truck,
  Utensils,
} from "lucide-react"

import axiosClient from "@/utils/axiosClient"
import DeliveryGateModal, {
  type DeliveryContext,
  type Supermarket,
} from "../Home/DeliveryGateModal"

const cn = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(" ")

const DELIVERY_CONTEXT_KEY = "customer_delivery_context_v3"
const CART_KEY = "customer_cart_v1"

const primaryBtn =
  "bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-xl shadow-md transition hover:brightness-105 active:scale-[0.99]"

const secondaryBtn =
  "rounded-xl border border-sky-200 bg-white text-sky-700 transition hover:bg-sky-50"

type CartItem = {
  productId: string
  supermarketId: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

type ProductApiItem = {
  productId: string
  supermarketId: string
  name: string
  brand?: string
  category?: string
  barcode?: string
  isFreshFood?: boolean
  type?: number
  sku?: string
  status?: number
  weightType?: number
  weightTypeName?: string
  defaultPricePerKg?: number
  originalPrice?: number
  suggestedPrice?: number
  finalPrice?: number
  expiryDate?: string
  manufactureDate?: string
  daysToExpiry?: number
  ocrConfidence?: number
  pricingConfidence?: number
  pricingReasons?: string
  createdBy?: string
  createdAt?: string
  verifiedBy?: string
  verifiedAt?: string
  pricedBy?: string
  pricedAt?: string
  mainImageUrl?: string
  totalImages?: number
  productImages?: Array<{
    productImageId: string
    productId: string
    imageUrl: string
    createdAt: string
  }>
  ingredients?: string
  nutritionFacts?: Record<string, string>
  barcodeLookupInfo?: {
    barcode?: string
    productName?: string
    brand?: string
    category?: string
    description?: string
    imageUrl?: string
    manufacturer?: string
    weight?: string
    ingredients?: string
    nutritionFacts?: Record<string, string>
    country?: string
    source?: string
    confidence?: number
    isVietnameseProduct?: boolean
    gs1Prefix?: string
    scanCount?: number
    isVerified?: boolean
  }
}

type ProductsResponse = {
  success: boolean
  message: string
  data?: {
    items?: ProductApiItem[]
    totalResult?: number
    page?: number
    pageSize?: number
  }
  errors?: string[]
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
  errors?: string[]
}

type ProductView = {
  productId: string
  supermarketId: string
  supermarketName: string
  name: string
  brand: string
  subtitle: string
  category: string
  originalPrice: number
  price: number
  discountLabel: string
  timeLeft: string
  bestBeforeTitle: string
  bestBeforeValue: string
  imageUrl?: string
  imageVariant?: "milk" | "bread" | "beef" | "avocado"
  isFreshFood: boolean
  daysToExpiry: number | null
}

type StatCard = {
  icon: "meals" | "co2" | "deals"
  title: string
  value: string
  delta: string
}

type CategoryItem = {
  label: string
  count: number
}

const cartStorage = {
  get(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  },
  set(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  },
  add(item: Omit<CartItem, "qty">, qty = 1) {
    const items = this.get()
    const found = items.find((x) => x.productId === item.productId)
    if (found) found.qty += qty
    else items.push({ ...item, qty })
    this.set(items)
  },
  getTotalQty() {
    return this.get().reduce((sum, item) => sum + item.qty, 0)
  },
}

const deliveryStorage = {
  get(): DeliveryContext {
    try {
      const raw = localStorage.getItem(DELIVERY_CONTEXT_KEY)
      return raw ? (JSON.parse(raw) as DeliveryContext) : {}
    } catch {
      return {}
    }
  },
  set(data: DeliveryContext) {
    localStorage.setItem(DELIVERY_CONTEXT_KEY, JSON.stringify(data))
  },
  clear() {
    localStorage.removeItem(DELIVERY_CONTEXT_KEY)
  },
  isReady(data?: DeliveryContext) {
    const ctx = data ?? this.get()
    if (!ctx.deliveryMethodId) return false

    if (ctx.deliveryMethodId === "DELIVERY") {
      return !!ctx.addressText && typeof ctx.lat === "number" && typeof ctx.lng === "number"
    }

    if (ctx.deliveryMethodId === "PICKUP") {
      return !!ctx.pickupPointId && !!ctx.pickupPointName
    }

    return false
  },
}

const imageBg = (variant?: ProductView["imageVariant"]) => {
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

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}đ`

const formatBestBefore = (input?: string) => {
  if (!input) return "Chưa cập nhật"

  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật"

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

const getTimeLeftText = (daysToExpiry?: number) => {
  if (typeof daysToExpiry !== "number") return "Đang cập nhật"
  if (daysToExpiry < 0) return "Đã hết hạn"
  if (daysToExpiry === 0) return "Hết hạn hôm nay"
  if (daysToExpiry === 1) return "Còn 1 ngày"
  return `Còn ${daysToExpiry} ngày`
}

const getDiscountLabel = (originalPrice?: number, finalPrice?: number) => {
  const original = Number(originalPrice ?? 0)
  const final = Number(finalPrice ?? 0)

  if (original <= 0 || final <= 0 || final >= original) return ""

  const percent = Math.round(((original - final) / original) * 100)
  return `-${percent}%`
}

const inferImageVariant = (name: string, category?: string): ProductView["imageVariant"] => {
  const text = `${name} ${category ?? ""}`.toLowerCase()

  if (text.includes("sữa") || text.includes("milk") || text.includes("trứng")) return "milk"
  if (text.includes("bánh") || text.includes("bread")) return "bread"
  if (text.includes("thịt") || text.includes("bò") || text.includes("gà")) return "beef"
  if (text.includes("bơ") || text.includes("rau") || text.includes("quả")) return "avocado"

  return undefined
}

const normalizeCategory = (category?: string, name?: string) => {
  if (category?.trim()) return category.trim()

  const lower = (name ?? "").toLowerCase()
  if (lower.includes("sữa") || lower.includes("trứng")) return "Sữa & Trứng"
  if (lower.includes("bánh") || lower.includes("mì")) return "Bánh Mì"
  if (
    lower.includes("rau") ||
    lower.includes("củ") ||
    lower.includes("quả") ||
    lower.includes("bơ")
  ) {
    return "Nông Sản"
  }
  if (
    lower.includes("thịt") ||
    lower.includes("bò") ||
    lower.includes("gà") ||
    lower.includes("heo")
  ) {
    return "Thịt & Gia Cầm"
  }

  return "Khác"
}

const formatSupermarketLabel = (supermarketId?: string) => {
  if (!supermarketId) return "Siêu thị chưa xác định"
  return `Siêu thị ${supermarketId.slice(0, 8)}`
}

const mapProductFromApi = (
  item: ProductApiItem,
  supermarketNameMap: Map<string, string>
): ProductView => {
  const originalPrice = Number(item.originalPrice ?? 0)
  const finalPrice = Number(item.finalPrice ?? 0)

  const fallbackImage =
    item.productImages?.find((img) => img.imageUrl)?.imageUrl ||
    item.barcodeLookupInfo?.imageUrl ||
    ""

  const category = normalizeCategory(item.category, item.name)
  const supermarketName =
    supermarketNameMap.get(item.supermarketId) || formatSupermarketLabel(item.supermarketId)

  return {
    productId: item.productId,
    supermarketId: item.supermarketId,
    supermarketName,
    name: item.name || "Sản phẩm",
    brand: item.brand || "",
    subtitle: item.brand
      ? `${item.brand} • Thuộc ${supermarketName}`
      : `Thuộc ${supermarketName}`,
    category,
    originalPrice,
    price: finalPrice > 0 ? finalPrice : originalPrice,
    discountLabel: getDiscountLabel(originalPrice, finalPrice > 0 ? finalPrice : originalPrice),
    timeLeft: getTimeLeftText(item.daysToExpiry),
    bestBeforeTitle: "Sử dụng tốt nhất trước",
    bestBeforeValue: formatBestBefore(item.expiryDate),
    imageUrl: item.mainImageUrl || fallbackImage || undefined,
    imageVariant: inferImageVariant(item.name, category),
    isFreshFood: !!item.isFreshFood,
    daysToExpiry: typeof item.daysToExpiry === "number" ? item.daysToExpiry : null,
  }
}

const ProductCard: React.FC<{
  product: ProductView
  onAdd: (item: ProductView) => void
}> = ({ product, onAdd }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/50 bg-white shadow-lg transition hover:shadow-xl">
      <div className={cn("relative h-[192px] w-full", imageBg(product.imageVariant))}>
        {!!product.discountLabel && (
          <div className="absolute left-3 top-3 z-20 rounded-md bg-red-500 px-2 py-1 shadow-sm">
            <span className="text-[10px] font-bold text-white">{product.discountLabel}</span>
          </div>
        )}

        <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1.5 rounded-full border border-gray-100 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur">
          <AlarmClock size={14} className="text-emerald-500" />
          <span className="text-[12px] font-semibold text-gray-800">{product.timeLeft}</span>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <img
            src={
              product.imageUrl ||
              `https://picsum.photos/seed/${encodeURIComponent(product.productId)}/500/500`
            }
            alt={product.name}
            className="h-[160px] w-[160px] rounded-2xl object-cover shadow-sm ring-1 ring-black/5"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[18px] font-bold text-gray-800">{product.name}</div>
            <div className="mt-0.5 text-[12px] text-gray-500">{product.subtitle}</div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                {product.category}
              </span>

              {product.isFreshFood && (
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700">
                  Tươi sống
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            {product.originalPrice > product.price && (
              <div className="text-[12px] text-red-500 line-through">
                {formatCurrency(product.originalPrice)}
              </div>
            )}
            <div className="text-[20px] font-bold text-gray-800">
              {formatCurrency(product.price)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <div className="text-[10px] font-semibold text-gray-500">
              {product.bestBeforeTitle}
            </div>
            <div className="text-[14px] font-semibold text-red-500">
              {product.bestBeforeValue}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAdd(product)}
            className={cn("grid h-10 w-10 place-items-center", primaryBtn)}
            aria-label="Thêm vào giỏ"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

const StatIcon = ({ kind }: { kind: StatCard["icon"] }) => {
  const common = "text-emerald-600"
  if (kind === "meals") return <Utensils size={26} className={common} />
  if (kind === "co2") return <Leaf size={26} className={common} />
  return <Tag size={26} className={common} />
}

const Home: React.FC = () => {
  const [gateOpen, setGateOpen] = useState(false)
  const [deliveryCtx, setDeliveryCtx] = useState<DeliveryContext>(() => deliveryStorage.get())
  const [cartCount, setCartCount] = useState(() => cartStorage.getTotalQty())

  const [productsRaw, setProductsRaw] = useState<ProductApiItem[]>([])
  const [supermarketsMaster, setSupermarketsMaster] = useState<Supermarket[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeCategory, setActiveCategory] = useState("Tất Cả")

  useEffect(() => {
    if (!deliveryStorage.isReady(deliveryCtx)) {
      setGateOpen(true)
    }
  }, [deliveryCtx])

  useEffect(() => {
    const fetchBootstrapData = async () => {
      try {
        setLoading(true)
        setError("")

        const [productsRes, supermarketsRes] = await Promise.all([
          axiosClient.get<ProductsResponse>("/api/Products", {
            params: {
              pageNumber: 1,
              pageSize: 100,
            },
          }),
          axiosClient.get<SupermarketsResponse>("/api/Supermarkets", {
            params: {
              pageNumber: 1,
              pageSize: 100,
            },
          }),
        ])

        const productItems = productsRes.data?.data?.items ?? []
        const supermarketItems = supermarketsRes.data?.data?.items ?? []

        const supermarketsMapped: Supermarket[] = supermarketItems.map((item) => ({
          supermarketId: item.supermarketId,
          name: item.name,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          contactPhone: item.contactPhone,
          status: item.status,
          createdAt: item.createdAt,
        }))

        setProductsRaw(productItems)
        setSupermarketsMaster(supermarketsMapped)
      } catch (err) {
        console.error("Fetch home data failed:", err)
        setError("Không tải được dữ liệu trang chủ.")
        setProductsRaw([])
        setSupermarketsMaster([])
      } finally {
        setLoading(false)
      }
    }

    fetchBootstrapData()
  }, [])

  const supermarketNameMap = useMemo(() => {
    const map = new Map<string, string>()
    supermarketsMaster.forEach((item) => {
      map.set(item.supermarketId, item.name)
    })
    return map
  }, [supermarketsMaster])

  const products = useMemo(() => {
    return productsRaw
      .map((item) => mapProductFromApi(item, supermarketNameMap))
      .filter((item) => item.price > 0)
  }, [productsRaw, supermarketNameMap])

  const matchedSupermarketIds = useMemo(() => {
    return new Set((deliveryCtx.nearbySupermarkets ?? []).map((item) => item.supermarketId))
  }, [deliveryCtx.nearbySupermarkets])

  const visibleProducts = useMemo(() => {
    if (!deliveryStorage.isReady(deliveryCtx)) return []
    if (!deliveryCtx.nearbySupermarkets?.length) return []
    return products.filter((item) => matchedSupermarketIds.has(item.supermarketId))
  }, [deliveryCtx, matchedSupermarketIds, products])

  const noMatchedSupermarket =
    deliveryStorage.isReady(deliveryCtx) &&
    Array.isArray(deliveryCtx.nearbySupermarkets) &&
    deliveryCtx.nearbySupermarkets.length === 0

  const stats: StatCard[] = useMemo(
    () => [
      { icon: "meals", title: "Bữa Ăn Đã Cứu Hôm Nay", value: "1,240", delta: "+12%" },
      { icon: "co2", title: "Lượng CO2 Giảm Thiểu", value: "350kg", delta: "+5%" },
      { icon: "deals", title: "Ưu Đãi Đang Chạy", value: `${visibleProducts.length}`, delta: "+20%" },
    ],
    [visibleProducts.length]
  )

  const categories: CategoryItem[] = useMemo(() => {
    const counts = visibleProducts.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {})

    return [
      { label: "Tất Cả", count: visibleProducts.length },
      ...Object.entries(counts)
        .sort((a, b) => a[0].localeCompare(b[0], "vi"))
        .map(([label, count]) => ({
          label,
          count,
        })),
    ]
  }, [visibleProducts])

  const filteredProducts = useMemo(() => {
    if (activeCategory === "Tất Cả") return visibleProducts
    return visibleProducts.filter((item) => item.category === activeCategory)
  }, [activeCategory, visibleProducts])

  const handleDoneGate = (value: DeliveryContext) => {
    deliveryStorage.set(value)
    setDeliveryCtx(value)
    setGateOpen(false)
    setActiveCategory("Tất Cả")
  }

  const handleAddToCart = (item: ProductView) => {
    cartStorage.add({
      productId: item.productId,
      supermarketId: item.supermarketId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
    })
    setCartCount(cartStorage.getTotalQty())
  }

  const displayMarkets: Supermarket[] = useMemo(() => {
    return deliveryCtx.nearbySupermarkets ?? []
  }, [deliveryCtx.nearbySupermarkets])

  return (
    <div className="min-h-screen w-full bg-[#F6F8F6]">
      <DeliveryGateModal
        open={gateOpen}
        initialValue={deliveryCtx}
        onDone={handleDoneGate}
        onClose={() => setGateOpen(false)}
      />

      <main className="w-full px-6 py-6 lg:px-10">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4 rounded-2xl border border-white/50 bg-white/80 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Phương thức:</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-700">
                  {deliveryCtx.deliveryMethodId === "DELIVERY" ? (
                    <>
                      <Truck size={14} />
                      Giao tận nơi
                    </>
                  ) : deliveryCtx.deliveryMethodId === "PICKUP" ? (
                    <>
                      <PackageCheck size={14} />
                      Tự lấy tại điểm tập kết
                    </>
                  ) : (
                    "Chưa chọn"
                  )}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold">Vị trí:</span>
                <span className="inline-flex items-center gap-1 text-gray-700">
                  <MapPin size={14} className="text-sky-600" />
                  {deliveryCtx.deliveryMethodId === "DELIVERY"
                    ? deliveryCtx.addressText || "Chưa chọn"
                    : deliveryCtx.pickupPointAddress || "Chưa chọn"}
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Trang chủ hiện lọc sản phẩm theo danh sách siêu thị phục vụ từ khu vực bạn đã chọn.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className={cn(secondaryBtn, "px-4 py-2")}
              >
                Đổi lựa chọn
              </button>

              <button
                type="button"
                onClick={() => {
                  deliveryStorage.clear()
                  setDeliveryCtx({})
                  setGateOpen(true)
                }}
                className={cn(secondaryBtn, "px-4 py-2")}
              >
                Reset
              </button>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-8 shadow-2xl">
            <div className="relative z-10 max-w-3xl space-y-5">
              <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-white backdrop-blur">
                <span className="text-[12px] font-bold">Tiết kiệm đến 70% hôm nay</span>
              </span>

              <h1 className="text-4xl font-extrabold leading-tight text-white lg:text-5xl">
                Cứu Thực Phẩm, Tiết Kiệm Chi Phí
              </h1>

              <p className="text-base text-white/90 lg:text-lg">
                Hệ thống đang hiển thị sản phẩm theo các siêu thị phục vụ được từ vị trí hoặc điểm
                nhận bạn đã chọn.
              </p>

              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className={cn(primaryBtn, "px-6 py-3")}
              >
                Chọn lại vị trí mua hàng
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg"
              >
                <div className="grid h-14 w-14 place-items-center rounded-xl border border-white/40 bg-white">
                  <StatIcon kind={item.icon} />
                </div>

                <div>
                  <div className="text-sm text-gray-500">{item.title}</div>
                  <div className="mt-1 flex items-end gap-2">
                    <div className="text-2xl font-extrabold text-gray-800">{item.value}</div>
                    <div className="text-sm font-semibold text-emerald-600">{item.delta}</div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-8 lg:flex-row">
            <aside className="w-full lg:w-[260px]">
              <div className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-lg">
                <div>
                  <div className="text-lg font-bold text-gray-800">Danh Mục</div>
                  <div className="text-xs text-gray-500">Lọc nhanh theo nhóm sản phẩm</div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  {categories.map((item) => {
                    const active = activeCategory === item.label
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setActiveCategory(item.label)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition",
                          active
                            ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                            : "border-slate-200 bg-white text-gray-700 hover:bg-slate-50"
                        )}
                      >
                        <span>{item.label}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                          {item.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-2xl font-extrabold text-gray-800">
                    Giảm Giá Sốc: Sắp Kết Thúc!
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Chỉ hiển thị sản phẩm thuộc các siêu thị phục vụ khu vực bạn đã chọn
                  </div>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-2 shadow-sm">
                  <Clock size={18} className="text-emerald-600" />
                  <span className="text-[14px] font-semibold text-emerald-700">
                    {loading ? "Đang tải..." : `${filteredProducts.length} sản phẩm`}
                  </span>
                </div>
              </div>

              {!!displayMarkets.length && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {displayMarkets.map((market) => (
                    <div
                      key={market.supermarketId}
                      className="rounded-full border border-sky-100 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm"
                    >
                      {market.name}
                      {typeof market.distanceKm === "number"
                        ? ` • ${market.distanceKm.toFixed(1)}km`
                        : ""}
                    </div>
                  ))}
                </div>
              )}

              {noMatchedSupermarket && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  Khu vực bạn đã chọn hiện chưa có siêu thị phục vụ trong bán kính 5km. Địa chỉ vẫn
                  được ghi nhận, nhưng hiện chưa có sản phẩm để hiển thị.
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[360px] animate-pulse rounded-2xl border border-white/50 bg-white shadow-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((item) => (
                    <ProductCard key={item.productId} product={item} onAdd={handleAddToCart} />
                  ))}
                </div>
              )}

              {!loading && !filteredProducts.length && (
                <div className="mt-8 rounded-2xl border border-dashed border-sky-200 bg-white/80 p-8 text-center shadow-sm">
                  <div className="text-lg font-semibold text-slate-800">
                    Chưa có sản phẩm để hiển thị
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {noMatchedSupermarket
                      ? "Khu vực bạn chọn hiện chưa có siêu thị phục vụ nên chưa có sản phẩm để hiển thị."
                      : "Hiện chưa có dữ liệu phù hợp với danh mục bạn đang chọn."}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      noMatchedSupermarket ? setGateOpen(true) : setActiveCategory("Tất Cả")
                    }
                    className={cn(primaryBtn, "mt-4 px-5 py-2.5")}
                  >
                    {noMatchedSupermarket ? "Chọn khu vực khác" : "Xem tất cả sản phẩm"}
                  </button>
                </div>
              )}

              {!!filteredProducts.length && (
                <div className="mt-8 rounded-2xl border border-white/40 bg-white/80 p-8 text-center shadow-lg">
                  <p className="text-[16px] text-gray-500">
                    Bạn đã xem hết các ưu đãi hiện tại phù hợp với khu vực đã chọn.
                  </p>
                  <button
                    type="button"
                    onClick={() => setGateOpen(true)}
                    className={cn(secondaryBtn, "mt-4 px-6 py-2.5")}
                  >
                    Chọn lại khu vực
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="md:hidden">
            <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/80 px-4 py-3 shadow-md">
              <div className="flex-1 text-sm text-slate-600">
                Giỏ hàng hiện có <span className="font-semibold">{cartCount}</span> sản phẩm
              </div>
              <button
                type="button"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-gray-100 bg-white shadow"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="text-gray-800" size={20} />
                <span className="absolute -right-2 -top-2 rounded-full bg-green-400 px-2 py-0.5 text-[10px] font-bold text-gray-900">
                  {cartCount}
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
