import React from "react"
import {
    ArrowUpRight,
    Bot,
    CalendarClock,
    ChartColumn,
    CircleAlert,
    ClipboardList,
    Package,
    Sparkles,
    Store,
    Tag,
    TrendingUp,
} from "lucide-react"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type StatCardProps = {
    title: string
    value: string
    hint: string
    icon: React.ReactNode
}

const StatCard: React.FC<StatCardProps> = ({ title, value, hint, icon }) => {
    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-200 bg-white",
                "p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                    {icon}
                </div>
            </div>
        </div>
    )
}

type MiniPanelProps = {
    title: string
    subtitle?: string
    children: React.ReactNode
    rightNode?: React.ReactNode
}

const MiniPanel: React.FC<MiniPanelProps> = ({
    title,
    subtitle,
    children,
    rightNode,
}) => {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    {subtitle ? (
                        <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
                    ) : null}
                </div>

                {rightNode}
            </div>

            <div className="p-4">{children}</div>
        </section>
    )
}

const lineWidths = ["w-[90%]", "w-[74%]", "w-[82%]", "w-[66%]"]
const chartHeights = ["h-16", "h-24", "h-14", "h-20", "h-28", "h-18", "h-12"]

const SupermarketDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-5">
                <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                <Store size={13} />
                                Supermarket Dashboard
                            </div>

                            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                Tổng quan vận hành siêu thị
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Theo dõi nhanh tình trạng sản phẩm, gợi ý giá AI, tiến độ đăng bán
                                và các đầu việc cần ưu tiên xử lý.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:min-w-[400px]">
                            {[
                                { label: "AI pricing", value: "12 mới", icon: <Bot size={15} /> },
                                { label: "Sắp hết hạn", value: "08 lot", icon: <CircleAlert size={15} /> },
                                { label: "Đã publish", value: "24 lot", icon: <Tag size={15} /> },
                                { label: "Hiệu suất", value: "Tốt", icon: <TrendingUp size={15} /> },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                                >
                                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700">
                                        {item.icon}
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Sản phẩm đang hiển thị"
                        value="128"
                        hint="Các lô đã publish và còn hiệu lực."
                        icon={<Package size={20} />}
                    />
                    <StatCard
                        title="Gợi ý giá AI mới"
                        value="12"
                        hint="Các lô vừa có đề xuất giá mới."
                        icon={<Sparkles size={20} />}
                    />
                    <StatCard
                        title="Lô sắp hết hạn"
                        value="08"
                        hint="Cần ưu tiên điều chỉnh giá sớm."
                        icon={<CalendarClock size={20} />}
                    />
                    <StatCard
                        title="Tác vụ đang chờ"
                        value="17"
                        hint="Xác nhận giá, kiểm tra lot, publish."
                        icon={<ClipboardList size={20} />}
                    />
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                    <MiniPanel
                        title="Xu hướng hoạt động"
                        subtitle="Khối placeholder để giữ bố cục trước khi nối dữ liệu thật."
                        rightNode={
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-500">
                                <ChartColumn size={13} />
                                7 ngày gần đây
                            </div>
                        }
                    >
                        <div className="flex h-[220px] items-end gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                            {chartHeights.map((height, index) => (
                                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                                    <div
                                        className={cn(
                                            "w-full rounded-t-xl rounded-b-sm bg-slate-300",
                                            height
                                        )}
                                    />
                                    <span className="text-[10px] font-medium text-slate-400">
                                        T{index + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </MiniPanel>

                    <MiniPanel
                        title="Nhắc việc ưu tiên"
                        subtitle="Một vài cụm nội dung để trang nhìn đỡ trống."
                    >
                        <div className="space-y-2.5">
                            {[
                                {
                                    title: "Xem lại các gợi ý giá AI mới",
                                    text: "Một số lô đang chờ staff xác nhận giá.",
                                },
                                {
                                    title: "Ưu tiên xử lý lô sắp hết hạn",
                                    text: "Có vài sản phẩm cần đẩy hiển thị sớm.",
                                },
                                {
                                    title: "Kiểm tra lot chưa hoàn tất đăng bán",
                                    text: "Vẫn còn tác vụ dở dang ở bước publish.",
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                {item.text}
                                            </p>
                                        </div>

                                        <div className="mt-0.5 text-slate-400">
                                            <ArrowUpRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </MiniPanel>
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <MiniPanel
                        title="Tình trạng workflow sản phẩm"
                        subtitle="Bố cục sẵn cho draft, verified, priced, published."
                    >
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                                { label: "Draft", value: "06" },
                                { label: "Verified", value: "11" },
                                { label: "Priced", value: "09" },
                                { label: "Published", value: "24" },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"
                                >
                                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                                        {item.label}
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-slate-900">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 space-y-3">
                            {lineWidths.map((width, index) => (
                                <div key={index} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Quy trình #{index + 1}</span>
                                        <span className="font-medium text-slate-700">
                                            {20 + index * 12}%
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100">
                                        <div className={cn("h-2 rounded-full bg-slate-300", width)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </MiniPanel>

                    <MiniPanel
                        title="Hoạt động gần đây"
                        subtitle="Khung placeholder để sau này thay bằng activity feed thật."
                    >
                        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                            {[
                                "Đã tạo mới 1 lot sản phẩm chờ định giá",
                                "AI vừa cập nhật đề xuất giá cho một số mặt hàng",
                                "Một lô sản phẩm đã được publish thành công",
                                "Có sản phẩm sắp chạm ngưỡng hết hạn hôm nay",
                                "Cần kiểm tra lại thông tin trước khi xuất bản",
                            ].map((item, index) => (
                                <div key={index} className="flex items-start gap-3 px-4 py-3">
                                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                                    <div className="min-w-0">
                                        <p className="text-sm leading-6 text-slate-800">{item}</p>
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            Vừa cập nhật gần đây
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </MiniPanel>
                </section>
            </div>
        </div>
    )
}

export default SupermarketDashboard
