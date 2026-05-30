import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCcw } from "lucide-react"

import AdminSettingsPromotions from "@/pages/Admin/adminSettings/Promotions"
import { categoryService } from "@/services/category.service"
import { marketingPromotionService } from "@/services/marketing-promotion.service"
import type { CategoryItem, PromotionItem } from "@/types/admin.type"
import { showError } from "@/utils/toast"

const MarketingPromotions = () => {
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [promotions, setPromotions] = useState<PromotionItem[]>([])
    const [categories, setCategories] = useState<CategoryItem[]>([])

    const loadData = useCallback(async () => {
        try {
            const [promotionRows, categoryRows] = await Promise.all([
                marketingPromotionService.getPromotions(),
                categoryService.getCategories(true),
            ])
            setPromotions(promotionRows)
            setCategories(categoryRows)
        } catch (err) {
            showError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải dữ liệu khuyến mãi",
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        void loadData()
    }, [loadData])

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quản lý khuyến mãi
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Tạo, cập nhật, bật/tắt và theo dõi chi tiết chương trình ưu đãi.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setRefreshing(true)
                        void loadData()
                    }}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                    {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCcw className="h-4 w-4" />
                    )}
                    Làm mới
                </button>
            </div>

            <AdminSettingsPromotions
                loading={loading}
                promotions={promotions}
                categories={categories}
                onRefresh={loadData}
                client={marketingPromotionService}
                title="Danh sách khuyến mãi"
                description="Quản lý mã ưu đãi, giới hạn sử dụng và thời gian áp dụng."
            />
        </div>
    )
}

export default MarketingPromotions
