import React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Home, ShieldX } from "lucide-react"

import UICommonBackground from "@/components/uiCommon/UICommonBackground"

const Forbidden: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_32%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)]" />
      <UICommonBackground />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/8 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300">
            <ShieldX className="h-8 w-8" />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
            403 Error
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Truy cập bị từ chối
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            Bạn không có quyền truy cập vào trang này.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.99]"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.99]"
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

export default Forbidden
