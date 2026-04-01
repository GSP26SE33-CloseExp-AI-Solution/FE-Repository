import { Leaf, Store, UtensilsCrossed } from "lucide-react"
import type { HomeStatCard } from "@/types/home.type"

const StatIcon = ({ kind }: { kind: HomeStatCard["icon"] }) => {
    const common = "text-slate-800"
    if (kind === "meals") return <UtensilsCrossed size={16} className={common} />
    if (kind === "co2") return <Leaf size={16} className={common} />
    return <Store size={16} className={common} />
}

const HomeStatsSection = ({ stats }: { stats: HomeStatCard[] }) => {
    return (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {stats.map((item) => (
                <div
                    key={item.title}
                    className="rounded-[20px] border border-slate-200 bg-white px-4 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-[16px] bg-gradient-to-br from-emerald-50 to-sky-50">
                            <StatIcon kind={item.icon} />
                        </div>
                        <div className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9.5px] font-semibold text-slate-600">
                            Hôm nay
                        </div>
                    </div>

                    <div className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        {item.title}
                    </div>
                    <div className="mt-1 text-[24px] font-bold tracking-[-0.03em] text-slate-900">
                        {item.value}
                    </div>
                    <div className="mt-1.5 text-[12px] font-medium leading-5 text-slate-500">
                        {item.note}
                    </div>
                </div>
            ))}
        </section>
    )
}

export default HomeStatsSection
