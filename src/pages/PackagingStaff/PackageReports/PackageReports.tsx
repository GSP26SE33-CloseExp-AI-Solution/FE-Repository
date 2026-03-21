import { BarChart3 } from "lucide-react"

const PackageReports = () => {
    return (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <BarChart3 className="h-7 w-7 text-slate-600" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">
                Báo cáo đóng gói
            </h1>
            <p className="mt-2 text-sm text-slate-500">
                Chờ bổ sung API thống kê cho Packaging Staff.
            </p>
        </div>
    )
}

export default PackageReports
