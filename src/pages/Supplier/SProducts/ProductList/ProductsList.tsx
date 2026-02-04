import { useNavigate } from "react-router-dom"

import { useProductsList } from "./hooks/useProductsList"
import * as helpers from "./utils/productHelpers"

import ProductsTopBar from "./components/ProductsTopBar"
import ExpiryLegend from "./components/ExpiryLegend"
import ProductsTable from "./components/ProductsTable"
import PaginationBar from "./components/PaginationBar"

const ProductsList = () => {
    const navigate = useNavigate()

    const handleAddProduct = () => {
        navigate("/supplier/products/add")
    }

    const supermarketId = "123" // tạm fake
    const productsList = useProductsList(supermarketId)

    return (
        <div className="w-full min-h-screen bg-white">
            {/* PAGE CONTAINER */}
            <div className="max-w-[1400px] mx-auto px-6 pt-6 pb-10 space-y-6">

                {/* TOP BAR */}
                <ProductsTopBar
                    keyword={productsList.keyword}
                    searchType={productsList.searchType}
                    onSearchChange={productsList.handleSearchChange}
                    onSearchTypeChange={productsList.setSearchType}
                    onAddProduct={handleAddProduct}
                />

                {/* EXPIRY COLOR LEGEND */}
                <ExpiryLegend />

                {/* TABLE */}
                <ProductsTable
                    lots={productsList.currentLots}
                    expiryFilter={productsList.expiryFilter}
                    onExpiryFilterChange={productsList.setExpiryFilter}
                    formatDate={helpers.formatDate}
                    formatPrice={helpers.formatPrice}
                    calcDiscount={helpers.calcDiscount}
                    getExpiryStatus={helpers.getExpiryStatus}
                    getDaysLeft={helpers.getDaysLeft}
                />

                {/* PAGINATION */}
                <PaginationBar
                    currentPage={productsList.currentPage}
                    totalPages={productsList.totalPages}
                    goPrev={productsList.goPrev}
                    goNext={productsList.goNext}
                />
            </div>
        </div>
    )
}

export default ProductsList
