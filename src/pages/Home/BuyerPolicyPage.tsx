import React from "react"
import { ArrowLeft, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"

const SUPPORT_EMAIL = "closedexp@gmail.com"

const BuyerPolicyPage: React.FC = () => {
    const navigate = useNavigate()

    const handleContactClick = () => {
        const subject = "Yêu cầu hỗ trợ CloseExp AI"
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
            SUPPORT_EMAIL,
        )}&su=${encodeURIComponent(subject)}`

        window.open(gmailUrl, "_blank", "noopener,noreferrer")
    }

    const policySections = [
        {
            title: "1. Thông tin sản phẩm",
            content:
                "CloseExp AI hiển thị các thông tin quan trọng như tên sản phẩm, siêu thị cung cấp, đơn vị bán, giá bán, số lượng còn lại và hạn sử dụng. Người mua nên kiểm tra kỹ thông tin trước khi thêm sản phẩm vào giỏ hàng và thanh toán.",
        },
        {
            title: "2. Sản phẩm gần hạn",
            content:
                "Các sản phẩm trên nền tảng có thể là sản phẩm gần đến hạn sử dụng nhưng vẫn còn trong thời gian được phép bán. Người mua cần cân nhắc nhu cầu sử dụng và ưu tiên dùng sản phẩm trong thời gian phù hợp theo hạn sử dụng được hiển thị.",
        },
        {
            title: "3. Giá bán và thanh toán",
            content:
                "Giá sản phẩm được hiển thị tại thời điểm đặt hàng. Tổng tiền thanh toán có thể bao gồm giá sản phẩm, phí giao hàng, ưu đãi áp dụng và các khoản phí liên quan nếu có. Đơn hàng chỉ được xử lý sau khi thanh toán thành công.",
        },
        {
            title: "4. Nhận hàng và giao hàng",
            content:
                "Người mua cần chọn đúng phương thức nhận hàng, địa chỉ hoặc điểm nhận hàng, ngày nhận và khung giờ phù hợp. CloseExp AI xử lý đơn dựa trên thông tin người mua đã cung cấp trong quá trình đặt hàng.",
        },
        {
            title: "5. Hủy đơn và hoàn tiền",
            content:
                "Người mua có thể hủy đơn trong phạm vi thời gian được hệ thống cho phép. Với các trường hợp thanh toán lỗi, đơn không thể xử lý, giao hàng thất bại hoặc phát sinh vấn đề hợp lệ, yêu cầu hoàn tiền sẽ được xem xét theo trạng thái thực tế của đơn hàng.",
        },
        {
            title: "6. Kiểm tra khi nhận hàng",
            content:
                "Khi nhận hàng, người mua nên kiểm tra sản phẩm, số lượng, tình trạng đóng gói và thông tin hạn sử dụng. Nếu phát hiện vấn đề, người mua nên liên hệ hỗ trợ sớm để được kiểm tra và xử lý.",
        },
        {
            title: "7. Trách nhiệm sau khi nhận hàng",
            content:
                "Sau khi đơn hàng đã được bàn giao thành công, người mua có trách nhiệm bảo quản và sử dụng sản phẩm đúng cách. CloseExp AI không chịu trách nhiệm cho các vấn đề phát sinh do bảo quản sai cách hoặc sử dụng sản phẩm sau thời hạn phù hợp.",
        },
        {
            title: "8. Tài khoản và thông tin cá nhân",
            content:
                "Người mua cần cung cấp thông tin chính xác khi đăng ký, đặt hàng và nhận hàng. CloseExp AI sử dụng thông tin tài khoản, địa chỉ và liên hệ để phục vụ việc xử lý đơn, giao nhận, hỗ trợ khách hàng và cải thiện trải nghiệm sử dụng.",
        },
        {
            title: "9. Hỗ trợ khách hàng",
            content:
                "Nếu cần hỗ trợ về đơn hàng, thanh toán, giao nhận hoặc tài khoản, người mua có thể gửi email đến bộ phận hỗ trợ của CloseExp AI. Vui lòng mô tả rõ vấn đề và cung cấp mã đơn hàng nếu có để được xử lý nhanh hơn.",
        },
    ]

    return (
        <main className="min-h-screen bg-white">
            <section className="mx-auto max-w-[980px] px-5 py-10 md:px-8 md:py-14">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-500 transition hover:text-emerald-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                </button>

                <header className="mt-8 border-b border-slate-100 pb-8">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                        Chính sách dành cho người mua
                    </p>

                    <h1 className="mt-4 max-w-[760px] text-[32px] font-bold leading-tight tracking-[-0.04em] text-slate-850 md:text-[44px]">
                        Điều khoản & chính sách sử dụng CloseExp AI
                    </h1>

                    <p className="mt-4 max-w-[720px] text-[15px] leading-7 text-slate-500">
                        Trang này giúp người mua hiểu rõ các nguyên tắc khi đặt hàng, thanh
                        toán, nhận hàng, kiểm tra sản phẩm gần hạn và liên hệ hỗ trợ trong quá
                        trình sử dụng CloseExp AI.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-500 px-5 text-[13px] font-semibold text-white transition hover:bg-emerald-600 active:scale-95"
                        >
                            Về trang mua hàng
                        </button>

                        <button
                            type="button"
                            onClick={handleContactClick}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600 active:scale-95"
                        >
                            <Mail className="h-4 w-4" />
                            Liên hệ hỗ trợ
                        </button>
                    </div>
                </header>

                <section className="py-8">
                    <div className="grid gap-7">
                        {policySections.map((section) => (
                            <article key={section.title} className="border-b border-slate-100 pb-6 last:border-b-0">
                                <h2 className="text-[16px] font-bold text-slate-800">
                                    {section.title}
                                </h2>
                                <p className="mt-2 text-[14px] leading-7 text-slate-500">
                                    {section.content}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5 md:flex md:items-center md:justify-between md:gap-6">
                    <div>
                        <h2 className="text-[16px] font-bold text-slate-800">
                            Cần hỗ trợ thêm?
                        </h2>
                        <p className="mt-1 text-[13px] leading-6 text-slate-500">
                            Gửi email cho CloseExp AI, hộp thư sẽ được mở với địa chỉ nhận đã điền sẵn.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleContactClick}
                        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-[13px] font-semibold text-white transition hover:bg-emerald-600 active:scale-95 md:mt-0"
                    >
                        <Mail className="h-4 w-4" />
                        Gửi mail hỗ trợ
                    </button>
                </section>
            </section>
        </main>
    )
}

export default BuyerPolicyPage
