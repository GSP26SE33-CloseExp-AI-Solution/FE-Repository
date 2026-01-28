import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AddProductHeader from "../AddProduct/components/AddProductHeader";
import ProductImagesPreview from "./components/ProductImagesPreview";
import RequiredFieldsForm from "./components/RequiredFieldsForm";
import ActionButtons from "./components/ActionButtons";

import { fakeAiProduct } from "../data/fakeAiProduct";
import { ProductDraft } from "../data/products";
import { validateProduct } from "./utils/validateProduct";
import { normalizeProduct } from "./utils/normalizeProduct";

const ConfirmProduct: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { product, images } = location.state as {
        product: ProductDraft;
        images: string[];
    };

    const aiInitialProduct = fakeAiProduct();

    const [draftProduct, setDraftProduct] =
        useState<ProductDraft>(aiInitialProduct);

    const validation = validateProduct(draftProduct);
    const isValid = validation.isValid;
    const missingFields = validation.missingFields;

    // RESET DATA FROM AI
    const handleResetAll = () => {
        setDraftProduct(aiInitialProduct);
    };

    function setDraftField<K extends keyof ProductDraft>(
        draft: ProductDraft,
        key: K,
        value: ProductDraft[K]
    ) {
        draft[key] = value;
    }

    const resetSection = (fields: (keyof ProductDraft)[]) => {
        setDraftProduct((prev) => {
            const updated = { ...prev };

            fields.forEach((key) => {
                setDraftField(updated, key, aiInitialProduct[key]);
            });

            return updated;
        });
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleSaveDraft = () => {
        console.log("SAVE DRAFT", draftProduct);
    };

    const handleSubmit = () => {
        if (!isValid) {
            toast.error(`Còn thiếu ${missingFields.length} trường bắt buộc`);
            return;
        }

        const finalProduct = normalizeProduct(draftProduct);

        console.log("SUBMIT PRODUCT", finalProduct);

        navigate("/supermarket/products");
    };

    return (
        <div className="w-full min-h-screen bg-white">
            <AddProductHeader />

            <div className="px-6 py-4">
                <div className="grid grid-cols-10 gap-6">
                    {/* LEFT: Images */}
                    <div className="col-span-3">
                        <ProductImagesPreview images={images} />
                    </div>

                    {/* RIGHT: Form */}
                    <div className="col-span-7 space-y-6">
                        <RequiredFieldsForm
                            product={draftProduct}
                            onChange={setDraftProduct}
                            onResetAll={handleResetAll}
                            onResetSection={resetSection}
                        />

                        <ActionButtons
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
