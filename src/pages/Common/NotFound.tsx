import React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Compass, Home } from "lucide-react"

import UICommonBackground from "@/components/uiCommon/UICommonBackground"

const NotFound: React.FC = () => {
    const navigate = useNavigate()

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <UICommonBackground />

            <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/8 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
                        <Compass className="h-8 w-8" />
                    </div>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                        404 Error
                    </p>

                    <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
                        Trang không tồn tại
                    </h1>

                    <p className="mt-3 text-sm leading-7 text-slate-300">
                        Đường dẫn bạn truy cập không hợp lệ hoặc nội dung đã được di chuyển.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.99]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.99]"
                        >
                            <Home className="h-4 w-4" />
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NotFound
