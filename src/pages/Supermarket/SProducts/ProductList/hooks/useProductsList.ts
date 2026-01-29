import { useState, ChangeEvent } from "react"
import { Product } from "../../../../../mocks/fakeProducts.mock"
import { getExpiryStatus } from "../utils/productHelpers"

const ITEMS_PER_PAGE = 10

export const useProductsList = (products: Product[]) => {
    const [keyword, setKeyword] = useState("")
    const [searchType, setSearchType] = useState("Tất cả")
    const [expiryFilter, setExpiryFilter] = useState("Tất cả")
    const [currentPage, setCurrentPage] = useState(1)

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

    return {
        keyword,
        searchType,
        expiryFilter,
        currentPage,
        totalPages,
        currentProducts,

        setSearchType,
        setExpiryFilter,
        handleSearchChange,
        goNext,
        goPrev,
    }
}
