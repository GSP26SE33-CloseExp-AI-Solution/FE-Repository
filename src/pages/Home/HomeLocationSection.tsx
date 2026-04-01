import { MapPin, PackageCheck, Truck } from "lucide-react"
import type { CustomerOrderContext } from "@/types/order.type"
import { cn } from "@/utils/home"
import { secondaryBtn } from "@/constants/home.constants"

type Props = {
    deliveryCtx: CustomerOrderContext
    currentLocationText: string
    onOpenGate: () => void
    onReset: () => void
}

const HomeLocationSection = ({
    deliveryCtx,
    currentLocationText,
    onOpenGate,
    onReset,
}: Props) => {
    return (
        <section className="rounded-[24px] border border-emerald-100 bg-white px-4 py-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                            Khu vực mua sắm
                        </span>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                            {deliveryCtx.deliveryMethodId === "DELIVERY" ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <Truck size={12} />
                                    Giao tận nơi
                                </span>
                            ) : deliveryCtx.deliveryMethodId === "PICKUP" ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <PackageCheck size={12} />
                                    Nhận tại điểm hẹn
                                </span>
                            ) : (
                                "Chưa chọn"
                            )}
                        </span>
                    </div>

                    <div className="mt-2.5 flex items-start gap-2">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                        <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                                Áp dụng cho khu vực
                            </div>
                            <div className="mt-1 text-[14px] font-medium leading-5 text-slate-700">
                                {currentLocationText}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onOpenGate}
                        className={cn(secondaryBtn, "px-4 py-2.5 text-[12.5px] font-semibold")}
                    >
                        Đổi khu vực
                    </button>

                    <button
                        type="button"
                        onClick={onReset}
                        className={cn(secondaryBtn, "px-4 py-2.5 text-[12.5px] font-semibold")}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </section>
    )
}

export default HomeLocationSection
