import React, { useMemo, useState } from "react"
import {
  Search,
  ShoppingCart,
  AlarmClock,
  Clock,
  Utensils,
  Leaf,
  Tag,
} from "lucide-react"

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

const cn = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(" ")

const surfaceCard =
  "backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-6 border border-white/40"
const softCard = "bg-white shadow-lg rounded-2xl border border-gray-100"

const primaryBtn =
  "bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold rounded-lg shadow-md transition-all duration-300 active:scale-95"
const secondaryBtn =
  "border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"

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

const ProductCard: React.FC<{ deal: FlashDeal; onAdd?: (id: string) => void }> = ({
  deal,
  onAdd,
}) => {
  return (
    <div className={cn(softCard, "overflow-hidden hover:shadow-xl transition-shadow")}>
      <div className={cn("relative h-[192px] w-full", imageBg(deal.imageVariant))}>
        {/* discount */}
        <div className="absolute left-3 top-3 rounded-md bg-red-500 px-2 py-1 shadow-sm">
          <span className="text-[10px] font-bold text-white">
            {deal.discountLabel}
          </span>
        </div>

        {/* time left */}
        <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 shadow-sm border border-gray-100">
          <AlarmClock size={14} className="text-emerald-500" />
          <span className="text-[12px] font-semibold text-gray-800">
            {deal.timeLeft}
          </span>
        </div>

        {/* mock image tag */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-gray-200 bg-white/70 backdrop-blur px-3 py-1 text-[12px] font-medium text-gray-500">
            Ảnh sản phẩm (mock)
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[18px] font-bold text-gray-800">
              {deal.name}
            </div>
            <div className="mt-0.5 text-[12px] text-gray-500">
              {deal.subtitle}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[12px] text-red-500">
              {deal.originalPrice}
            </div>
            <div className="text-[20px] font-bold text-gray-800">
              {deal.price}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <div className="text-[10px] font-semibold text-gray-500">
              {deal.bestBeforeTitle}
            </div>
            <div
              className={cn(
                "text-[14px] font-semibold",
                deal.bestBeforeValue.includes("Ngày mai") ||
                  deal.bestBeforeValue.includes("Tối nay")
                  ? "text-red-500"
                  : "text-gray-800"
              )}
            >
              {deal.bestBeforeValue}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAdd?.(deal.id)}
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
  const [cartCount, setCartCount] = useState(3)
  const [activeCategory, setActiveCategory] = useState("Tất Cả Giảm Giá")

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

  const deals: FlashDeal[] = useMemo(
    () => [
      {
        id: "1",
        name: "Sữa Tươi Nguyên Chất",
        subtitle: "Hộp 1L • Whole Foods",
        originalPrice: "45.000đ",
        price: "18.000đ",
        discountLabel: "-60% GIẢM",
        timeLeft: "Còn 01:12:44",
        bestBeforeTitle: "Sử dụng tốt nhất trước",
        bestBeforeValue: "Ngày mai, 10:00 SA",
        imageVariant: "milk",
      },
      {
        id: "2",
        name: "Bánh Mì",
        subtitle: "750g • Daily Bakes",
        originalPrice: "60.000đ",
        price: "18.000đ",
        discountLabel: "-70% GIẢM",
        timeLeft: "Còn 00:45:12",
        bestBeforeTitle: "Sử dụng tốt nhất trước",
        bestBeforeValue: "Tối nay, 20:00 CH",
        imageVariant: "bread",
      },
      {
        id: "3",
        name: "Thịt Bò",
        subtitle: "450g • Butcher's Choice",
        originalPrice: "120.000đ",
        price: "60.000đ",
        discountLabel: "-50% GIẢM",
        timeLeft: "Còn 03:20:05",
        bestBeforeTitle: "Sử dụng tốt nhất trước",
        bestBeforeValue: "25 Tháng 1, 2024",
        imageVariant: "beef",
      },
      {
        id: "4",
        name: "Bơ Sáp (3 quả)",
        subtitle: "Loại A • Fresh Mart",
        originalPrice: "55.000đ",
        price: "33.000đ",
        discountLabel: "-40% GIẢM",
        timeLeft: "Còn 05:15:30",
        bestBeforeTitle: "Sử dụng tốt nhất trước",
        bestBeforeValue: "26 Tháng 1, 2024",
        imageVariant: "avocado",
      },
      {
        id: "5",
        name: "Sữa Chua Ít Đường",
        subtitle: "Lốc 4 • Dairy Home",
        originalPrice: "32.000đ",
        price: "16.000đ",
        discountLabel: "-50% GIẢM",
        timeLeft: "Còn 02:10:08",
        bestBeforeTitle: "Sử dụng tốt nhất trước",
        bestBeforeValue: "Ngày mai, 09:00 SA",
        imageVariant: "milk",
      },
      {
        id: "6",
        name: "Rau Xà Lách",
        subtitle: "500g • Green Farm",
        originalPrice: "25.000đ",
        price: "15.000đ",
        discountLabel: "-40% GIẢM",
        timeLeft: "Còn 06:22:19",
        bestBeforeTitle: "Sử dụng tốt nhất trước",
        bestBeforeValue: "Hôm nay, 18:00 CH",
        imageVariant: "avocado",
      },
    ],
    []
  )

  const filteredDeals = useMemo(() => {
    if (activeCategory === "Tất Cả Giảm Giá") return deals
    if (activeCategory === "Bánh Mì") return deals.filter((d) => d.name.toLowerCase().includes("bánh"))
    if (activeCategory === "Sữa & Trứng") return deals.filter((d) => d.name.toLowerCase().includes("sữa"))
    if (activeCategory === "Nông Sản") return deals.filter((d) => d.subtitle.toLowerCase().includes("farm"))
    if (activeCategory === "Thịt & Gia Cầm") return deals.filter((d) => d.name.toLowerCase().includes("thịt"))
    return deals
  }, [activeCategory, deals])

  const handleAdd = (id: string) => {
    setCartCount((n) => n + 1)
    console.log("add to cart", id)
  }

  return (
    <div className="min-h-[900px] w-full bg-[#F6F8F6] font-sans">
      <main className="w-full px-[40px] py-[24px]">
        <div className="flex flex-col gap-10">

          {/* HERO */}
          <section className={cn(surfaceCard, "overflow-hidden relative")}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.55),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.28),transparent_40%),linear-gradient(135deg,#0b1410,#143522,#2ECC71)]" />
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_60%_80%,rgba(255,255,255,0.35),transparent_45%)]" />

            <div className="relative space-y-5">
              <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1.5 backdrop-blur border border-white/15">
                <span className="text-[12px] font-bold text-white">
                  Tiết kiệm đến 70% hôm nay
                </span>
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

            {/* ASIDE */}
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
                          active
                            ? "bg-green-50 border-green-200"
                            : "bg-white/60 border-white/40 hover:bg-gray-50"
                        )}
                      >
                        <span className={cn(active ? "text-emerald-600" : "text-gray-600")}>
                          {c.icon}
                        </span>
                        <span
                          className={cn(
                            "text-[15px]",
                            active
                              ? "font-semibold text-emerald-700"
                              : "font-medium text-gray-700"
                          )}
                        >
                          {c.label}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>

            {/* DEALS */}
            <div className="flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[24px] font-extrabold text-gray-800">
                  Giảm Giá Sốc: Sắp Kết Thúc!
                </div>

                <div className="flex w-fit items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-2 shadow-sm">
                  <Clock size={18} className="text-emerald-600" />
                  <span className="text-[14px] font-semibold text-emerald-700">
                    Cập nhật sau 02:45:10
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDeals.map((d) => (
                  <ProductCard key={d.id} deal={d} onAdd={handleAdd} />
                ))}
              </div>

              <div className={cn(surfaceCard, "mt-8 p-8 text-center space-y-4")}>
                <p className="text-[16px] text-gray-500">
                  Bạn đã xem hết các ưu đãi hiện tại trong khu vực của mình.
                </p>
                <button
                  type="button"
                  className={cn(secondaryBtn, "px-6 py-2.5")}
                  onClick={() => console.log("refresh deals")}
                >
                  Làm Mới Ưu Đãi
                </button>
              </div>
            </div>
          </section>

          {/* MOBILE SEARCH */}
          <section className="md:hidden">
            <div className="w-full bg-white/80 shadow-md rounded-xl border border-white/40 flex items-center gap-3 px-4 py-3 focus-within:ring-2 focus-within:ring-green-200">
              <Search className="text-gray-400" size={18} />
              <input
                className="w-full bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                placeholder="Tìm kiếm sản phẩm tại đây"
              />
              <button
                type="button"
                className="relative h-10 w-10 rounded-xl bg-white shadow border border-gray-100"
                aria-label="Giỏ hàng"
              >
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