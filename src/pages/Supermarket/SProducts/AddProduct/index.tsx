import { useState } from "react";
import { useProductImages } from "./hooks/useProductImages";

import AddProductHeader from "./components/AddProductHeader";
import ImageUploadCard from "./components/ImageUploadCard";
import ConfirmButton from "./components/ConfirmButton";
import AiProcessing from "./components/AiProcessing";

import { fakeAiProduct } from "../data/fakeAiProduct";
import { ProductDraft } from "../data/products";

type PageState = "UPLOAD" | "AI_PROCESSING" | "AI_RESULT" | "SAVED";

const AddProduct: React.FC = () => {
    const productImages = useProductImages({ maxImages: 5 });

    const [pageState, setPageState] = useState<PageState>("UPLOAD");
    const [product, setProduct] = useState<ProductDraft | null>(null);

    const handleConfirmUpload = () => {
        setPageState("AI_PROCESSING");

        // fake AI delay
        setTimeout(() => {
            setProduct(fakeAiProduct());
            setPageState("AI_RESULT");
        }, 2500);
    };

    return (
        <div className="w-full bg-white min-h-screen">
            <AddProductHeader />

            {pageState === "UPLOAD" && (
                <>
                    <ImageUploadCard {...productImages} />

                    {productImages.images.length > 0 &&
                        !productImages.usingCamera && (
                            <div className="flex justify-start">
                                <ConfirmButton
                                    onConfirm={handleConfirmUpload}
                                />
                            </div>
                        )}
                </>
            )}

            {pageState === "AI_PROCESSING" && <AiProcessing />}

            {pageState === "AI_RESULT" && product && (
                <div className="p-6">
                    <h3 className="text-xl font-semibold mb-4">
                        Kết quả AI trích xuất
                    </h3>

                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(product, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default AddProduct;
