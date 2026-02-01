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
            // lấy ảnh chính (file gốc gửi BE)
            const mainImage = productImages.images[0].file;

            // gọi AI
            const aiResponse = await aiService.smartScan(mainImage);

            // KHÔNG build ProductDraft ở đây
            // chỉ gửi raw AI response + ảnh sang Confirm
            navigate("/supermarket/products/confirm", {
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
        <div className="w-full bg-white min-h-screen">
            <AddProductHeader />

            {pageState === "UPLOAD" && (
                <>
                    <ImageUploadCard {...productImages} />

                    {productImages.images.length > 0 &&
                        !productImages.usingCamera && (
                            <div className="flex justify-start">
                                <ConfirmButton onConfirm={handleConfirmUpload} />
                            </div>
                        )}
                </>
            )}

            {pageState === "AI_PROCESSING" && <AiProcessing />}
        </div>
    );
};

export default AddProduct;
