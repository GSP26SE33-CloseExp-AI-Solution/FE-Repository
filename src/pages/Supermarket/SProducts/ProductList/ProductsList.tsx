import { useNavigate } from "react-router-dom"
import { ProductDraft } from "@/types/product.type";
import { useProductsList } from "./hooks/useProductsList"
import * as helpers from "./utils/productHelpers"

import ProductsTopBar from "./components/ProductsTopBar"
import ExpiryLegend from "./components/ExpiryLegend"
import ProductsTable from "./components/ProductsTable"
import PaginationBar from "./components/PaginationBar"

const ProductsList = () => {
    const navigate = useNavigate()

    const handleAddProduct = () => {
        navigate("/supermarket/products/add")
    }

    const supermarketId = "123" // tạm fake
    const productsList = useProductsList(supermarketId)

    return (
        <div className="w-full">
            <ProductsTopBar
                keyword={productsList.keyword}
                searchType={productsList.searchType}
                onSearchChange={productsList.handleSearchChange}
                onSearchTypeChange={productsList.setSearchType}
                onAddProduct={handleAddProduct}
            />

            <ExpiryLegend />

            <ProductsTable
                products={productsList.currentProducts}
                expiryFilter={productsList.expiryFilter}
                onExpiryFilterChange={productsList.setExpiryFilter}
                formatDate={helpers.formatDate}
                formatPrice={helpers.formatPrice}
                calcDiscount={helpers.calcDiscount}
                getExpiryStatus={helpers.getExpiryStatus}
                getDaysLeft={helpers.getDaysLeft}
            />

            <PaginationBar
                currentPage={productsList.currentPage}
                totalPages={productsList.totalPages}
                goPrev={productsList.goPrev}
                goNext={productsList.goNext}
            />
        </div>
    )
}

export default ProductsList;
