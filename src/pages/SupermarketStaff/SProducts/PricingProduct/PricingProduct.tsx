import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { productService } from "@/services/product.service";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@/types/aiProduct.type";

/* ================= TYPES ================= */

interface PricingSuggestion {
    productId: string;
    productName: string;
    originalPrice: number;
    suggestedPrice: number;
    confidence: number;
    discountPercent: number;
    expiryDate: string;
    daysToExpiry: number;
    reasons: string[];
    minMarketPrice: number;
    avgMarketPrice: number;
    maxMarketPrice: number;
}

/* ================= COMPONENT ================= */

const PricingPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState<Product | null>(null);
    const [suggestion, setSuggestion] =
        useState<PricingSuggestion | null>(null);

    const [finalPrice, setFinalPrice] = useState<number>(0);
    const [priceFeedback, setPriceFeedback] = useState("");
    const [acceptAi, setAcceptAi] = useState(true);
    const [loading, setLoading] = useState(true);

    /* ================= FETCH PRODUCT ================= */
    useEffect(() => {
        if (!productId) {
            toast.error("Thiếu productId");
            setLoading(false);
            return;
        }

        setLoading(true);

        productService
            .getById(productId)
            .then((res) => {
                setProduct(res.data.data);
            })
            .catch(() => {
                toast.error("Không tải được sản phẩm");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [productId]);

    /* ================= PRICING SUGGESTION ================= */
    useEffect(() => {
        if (!product) return;
        if (!product.originalPrice || product.originalPrice <= 0) return;

        productService.pricingSuggestion(
            product.productId,
            product.originalPrice
        )
            .then((res) => {
                const data = res.data.data;
                setSuggestion(data);
                setFinalPrice(data.suggestedPrice);
                setAcceptAi(true);
            })
            .catch(() => {
                toast.error("Không lấy được đề xuất giá từ AI");
            });
    }, [product]);

    /* ================= CONFIRM PRICE ================= */
    const handleConfirmPrice = async () => {
        if (!product) return;

        if (!user?.userId) {
            toast.error("Không xác định được người xác nhận");
            return;
        }

        if (finalPrice <= 0) {
            toast.error("Giá bán phải lớn hơn 0");
            return;
        }

        try {
            await productService.confirmPrice(product.productId, {
                finalPrice,
                acceptedSuggestion: acceptAi,
                confirmedBy: user.userId,
                priceFeedback: priceFeedback || undefined,
            });

            toast.success("Chốt giá thành công – Sản phẩm sẵn sàng publish");
            navigate(`/supermarketStaff/products/${product.productId}/publish`);
        } catch (err) {
            console.error("❌ CONFIRM PRICE FAILED", err);
            toast.error("Chốt giá thất bại");
        }
    };

    /* ================= UI STATES ================= */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Đang tải dữ liệu…
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Không tìm thấy sản phẩm
            </div>
        );
    }

    /* ================= RENDER ================= */
    return (
        <div className="w-full min-h-screen bg-white px-8 py-6 space-y-6">
            {/* ===== HEADER ===== */}
            <div>
                <h1 className="text-xl font-semibold text-gray-800">
                    Chốt giá sản phẩm
                </h1>
                <p className="text-sm text-gray-500">
                    {product.name} – {product.brand}
                </p>
            </div>

            {/* ===== PRODUCT INFO ===== */}
            <div className="border rounded-lg p-4 space-y-2">
                <div>
                    <span className="font-medium">Hạn sử dụng:</span>{" "}
                    {product.expiryDate
                        ? new Date(product.expiryDate).toLocaleDateString()
                        : "—"}
                </div>
                <div>
                    <span className="font-medium">Số ngày còn lại:</span>{" "}
                    {product.daysToExpiry ?? "—"}
                </div>
                <div>
                    <span className="font-medium">Giá gốc:</span>{" "}
                    {product.originalPrice}
                </div>
            </div>

            {/* ===== AI ANALYSIS OVERVIEW ===== */}
            <div className="border rounded-lg p-4 space-y-2 bg-blue-50">
                <div className="font-semibold text-blue-700">
                    Phân tích AI ban đầu
                </div>

                <div className="text-sm">
                    Độ tin cậy OCR:{" "}
                    <span className="font-medium">
                        {Math.round((product.ocrConfidence ?? 0) * 100)}%
                    </span>
                </div>

                {product.pricingConfidence !== undefined && (
                    <div className="text-sm">
                        Độ tin cậy định giá AI:{" "}
                        <span className="font-medium">
                            {Math.round(product.pricingConfidence * 100)}%
                        </span>
                    </div>
                )}

                {product.pricingReasons && (
                    <div className="text-sm text-gray-700">
                        Lý do AI:
                        <div className="text-xs mt-1 whitespace-pre-line">
                            {product.pricingReasons}
                        </div>
                    </div>
                )}

                {product.suggestedPrice > 0 && (
                    <div className="text-sm">
                        Giá AI ban đầu đề xuất:{" "}
                        <span className="font-semibold text-green-700">
                            {product.suggestedPrice}
                        </span>
                    </div>
                )}
            </div>

            {/* ===== AI PRICING REASON (OCR / INITIAL) ===== */}
            <div className="border rounded-lg p-4 space-y-2 bg-yellow-50">
                <div className="font-semibold text-yellow-700">
                    Lý do định giá từ AI (OCR)
                </div>

                <div className="text-sm text-gray-700 whitespace-pre-line">
                    {product.pricingReasons ??
                        "AI chưa đủ dữ kiện (giá gốc, hạn sử dụng hoặc dữ liệu thị trường) để đưa ra lý do định giá chi tiết ở bước này."}
                </div>

                <div className="text-xs text-gray-500">
                    Độ tin cậy AI ban đầu:{" "}
                    {product.pricingConfidence > 0
                        ? `${Math.round(product.pricingConfidence * 100)}%`
                        : "Chưa xác định"}
                </div>
            </div>

            {/* ===== AI SUGGESTION ===== */}
            {suggestion && (
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">
                            AI đề xuất giá
                        </span>
                        <span className="text-sm text-gray-600">
                            Độ tin cậy:{" "}
                            {Math.round(suggestion.confidence * 100)}%
                        </span>
                    </div>

                    <div>
                        <div>
                            Giá đề xuất:{" "}
                            <span className="font-semibold text-green-600">
                                {suggestion.suggestedPrice}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600">
                            Thị trường: {suggestion.minMarketPrice} –{" "}
                            {suggestion.maxMarketPrice}
                        </div>
                    </div>

                    {suggestion.reasons?.length > 0 && (
                        <ul className="list-disc ml-5 text-sm text-gray-600">
                            {suggestion.reasons.map((r, idx) => (
                                <li key={idx}>{r}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* ===== FINAL PRICE ===== */}
            <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={acceptAi}
                        onChange={(e) => {
                            setAcceptAi(e.target.checked);
                            if (
                                e.target.checked &&
                                suggestion?.suggestedPrice
                            ) {
                                setFinalPrice(suggestion.suggestedPrice);
                            }
                        }}
                    />
                    <span>Dùng giá AI đề xuất</span>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Giá bán cuối
                    </label>
                    <input
                        type="number"
                        value={finalPrice}
                        onChange={(e) => {
                            setFinalPrice(Number(e.target.value));
                            setAcceptAi(false);
                        }}
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>
            </div>

            {/* ===== FEEDBACK FINAL PRICE ===== */}
            <div>
                <label className="block text-sm font-medium mb-1">
                    Ghi chú chốt giá (tuỳ chọn)
                </label>
                <textarea
                    value={priceFeedback}
                    onChange={(e) => setPriceFeedback(e.target.value)}
                    placeholder="Ví dụ: Giá thấp hơn đề xuất do hàng cận hạn, bao bì trầy xước..."
                    className="w-full border px-3 py-2 rounded min-h-[80px]"
                />
            </div>

            {/* ===== ACTIONS ===== */}
            <div className="flex justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 border rounded"
                >
                    Quay lại
                </button>

                <button
                    onClick={handleConfirmPrice}
                    className="px-6 py-2 bg-green-600 text-white rounded"
                >
                    Chốt giá
                </button>
            </div>
        </div>
    );
};

export default PricingPage;
