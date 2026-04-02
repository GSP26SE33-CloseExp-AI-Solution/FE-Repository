import React from "react"
import { useNavigate } from "react-router-dom"

import { useAuthContext } from "@/contexts/AuthContext"

const getPartnerDestinationByRole = (roleName?: string | null) => {
    switch (roleName) {
        case "Vendor":
            return "/partner/register"
        case "SupermarketStaff":
            return "/supermarketStaff/dashboard"
        case "Admin":
            return "/admin"
        case "PackagingStaff":
            return "/package/orders"
        case "MarketingStaff":
            return "/marketing/profile"
        default:
            return "/partner/register"
    }
}

const CustomerFooter: React.FC = () => {
    const navigate = useNavigate()
    const { user, roleName } = useAuthContext()

    const handlePartnerClick = () => {
        if (!user) {
            navigate("/login", {
                state: { redirectTo: "/partner/register" },
            })
            return
        }

        navigate(getPartnerDestinationByRole(roleName))
    }

    const quickLinks = [
        { label: "Cách thức hoạt động", onClick: () => navigate("/how-it-works") },
        { label: "Trở thành đối tác", onClick: handlePartnerClick },
        { label: "Báo cáo tác động", onClick: () => navigate("/impact") },
    ]

    const supportLinks = [
        { label: "Trung tâm trợ giúp", onClick: () => navigate("/help-center") },
        { label: "Liên hệ", onClick: () => navigate("/contact") },
        { label: "Điều khoản dịch vụ", onClick: () => navigate("/terms") },
    ]

    return (
        <footer className="w-full border-t border-emerald-100/70 bg-[linear-gradient(180deg,#ffffff_0%,#f8fffb_100%)]">
            <div className="mx-auto max-w-[1440px] px-5 py-3 md:px-8 md:py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                    <div className="w-full lg:w-[250px]">
                        <div className="text-[16px] font-bold tracking-[-0.01em] text-slate-700">
                            CloseExp AI
                        </div>

                        <p className="mt-2 max-w-[230px] text-[12px] leading-5 text-slate-400">
                            Giảm lãng phí thực phẩm qua từng món hời. Hãy tham gia cùng chúng tôi.
                        </p>

                        <p className="mt-3 text-[10.5px] text-slate-400">
                            © {new Date().getFullYear()} CloseExp AI Việt Nam
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto lg:gap-8">
                        <div className="w-full sm:w-[180px]">
                            <div className="text-[13px] font-semibold text-slate-700">
                                Liên Kết Nhanh
                            </div>

                            <ul className="mt-2 space-y-1">
                                {quickLinks.map((item) => (
                                    <li key={item.label}>
                                        <button
                                            type="button"
                                            onClick={item.onClick}
                                            className="text-left text-[12px] text-slate-400 transition hover:text-emerald-600"
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="w-full sm:w-[180px]">
                            <div className="text-[13px] font-semibold text-slate-700">Hỗ Trợ</div>

                            <ul className="mt-2 space-y-1">
                                {supportLinks.map((item) => (
                                    <li key={item.label}>
                                        <button
                                            type="button"
                                            onClick={item.onClick}
                                            className="text-left text-[12px] text-slate-400 transition hover:text-emerald-600"
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="w-full sm:w-[300px]">
                            <div className="text-[13px] font-semibold text-slate-700">
                                Cập Nhật Tin Tức
                            </div>

                            <p className="mt-2 text-[12px] leading-5 text-slate-400">
                                Nhận thông báo ưu đãi mới và các cập nhật quan trọng.
                            </p>

                            <div className="mt-2 flex gap-2">
                                <input
                                    className="h-[36px] w-full rounded-lg border border-emerald-50 bg-white px-3 text-[12px] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-100"
                                    placeholder="email@example.com"
                                />
                                <button
                                    type="button"
                                    className="h-[36px] min-w-[84px] rounded-lg bg-[linear-gradient(135deg,#6ee7b7_0%,#34d399_100%)] px-3 text-[12px] font-semibold text-white transition active:scale-95"
                                >
                                    Đăng ký
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default CustomerFooter
