import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    LogOut,
    Search,
    ShieldCheck,
    ShoppingCart,
    User as UserIcon,
} from "lucide-react"

import { useAuthContext } from "@/contexts/AuthContext"
import { useLogoutAll } from "@/hooks/useLogoutAll"
import Logo from "@/assets/logo.png"

const CustomerHeader = () => {
    const { user, roleName, logout } = useAuthContext()
    const { logoutAll, loggingOutAll } = useLogoutAll()
    const navigate = useNavigate()

    const CART_ROUTE = "/cart"
    const LOGIN_ROUTE = "/login"
    const PROFILE_ROUTE = "/vendor/profile"

    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const CART_KEY = "customer_cart_v1"

    type CartItem = { qty: number }

    const getCartTotalQty = () => {
        try {
            const raw = localStorage.getItem(CART_KEY)
            const items = raw ? (JSON.parse(raw) as CartItem[]) : []
            return items.reduce((sum, it) => sum + (it.qty ?? 0), 0)
        } catch {
            return 0
        }
    }

    const handleViewCart = () => {
        if (!user) {
            navigate(LOGIN_ROUTE, {
                state: { redirectTo: CART_ROUTE },
            })
            return
        }

        navigate(CART_ROUTE)
    }

    const handleLogoutAll = async () => {
        const confirmed = window.confirm(
            "Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị không? Bạn sẽ cần đăng nhập lại sau khi tiếp tục."
        )

        if (!confirmed) return

        await logoutAll()
    }

    const [cartCount, setCartCount] = useState<number>(() => getCartTotalQty())

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const sync = () => setCartCount(getCartTotalQty())

        const handleStorage = (e: StorageEvent) => {
            if (e.key === CART_KEY) sync()
        }

        window.addEventListener("focus", sync)
        window.addEventListener("storage", handleStorage)
        window.addEventListener("cart:updated", sync as EventListener)

        sync()

        return () => {
            window.removeEventListener("focus", sync)
            window.removeEventListener("storage", handleStorage)
            window.removeEventListener("cart:updated", sync as EventListener)
        }
    }, [])

    const avatarText = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "?"

    return (
        <header className="fixed top-0 left-0 z-50 h-20 w-full border-b border-white/40 bg-white/70 shadow-sm backdrop-blur-xl">
            <div className="flex h-full w-full items-center justify-between gap-6 px-8">
                <div className="flex items-center gap-0">
                    <img
                        src={Logo}
                        alt="CloseExp AI"
                        className="h-20 w-20 shrink-0 object-contain translate-y-1.5"
                    />
                    <div className="-ml-2 leading-tight">
                        <p className="text-base font-bold text-gray-800">CloseExp AI</p>
                        <p className="text-sm text-gray-500">Mua sắm thông minh, giảm lãng phí</p>
                    </div>
                </div>

                <div className="hidden max-w-2xl flex-1 md:flex">
                    <div className="flex w-full items-center gap-3 rounded-xl border border-white/40 bg-white/80 px-4 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-200">
                        <Search className="text-gray-400" size={18} />
                        <input
                            className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
                            placeholder="Tìm kiếm tại đây..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="mr-2 hidden items-center gap-5 text-sm lg:flex">
                        <button
                            className="font-semibold text-gray-800"
                            onClick={() => navigate("/")}
                            type="button"
                        >
                            Trang Chủ
                        </button>
                        <button
                            className="font-medium text-gray-600 transition hover:text-gray-800"
                            onClick={() => navigate("/shop")}
                            type="button"
                        >
                            Cửa Hàng
                        </button>
                        <button
                            className="font-medium text-gray-600 transition hover:text-gray-800"
                            onClick={() => navigate("/impact")}
                            type="button"
                        >
                            Tác Động
                        </button>
                    </nav>

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
                            <span className="absolute -right-2 -top-2 rounded-full bg-green-400 px-2 py-0.5">
                                <span className="text-[10px] font-bold text-gray-900">
                                    {cartCount}
                                </span>
                            </span>
                        )}
                    </button>

                    {!user ? (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2.5 font-semibold text-white shadow-md transition-all duration-300 active:scale-95"
                            >
                                Đăng nhập
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/register")}
                                className="rounded-lg border border-gray-200 px-4 py-2.5 font-medium text-gray-600 transition hover:bg-gray-50"
                            >
                                Tạo tài khoản
                            </button>
                        </div>
                    ) : (
                        <div className="relative" ref={ref}>
                            <button
                                type="button"
                                onClick={() => setOpen((v) => !v)}
                                className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/60"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 font-bold text-white">
                                    {avatarText}
                                </div>

                                <div className="hidden flex-col text-left leading-tight sm:flex">
                                    <span className="font-medium text-gray-700">
                                        {user.fullName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {roleName ?? "Vendor"}
                                    </span>
                                </div>
                            </button>

                            {open && (
                                <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
                                    <div className="border-b border-gray-100 px-4 py-3">
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
                                            navigate("/")
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
                </div>
            </div>
        </header>
    )
}

export default CustomerHeader
