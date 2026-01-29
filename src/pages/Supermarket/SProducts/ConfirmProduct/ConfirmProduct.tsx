import React from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AddProductHeader from "../AddProduct/components/AddProductHeader";

// components
import ProductImagesPreview from "./components/ProductImagesPreview";
import RequiredFieldsForm from "./components/RequiredFieldsForm/RequiredFieldsForm";
import ActionButtons from "./components/ActionButtons";
import PriceSuggestionPanel from "./components/AiPricing/PriceSuggestionPanel";
import ProductSummaryTable from "./components/ProductSummaryTable";

// mocks
import { fakeAiProduct } from "../../../../mocks/fakeAiProduct.mock";

// utils
import { validateProduct } from "./utils/validateProduct";
import { normalizeProduct } from "./utils/normalizeProduct";

// hooks
import { useConfirmStep } from "./hooks/useConfirmStep";
import { useAiPricing } from "./hooks/useAiPricing";
import { useProductDraft } from "./hooks/useProductDraft";

const ConfirmProduct: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { images } = (location.state as any) || {};

    const aiInitialProduct = fakeAiProduct();

    const { draftProduct, setDraftProduct, updateField } =
        useProductDraft(aiInitialProduct);

    const { step, setStep, locked } = useConfirmStep();

    const { priceSuggestion, loading, fetchAiPrice } = useAiPricing(draftProduct);

    const validation = validateProduct(draftProduct);
    const { isValid, missingFields } = validation;

    const handleSubmit = async () => {
        if (!isValid) {
            toast.error(`Còn thiếu ${missingFields.length} trường bắt buộc`);
            return;
        }

        // Step 1: gọi AI
        if (step === "edit") {
            await fetchAiPrice();
            setStep("ai");
            return;
        }

        // Step 2: confirm AI
        if (step === "ai") {
            setStep("review");
            return;
        }

        // Step 3: submit thật
        const finalProduct = normalizeProduct(draftProduct);
        console.log("FINAL PRODUCT", finalProduct);
        navigate("/supermarket/products");
    };

    useEffect(() => {
        if (priceSuggestion && draftProduct.salePrice == null) {
            updateField("salePrice", priceSuggestion.suggestedPrice);
        }
    }, [priceSuggestion]);

    const salePrice = draftProduct.salePrice ?? 0;

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
                            onResetAll={() => setDraftProduct(aiInitialProduct)}
                            onResetSection={() => { }}
                            locked={locked}
                        />

                        {step !== "edit" && priceSuggestion && (
                            <PriceSuggestionPanel
                                data={priceSuggestion}
                                salePrice={salePrice}
                                onChangePrice={(price) => updateField("salePrice", price)}
                            />
                        )}

                        {step === "review" && priceSuggestion && (
                            <ProductSummaryTable
                                product={draftProduct}
                                price={salePrice}
                            />
                        )}

                        <ActionButtons
                            onBack={() => navigate(-1)}
                            onSaveDraft={() => console.log("SAVE")}
                            onSubmit={handleSubmit}
                            disabled={!isValid || loading}
                            missingCount={missingFields.length}
                            step={step}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmProduct;
