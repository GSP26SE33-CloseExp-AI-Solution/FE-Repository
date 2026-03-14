import React from "react"
import { useAuthContext } from "@/contexts/AuthContext"
import { Package, Sparkles, BadgeCheck } from "lucide-react"

const SupplierFooter: React.FC = () => {
    const { supermarketName } = useAuthContext()

    return (
        <footer className="w-full bg-white border-t border-gray-100">
            <div className="w-full px-8 py-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">
                            Trung tâm vận hành siêu thị
                        </span>
                        {supermarketName ? <span className="text-gray-400"> · </span> : null}
                        {supermarketName ? (
                            <span className="font-medium text-gray-700">{supermarketName}</span>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm"
                        >
                            <Package size={16} />
                            Quản lý sản phẩm
                        </button>

                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm"
                        >
                            <Sparkles size={16} />
                            Quét AI
                        </button>

                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm"
                        >
                            <BadgeCheck size={16} />
                            Quy trình duyệt
                        </button>
                    </div>

                    <div className="text-xs text-gray-400">
                        © {new Date().getFullYear()} CloseExp AI · phiên bản 1.0.0
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default SupplierFooter
