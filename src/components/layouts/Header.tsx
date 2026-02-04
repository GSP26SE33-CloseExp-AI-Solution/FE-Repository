import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Bell, LogOut } from "lucide-react"

import { BREAD_CRUMB_MAP } from "@/constants/breadcrumbs"
import { useAuthContext } from "../../contexts/AuthContext"

import Logo from "@/assets/logo.png"

const Header = () => {
    const { user, roleName, supermarketName, logout } = useAuthContext()
    const navigate = useNavigate()

    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const location = useLocation()

    const getBreadcrumbs = (pathname: string): string[] => {
        const match = Object.keys(BREAD_CRUMB_MAP)
            .sort((a, b) => b.length - a.length)
            .find((key) => pathname.startsWith(key))
        return match ? BREAD_CRUMB_MAP[match] : []
    }

    const breadcrumbs = getBreadcrumbs(location.pathname)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () =>
            document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const avatarText = user?.fullName
        ? user.fullName.charAt(0).toUpperCase()
        : "U"

    return (
        <header className="fixed top-0 left-0 w-full h-20 backdrop-blur-xl bg-white/70 border-b border-white/40 z-50 shadow-sm">
            <div className="w-full h-full px-8 flex items-center">

                {/* LEFT */}
                <div className="flex items-center gap-3 w-[260px]">
                    <img src={Logo} alt="CloseExp AI" className="w-10 h-10" />
                    <div className="leading-tight">
                        <p className="font-bold text-gray-800">CloseExp AI</p>
                        <p className="text-xs text-gray-500">
                            Nền tảng mua bán thông minh
                        </p>
                    </div>
                </div>

                {/* CENTER */}
                <div className="flex items-center gap-2 flex-1 text-sm text-gray-500">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={index} className="flex items-center gap-2">
                            {index > 0 && <span>/</span>}
                            <span
                                className={
                                    index === breadcrumbs.length - 1
                                        ? "text-gray-800 font-medium"
                                        : ""
                                }
                            >
                                {crumb}
                            </span>
                        </span>
                    ))}
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-6">
                    <button className="text-gray-500 hover:text-green-600">
                        <Bell size={22} />
                    </button>

                    <div className="relative" ref={ref}>
                        <button
                            onClick={() => setOpen(!open)}
                            className="flex items-center gap-3 hover:bg-white/60 px-3 py-2 rounded-lg"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center font-bold">
                                {avatarText}
                            </div>

                            <div className="flex flex-col text-left leading-tight">
                                <span className="font-medium text-gray-700">
                                    {user?.fullName ?? "Người dùng"}
                                </span>

                                <span className="text-xs text-gray-500">
                                    {roleName}
                                    {supermarketName &&
                                        ` · ${supermarketName}`}
                                </span>
                            </div>
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg overflow-hidden">
                                <button
                                    onClick={() => navigate("/supplier/profile")}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                                >
                                    Hồ sơ
                                </button>

                                <button
                                    onClick={() => {
                                        console.log("🖱️ [UI] Logout button clicked")
                                        logout()
                                    }}
                                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <LogOut size={16} />
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
