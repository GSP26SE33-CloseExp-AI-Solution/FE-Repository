import React, { useEffect, useMemo, useState } from "react"
import {
  Clock3,
  Leaf,
  MapPin,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react"

import { supermarketService } from "@/services/supermarket.service"
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
  "rounded-2xl bg-slate-900 text-white font-semibold transition hover:bg-slate-800 active:scale-[0.99]"

const secondaryBtn =
  "rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"

type CartItem = {
  lotId: string
  productId: string
  supermarketId: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

type ProductLotApiItem = {
  lotId: string
  productId: string
  productName?: string
  productImageUrl?: string | null
  barcode?: string
  brand?: string
  supermarketId: string
  supermarketName?: string
  unitId?: string
  unitName?: string
  quantity?: number
  weight?: number
  status?: string
  manufactureDate?: string
  expiryDate?: string
  createdAt?: string
  publishedBy?: string
  publishedAt?: string
  originalUnitPrice?: number
  suggestedUnitPrice?: number
  finalUnitPrice?: number
  sellingUnitPrice?: number
  daysRemaining?: number

  hoursRemaining?: number
  category?: string
  isFreshFood?: boolean
  mainImageUrl?: string
  productImages?: Array<{
    productImageId: string
    productId: string
    imageUrl: string
    createdAt: string
  }>
}

type ProductLotsResponse = {
  success: boolean
  message: string
  data?: {
    items?: ProductLotApiItem[]
    totalResult?: number
    page?: number
    pageSize?: number
  }
  errors?: string[]
}

type ProductView = {
  lotId: string
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
  friendlyHint: string
  bestBeforeTitle: string
  bestBeforeValue: string
  imageUrl?: string
  imageVariant?: "milk" | "bread" | "beef" | "avocado"
  isFreshFood: boolean
  daysToExpiry: number | null
  hoursRemaining: number | null
}

type StatCard = {
  icon: "meals" | "co2" | "stores"
  title: string
  value: string
  note: string
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
    const found = items.find((x) => x.lotId === item.lotId)
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
      return "bg-[radial-gradient(circle_at_28%_22%,rgba(59,130,246,0.14),transparent_40%),linear-gradient(135deg,#ffffff,#eef6ff)]"
    case "bread":
      return "bg-[radial-gradient(circle_at_28%_22%,rgba(245,158,11,0.18),transparent_40%),linear-gradient(135deg,#ffffff,#fff6e8)]"
    case "beef":
      return "bg-[radial-gradient(circle_at_28%_22%,rgba(239,68,68,0.14),transparent_40%),linear-gradient(135deg,#ffffff,#fff1f2)]"
    case "avocado":
      return "bg-[radial-gradient(circle_at_28%_22%,rgba(34,197,94,0.16),transparent_40%),linear-gradient(135deg,#ffffff,#edfdf2)]"
    default:
      return "bg-[radial-gradient(circle_at_28%_22%,rgba(15,23,42,0.06),transparent_40%),linear-gradient(135deg,#ffffff,#f8fafc)]"
  }
}

const formatCurrency = (value: number) => {
  if (!value || value <= 0) return ""
  return `${value.toLocaleString("vi-VN")}đ`
}

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

const getHoursUntilCutoff21 = () => {
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setHours(21, 0, 0, 0)

  const diffMs = cutoff.getTime() - now.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60))
}

const isProductVisibleByExpiry = (daysRemaining?: number, hoursRemaining?: number) => {
  if (typeof daysRemaining !== "number") return false
  if (daysRemaining < 0) return false
  if (daysRemaining > 0) return true

  const effectiveHours =
    typeof hoursRemaining === "number" ? hoursRemaining : getHoursUntilCutoff21()

  return effectiveHours > 0
}

const getTimeLeftText = (daysRemaining?: number, hoursRemaining?: number) => {
  if (typeof daysRemaining !== "number") return ""

  if (daysRemaining < 0) return ""

  if (daysRemaining === 0) {
    const effectiveHours =
      typeof hoursRemaining === "number" ? hoursRemaining : getHoursUntilCutoff21()

    if (effectiveHours <= 0) return ""
    if (effectiveHours <= 3) return `Dùng ngon trong ${effectiveHours} giờ`
    return "Nên dùng hôm nay"
  }

  if (daysRemaining === 1) return "Phù hợp cho hôm nay & ngày mai"
  if (daysRemaining <= 3) return "Nên mua sớm"
  if (daysRemaining <= 7) return "Ưu đãi nên xem trước"

  return "Giá tốt hôm nay"
}

const getFriendlyHint = (daysRemaining?: number, hoursRemaining?: number) => {
  if (typeof daysRemaining !== "number") return ""

  if (daysRemaining === 0) {
    const effectiveHours =
      typeof hoursRemaining === "number" ? hoursRemaining : getHoursUntilCutoff21()

    if (effectiveHours <= 0) return ""
    if (effectiveHours <= 3) return `Còn khoảng ${effectiveHours} giờ phù hợp để dùng ngon`
    return "Phù hợp cho bữa ăn trong hôm nay"
  }

  if (daysRemaining === 1) return "Phù hợp cho 1–2 ngày tới"
  if (daysRemaining <= 3) return "Nên chọn sớm để có ưu đãi tốt"
  if (daysRemaining <= 7) return "Tiện mua cho vài bữa gần nhất"

  return "Dễ chọn cho nhu cầu hằng ngày"
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
  if (lower.includes("bánh") || lower.includes("mì")) return "Bánh mì & Khô"
  if (
    lower.includes("rau") ||
    lower.includes("củ") ||
    lower.includes("quả") ||
    lower.includes("bơ")
  ) {
    return "Nông sản"
  }
  if (
    lower.includes("thịt") ||
    lower.includes("bò") ||
    lower.includes("gà") ||
    lower.includes("heo")
  ) {
    return "Thịt & Gia cầm"
  }

  return "Thực phẩm"
}

const formatSupermarketLabel = (supermarketId?: string) => {
  if (!supermarketId) return "Siêu thị gần bạn"
  return `Siêu thị ${supermarketId.slice(0, 8)}`
}

const mapProductLotFromApi = (
  item: ProductLotApiItem,
  supermarketNameMap: Map<string, string>
): ProductView => {
  const originalPrice = Number(item.originalUnitPrice ?? 0)
  const suggestedPrice = Number(item.suggestedUnitPrice ?? 0)
  const finalPrice = Number(item.finalUnitPrice ?? 0)
  const sellingPrice = Number(item.sellingUnitPrice ?? 0)

  const resolvedPrice =
    sellingPrice > 0
      ? sellingPrice
      : finalPrice > 0
        ? finalPrice
        : suggestedPrice > 0
          ? suggestedPrice
          : originalPrice

  const fallbackImage = item.productImages?.find((img) => img.imageUrl)?.imageUrl || ""
  const category = normalizeCategory(item.category, item.productName)
  const supermarketName =
    item.supermarketName ||
    supermarketNameMap.get(item.supermarketId) ||
    formatSupermarketLabel(item.supermarketId)

  return {
    lotId: item.lotId,
    productId: item.productId,
    supermarketId: item.supermarketId,
    supermarketName,
    name: item.productName || "Sản phẩm",
    brand: item.brand || "",
    subtitle: item.brand ? `${item.brand} • ${supermarketName}` : supermarketName,
    category,
    originalPrice: originalPrice > 0 ? originalPrice : resolvedPrice,
    price: resolvedPrice,
    discountLabel: getDiscountLabel(
      originalPrice > 0 ? originalPrice : resolvedPrice,
      resolvedPrice
    ),
    timeLeft: getTimeLeftText(item.daysRemaining, item.hoursRemaining),
    friendlyHint: getFriendlyHint(item.daysRemaining, item.hoursRemaining),
    bestBeforeTitle: "Nên dùng tốt nhất trước",
    bestBeforeValue: formatBestBefore(item.expiryDate),
    imageUrl: item.productImageUrl || item.mainImageUrl || fallbackImage || undefined,
    imageVariant: inferImageVariant(item.productName || "", category),
    isFreshFood: !!item.isFreshFood,
    daysToExpiry: typeof item.daysRemaining === "number" ? item.daysRemaining : null,
    hoursRemaining: typeof item.hoursRemaining === "number" ? item.hoursRemaining : null,
  }
}

const ProductCard: React.FC<{
  product: ProductView
  onAdd: (item: ProductView) => void
}> = ({ product, onAdd }) => {
  const isSoftUrgent =
    product.daysToExpiry === 0 ||
    (typeof product.daysToExpiry === "number" && product.daysToExpiry <= 3)

  const showOldPrice = product.originalPrice > 0 && product.originalPrice > product.price
  const hasPrice = product.price > 0

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)]">
      <div className={cn("relative h-[156px] w-full overflow-hidden", imageBg(product.imageVariant))}>
        {!!product.discountLabel && (
          <div className="absolute left-3 top-3 z-20 rounded-full bg-rose-500 px-2.5 py-1 shadow-sm">
            <span className="text-[10px] font-semibold text-white">{product.discountLabel}</span>
          </div>
        )}

        {!!product.timeLeft && (
          <div
            className={cn(
              "absolute right-3 top-3 z-20 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm",
              isSoftUrgent
                ? "bg-amber-100 text-amber-800"
                : "bg-white/90 text-slate-700 backdrop-blur"
            )}
          >
            {product.timeLeft}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <img
            src={
              product.imageUrl ||
              `https://picsum.photos/seed/${encodeURIComponent(product.lotId)}/420/420`
            }
            alt={product.name}
            className="h-[112px] w-[112px] rounded-[20px] object-cover shadow-md ring-1 ring-black/5 transition duration-200 group-hover:scale-[1.03]"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="min-h-[96px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 min-h-[46px] text-[15px] font-semibold leading-6 tracking-[-0.01em] text-slate-900">
                {product.name}
              </h3>

              <p className="mt-1 line-clamp-1 min-h-[18px] text-[12px] font-medium text-slate-500">
                {product.subtitle}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <div className="min-h-[16px] text-[11px] font-medium text-slate-400">
                {showOldPrice ? (
                  <span className="line-through">{formatCurrency(product.originalPrice)}</span>
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>

              {hasPrice ? (
                <div className="mt-1 text-[18px] font-bold leading-5 tracking-[-0.02em] text-slate-900">
                  {formatCurrency(product.price)}
                </div>
              ) : (
                <div className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                  Giá sẽ cập nhật
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex min-h-[30px] flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              {product.category}
            </span>

            {product.isFreshFood && (
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-700">
                Tươi sống
              </span>
            )}

            {isSoftUrgent && (
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700">
                Nên xem trước
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {product.bestBeforeTitle}
          </div>
          <div className="mt-1 line-clamp-1 min-h-[18px] text-[12px] font-semibold text-rose-600">
            {product.bestBeforeValue}
          </div>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex min-h-[54px] items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[12px] font-medium leading-5 text-slate-500">
                {product.friendlyHint}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAdd(product)}
              className={cn(
                primaryBtn,
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl px-3.5 text-[12px]"
              )}
              aria-label="Thêm vào giỏ"
            >
              <ShoppingCart size={14} />
              Thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const StatIcon = ({ kind }: { kind: StatCard["icon"] }) => {
  const common = "text-slate-800"
  if (kind === "meals") return <UtensilsCrossed size={18} className={common} />
  if (kind === "co2") return <Leaf size={18} className={common} />
  return <Store size={18} className={common} />
}

const Home: React.FC = () => {
  const [gateOpen, setGateOpen] = useState(false)
  const [deliveryCtx, setDeliveryCtx] = useState<DeliveryContext>(() => deliveryStorage.get())
  const [cartCount, setCartCount] = useState(() => cartStorage.getTotalQty())

  const [productsRaw, setProductsRaw] = useState<ProductLotApiItem[]>([])
  const [supermarketsMaster, setSupermarketsMaster] = useState<Supermarket[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeCategory, setActiveCategory] = useState("Tất cả")

  useEffect(() => {
    if (!deliveryStorage.isReady(deliveryCtx)) {
      setGateOpen(true)
    }
  }, [deliveryCtx])

  useEffect(() => {
    const fetchBootstrapData = async () => {
      if (!deliveryStorage.isReady(deliveryCtx)) {
        setProductsRaw([])
        setSupermarketsMaster([])
        setError("")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      try {
        const supermarketsResult = await supermarketService.getSupermarkets({
          pageNumber: 1,
          pageSize: 100,
        })

        setSupermarketsMaster(supermarketsResult)

        const response = await axiosClient.get<ProductLotsResponse>(
          "/customers/stocklots/available",
          {
            params: {
              pageNumber: 1,
              pageSize: 100,
            },
          }
        )

        const items = response.data?.data?.items ?? []

        setProductsRaw(items)

        if (!items.length) {
          setError("Hiện chưa có ưu đãi phù hợp để hiển thị.")
        }
      } catch (err) {
        console.error("Home bootstrap failed:", err)
        setError("Không tải được dữ liệu trang chủ.")
        setProductsRaw([])
        setSupermarketsMaster([])
      } finally {
        setLoading(false)
      }
    }

    fetchBootstrapData()
  }, [deliveryCtx])

  const supermarketNameMap = useMemo(() => {
    const map = new Map<string, string>()
    supermarketsMaster.forEach((item) => {
      map.set(item.supermarketId, item.name)
    })
    return map
  }, [supermarketsMaster])

  const products = useMemo(() => {
    return productsRaw
      .map((item) => mapProductLotFromApi(item, supermarketNameMap))
      .filter((item) =>
        isProductVisibleByExpiry(item.daysToExpiry ?? undefined, item.hoursRemaining ?? undefined)
      )
      .sort((a, b) => {
        const aDays = a.daysToExpiry ?? Number.MAX_SAFE_INTEGER
        const bDays = b.daysToExpiry ?? Number.MAX_SAFE_INTEGER

        if (aDays !== bDays) return aDays - bDays

        const aHours =
          aDays === 0 ? (a.hoursRemaining ?? getHoursUntilCutoff21()) : Number.MAX_SAFE_INTEGER
        const bHours =
          bDays === 0 ? (b.hoursRemaining ?? getHoursUntilCutoff21()) : Number.MAX_SAFE_INTEGER

        if (aHours !== bHours) return aHours - bHours

        return a.name.localeCompare(b.name, "vi")
      })
  }, [productsRaw, supermarketNameMap])

  const matchedSupermarketIds = useMemo(() => {
    return new Set((deliveryCtx.nearbySupermarkets ?? []).map((item) => item.supermarketId))
  }, [deliveryCtx.nearbySupermarkets])

  const visibleProducts = useMemo(() => {
    if (!deliveryStorage.isReady(deliveryCtx)) return []
    if (matchedSupermarketIds.size > 0) {
      return products.filter((item) => matchedSupermarketIds.has(item.supermarketId))
    }
    return products
  }, [deliveryCtx, matchedSupermarketIds, products])

  const noMatchedSupermarket =
    deliveryStorage.isReady(deliveryCtx) &&
    Array.isArray(deliveryCtx.nearbySupermarkets) &&
    deliveryCtx.nearbySupermarkets.length === 0

  const highlightCount = useMemo(
    () =>
      visibleProducts.filter(
        (item) =>
          item.daysToExpiry === 0 ||
          (typeof item.daysToExpiry === "number" && item.daysToExpiry <= 3)
      ).length,
    [visibleProducts]
  )

  const stats: StatCard[] = useMemo(
    () => [
      {
        icon: "meals",
        title: "Ưu đãi đang có",
        value: `${visibleProducts.length}`,
        note: "Đã chọn lọc theo khu vực của bạn",
      },
      {
        icon: "co2",
        title: "Món nên xem trước",
        value: `${highlightCount}`,
        note: "Thích hợp cho nhu cầu gần nhất",
      },
      {
        icon: "stores",
        title: "Siêu thị phù hợp",
        value: `${deliveryCtx.nearbySupermarkets?.length ?? 0}`,
        note: "Có thể phục vụ lựa chọn hiện tại",
      },
    ],
    [visibleProducts.length, highlightCount, deliveryCtx.nearbySupermarkets?.length]
  )

  const categories: CategoryItem[] = useMemo(() => {
    const counts = visibleProducts.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {})

    return [
      { label: "Tất cả", count: visibleProducts.length },
      ...Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "vi"))
        .map(([label, count]) => ({
          label,
          count,
        })),
    ]
  }, [visibleProducts])

  const filteredProducts = useMemo(() => {
    if (activeCategory === "Tất cả") return visibleProducts
    return visibleProducts.filter((item) => item.category === activeCategory)
  }, [activeCategory, visibleProducts])

  const handleDoneGate = (value: DeliveryContext) => {
    deliveryStorage.set(value)
    setDeliveryCtx(value)
    setGateOpen(false)
    setActiveCategory("Tất cả")
  }

  const handleAddToCart = (item: ProductView) => {
    cartStorage.add({
      lotId: item.lotId,
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

  const currentLocationText =
    deliveryCtx.deliveryMethodId === "DELIVERY"
      ? deliveryCtx.addressText || "Chưa chọn"
      : deliveryCtx.pickupPointAddress || "Chưa chọn"

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <DeliveryGateModal
        open={gateOpen}
        initialValue={deliveryCtx}
        onDone={handleDoneGate}
        onClose={() => setGateOpen(false)}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <section className="rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    Khu vực mua sắm
                  </span>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                    {deliveryCtx.deliveryMethodId === "DELIVERY" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Truck size={13} />
                        Giao tận nơi
                      </span>
                    ) : deliveryCtx.deliveryMethodId === "PICKUP" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <PackageCheck size={13} />
                        Nhận tại điểm hẹn
                      </span>
                    ) : (
                      "Chưa chọn"
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Áp dụng cho khu vực
                    </div>
                    <div className="mt-1 text-[14px] font-medium leading-6 text-slate-700">
                      {currentLocationText}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGateOpen(true)}
                  className={cn(secondaryBtn, "px-4 py-2.5 text-sm font-semibold")}
                >
                  Đổi khu vực
                </button>

                <button
                  type="button"
                  onClick={() => {
                    deliveryStorage.clear()
                    setDeliveryCtx({})
                    setGateOpen(true)
                  }}
                  className={cn(secondaryBtn, "px-4 py-2.5 text-sm font-semibold")}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_58%,#0f766e_100%)] px-5 py-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:px-7 sm:py-7">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.03em] text-white/90 backdrop-blur">
                  <Sparkles size={13} />
                  Món ngon giá tốt gần bạn
                </div>

                <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[34px] lg:text-[40px]">
                  Chọn nhanh thực phẩm ưu đãi
                  <br className="hidden sm:block" /> cho bữa ăn hôm nay
                </h1>

                <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/80 sm:text-[15px]">
                  Danh sách được sắp gọn theo những món nên xem trước, giúp bạn dễ chọn hơn,
                  tiết kiệm hơn và vẫn đủ yên tâm để dùng cho nhu cầu gần nhất.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">
                    Giỏ hàng
                  </div>
                  <div className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-white">
                    {cartCount}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGateOpen(true)}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Chọn lại khu vực
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100">
                    <StatIcon kind={item.icon} />
                  </div>
                  <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                    Hôm nay
                  </div>
                </div>

                <div className="mt-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {item.title}
                </div>
                <div className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-slate-900">
                  {item.value}
                </div>
                <div className="mt-2 text-[13px] font-medium leading-6 text-slate-500">
                  {item.note}
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-6 xl:flex-row">
            <aside className="w-full xl:w-[250px] xl:shrink-0">
              <div className="sticky top-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <div className="text-[18px] font-bold tracking-[-0.02em] text-slate-900">
                    Danh mục
                  </div>
                  <div className="mt-1 text-[13px] font-medium leading-6 text-slate-500">
                    Chọn nhanh theo nhóm món bạn muốn xem
                  </div>
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
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span className="pr-3 text-[13px] font-semibold">{item.label}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {item.count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {!!displayMarkets.length && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Siêu thị gần bạn
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {displayMarkets.map((market) => (
                        <div
                          key={market.supermarketId}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600"
                        >
                          {market.name}
                          {typeof market.distanceKm === "number"
                            ? ` • ${market.distanceKm.toFixed(1)}km`
                            : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-[24px] font-bold tracking-[-0.03em] text-slate-900">
                      Ưu đãi dành cho bạn
                    </div>
                    <div className="mt-1 text-[14px] font-medium leading-6 text-slate-500">
                      Những món dễ chọn cho nhu cầu gần nhất sẽ được hiển thị trước.
                    </div>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                    <Clock3 size={15} className="text-slate-600" />
                    <span className="text-[12px] font-semibold text-slate-700">
                      {loading ? "Đang tải..." : `${filteredProducts.length} món đang hiển thị`}
                    </span>
                  </div>
                </div>

                {noMatchedSupermarket && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800">
                    Khu vực bạn chọn hiện chưa có siêu thị phù hợp. Bạn có thể đổi khu vực để xem thêm ưu đãi.
                  </div>
                )}

                {error && (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[306px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                    {filteredProducts.map((item) => (
                      <ProductCard key={item.lotId} product={item} onAdd={handleAddToCart} />
                    ))}
                  </div>
                )}

                {!loading && !filteredProducts.length && (
                  <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <div className="text-[18px] font-semibold tracking-[-0.01em] text-slate-900">
                      Chưa có món phù hợp để hiển thị
                    </div>
                    <p className="mt-2 text-[14px] font-medium leading-6 text-slate-500">
                      {noMatchedSupermarket
                        ? "Khu vực hiện tại chưa có siêu thị phù hợp. Bạn thử đổi khu vực để xem thêm lựa chọn nhé."
                        : "Hiện chưa có dữ liệu phù hợp với danh mục bạn đang chọn."}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        noMatchedSupermarket ? setGateOpen(true) : setActiveCategory("Tất cả")
                      }
                      className={cn(primaryBtn, "mt-4 px-5 py-2.5 text-sm")}
                    >
                      {noMatchedSupermarket ? "Đổi khu vực" : "Xem tất cả"}
                    </button>
                  </div>
                )}

                {!!filteredProducts.length && (
                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-6 text-center">
                    <p className="text-[14px] font-medium leading-6 text-slate-500">
                      Bạn đã xem hết những ưu đãi hiện phù hợp với lựa chọn này.
                    </p>
                    <button
                      type="button"
                      onClick={() => setGateOpen(true)}
                      className={cn(secondaryBtn, "mt-4 px-5 py-2.5 text-sm font-semibold")}
                    >
                      Chọn lại khu vực
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="md:hidden">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex-1 text-[13px] font-medium text-slate-600">
                Giỏ hàng hiện có <span className="font-bold text-slate-900">{cartCount}</span> sản phẩm
              </div>
              <button
                type="button"
                className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="text-slate-800" size={18} />
                <span className="absolute -right-2 -top-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
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
