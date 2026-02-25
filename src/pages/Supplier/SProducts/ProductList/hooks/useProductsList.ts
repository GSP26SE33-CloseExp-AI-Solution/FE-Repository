import { useEffect, useState, ChangeEvent, useMemo } from "react"
import { ProductLotUI } from "@/types/productLotUI.type"
import { getExpiryStatus } from "../utils/productHelpers"
import { productService  } from "@/services/product.service"
import { mapProductsToLotsUI } from "@/mappers/product.mapper"

const ITEMS_PER_PAGE = 10

export const useProductsList = (supermarketId: string) => {
    const [keyword, setKeyword] = useState("")
    const [searchType, setSearchType] = useState("Tất cả")
    const [expiryFilter, setExpiryFilter] = useState("Tất cả")
    const [currentPage, setCurrentPage] = useState(1)

    const [lots, setLots] = useState<ProductLotUI[]>([])
    const [loading, setLoading] = useState(false)

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value)
        setCurrentPage(1)
    }

    // 🔍 FILTER KEYWORD
    const filteredByKeyword = useMemo(() => {
        const kw = keyword.toLowerCase()
        if (!kw) return lots

        return lots.filter(lot => {
            switch (searchType) {
                case "Tên sản phẩm":
                    return lot.productName.toLowerCase().includes(kw)
                case "Phân loại":
                    return lot.category.toLowerCase().includes(kw)
                case "Thương hiệu":
                    return lot.brand.toLowerCase().includes(kw)
                case "Barcode":
                    return lot.barcode?.toLowerCase().includes(kw)
                default:
                    return (
                        lot.productName.toLowerCase().includes(kw) ||
                        lot.category.toLowerCase().includes(kw) ||
                        lot.brand.toLowerCase().includes(kw) ||
                        lot.barcode?.toLowerCase().includes(kw)
                    )
            }
        })
    }, [lots, keyword, searchType])

    // ⏳ FILTER EXPIRY
    const filteredLots = useMemo(() => {
        if (expiryFilter === "Tất cả") return filteredByKeyword

        return filteredByKeyword.filter(lot => {
            const status = getExpiryStatus(lot.expiryDate).label
            return status === expiryFilter
        })
    }, [filteredByKeyword, expiryFilter])

    // 📄 PAGINATION
    const totalPages = Math.ceil(filteredLots.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

    const currentLots = useMemo(() => {
        return filteredLots.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [filteredLots, startIndex])

    const goNext = () => currentPage < totalPages && setCurrentPage(p => p + 1)
    const goPrev = () => currentPage > 1 && setCurrentPage(p => p - 1)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                const res = await productService.getMySupermarket()
                const items = res.data?.data?.items ?? res.data?.items ?? []
                setLots(mapProductsToLotsUI(items))
            } catch (err) {
                console.error("Failed to fetch products:", err)
                setLots([])
            } finally {
                setLoading(false)
            }
        }

        if (supermarketId) fetchProducts()
    }, [supermarketId])

    useEffect(() => {
        setCurrentPage(1)
    }, [keyword, searchType, expiryFilter])

    return {
        keyword,
        searchType,
        expiryFilter,
        currentPage,
        totalPages,
        currentLots,
        loading,

        setSearchType,
        setExpiryFilter,
        handleSearchChange,
        goNext,
        goPrev,
    }
}
