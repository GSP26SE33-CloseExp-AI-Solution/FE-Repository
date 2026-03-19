import React from "react"

const CustomerFooter: React.FC = () => {
    return (
        <footer className="w-full bg-white/70 backdrop-blur-xl border-t border-white/40 shadow-sm">
            <div className="max-w-[1440px] mx-auto px-8 py-10">
                <div className="flex flex-col gap-10 lg:flex-row lg:gap-10">
                    {/* Brand */}
                    <div className="w-full lg:w-[300px]">
                        <div className="flex items-center gap-3">
                            <span className="text-[18px] font-bold text-gray-800">CloseExp AI</span>
                        </div>

                        <p className="mt-5 text-[14px] text-gray-500 leading-6">
                            Giảm lãng phí thực phẩm qua từng món hời. Hãy tham gia cùng chúng tôi.
                        </p>

                        <p className="mt-6 text-xs text-gray-400">
                            © {new Date().getFullYear()} CloseExp AI Việt Nam
                        </p>
                    </div>

                    {/* Quick links */}
                    <div className="w-full lg:w-[300px]">
                        <div className="text-[16px] font-bold text-gray-800">Liên Kết Nhanh</div>
                        <ul className="mt-4 space-y-2">
                            {["Cách thức hoạt động", "Trở thành đối tác", "Báo cáo tác động"].map((x) => (
                                <li key={x}>
                                    <a className="text-[14px] text-gray-500 hover:text-gray-800 transition" href="#">
                                        {x}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="w-full lg:w-[300px]">
                        <div className="text-[16px] font-bold text-gray-800">Hỗ Trợ</div>
                        <ul className="mt-4 space-y-2">
                            {["Trung tâm trợ giúp", "Liên hệ", "Điều khoản dịch vụ"].map((x) => (
                                <li key={x}>
                                    <a className="text-[14px] text-gray-500 hover:text-gray-800 transition" href="#">
                                        {x}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="w-full lg:w-[347px]">
                        <div className="text-[16px] font-bold text-gray-800">Cập Nhật Tin Tức</div>
                        <p className="mt-3 text-[14px] text-gray-500">
                            Nhận thông báo ưu đãi mới và các cập nhật quan trọng.
                        </p>

                        <div className="mt-4 flex gap-2">
                            <input
                                className="h-[52px] w-full rounded-xl bg-white shadow-md border border-gray-100 px-4 outline-none
                           focus:ring-2 focus:ring-green-200 placeholder:text-gray-400"
                                placeholder="email@example.com"
                            />
                            <button
                                type="button"
                                className="h-[52px] w-[118px] bg-gradient-to-r from-green-400 to-emerald-500
                           text-white font-semibold rounded-xl shadow-md
                           transition-all duration-300 active:scale-95"
                            >
                                Đăng ký
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default CustomerFooter