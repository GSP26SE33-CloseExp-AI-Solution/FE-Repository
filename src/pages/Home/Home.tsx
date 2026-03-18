import React, { useEffect, useMemo, useState } from "react"
import {
  AlarmClock,
  Clock,
  Leaf,
  MapPin,
  ShoppingCart,
  Tag,
  Truck,
  PackageCheck,
  Utensils,
} from "lucide-react"

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

type StatCard = {
  icon: "meals" | "co2" | "deals"
  title: string
  value: string
  delta: string
}

type CategoryItem = {
  label: string
}

const imageBg = (variant?: MockProduct["imageVariant"]) => {
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

const makeProductsForSupermarket = (sm: Supermarket): MockProduct[] => {
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

const ProductCard: React.FC<{ product: MockProduct; onAdd: (item: MockProduct) => void }> = ({
  product,
  onAdd,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/50 bg-white shadow-lg transition hover:shadow-xl">
      <div className={cn("relative h-[192px] w-full", imageBg(product.imageVariant))}>
        <div className="absolute left-3 top-3 z-20 rounded-md bg-red-500 px-2 py-1 shadow-sm">
          <span className="text-[10px] font-bold text-white">{product.discountLabel}</span>
        </div>

        <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1.5 rounded-full border border-gray-100 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur">
          <AlarmClock size={14} className="text-emerald-500" />
          <span className="text-[12px] font-semibold text-gray-800">{product.timeLeft}</span>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <img
            src={`https://picsum.photos/seed/${encodeURIComponent(product.productId)}/500/500`}
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
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[12px] text-red-500 line-through">
              {product.originalPrice.toLocaleString("vi-VN")}đ
            </div>
            <div className="text-[20px] font-bold text-gray-800">
              {product.price.toLocaleString("vi-VN")}đ
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
  const [activeCategory, setActiveCategory] = useState("Tất Cả Giảm Giá")

  useEffect(() => {
    if (!deliveryStorage.isReady(deliveryCtx)) {
      setGateOpen(true)
    }
  }, [deliveryCtx])

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
      { label: "Tất Cả Giảm Giá" },
      { label: "Sữa & Trứng" },
      { label: "Bánh Mì" },
      { label: "Nông Sản" },
      { label: "Thịt & Gia Cầm" },
    ],
    []
  )

  const products = useMemo(() => {
    const supermarkets = deliveryCtx.nearbySupermarkets ?? []
    return supermarkets.flatMap(makeProductsForSupermarket)
  }, [deliveryCtx])

  const filteredProducts = useMemo(() => {
    if (activeCategory === "Tất Cả Giảm Giá") return products
    if (activeCategory === "Sữa & Trứng") return products.filter((p) => p.name.includes("Sữa"))
    if (activeCategory === "Bánh Mì") return products.filter((p) => p.name.includes("Bánh"))
    if (activeCategory === "Nông Sản") return products.filter((p) => p.name.includes("Bơ"))
    if (activeCategory === "Thịt & Gia Cầm") return products.filter((p) => p.name.includes("Thịt"))
    return products
  }, [activeCategory, products])

  const handleDoneGate = (value: DeliveryContext) => {
    deliveryStorage.set(value)
    setDeliveryCtx(value)
    setGateOpen(false)
  }

  const handleAddToCart = (item: MockProduct) => {
    cartStorage.add({
      productId: item.productId,
      supermarketId: item.supermarketId,
      name: item.name,
      price: item.price,
    })
    setCartCount(cartStorage.getTotalQty())
  }

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
                Số siêu thị phục vụ hiện tại: {deliveryCtx.nearbySupermarkets?.length ?? 0}
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
                Chọn khu vực nhận hàng trước, sau đó hệ thống sẽ hiển thị sản phẩm từ các siêu
                thị phù hợp gần bạn.
              </p>

              <button type="button" onClick={() => setGateOpen(true)} className={cn(primaryBtn, "px-6 py-3")}>
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
                          "rounded-xl border px-4 py-3 text-left text-sm transition",
                          active
                            ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                            : "border-slate-200 bg-white text-gray-700 hover:bg-slate-50"
                        )}
                      >
                        {item.label}
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
                    Dựa trên khu vực nhận hàng bạn đã chọn
                  </div>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-2 shadow-sm">
                  <Clock size={18} className="text-emerald-600" />
                  <span className="text-[14px] font-semibold text-emerald-700">
                    Cập nhật sau 02:45:10
                  </span>
                </div>
              </div>

              {!!deliveryCtx.nearbySupermarkets?.length && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {deliveryCtx.nearbySupermarkets.map((market) => (
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

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((item) => (
                  <ProductCard key={item.productId} product={item} onAdd={handleAddToCart} />
                ))}
              </div>

              {!filteredProducts.length && (
                <div className="mt-8 rounded-2xl border border-dashed border-sky-200 bg-white/80 p-8 text-center shadow-sm">
                  <div className="text-lg font-semibold text-slate-800">
                    Chưa có sản phẩm để hiển thị
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Bạn hãy chọn lại vị trí hoặc phương thức nhận hàng để tải danh sách phù hợp.
                  </p>
                  <button
                    type="button"
                    onClick={() => setGateOpen(true)}
                    className={cn(primaryBtn, "mt-4 px-5 py-2.5")}
                  >
                    Chọn lại vị trí
                  </button>
                </div>
              )}

              {!!filteredProducts.length && (
                <div className="mt-8 rounded-2xl border border-white/40 bg-white/80 p-8 text-center shadow-lg">
                  <p className="text-[16px] text-gray-500">
                    Bạn đã xem hết các ưu đãi hiện tại trong khu vực của mình.
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
