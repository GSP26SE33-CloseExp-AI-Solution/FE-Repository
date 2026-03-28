import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Bell, LogOut } from "lucide-react"

import Logo from "@/assets/logo.png"
import { BREAD_CRUMB_MAP } from "@/constants/breadcrumbs"
import { useAuthContext } from "@/contexts/AuthContext"

type BaseStaffHeaderProps = {
    portalSubtitle: string
    roleLabel: string
    profileRoute: string
    accentClass: string
    centerHint?: string
    extraMeta?: React.ReactNode
    headerActions?: React.ReactNode
}

const BaseStaffHeader = ({
    portalSubtitle,
    roleLabel,
    profileRoute,
    accentClass,
    centerHint,
    extraMeta,
    headerActions,
}: BaseStaffHeaderProps) => {
    const { user, logout } = useAuthContext()
    const navigate = useNavigate()
    const location = useLocation()

    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const breadcrumbs = useMemo(() => {
        const match = Object.keys(BREAD_CRUMB_MAP)
            .sort((a, b) => b.length - a.length)
            .find((key) => location.pathname.startsWith(key))

        return match ? BREAD_CRUMB_MAP[match] : []
    }, [location.pathname])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const avatarText = user?.fullName
        ? user.fullName.charAt(0).toUpperCase()
        : "U"

    return (
        <header className="fixed top-0 left-0 w-full h-20 backdrop-blur-xl bg-white/70 border-b border-white/40 z-50 shadow-sm">
            <div className="w-full h-full px-8 flex items-center gap-6">
                <div className="flex items-center gap-0 w-[310px] shrink-0">
                    <img
                        src={Logo}
                        alt="CloseExp AI"
                        className="w-20 h-20 object-contain shrink-0 translate-y-1"
                    />
                    <div className="-ml-2 leading-tight">
                        <p className="text-base font-bold text-gray-800">CloseExp AI</p>
                        <p className="text-sm text-gray-500">{portalSubtitle}</p>
                        {extraMeta ? <div className="mt-1">{extraMeta}</div> : null}
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={`${crumb}-${index}`} className="flex items-center gap-2">
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

                    {centerHint ? (
                        <p className="mt-1 text-xs text-gray-400 truncate">
                            {centerHint}
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {headerActions}

                    <button
                        type="button"
                        className="text-gray-500 hover:text-green-600 h-10 w-10 rounded-xl hover:bg-white/70 transition grid place-items-center"
                    >
                        <Bell size={20} />
                    </button>

                    <div className="relative" ref={ref}>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="flex items-center gap-3 hover:bg-white/60 px-3 py-2 rounded-xl transition"
                        >
                            <div
                                className={`w-9 h-9 rounded-full bg-gradient-to-br ${accentClass} text-white flex items-center justify-center font-bold`}
                            >
                                {avatarText}
                            </div>

                            <div className="flex flex-col text-left leading-tight">
                                <span className="font-medium text-gray-700">
                                    {user?.fullName ?? "Người dùng"}
                                </span>

                                <span className="text-xs text-gray-500">
                                    {roleLabel}
                                </span>
                            </div>
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false)
                                        navigate(profileRoute)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50"
                                >
                                    Hồ sơ
                                </button>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        setOpen(false)
                                        await logout()
                                        navigate("/", { replace: true })
                                    }}
                                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
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

export default BaseStaffHeader
