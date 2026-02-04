import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { aiService } from "@/services/aiImage.service";
import { useProductImages } from "./hooks/useProductImages";

import AddProductHeader from "./components/AddProductHeader";
import ImageUploadCard from "./components/ImageUploadCard";
import ConfirmButton from "./components/ConfirmButton";
import AiProcessing from "./components/AiProcessing";

type PageState = "UPLOAD" | "AI_PROCESSING";

const AddProduct: React.FC = () => {
    const productImages = useProductImages({ maxImages: 5 });
    const [pageState, setPageState] = useState<PageState>("UPLOAD");
    const navigate = useNavigate();

    const handleConfirmUpload = async () => {
        if (productImages.images.length === 0) return;

        setPageState("AI_PROCESSING");

        try {
            const mainImage = productImages.images[0].file;
            const aiResponse = await aiService.smartScan(mainImage);

            navigate("/supplier/products/confirm", {
                state: {
                    product: aiResponse,
                    images: productImages.images.map((i) => i.preview),
                },
            });
        } catch (error) {
            console.error("AI smart-scan failed", error);
            alert("AI không phân tích được ảnh. Vui lòng thử lại.");
            setPageState("UPLOAD");
        }
    };

    return (
        <div className="w-full min-h-screen bg-white">
            <div className="w-full px-8 pt-30 pb-16 space-y-6">

                <AddProductHeader />

                {pageState === "UPLOAD" && (
                    <div>
                        <ImageUploadCard {...productImages} />

                        {productImages.images.length > 0 && !productImages.usingCamera && (
                            <div className="">
                                <ConfirmButton onConfirm={handleConfirmUpload} />
                            </div>
                        )}
                    </div>
                )}

                {pageState === "AI_PROCESSING" && (
                    <div>
                        <AiProcessing />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddProduct;
