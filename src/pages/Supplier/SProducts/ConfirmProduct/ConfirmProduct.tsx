import React, { useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AddProductHeader from "../AddProduct/components/AddProductHeader";
import ProductImagesPreview from "./components/ProductImagesPreview";
import RequiredFieldsForm from "./components/RequiredFieldsForm/RequiredFieldsForm";
import ActionButtons from "./components/ActionButtons";

import { Product } from "@/types/aiProduct.type";
import { validateProduct } from "./utils/validateProduct";
import { productService } from "@/services/product.service";

const ConfirmProduct: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { product, images } = location.state as {
        product: Product;
        images: string[];
    };

    /* ===== init ===== */
    const initialProductRef = useRef<Product>(product);
    const [currentProduct, setCurrentProduct] = useState<Product>(product);

    /* ===== validation ===== */
    const { isValid, missingFields } = useMemo(
        () => validateProduct(currentProduct),
        [currentProduct]
    );

    /* ===== reset ===== */
    const handleResetAll = () => {
        setCurrentProduct(initialProductRef.current);
    };

    const resetSection = (fields: (keyof Product)[]) => {
        setCurrentProduct((prev) => {
            const updated = { ...prev } as Product;

            fields.forEach((key) => {
                (updated as Record<keyof Product, Product[keyof Product]>)[key] =
                    initialProductRef.current[key];
            });

            return updated;
        });
    };

    /* ===== actions ===== */
    const handleBack = () => navigate(-1);

    const handleSaveDraft = () => {
        console.log("SAVE DRAFT PRODUCT", currentProduct);
        toast.success("Đã lưu nháp sản phẩm");
    };

    const handleSubmit = async () => {
        if (!isValid) {
            toast.error(`Còn thiếu ${missingFields.length} trường bắt buộc`);
            return;
        }

        try {
            const verifiedProduct = await productService.verifyProduct(
                currentProduct.productId,
                {
                    name: currentProduct.name,
                    brand: currentProduct.brand,
                    category: currentProduct.category,
                    barcode: currentProduct.barcode,
                    originalPrice: currentProduct.originalPrice,
                    expiryDate: currentProduct.expiryDate,
                    manufactureDate: currentProduct.manufactureDate,
                    verifiedBy: currentProduct.createdBy,
                }
            );

            toast.success("Xác nhận sản phẩm thành công");

            navigate("/supplier/products/pricing", {
                state: {
                    product: verifiedProduct,
                    images,
                },
            });
        } catch {
            toast.error("Xác nhận sản phẩm thất bại");
        }
    };

    /* ===== pricing rule ===== */
    const canSuggestPrice = currentProduct.status === 1;

    return (
        <div className="w-full min-h-screen bg-white">
            <AddProductHeader />

            <div className="px-6 py-4">
                <div className="grid grid-cols-10 gap-6">
                    <div className="col-span-3">
                        <ProductImagesPreview images={images} />
                    </div>

                    <div className="col-span-7 space-y-6">
                        <RequiredFieldsForm
                            product={currentProduct}
                            onChange={setCurrentProduct}
                            onResetAll={handleResetAll}
                            onResetSection={resetSection}
                            locked={canSuggestPrice}
                        />

                        <ActionButtons
                            step="review"
                            onBack={handleBack}
                            onSaveDraft={handleSaveDraft}
                            onSubmit={handleSubmit}
                            disabled={!isValid}
                            missingCount={missingFields.length}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmProduct;
