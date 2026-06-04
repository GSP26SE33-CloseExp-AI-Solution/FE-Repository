import React from "react"
import { ArrowUpRight, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"

const SUPPORT_EMAIL = "closedexp@gmail.com"

const CustomerFooter: React.FC = () => {
    const navigate = useNavigate()

    const handleContactClick = () => {
        const subject = "Yêu cầu hỗ trợ CloseExp AI"
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
            SUPPORT_EMAIL,
        )}&su=${encodeURIComponent(subject)}`

        window.open(gmailUrl, "_blank", "noopener,noreferrer")
    }

    const footerLinks = [
        { label: "Về chúng tôi", onClick: () => navigate("/about") },
        { label: "Điều khoản & chính sách", onClick: () => navigate("/buyer-policy") },
        { label: "Liên hệ hỗ trợ", onClick: handleContactClick },
    ]

    return (
        <footer className="w-full border-t border-emerald-100/70 bg-[linear-gradient(180deg,#ffffff_0%,#f8fffb_100%)]">
            <div className="mx-auto max-w-[1440px] px-5 py-4 md:px-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="w-full md:max-w-[280px]">
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="text-left text-[16px] font-bold tracking-[-0.01em] text-slate-700 transition hover:text-emerald-600"
                        >
                            CloseExp AI
                        </button>

                        <p className="mt-2 max-w-[250px] text-[12px] leading-5 text-slate-400">
                            Giảm lãng phí thực phẩm qua từng món hời. Hãy tham gia cùng chúng tôi.
                        </p>

                        <p className="mt-3 text-[10.5px] text-slate-400">
                            © {new Date().getFullYear()} CloseExp AI Việt Nam
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                        <div className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
                            {footerLinks.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={item.onClick}
                                    className="text-[12px] font-medium text-slate-500 transition hover:text-emerald-600"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <p className="max-w-[360px] text-left text-[11.5px] leading-5 text-slate-400 md:text-right">
                            Hỗ trợ các vấn đề về đơn hàng, thanh toán và tài khoản người mua.
                        </p>

                        <button
                            type="button"
                            onClick={handleContactClick}
                            className="inline-flex h-[38px] w-fit items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#6ee7b7_0%,#34d399_100%)] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:shadow-md active:scale-95"
                        >
                            <Mail className="h-4 w-4" />
                            Gửi mail hỗ trợ
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>

                        <p className="text-[11px] text-slate-400">{SUPPORT_EMAIL}</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default CustomerFooter
