import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"

import { useProductsList } from "./hooks/useProductsList"
import * as helpers from "./utils/productHelpers"

import ProductsTopBar from "./components/ProductsTopBar"
import ExpiryLegend from "./components/ExpiryLegend"
import ProductsTable from "./components/ProductsTable"
import PaginationBar from "./components/PaginationBar"
import PriceConfirmationModal from "../PriceConfirmation/components/PriceConfirmationModal"

import { ProductLotUI } from "@/types/productLotUI.type"
import { PricingSuggestionResponse } from "@/types/verifiedProduct.type"
import { getPricingSuggestion, confirmProductPrice, publishProduct } from "@/services/product.service"
import { authStorage } from "@/utils/authStorage"

const ProductsList = () => {
    const navigate = useNavigate()

    const handleAddProduct = () => {
        navigate("/supplier/products/add")
    }

    const session = authStorage.get()
    const supermarketId = session?.user?.marketStaffInfo?.supermarket?.supermarketId ?? "123"
    const productsList = useProductsList(supermarketId)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedLot, setSelectedLot] = useState<ProductLotUI | null>(null)
    const [pricingSuggestion, setPricingSuggestion] = useState<PricingSuggestionResponse | null>(null)
    const [loadingPricing, setLoadingPricing] = useState(false)

    const handleConfirmPriceClick = async (lot: ProductLotUI) => {
        setSelectedLot(lot)
        setIsModalOpen(true)
        setLoadingPricing(true)
        setPricingSuggestion(null)

        try {
            const suggestion = await getPricingSuggestion(lot.productId, lot.originalPrice)
            setPricingSuggestion(suggestion)
        } catch (error) {
            console.error("Failed to get pricing suggestion:", error)
            toast.error("Không thể lấy gợi ý giá từ AI")
        } finally {
            setLoadingPricing(false)
        }
    }

    const handleConfirmPrice = async (finalPrice: number, acceptsSuggestion: boolean) => {
        if (!selectedLot) return

        try {
            const userId = session?.user?.userId ?? ""
            await confirmProductPrice(selectedLot.productId, {
                finalPrice,
                acceptsSuggestion,
                confirmedBy: userId
            })
            toast.success("Đã xác nhận giá thành công!")
            setIsModalOpen(false)
            setSelectedLot(null)

            // Reload products to update status
            window.location.reload()
        } catch (error) {
            console.error("Failed to confirm price:", error)
            toast.error("Không thể xác nhận giá. Vui lòng thử lại.")
        }
    }

    const handlePublishClick = async (lot: ProductLotUI) => {
        try {
            const userId = session?.user?.userId ?? ""
            await publishProduct(lot.productId, userId)
            toast.success("Sản phẩm đã được công khai!")

            // Reload products to update status
            window.location.reload()
        } catch (error) {
            console.error("Failed to publish product:", error)
            toast.error("Không thể công khai sản phẩm. Vui lòng thử lại.")
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedLot(null)
        setPricingSuggestion(null)
    }

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
                    onConfirmPrice={handleConfirmPriceClick}
                    onPublish={handlePublishClick}
                />

                {/* PAGINATION */}
                <PaginationBar
                    currentPage={productsList.currentPage}
                    totalPages={productsList.totalPages}
                    goPrev={productsList.goPrev}
                    goNext={productsList.goNext}
                />
            </div>

            {/* PRICE CONFIRMATION MODAL */}
            <PriceConfirmationModal
                isOpen={isModalOpen}
                product={selectedLot ? {
                    productId: selectedLot.productId,
                    supermarketId: supermarketId,
                    name: selectedLot.productName,
                    brand: selectedLot.brand,
                    category: selectedLot.category,
                    barcode: selectedLot.barcode || "",
                    isFreshFood: false,
                    weightType: 0,
                    status: selectedLot.productStatus || "",
                    createdAt: "",
                    imageUrl: selectedLot.imageUrl,
                    expiryDate: selectedLot.expiryDate,
                } : null}
                pricingSuggestion={pricingSuggestion}
                loading={loadingPricing}
                onConfirm={handleConfirmPrice}
                onClose={handleCloseModal}
            />
        </div>
    )
}

export default ProductsList
