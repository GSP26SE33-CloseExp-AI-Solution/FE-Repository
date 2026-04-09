import { useEffect, useState } from "react"

import { supermarketService } from "@/services/supermarket.service"
import { categoryService } from "@/services/category.service"
import axiosClient from "@/utils/axiosClient"
import { orderContextStorage } from "@/utils/orderStorage"

import type { CustomerOrderContext } from "@/types/order.type"
import type {
    HomeCategoryItem,
    HomeProductLotApiItem,
    HomeProductLotsResponse,
} from "@/types/home.type"

export const useHomeBootstrap = (deliveryCtx: CustomerOrderContext) => {
    const [productsRaw, setProductsRaw] = useState<HomeProductLotApiItem[]>([])
    const [availableSupermarkets, setAvailableSupermarkets] = useState<
        NonNullable<CustomerOrderContext["nearbySupermarkets"]>
    >([])
    const [categoriesMaster, setCategoriesMaster] = useState<HomeCategoryItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchBootstrapData = async () => {
            if (!orderContextStorage.isContextSufficientForShopping(deliveryCtx)) {
                setProductsRaw([])
                setAvailableSupermarkets([])
                setCategoriesMaster([])
                setError("")
                setLoading(false)
                return
            }

            setLoading(true)
            setError("")

            try {
                const [supermarketsResult, categoriesResult, response] = await Promise.all([
                    supermarketService.getAvailableSupermarkets(),
                    categoryService.getCategories(false),
                    axiosClient.get<HomeProductLotsResponse>("/customers/stocklots/available", {
                        params: {
                            pageNumber: 1,
                            pageSize: 100,
                        },
                    }),
                ])

                setAvailableSupermarkets(supermarketsResult)
                setCategoriesMaster(
                    categoriesResult.map((item) => ({
                        value: item.categoryId,
                        label: item.name,
                        count: 0,
                    }))
                )

                const items = response.data?.data?.items ?? []
                setProductsRaw(items)

                if (!items.length) {
                    setError("Hiện chưa có ưu đãi phù hợp để hiển thị.")
                }
            } catch (err) {
                console.error("[Home] bootstrap failed:", err)
                setError("Không tải được dữ liệu trang chủ.")
                setProductsRaw([])
                setAvailableSupermarkets([])
                setCategoriesMaster([])
            } finally {
                setLoading(false)
            }
        }

        void fetchBootstrapData()
    }, [deliveryCtx])

    return {
        productsRaw,
        availableSupermarkets,
        categoriesMaster,
        loading,
        error,
        setError,
    }
}
