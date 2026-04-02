import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    LogOut,
    Menu,
    Search,
    ShieldCheck,
    ShoppingCart,
    Store,
    Tag,
    User as UserIcon,
    X,
} from "lucide-react"

import { useAuthContext } from "@/contexts/AuthContext"
import { useLogoutAll } from "@/hooks/useLogoutAll"
import Logo from "@/assets/logo.png"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

const SEARCH_INDEX_KEY = "customer_visible_search_index_v1"

type SearchableProductItem = {
    type: "product"
    lotId: string
    productId: string
    name: string
    category?: string
    supermarketId?: string
    supermarketName?: string
    imageUrl?: string
    price?: number
}

type SearchableCategoryItem = {
    type: "category"
    key: string
    label: string
    count?: number
}

type SearchIndexPayload = {
    products: SearchableProductItem[]
    categories: SearchableCategoryItem[]
    updatedAt?: string
}

type CartItem = { qty: number }

const HOME_ROUTE = "/"
const IMPACT_ROUTE = "/impact"
const PARTNER_ROUTE = "/partner/register"
const CART_ROUTE = "/cart"
const LOGIN_ROUTE = "/login"
const PROFILE_ROUTE = "/vendor/profile"
const CART_KEY = "customer_cart_v1"

const getPartnerDestinationByRole = (roleName?: string | null) => {
    switch (roleName) {
        case "Vendor":
            return PARTNER_ROUTE
        case "SupermarketStaff":
            return "/supermarketStaff/dashboard"
        case "Admin":
            return "/admin"
        case "PackagingStaff":
            return "/package/orders"
        case "MarketingStaff":
            return "/marketing/profile"
        default:
            return PARTNER_ROUTE
    }
}

const CustomerHeader = () => {
    const { user, roleName, logout } = useAuthContext()
    const { logoutAll, loggingOutAll } = useLogoutAll()
    const navigate = useNavigate()
    const location = useLocation()

    const [open, setOpen] = useState(false)
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const [searchExpanded, setSearchExpanded] = useState(false)
    const [searchKeyword, setSearchKeyword] = useState("")
    const [searchIndex, setSearchIndex] = useState<SearchIndexPayload>({
        products: [],
        categories: [],
    })
    const [cartCount, setCartCount] = useState<number>(0)

    const ref = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const navItems = useMemo(
        () => [
            { label: "Trang Chủ", key: "home" as const },
            { label: "Cửa Hàng", key: "shop" as const },
            { label: "Tác Động", key: "impact" as const },
            { label: "Đối Tác", key: "partner" as const },
        ],
        []
    )

    const getCartTotalQty = () => {
        try {
            const raw = localStorage.getItem(CART_KEY)
            const items = raw ? (JSON.parse(raw) as CartItem[]) : []
            return items.reduce((sum, it) => sum + (it.qty ?? 0), 0)
        } catch {
            return 0
        }
    }

    const loadSearchIndex = () => {
        try {
            const raw = localStorage.getItem(SEARCH_INDEX_KEY)
            if (!raw) {
                setSearchIndex({ products: [], categories: [] })
                return
            }

            const parsed = JSON.parse(raw) as SearchIndexPayload
            setSearchIndex({
                products: Array.isArray(parsed.products) ? parsed.products : [],
                categories: Array.isArray(parsed.categories) ? parsed.categories : [],
                updatedAt: parsed.updatedAt,
            })
        } catch {
            setSearchIndex({ products: [], categories: [] })
        }
    }

    const currentQuery = new URLSearchParams(location.search)
    const currentView = currentQuery.get("view")

    const isActiveNav = (key: "home" | "shop" | "impact" | "partner") => {
        if (key === "impact") {
            return (
                location.pathname === IMPACT_ROUTE ||
                location.pathname.startsWith(`${IMPACT_ROUTE}/`)
            )
        }

        if (key === "partner") {
            return (
                location.pathname === PARTNER_ROUTE ||
                location.pathname.startsWith(`${PARTNER_ROUTE}/`)
            )
        }

        if (location.pathname !== HOME_ROUTE) return false

        if (key === "shop") {
            return currentView === "shop"
        }

        if (key === "home") {
            return currentView !== "shop"
        }

        return false
    }

    const normalizedKeyword = searchKeyword.trim().toLowerCase()

    const suggestedProducts = useMemo(() => {
        if (!normalizedKeyword) return searchIndex.products.slice(0, 5)

        return searchIndex.products
            .filter((item) => {
                const name = item.name?.toLowerCase() ?? ""
                const category = item.category?.toLowerCase() ?? ""
                const market = item.supermarketName?.toLowerCase() ?? ""

                return (
                    name.includes(normalizedKeyword) ||
                    category.includes(normalizedKeyword) ||
                    market.includes(normalizedKeyword)
                )
            })
            .slice(0, 6)
    }, [normalizedKeyword, searchIndex.products])

    const suggestedCategories = useMemo(() => {
        if (!normalizedKeyword) return searchIndex.categories.slice(0, 4)

        return searchIndex.categories
            .filter((item) => item.label.toLowerCase().includes(normalizedKeyword))
            .slice(0, 4)
    }, [normalizedKeyword, searchIndex.categories])

    const closeAllMenus = () => {
        setMobileNavOpen(false)
        setOpen(false)
    }

    const goHome = () => {
        navigate(HOME_ROUTE)
        closeAllMenus()
    }

    const goShop = () => {
        navigate(`${HOME_ROUTE}?view=shop`)
        closeAllMenus()

        requestAnimationFrame(() => {
            window.dispatchEvent(new CustomEvent("home:scroll-products"))
        })
    }

    const goImpact = () => {
        navigate(IMPACT_ROUTE)
        closeAllMenus()
    }

    const goPartner = () => {
        if (!user) {
            navigate(LOGIN_ROUTE, {
                state: { redirectTo: PARTNER_ROUTE },
            })
            closeAllMenus()
            return
        }

        navigate(getPartnerDestinationByRole(roleName))
        closeAllMenus()
    }

    const handleNavClick = (key: "home" | "shop" | "impact" | "partner") => {
        if (key === "home") {
            goHome()
            return
        }

        if (key === "shop") {
            goShop()
            return
        }

        if (key === "impact") {
            goImpact()
            return
        }

        goPartner()
    }

    const handleViewCart = () => {
        if (!user) {
            navigate(LOGIN_ROUTE, {
                state: { redirectTo: CART_ROUTE },
            })
            return
        }

        navigate(CART_ROUTE)
        setMobileNavOpen(false)
    }

    const handleLogoutAll = async () => {
        const confirmed = window.confirm(
            "Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị không? Bạn sẽ cần đăng nhập lại sau khi tiếp tục."
        )

        if (!confirmed) return
        await logoutAll()
    }

    const openSearch = () => {
        setSearchExpanded(true)
        window.setTimeout(() => {
            searchInputRef.current?.focus()
        }, 20)
    }

    const goHomeWithSearch = (params: URLSearchParams) => {
        params.set("view", "shop")

        const query = params.toString()
        navigate(`${HOME_ROUTE}?${query}`)

        setSearchExpanded(false)
        setMobileNavOpen(false)
        setSearchKeyword("")
        setOpen(false)

        requestAnimationFrame(() => {
            window.dispatchEvent(new CustomEvent("home:apply-search-from-header"))
            window.dispatchEvent(new CustomEvent("home:scroll-products"))
        })
    }

    const handleSubmitSearch = () => {
        const keyword = searchKeyword.trim()
        const params = new URLSearchParams()

        if (keyword) params.set("q", keyword)

        goHomeWithSearch(params)
    }

    const handlePickProduct = (item: SearchableProductItem) => {
        const params = new URLSearchParams()
        params.set("q", item.name)
        params.set("lotId", item.lotId)
        if (item.category) params.set("category", item.category)

        goHomeWithSearch(params)
    }

    const handlePickCategory = (item: SearchableCategoryItem) => {
        const params = new URLSearchParams()
        params.set("category", item.label)

        goHomeWithSearch(params)
    }

    useEffect(() => {
        setCartCount(getCartTotalQty())
        loadSearchIndex()
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }

            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchExpanded(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const syncCart = () => setCartCount(getCartTotalQty())

        const handleStorage = (e: StorageEvent) => {
            if (e.key === CART_KEY) syncCart()
            if (e.key === SEARCH_INDEX_KEY) loadSearchIndex()
        }

        const handleSearchIndexUpdated = () => loadSearchIndex()

        window.addEventListener("focus", syncCart)
        window.addEventListener("storage", handleStorage)
        window.addEventListener("cart:updated", syncCart as EventListener)
        window.addEventListener(
            "customer:search-index-updated",
            handleSearchIndexUpdated as EventListener
        )

        return () => {
            window.removeEventListener("focus", syncCart)
            window.removeEventListener("storage", handleStorage)
            window.removeEventListener("cart:updated", syncCart as EventListener)
            window.removeEventListener(
                "customer:search-index-updated",
                handleSearchIndexUpdated as EventListener
            )
        }
    }, [])

    useEffect(() => {
        setOpen(false)
        setMobileNavOpen(false)
    }, [location.pathname, location.search])

    useEffect(() => {
        if (!mobileNavOpen) return

        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [mobileNavOpen])

    const avatarText = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "?"

    return (
        <>
            <header className="fixed top-0 left-0 z-50 h-20 w-full border-b border-white/40 bg-white/70 shadow-sm backdrop-blur-xl">
                <div className="flex h-full w-full items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={goHome}
                        className="flex items-center gap-0"
                        aria-label="Về trang chủ"
                    >
                        <img
                            src={Logo}
                            alt="CloseExp AI"
                            className="h-20 w-20 shrink-0 object-contain translate-y-1.5"
                        />
                        <div className="-ml-2 leading-tight">
                            <p className="text-base font-bold text-gray-800">CloseExp AI</p>
                            <p className="text-sm text-gray-500">Mua sắm thông minh, giảm lãng phí</p>
                        </div>
                    </button>

                    <nav className="mr-1 hidden items-center gap-5 text-sm lg:flex">
                        {navItems.map((item) => {
                            const active = isActiveNav(item.key)

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => handleNavClick(item.key)}
                                    className={cn(
                                        "relative px-1 py-2 font-medium transition",
                                        active
                                            ? "font-semibold text-gray-800"
                                            : "text-gray-600 hover:text-gray-800"
                                    )}
                                >
                                    {item.label}
                                    {active && (
                                        <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-gradient-to-r from-green-400 to-emerald-500" />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="ml-auto flex items-center gap-2 sm:gap-3">
                        <div ref={searchRef} className="relative hidden md:block">
                            <div
                                className={cn(
                                    "overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-md transition-all duration-300",
                                    searchExpanded ? "w-[340px]" : "w-[46px]"
                                )}
                            >
                                <div className="flex h-[46px] items-center">
                                    <button
                                        type="button"
                                        onClick={openSearch}
                                        className="grid h-[46px] w-[46px] shrink-0 place-items-center text-gray-500 transition hover:text-gray-700"
                                        aria-label="Mở tìm kiếm"
                                    >
                                        <Search size={18} />
                                    </button>

                                    <input
                                        ref={searchInputRef}
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSubmitSearch()
                                            if (e.key === "Escape") setSearchExpanded(false)
                                        }}
                                        className={cn(
                                            "w-full bg-transparent pr-4 text-sm text-gray-700 outline-none placeholder:text-gray-400 transition-opacity duration-200",
                                            searchExpanded
                                                ? "opacity-100"
                                                : "pointer-events-none opacity-0"
                                        )}
                                        placeholder="Tìm sản phẩm, danh mục..."
                                    />
                                </div>
                            </div>

                            {searchExpanded && (
                                <div className="absolute right-0 mt-3 w-[360px] overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                                    <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 via-white to-green-50/70 px-4 py-3">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Tìm trong khu vực hiện tại
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Gợi ý từ danh sách sản phẩm đang hiển thị
                                        </p>
                                    </div>

                                    <div className="max-h-[420px] overflow-y-auto p-3">
                                        {suggestedCategories.length > 0 && (
                                            <div>
                                                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                                                    Danh mục
                                                </p>

                                                <div className="space-y-1">
                                                    {suggestedCategories.map((item) => (
                                                        <button
                                                            key={item.key}
                                                            type="button"
                                                            onClick={() => handlePickCategory(item)}
                                                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-gray-50"
                                                        >
                                                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                                <Tag size={16} />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-medium text-slate-800">
                                                                    {item.label}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {item.count ?? 0} sản phẩm đang hiển thị
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {suggestedProducts.length > 0 && (
                                            <div className={cn(suggestedCategories.length > 0 && "mt-3")}>
                                                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                                                    Sản phẩm
                                                </p>

                                                <div className="space-y-1">
                                                    {suggestedProducts.map((item) => (
                                                        <button
                                                            key={`${item.lotId}-${item.productId}`}
                                                            type="button"
                                                            onClick={() => handlePickProduct(item)}
                                                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-gray-50"
                                                        >
                                                            <div className="h-12 w-12 overflow-hidden rounded-2xl bg-gray-100">
                                                                {item.imageUrl ? (
                                                                    <img
                                                                        src={item.imageUrl}
                                                                        alt={item.name}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="grid h-full w-full place-items-center text-xs text-gray-400">
                                                                        AI
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-medium text-slate-800">
                                                                    {item.name}
                                                                </p>
                                                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                                                    {item.category || "Thực phẩm"}
                                                                    {item.supermarketName
                                                                        ? ` • ${item.supermarketName}`
                                                                        : ""}
                                                                </p>
                                                            </div>

                                                            {typeof item.price === "number" && (
                                                                <div className="shrink-0 text-right">
                                                                    <p className="text-sm font-semibold text-emerald-600">
                                                                        {new Intl.NumberFormat("vi-VN").format(item.price)}₫
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {suggestedProducts.length === 0 &&
                                            suggestedCategories.length === 0 && (
                                                <div className="px-3 py-8 text-center">
                                                    <p className="text-sm font-medium text-slate-700">
                                                        Không tìm thấy gợi ý phù hợp
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Thử tên sản phẩm hoặc danh mục khác
                                                    </p>
                                                </div>
                                            )}
                                    </div>

                                    <div className="border-t border-gray-100 px-3 py-3">
                                        <button
                                            type="button"
                                            onClick={handleSubmitSearch}
                                            className="w-full rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 active:scale-95"
                                        >
                                            Xem kết quả trong cửa hàng
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleViewCart}
                            className="relative h-[47px] w-[44px] rounded-xl border border-gray-100 bg-white shadow-md transition hover:bg-gray-50"
                            aria-label="Giỏ hàng"
                        >
                            <div className="grid h-full w-full place-items-center">
                                <ShoppingCart className="text-gray-800" size={22} />
                            </div>

                            {cartCount > 0 && (
                                <span className="absolute -right-2 -top-2 rounded-full bg-green-400 px-2 py-0.5 shadow-sm">
                                    <span className="text-[10px] font-bold text-gray-900">
                                        {cartCount}
                                    </span>
                                </span>
                            )}
                        </button>

                        {!user ? (
                            <div className="hidden items-center gap-2 sm:flex">
                                <button
                                    type="button"
                                    onClick={() => navigate(LOGIN_ROUTE)}
                                    className="rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2.5 font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg active:scale-95"
                                >
                                    Đăng nhập
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/register")}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-600 transition hover:bg-gray-50"
                                >
                                    Tạo tài khoản
                                </button>
                            </div>
                        ) : (
                            <div className="relative hidden sm:block" ref={ref}>
                                <button
                                    type="button"
                                    onClick={() => setOpen((v) => !v)}
                                    className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/60"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 font-bold text-white shadow-sm">
                                        {avatarText}
                                    </div>

                                    <div className="hidden flex-col text-left leading-tight lg:flex">
                                        <span className="max-w-[140px] truncate font-medium text-gray-700">
                                            {user.fullName}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {roleName ?? "Vendor"}
                                        </span>
                                    </div>
                                </button>

                                {open && (
                                    <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-[24px] border border-white/70 bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                                        <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 via-white to-green-50/80 px-4 py-4">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {user.fullName}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                                {user.email}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOpen(false)
                                                navigate(PROFILE_ROUTE)
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-gray-50"
                                        >
                                            <UserIcon size={16} className="text-gray-600" />
                                            <span>Hồ sơ</span>
                                        </button>

                                        {roleName === "Vendor" && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOpen(false)
                                                    navigate(PARTNER_ROUTE)
                                                }}
                                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-emerald-50"
                                            >
                                                <Store size={16} className="text-emerald-600" />
                                                <span>Trở thành đối tác</span>
                                            </button>
                                        )}

                                        <div className="mx-4 h-px bg-gray-100" />

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setOpen(false)
                                                await handleLogoutAll()
                                            }}
                                            disabled={loggingOutAll}
                                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <ShieldCheck size={16} className="mt-0.5 text-rose-600" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">
                                                    {loggingOutAll
                                                        ? "Đang xử lý..."
                                                        : "Đăng xuất tất cả thiết bị"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Thu hồi toàn bộ phiên đang đăng nhập
                                                </p>
                                            </div>
                                        </button>

                                        <div className="mx-4 h-px bg-gray-100" />

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setOpen(false)
                                                await logout()
                                                navigate(HOME_ROUTE)
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 transition hover:bg-red-50"
                                        >
                                            <LogOut size={16} />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(true)}
                            className="grid h-[47px] w-[44px] place-items-center rounded-xl border border-gray-100 bg-white shadow-md transition hover:bg-gray-50 lg:hidden"
                            aria-label="Mở menu"
                        >
                            <Menu size={20} className="text-gray-800" />
                        </button>
                    </div>
                </div>
            </header>

            <div
                className={cn(
                    "fixed inset-0 z-[60] lg:hidden",
                    mobileNavOpen ? "pointer-events-auto" : "pointer-events-none"
                )}
            >
                <div
                    className={cn(
                        "absolute inset-0 bg-slate-900/30 backdrop-blur-[3px] transition-opacity duration-300",
                        mobileNavOpen ? "opacity-100" : "opacity-0"
                    )}
                    onClick={() => setMobileNavOpen(false)}
                />

                <div
                    className={cn(
                        "absolute right-0 top-0 h-full w-[88%] max-w-[360px] border-l border-white/40 bg-gradient-to-b from-white via-emerald-50/40 to-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition-transform duration-300",
                        mobileNavOpen ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <div className="border-b border-white/60 bg-white/70 px-5 py-5 backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-base font-bold text-gray-800">Điều hướng nhanh</p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Truy cập nhanh các khu vực chính
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setMobileNavOpen(false)}
                                className="grid h-10 w-10 place-items-center rounded-2xl border border-white/60 bg-white/80 text-gray-600 shadow-sm transition hover:bg-white"
                                aria-label="Đóng menu"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/60 bg-white/80 p-2 shadow-sm">
                            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-3">
                                <Search size={16} className="text-gray-400" />
                                <input
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSubmitSearch()
                                        }
                                    }}
                                    className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                                    placeholder="Tìm sản phẩm, danh mục..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-4">
                        <div className="rounded-[28px] border border-white/70 bg-white/80 p-3 shadow-[0_12px_35px_rgba(16,24,40,0.08)]">
                            {navItems.map((item) => {
                                const active = isActiveNav(item.key)

                                return (
                                    <button
                                        key={`${item.key}-mobile`}
                                        type="button"
                                        onClick={() => handleNavClick(item.key)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                                            active
                                                ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700"
                                                : "text-gray-700 hover:bg-gray-50"
                                        )}
                                    >
                                        <span>{item.label}</span>
                                        {active && (
                                            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {!user ? (
                            <div className="mt-4 space-y-3 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_12px_35px_rgba(16,24,40,0.08)]">
                                <button
                                    type="button"
                                    onClick={() => navigate(LOGIN_ROUTE)}
                                    className="w-full rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 active:scale-95"
                                >
                                    Đăng nhập
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/register")}
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                >
                                    Tạo tài khoản
                                </button>
                            </div>
                        ) : (
                            <div className="mt-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_12px_35px_rgba(16,24,40,0.08)]">
                                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-green-50 px-3 py-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 font-bold text-white shadow-sm">
                                        {avatarText}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {user.fullName}
                                        </p>
                                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileNavOpen(false)
                                            navigate(PROFILE_ROUTE)
                                        }}
                                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-gray-50"
                                    >
                                        <UserIcon size={16} className="text-gray-600" />
                                        <span>Hồ sơ</span>
                                    </button>

                                    {roleName === "Vendor" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileNavOpen(false)
                                                navigate(PARTNER_ROUTE)
                                            }}
                                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-emerald-50"
                                        >
                                            <Store size={16} className="text-emerald-600" />
                                            <span>Trở thành đối tác</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setMobileNavOpen(false)
                                            await handleLogoutAll()
                                        }}
                                        disabled={loggingOutAll}
                                        className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <ShieldCheck size={16} className="mt-0.5 text-rose-600" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {loggingOutAll
                                                    ? "Đang xử lý..."
                                                    : "Đăng xuất tất cả thiết bị"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Thu hồi toàn bộ phiên đang đăng nhập
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setMobileNavOpen(false)
                                            await logout()
                                            navigate(HOME_ROUTE)
                                        }}
                                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-red-600 transition hover:bg-red-50"
                                    >
                                        <LogOut size={16} />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default CustomerHeader
