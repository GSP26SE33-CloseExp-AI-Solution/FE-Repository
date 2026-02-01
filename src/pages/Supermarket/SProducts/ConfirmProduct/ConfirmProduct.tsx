import React, { useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AddProductHeader from "../AddProduct/components/AddProductHeader";
import ProductImagesPreview from "./components/ProductImagesPreview";
import RequiredFieldsForm from "./components/RequiredFieldsForm/RequiredFieldsForm";
import ActionButtons from "./components/ActionButtons";

import { ProductDraft } from "@/types/product.type";
import { AiScanResponse } from "@/types/ai.type";
import { validateProduct } from "./utils/validateProduct";
import { normalizeProduct } from "./utils/normalizeProduct";
import { mapAiResponseToProductDraft } from "./utils/mapAiResponseToProductDraft";

const ConfirmProduct: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { product, images } = location.state as {
        product: AiScanResponse;
        images: string[];
    };

    /* Tạo bản nháp từ AI chỉ 1 lần */
    const aiInitialProductRef = useRef<ProductDraft>(
        mapAiResponseToProductDraft(product, images[0] ?? "")
    );

    const [draftProduct, setDraftProduct] = useState<ProductDraft>(
        aiInitialProductRef.current
    );

    /* Validation memo để không tính lại mỗi render */
    const validation = useMemo(
        () => validateProduct(draftProduct),
        [draftProduct]
    );

    const isValid = validation.isValid;
    const missingFields = validation.missingFields;

    /* ================= RESET ================= */

    const handleResetAll = () => {
        setDraftProduct(aiInitialProductRef.current);
    };

    const resetSection = (fields: (keyof ProductDraft)[]) => {
        setDraftProduct((prev) => {
            const updated = { ...prev };

            fields.forEach((key) => {
                (updated as any)[key] = aiInitialProductRef.current[key];
            });

            return updated;
        });
    };

    /* ================= ACTIONS ================= */

    const handleBack = () => navigate(-1);

    const handleSaveDraft = () => {
        console.log("SAVE DRAFT", draftProduct);
        toast.success("Đã lưu nháp sản phẩm");
    };

    const handleSubmit = () => {
        if (!isValid) {
            toast.error(`Còn thiếu ${missingFields.length} trường bắt buộc`);
            return;
        }

        const finalProduct = normalizeProduct(draftProduct);

        console.log("SUBMIT PRODUCT", finalProduct);
        toast.success("Tạo sản phẩm thành công");

        navigate("/supermarket/products");
    };

    /* ================= UI ================= */

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
                            product={draftProduct}
                            onChange={setDraftProduct}
                            onResetAll={handleResetAll}
                            onResetSection={resetSection}
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
