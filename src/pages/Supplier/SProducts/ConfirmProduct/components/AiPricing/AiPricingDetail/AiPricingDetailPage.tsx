import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import ProductInfoCard from "./components/ProductInfoCard";
import AiSuggestCard from "./components/AiSuggestCard";
import MarketCompareTable from "./components/MarketCompareTable";

import { getAiPriceSuggestion } from "@/services/aiPricing.service";
import { AiPricingResponse } from "@/types/aiPricing.types";
import { ProductDraft } from "@/types/product.type";

const AiPricingDetailPage = () => {
    const location = useLocation();
    const product = location.state as ProductDraft;

    const [pricing, setPricing] = useState<AiPricingResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await getAiPriceSuggestion({
                    category: product.category,
                    expiryDate: product.expiry!,
                    originalPrice: product.originalPrice ?? 0,
                    brand: product.brand,
                });

                if (res.success) {
                    setPricing(res);
                } else {
                    console.error("AI pricing failed:", res.errorMessage);
                }
            } catch (err) {
                console.error("AI pricing error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPricing();
    }, [product]);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">A.I gợi ý giá</h1>
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 text-sm"
                >
                    Quay lại
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <ProductInfoCard product={product} />
                    <MarketCompareTable pricing={pricing} loading={loading} />
                </div>

                <div className="col-span-1">
                    <AiSuggestCard pricing={pricing} loading={loading} />
                </div>
            </div>
        </div>
    );
};

export default AiPricingDetailPage;
