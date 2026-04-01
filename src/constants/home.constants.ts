import type { HomeStatCard } from "@/types/home.type"

export const CART_ROUTE = "/cart"
export const LOGIN_ROUTE = "/login"

export const ALL_CATEGORY_KEY = "ALL"
export const ALL_MARKET_KEY = "ALL_MARKET"

export const primaryBtn =
    "rounded-xl bg-slate-900 text-white font-semibold transition hover:bg-slate-800 active:scale-[0.99]"

export const secondaryBtn =
    "rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"

export const buildHomeStats = (
    visibleCount: number,
    highlightCount: number,
    supermarketCount: number
): HomeStatCard[] => [
        {
            icon: "meals",
            title: "Ưu đãi đang có",
            value: `${visibleCount}`,
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
            value: `${supermarketCount}`,
            note: "Có thể phục vụ lựa chọn hiện tại",
        },
    ]
