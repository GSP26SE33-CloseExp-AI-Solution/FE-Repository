import { useEffect, useState, ChangeEvent } from "react"
import { getExpiryStatus } from "../utils/productHelpers"
import { getProductsBySupermarket } from "@/services/product.service"
import { mapProductApiToUI } from "../utils/mapProductApiToUI"
import { Product } from "@/types/product.type"

const ITEMS_PER_PAGE = 10

export const useProductsList = (supermarketId: string) => {
    const [keyword, setKeyword] = useState("")
    const [searchType, setSearchType] = useState("Tất cả")
    const [expiryFilter, setExpiryFilter] = useState("Tất cả")
    const [currentPage, setCurrentPage] = useState(1)

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value)
        setCurrentPage(1)
    }

    // FILTER KEYWORD
    const filteredByKeyword = products.filter(p => {
        const kw = keyword.toLowerCase()
        if (!kw) return true

        switch (searchType) {
            case "Tên sản phẩm":
                return p.name.toLowerCase().includes(kw)
            case "Phân loại":
                return p.category.toLowerCase().includes(kw)
            case "Thương hiệu":
                return p.brand.toLowerCase().includes(kw)
            case "Xuất xứ":
                return p.origin.toLowerCase().includes(kw)
            default:
                return (
                    p.name.toLowerCase().includes(kw) ||
                    p.category.toLowerCase().includes(kw) ||
                    p.brand.toLowerCase().includes(kw) ||
                    p.origin.toLowerCase().includes(kw)
                )
        }
    })

    // FILTER EXPIRY
    const filteredProducts = filteredByKeyword.filter(p => {
        const status = getExpiryStatus(p.expiry).label
        if (expiryFilter === "Tất cả") return true
        return status === expiryFilter
    })

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const currentProducts = filteredProducts.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    )

    const goNext = () => currentPage < totalPages && setCurrentPage(p => p + 1)
    const goPrev = () => currentPage > 1 && setCurrentPage(p => p - 1)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)

                const data = await getProductsBySupermarket(supermarketId)

                const items = data.items ?? data ?? []

                if (items.length > 0) {
                    const mapped = items.map(mapProductApiToUI)
                    setProducts(mapped)
                } else {
                    setProducts([])
                }
            } catch (err) {
                console.error("Failed to fetch products:", err)
                setProducts([])
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
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
        currentProducts,
        loading,

        setSearchType,
        setExpiryFilter,
        handleSearchChange,
        goNext,
        goPrev,
    }
}
