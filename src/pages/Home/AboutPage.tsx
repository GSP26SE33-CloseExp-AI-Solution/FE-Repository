import React from "react"
import { ArrowRight, BrainCircuit, Clock3, Leaf, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"

const AboutPage: React.FC = () => {
    const navigate = useNavigate()

    const values = [
        {
            title: "Minh bạch khi mua",
            description:
                "Người mua có thể xem rõ thông tin sản phẩm, hạn sử dụng, giá bán và siêu thị cung cấp trước khi đặt hàng.",
        },
        {
            title: "Tiết kiệm có chọn lọc",
            description:
                "CloseExp AI tập trung vào các sản phẩm gần hạn còn phù hợp để sử dụng, giúp người mua có thêm lựa chọn giá tốt.",
        },
        {
            title: "Hỗ trợ vận hành bằng AI",
            description:
                "AI được dùng để hỗ trợ nhận diện thông tin sản phẩm và gợi ý giá, nhưng các bước quan trọng vẫn có nhân viên kiểm tra.",
        },
    ]

    const process = [
        "Siêu thị đăng sản phẩm gần hạn lên hệ thống.",
        "Thông tin sản phẩm, hạn dùng và giá bán được kiểm tra trước khi hiển thị.",
        "Người mua chọn sản phẩm, phương thức nhận hàng và thanh toán.",
        "Đơn hàng được đóng gói, bàn giao và cập nhật trạng thái trên hệ thống.",
    ]

    return (
        <main className="min-h-screen bg-white">
            <section className="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-14">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-[13px] font-semibold text-slate-500 transition hover:text-emerald-600"
                >
                    ← Về trang chủ
                </button>

                <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                            Về CloseExp AI
                        </p>

                        <h1 className="mt-4 max-w-[720px] text-[34px] font-bold leading-tight tracking-[-0.04em] text-slate-850 md:text-[46px]">
                            Mua sản phẩm gần hạn dễ hơn, rõ ràng hơn và tiết kiệm hơn.
                        </h1>

                        <p className="mt-5 max-w-[650px] text-[15px] leading-7 text-slate-500">
                            CloseExp AI là nền tảng giúp người mua tiếp cận các sản phẩm gần hạn
                            với mức giá phù hợp. Mỗi sản phẩm được hiển thị kèm thông tin cần
                            thiết như hạn sử dụng, đơn vị bán, siêu thị cung cấp và trạng thái
                            còn hàng để người mua dễ dàng cân nhắc trước khi đặt.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-[13px] font-semibold text-white transition hover:bg-emerald-600 active:scale-95"
                            >
                                Xem sản phẩm
                                <ArrowRight className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/buyer-policy")}
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600 active:scale-95"
                            >
                                Xem chính sách người mua
                            </button>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-6">
                        <div className="grid gap-5">
                            <div>
                                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Mục tiêu
                                </p>
                                <p className="mt-2 text-[20px] font-bold leading-snug text-slate-800">
                                    Giúp thực phẩm còn giá trị được sử dụng đúng lúc, đúng nhu cầu.
                                </p>
                            </div>

                            <div className="h-px bg-slate-200/80" />

                            <div className="grid gap-4">
                                <div className="flex gap-3">
                                    <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                    <p className="text-[13px] leading-6 text-slate-500">
                                        Góp phần giảm lãng phí thực phẩm thông qua việc kết nối nguồn hàng gần hạn với người mua phù hợp.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                    <p className="text-[13px] leading-6 text-slate-500">
                                        Tập trung vào sự rõ ràng: giá, hạn dùng, số lượng và thông tin nhận hàng đều được trình bày trước khi thanh toán.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                    <p className="text-[13px] leading-6 text-slate-500">
                                        Hỗ trợ đặt và nhận hàng theo khung giờ để quá trình xử lý đơn thuận tiện hơn.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="mt-14 border-t border-slate-100 pt-10">
                    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                                Điều chúng tôi ưu tiên
                            </p>
                            <h2 className="mt-3 text-[26px] font-bold tracking-[-0.03em] text-slate-800">
                                Trải nghiệm mua hàng đơn giản, rõ ràng và đáng tin cậy.
                            </h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {values.map((item) => (
                                <div key={item.title}>
                                    <h3 className="text-[14px] font-bold text-slate-750">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-[13px] leading-6 text-slate-500">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-12 rounded-3xl border border-slate-100 bg-white p-6 md:p-8">
                    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <BrainCircuit className="h-5 w-5" />
                            </div>

                            <h2 className="mt-4 text-[24px] font-bold tracking-[-0.03em] text-slate-800">
                                CloseExp AI hoạt động như thế nào?
                            </h2>

                            <p className="mt-3 text-[13px] leading-6 text-slate-500">
                                Quy trình được thiết kế để người mua dễ theo dõi từ lúc chọn sản
                                phẩm đến khi nhận hàng.
                            </p>
                        </div>

                        <ol className="grid gap-4">
                            {process.map((item, index) => (
                                <li key={item} className="flex gap-4">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-500">
                                        {index + 1}
                                    </span>
                                    <p className="pt-0.5 text-[14px] leading-6 text-slate-600">
                                        {item}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>
            </section>
        </main>
    )
}

export default AboutPage
