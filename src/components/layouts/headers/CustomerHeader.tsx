import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Search,
    ShoppingCart,
    User as UserIcon,
    LogOut,
} from "lucide-react"

import { useAuthContext } from "@/contexts/AuthContext"
import Logo from "@/assets/logo.png"

const CustomerHeader = () => {
    const { user, roleName, logout } = useAuthContext()
    const navigate = useNavigate()

    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const avatarText = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "?"

    return (
        <header className="fixed top-0 left-0 w-full h-20 backdrop-blur-xl bg-white/70 border-b border-white/40 z-50 shadow-sm">
            <div className="w-full h-full px-8 flex items-center justify-between gap-6">

                {/* LEFT: Brand */}
                <div className="flex items-center gap-3">
                    <img src={Logo} alt="CloseExp AI" className="w-10 h-10" />
                    <div className="leading-tight">
                        <p className="font-bold text-gray-800">CloseExp AI</p>
                        <p className="text-xs text-gray-500">Mua sắm thông minh, giảm lãng phí</p>
                    </div>
                </div>

                {/* CENTER: Search */}
                <div className="hidden md:flex flex-1 max-w-2xl">
                    <div className="w-full bg-white/80 shadow-md rounded-xl border border-white/40 flex items-center gap-3 px-4 py-2 focus-within:ring-2 focus-within:ring-green-200">
                        <Search className="text-gray-400" size={18} />
                        <input
                            className="w-full bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                            placeholder="Tìm kiếm tại đây..."
                        />
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">

                    {/* NAV */}
                    <nav className="hidden lg:flex items-center gap-5 text-sm mr-2">
                        <button
                            className="font-semibold text-gray-800"
                            onClick={() => navigate("/")}
                            type="button"
                        >
                            Trang Chủ
                        </button>
                        <button
                            className="font-medium text-gray-600 hover:text-gray-800 transition"
                            onClick={() => navigate("/shop")}
                            type="button"
                        >
                            Cửa Hàng
                        </button>
                        <button
                            className="font-medium text-gray-600 hover:text-gray-800 transition"
                            onClick={() => navigate("/impact")}
                            type="button"
                        >
                            Tác Động
                        </button>
                    </nav>

                    {/* CART */}
                    <button
                        type="button"
                        onClick={() => navigate("/cart")}
                        className="relative h-[47px] w-[44px] rounded-xl bg-white shadow-md border border-gray-100 hover:bg-gray-50 transition"
                        aria-label="Giỏ hàng"
                    >
                        <div className="h-full w-full grid place-items-center">
                            <ShoppingCart className="text-gray-800" size={22} />
                        </div>

                        {/* mock badge */}
                        <span className="absolute -right-2 -top-2 rounded-full bg-green-400 px-2 py-0.5">
                            <span className="text-[10px] font-bold text-gray-900">3</span>
                        </span>
                    </button>

                    {/* AUTH AREA */}
                    {!user ? (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="bg-gradient-to-r from-green-400 to-emerald-500
                                           text-white font-semibold px-4 py-2.5 rounded-lg shadow-md
                                           transition-all duration-300 active:scale-95"
                            >
                                Đăng nhập
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/register")}
                                className="border border-gray-200 text-gray-600
                                           font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50
                                           transition"
                            >
                                Tạo tài khoản
                            </button>
                        </div>
                    ) : (
                        <div className="relative" ref={ref}>
                            <button
                                type="button"
                                onClick={() => setOpen((v) => !v)}
                                className="flex items-center gap-3 hover:bg-white/60 px-3 py-2 rounded-xl transition"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center font-bold">
                                    {avatarText}
                                </div>

                                <div className="hidden sm:flex flex-col text-left leading-tight">
                                    <span className="font-medium text-gray-700">
                                        {user.fullName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {roleName ?? "Vendor"}
                                    </span>
                                </div>
                            </button>

                            {open && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                    <button
                                        onClick={() => {
                                            setOpen(false)
                                            navigate("/vendor/profile")
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <UserIcon size={16} className="text-gray-600" />
                                        Hồ sơ
                                    </button>

                                    <button
                                        onClick={async () => {
                                            setOpen(false)
                                            await logout()
                                            navigate("/")
                                        }}
                                        className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Đăng xuất
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