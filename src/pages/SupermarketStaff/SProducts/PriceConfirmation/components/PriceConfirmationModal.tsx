import React, { useState, useEffect, useMemo } from "react"
import { VerifiedProduct, PricingSuggestionResponse } from "@/types/verifiedProduct.type"

interface Props {
    isOpen: boolean
    product: VerifiedProduct | null
    pricingSuggestion: PricingSuggestionResponse | null
    loading: boolean
    onConfirm: (finalPrice: number, acceptsSuggestion: boolean) => void
    onClose: () => void
}

const PriceConfirmationModal: React.FC<Props> = ({
    isOpen,
    product,
    pricingSuggestion,
    loading,
    onConfirm,
    onClose,
}) => {
    const [customPrice, setCustomPrice] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Initialize price when suggestion loads
    useEffect(() => {
        if (pricingSuggestion?.suggestedPrice) {
            setCustomPrice(pricingSuggestion.suggestedPrice)
        }
    }, [pricingSuggestion])

    const isUsingSuggestedPrice = customPrice === pricingSuggestion?.suggestedPrice

    // Calculate competitiveness score (0-100) based on market price comparison
    const competitiveness = useMemo(() => {
        if (!pricingSuggestion) return 0
        const { minMarketPrice, maxMarketPrice } = pricingSuggestion
        // If price is lower than min market, it's very competitive
        if (customPrice <= minMarketPrice) return 100
        if (customPrice >= maxMarketPrice) return 0
        if (minMarketPrice === maxMarketPrice) return 50
        return Math.round(((maxMarketPrice - customPrice) / (maxMarketPrice - minMarketPrice)) * 100)
    }, [customPrice, pricingSuggestion])

    // Derive urgency from days to expiry
    const getUrgencyLevel = () => {
        if (!pricingSuggestion?.daysToExpiry) return "low"
        if (pricingSuggestion.daysToExpiry <= 3) return "high"
        if (pricingSuggestion.daysToExpiry <= 7) return "medium"
        return "low"
    }

    const urgencyLevel = getUrgencyLevel()

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case "high": return "text-red-600 bg-red-50"
            case "medium": return "text-orange-600 bg-orange-50"
            case "low": return "text-green-600 bg-green-50"
            default: return "text-gray-600 bg-gray-50"
        }
    }

    const getUrgencyText = (level: string) => {
        switch (level) {
            case "high": return "⚡ Cấp bách"
            case "medium": return "⏰ Trung bình"
            case "low": return "✨ Bình thường"
            default: return "✨ Bình thường"
        }
    }

    const handleConfirm = async () => {
        setIsSubmitting(true)
        try {
            await onConfirm(customPrice, isUsingSuggestedPrice)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUseSuggestedPrice = () => {
        if (pricingSuggestion?.suggestedPrice) {
            setCustomPrice(pricingSuggestion.suggestedPrice)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header - Fixed */}
                <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        Xác nhận giá với AI
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Product Info Summary */}
                    {product && (
                        <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                                <p className="text-sm text-gray-500">{product.brand}</p>
                                <p className="text-sm text-blue-600">{product.category}</p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-500">Đang phân tích giá với AI...</p>
                        </div>
                    )}

                    {/* Pricing Suggestion */}
                    {!loading && pricingSuggestion && (
                        <>
                            {/* AI Suggested Price */}
                            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-gray-600">Giá AI đề xuất</span>
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getUrgencyColor(urgencyLevel)}`}>
                                        {getUrgencyText(urgencyLevel)}
                                    </span>
                                </div>
                                <div className="text-3xl font-bold text-blue-600 mb-2">
                                    {pricingSuggestion.suggestedPrice?.toLocaleString("vi-VN") ?? 0} đ
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>Giá gốc: {pricingSuggestion.originalPrice?.toLocaleString("vi-VN") ?? 0} đ</span>
                                    <span className="text-green-600 font-medium">
                                        -{pricingSuggestion.discountPercent ?? 0}%
                                    </span>
                                </div>
                            </div>

                            {/* Market Price Comparison */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Giá thị trường</span>
                                    <span className="text-gray-600">
                                        {pricingSuggestion.minMarketPrice?.toLocaleString("vi-VN") ?? 0} đ
                                        {pricingSuggestion.minMarketPrice !== pricingSuggestion.maxMarketPrice &&
                                            ` - ${pricingSuggestion.maxMarketPrice?.toLocaleString("vi-VN") ?? 0} đ`
                                        }
                                    </span>
                                </div>

                                {/* Price Range Slider Visual */}
                                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="absolute h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                                        style={{
                                            left: "0%",
                                            width: `${Math.min(100, Math.max(0, competitiveness))}%`
                                        }}
                                    />
                                    {/* Current price marker */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md"
                                        style={{
                                            left: `${Math.min(100, Math.max(0, competitiveness))}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Competitiveness Score */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500 mb-1">Mức độ cạnh tranh</div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${competitiveness >= 70 ? "bg-green-500" :
                                                    competitiveness >= 40 ? "bg-yellow-500" : "bg-red-500"
                                                    }`}
                                                style={{ width: `${competitiveness}%` }}
                                            />
                                        </div>
                                        <span className="font-bold text-gray-700">{competitiveness}%</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-500 mb-1">Còn lại</div>
                                    <div className="font-bold text-gray-700">
                                        ⏳ {pricingSuggestion.daysToExpiry ?? "N/A"} ngày
                                    </div>
                                </div>
                            </div>

                            {/* AI Confidence */}
                            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-purple-700">Độ tin cậy AI</span>
                                    <span className="font-bold text-purple-600">
                                        {Math.round((pricingSuggestion.confidence ?? 0) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 rounded-full transition-all"
                                        style={{ width: `${(pricingSuggestion.confidence ?? 0) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Recommendations/Reasons */}
                            {pricingSuggestion.reasons && pricingSuggestion.reasons.length > 0 && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">💡</span>
                                        <div className="flex-1">
                                            <div className="font-medium text-amber-800 mb-2">Lý do đề xuất</div>
                                            <ul className="space-y-1">
                                                {pricingSuggestion.reasons.map((reason, index) => (
                                                    <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                                                        <span className="text-amber-500">•</span>
                                                        {reason}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Market Sources */}
                            {pricingSuggestion.marketPriceSources && pricingSuggestion.marketPriceSources.length > 0 && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm font-medium text-gray-700 mb-3">📊 Nguồn giá thị trường</div>
                                    <div className="space-y-2">
                                        {pricingSuggestion.marketPriceSources.map((source, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">{source.storeName}</span>
                                                <span className="font-semibold text-gray-800">
                                                    {source.price?.toLocaleString("vi-VN")} đ
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Price Input */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Nhập giá bán cuối cùng
                                </label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            value={customPrice}
                                            onChange={(e) => setCustomPrice(Number(e.target.value))}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                                            placeholder="Nhập giá..."
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">đ</span>
                                    </div>
                                    <button
                                        onClick={handleUseSuggestedPrice}
                                        disabled={isUsingSuggestedPrice}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${isUsingSuggestedPrice
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                            }`}
                                    >
                                        Dùng giá AI
                                    </button>
                                </div>
                                {isUsingSuggestedPrice && (
                                    <p className="text-sm text-green-600 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Đang sử dụng giá do AI đề xuất
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Error State */}
                    {!loading && !pricingSuggestion && (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-3">😕</div>
                            <p className="text-gray-600">Không thể lấy gợi ý giá từ AI</p>
                            <p className="text-sm text-gray-400">Vui lòng thử lại sau</p>
                        </div>
                    )}
                </div>

                {/* Footer - Fixed */}
                <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || !pricingSuggestion || isSubmitting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Xác nhận giá
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PriceConfirmationModal
