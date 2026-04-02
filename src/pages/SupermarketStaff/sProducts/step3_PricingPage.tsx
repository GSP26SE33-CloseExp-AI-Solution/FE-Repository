import React, { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
    AlertCircle,
    ArrowLeft,
    BadgeDollarSign,
    CheckCircle2,
    Loader2,
    RefreshCcw,
    Sparkles,
    Tag,
} from "lucide-react"
import toast from "react-hot-toast"

import { useAuth } from "@/hooks/useAuth"
import { productAiService } from "@/services/product-ai.service"
import {
    mapConfirmPriceResultToWorkflow,
    mapCreateLotResultToWorkflow,
    mapPricingSuggestionResultToWorkflow,
    mergeWorkflowSnapshots,
} from "@/mappers/product-ai.mapper"
import type { ProductWorkflowSnapshot } from "@/types/product-ai-workflow.type"

type UploadedPreviewItem = {
    id: string
    preview: string
    source: "upload" | "camera"
}

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

const formatCurrencyVN = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—"
    return value.toLocaleString("vi-VN") + " đ"
}

const parseCurrencyVN = (value: string) => {
    const parsed = Number(value.replace(/[^\d]/g, ""))
    return Number.isNaN(parsed) ? 0 : parsed
}

const normalizeDateInput = (value?: string | null) => {
    if (!value) return ""
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) {
        return value.includes("T") ? value.slice(0, 10) : value
    }
    return d.toISOString().slice(0, 10)
}

const PricingPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()

    const workflow = (location.state as { workflow?: ProductWorkflowSnapshot } | null)?.workflow
    const uploadedImages =
        (
            location.state as
            | { uploadedImages?: UploadedPreviewItem[] }
            | null
        )?.uploadedImages ?? []

    const [currentWorkflow, setCurrentWorkflow] = useState<ProductWorkflowSnapshot | null>(
        workflow ?? null,
    )
    const [loadingStage, setLoadingStage] = useState<"BOOTSTRAP" | "CONFIRMING" | null>("BOOTSTRAP")
    const [priceFeedback, setPriceFeedback] = useState("")
    const [acceptAi, setAcceptAi] = useState(true)
    const [finalPrice, setFinalPrice] = useState<number>(0)

    const createdLotRef = useRef(false)

    const previewImages = useMemo(() => {
        if (uploadedImages.length > 0) return uploadedImages.map((item) => item.preview)
        if (currentWorkflow?.productImages?.length) {
            return currentWorkflow.productImages.map((item) => item.imageUrl).filter(Boolean)
        }
        if (currentWorkflow?.mainImageUrl) return [currentWorkflow.mainImageUrl]
        return []
    }, [uploadedImages, currentWorkflow])

    const productName =
        currentWorkflow?.name ??
        currentWorkflow?.draft.name ??
        "Sản phẩm"

    const originalPrice =
        currentWorkflow?.pricing.originalPrice ??
        currentWorkflow?.verification.originalPrice ??
        0

    const expiryDate =
        currentWorkflow?.verification.expiryDate ??
        ""

    const manufactureDate =
        currentWorkflow?.verification.manufactureDate ??
        ""

    const lotId = currentWorkflow?.lot.lotId
    const suggestedPrice = currentWorkflow?.pricing.suggestedPrice
    const pricingConfidence = currentWorkflow?.pricing.pricingConfidence
    const pricingReasons = currentWorkflow?.pricing.pricingReasons ?? []
    const daysToExpiry = currentWorkflow?.verification.daysToExpiry
    const minMarketPrice = currentWorkflow?.pricing.minMarketPrice
    const avgMarketPrice = currentWorkflow?.pricing.avgMarketPrice
    const maxMarketPrice = currentWorkflow?.pricing.maxMarketPrice
    const marketPriceSources = currentWorkflow?.pricing.marketPriceSources ?? []

    useEffect(() => {
        const bootstrap = async () => {
            if (!currentWorkflow) return

            if (!user?.userId) {
                toast.error("Không xác định được người dùng")
                setLoadingStage(null)
                return
            }

            if (!currentWorkflow.productId && !productId) {
                toast.error("Thiếu productId để xử lý định giá")
                setLoadingStage(null)
                return
            }

            const resolvedProductId = currentWorkflow.productId ?? productId
            if (!resolvedProductId) {
                toast.error("Thiếu productId để xử lý định giá")
                setLoadingStage(null)
                return
            }

            const resolvedExpiryDate =
                currentWorkflow.verification.expiryDate ?? ""
            const resolvedOriginalPrice =
                currentWorkflow.pricing.originalPrice ??
                currentWorkflow.verification.originalPrice ??
                0

            if (!resolvedExpiryDate || resolvedOriginalPrice <= 0) {
                toast.error("Thiếu hạn sử dụng hoặc giá gốc để AI định giá")
                setLoadingStage(null)
                return
            }

            try {
                let workflowAfterLot = currentWorkflow

                if (!currentWorkflow.lot.lotId && !createdLotRef.current) {
                    createdLotRef.current = true

                    const createLotResult = await productAiService.createLotFromExisting({
                        productId: resolvedProductId,
                        expiryDate: resolvedExpiryDate,
                        manufactureDate: currentWorkflow.verification.manufactureDate || undefined,
                        createdBy: user.userId,
                    })

                    const lotWorkflow = mapCreateLotResultToWorkflow(createLotResult)
                    workflowAfterLot = mergeWorkflowSnapshots(currentWorkflow, lotWorkflow)

                    console.log("📦 PricingPage.createLotResult:", createLotResult)
                    console.log("📦 PricingPage.workflowAfterLot:", workflowAfterLot)

                    setCurrentWorkflow(workflowAfterLot)
                }

                const resolvedLotId = workflowAfterLot.lot.lotId
                if (!resolvedLotId) {
                    toast.error("Không tạo được lô hàng để định giá")
                    setLoadingStage(null)
                    return
                }

                if (!workflowAfterLot.pricing.suggestedPrice) {
                    const suggestionResult = await productAiService.getLotPricingSuggestion(
                        resolvedLotId,
                        {
                            originalPrice: resolvedOriginalPrice,
                        },
                    )

                    const suggestionWorkflow = mapPricingSuggestionResultToWorkflow(suggestionResult)
                    const mergedWorkflow = mergeWorkflowSnapshots(
                        workflowAfterLot,
                        suggestionWorkflow,
                    )

                    console.log("💡 PricingPage.suggestionResult:", suggestionResult)
                    console.log("💡 PricingPage.mergedWorkflow:", mergedWorkflow)

                    setCurrentWorkflow(mergedWorkflow)
                    setFinalPrice(suggestionResult.suggestedPrice || 0)
                    setAcceptAi(true)
                } else {
                    setFinalPrice(workflowAfterLot.pricing.suggestedPrice || 0)
                    setAcceptAi(true)
                }
            } catch (error) {
                console.error("❌ PricingPage.bootstrap -> error:", error)
                toast.error("Không lấy được đề xuất giá từ AI")
            } finally {
                setLoadingStage(null)
            }
        }

        void bootstrap()
    }, [currentWorkflow, productId, user?.userId])

    const competitiveness = useMemo(() => {
        if (
            typeof finalPrice !== "number" ||
            typeof minMarketPrice !== "number" ||
            typeof maxMarketPrice !== "number"
        ) {
            return 0
        }

        if (maxMarketPrice <= minMarketPrice) return 50

        const score = ((maxMarketPrice - finalPrice) / (maxMarketPrice - minMarketPrice)) * 100
        return Math.max(0, Math.min(100, Math.round(score)))
    }, [finalPrice, minMarketPrice, maxMarketPrice])

    const validation = useMemo(() => {
        if (!currentWorkflow?.lot.lotId) {
            return {
                isValid: false,
                message: "Chưa có lotId để chốt giá",
            }
        }

        if (!user?.userId) {
            return {
                isValid: false,
                message: "Không xác định được người xác nhận",
            }
        }

        if (finalPrice <= 0) {
            return {
                isValid: false,
                message: "Giá bán cuối phải lớn hơn 0",
            }
        }

        return {
            isValid: true,
            message: "",
        }
    }, [currentWorkflow?.lot.lotId, finalPrice, user?.userId])

    const handleConfirmPrice = async () => {
        if (!currentWorkflow?.lot.lotId) {
            toast.error("Chưa có lô hàng để chốt giá")
            return
        }

        if (!user?.userId) {
            toast.error("Không xác định được người xác nhận")
            return
        }

        if (finalPrice <= 0) {
            toast.error("Giá bán cuối phải lớn hơn 0")
            return
        }

        setLoadingStage("CONFIRMING")

        try {
            const confirmResult = await productAiService.confirmLotPrice(
                currentWorkflow.lot.lotId,
                {
                    finalPrice,
                    acceptedSuggestion: acceptAi,
                    confirmedBy: user.userId,
                    priceFeedback: priceFeedback.trim() || undefined,
                },
            )

            const confirmedWorkflow = mapConfirmPriceResultToWorkflow(confirmResult)
            const nextWorkflow = mergeWorkflowSnapshots(currentWorkflow, {
                ...confirmedWorkflow,
                pricing: {
                    ...confirmedWorkflow.pricing,
                    acceptedSuggestion: acceptAi,
                    priceFeedback: priceFeedback.trim() || undefined,
                    pricingReasons:
                        confirmedWorkflow.pricing.pricingReasons.length > 0
                            ? confirmedWorkflow.pricing.pricingReasons
                            : currentWorkflow.pricing.pricingReasons,
                    marketPriceSources:
                        confirmedWorkflow.pricing.marketPriceSources.length > 0
                            ? confirmedWorkflow.pricing.marketPriceSources
                            : currentWorkflow.pricing.marketPriceSources,
                },
            })

            console.log("✅ PricingPage.confirmResult:", confirmResult)
            console.log("✅ PricingPage.nextWorkflow:", nextWorkflow)

            toast.success("Chốt giá thành công")

            navigate(
                `/supermarketStaff/products/${nextWorkflow.productId}/publish`,
                {
                    state: {
                        workflow: nextWorkflow,
                        uploadedImages,
                    },
                },
            )
        } catch (error) {
            console.error("❌ PricingPage.handleConfirmPrice -> error:", error)
            toast.error("Chốt giá thất bại")
        } finally {
            setLoadingStage(null)
        }
    }

    if (!currentWorkflow) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
                <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                        <AlertCircle className="h-7 w-7" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900">
                        Không có workflow để định giá
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Bạn hãy quay lại bước xác nhận sản phẩm trước.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/supermarketStaff/products/add")}
                        className="mt-5 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Quay về trang thêm sản phẩm
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-28">
                <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/60 p-6 shadow-[0_16px_50px_rgba(139,92,246,0.08)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                AI Pricing
                            </div>

                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Chốt giá sản phẩm
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                AI sẽ tạo lô hàng, phân tích giá thị trường và gợi ý mức giá phù hợp
                                dựa trên hạn sử dụng còn lại.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                                Trạng thái:{" "}
                                <span className="font-semibold text-slate-900">
                                    {String(currentWorkflow.productState ?? "Verified")}
                                </span>
                            </div>
                            {typeof pricingConfidence === "number" ? (
                                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700">
                                    Độ tin cậy AI: {Math.round(pricingConfidence * 100)}%
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {loadingStage === "BOOTSTRAP" ? (
                    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[32px] border border-violet-100 bg-gradient-to-br from-white via-violet-50/30 to-violet-100/40 px-6 text-center">
                        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(139,92,246,0.14)]">
                            <Loader2 className="h-9 w-9 animate-spin text-violet-600" />
                        </div>

                        <h2 className="text-2xl font-semibold text-slate-900">
                            AI đang phân tích giá
                        </h2>

                        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                            Hệ thống đang tạo lô hàng và lấy đề xuất giá từ AI để bạn chốt mức giá
                            cuối cùng.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                        <div className="space-y-6">
                            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Tổng quan sản phẩm
                                    </h2>
                                </div>

                                <div className="p-5">
                                    {previewImages.length > 0 ? (
                                        <div className="mb-4 flex h-[260px] items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                                            <img
                                                src={previewImages[0]}
                                                alt={productName}
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                    ) : null}

                                    <div className="space-y-3 text-sm text-slate-600">
                                        <InfoRow label="Tên sản phẩm" value={productName} />
                                        <InfoRow
                                            label="Product ID"
                                            value={currentWorkflow.productId || "—"}
                                        />
                                        <InfoRow
                                            label="Lot ID"
                                            value={lotId || "Đang tạo..."}
                                        />
                                        <InfoRow
                                            label="Hạn sử dụng"
                                            value={
                                                expiryDate
                                                    ? new Date(expiryDate).toLocaleDateString("vi-VN")
                                                    : "—"
                                            }
                                        />
                                        <InfoRow
                                            label="Ngày sản xuất"
                                            value={
                                                manufactureDate
                                                    ? new Date(manufactureDate).toLocaleDateString("vi-VN")
                                                    : "—"
                                            }
                                        />
                                        <InfoRow
                                            label="Số ngày còn lại"
                                            value={
                                                typeof daysToExpiry === "number"
                                                    ? `${daysToExpiry} ngày`
                                                    : "—"
                                            }
                                        />
                                        <InfoRow
                                            label="Giá gốc"
                                            value={formatCurrencyVN(originalPrice)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                                <h3 className="text-base font-semibold text-slate-900">
                                    Đề xuất từ AI
                                </h3>

                                <div className="mt-4 rounded-3xl border border-violet-200 bg-violet-50 px-5 py-5">
                                    <div className="text-sm font-medium text-violet-700">
                                        Giá AI đề xuất
                                    </div>
                                    <div className="mt-2 text-3xl font-semibold tracking-tight text-violet-800">
                                        {formatCurrencyVN(suggestedPrice)}
                                    </div>
                                    <div className="mt-2 text-sm text-violet-700">
                                        So với giá gốc:{" "}
                                        <span className="font-semibold">
                                            {typeof originalPrice === "number" && typeof suggestedPrice === "number" && originalPrice > 0
                                                ? `${Math.round(((originalPrice - suggestedPrice) / originalPrice) * 100)}%`
                                                : "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3 text-sm text-slate-600">
                                    <InfoRow
                                        label="Min thị trường"
                                        value={formatCurrencyVN(minMarketPrice)}
                                    />
                                    <InfoRow
                                        label="Avg thị trường"
                                        value={formatCurrencyVN(avgMarketPrice)}
                                    />
                                    <InfoRow
                                        label="Max thị trường"
                                        value={formatCurrencyVN(maxMarketPrice)}
                                    />
                                    <InfoRow
                                        label="Mức cạnh tranh"
                                        value={`${competitiveness}%`}
                                    />
                                </div>

                                {pricingReasons.length > 0 ? (
                                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                                        <div className="mb-2 text-sm font-semibold text-amber-800">
                                            Lý do AI gợi ý giá
                                        </div>
                                        <ul className="space-y-2 text-sm text-amber-700">
                                            {pricingReasons.map((reason, index) => (
                                                <li key={`${reason}-${index}`} className="flex gap-2">
                                                    <span>•</span>
                                                    <span>{reason}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

                                {marketPriceSources.length > 0 ? (
                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                        <div className="mb-2 text-sm font-semibold text-slate-800">
                                            Nguồn giá thị trường
                                        </div>
                                        <div className="space-y-2 text-sm text-slate-600">
                                            {marketPriceSources.map((source, index) => (
                                                <div
                                                    key={`${source.storeName}-${index}`}
                                                    className="flex items-center justify-between gap-3"
                                                >
                                                    <span>{source.storeName}</span>
                                                    <span className="font-medium text-slate-800">
                                                        {formatCurrencyVN(source.price)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Chốt giá cuối
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Bạn có thể dùng giá AI hoặc chỉnh tay trước khi sang bước publish.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (typeof suggestedPrice === "number") {
                                            setFinalPrice(suggestedPrice)
                                            setAcceptAi(true)
                                            toast.success("Đã áp dụng lại giá AI đề xuất")
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Dùng giá AI
                                </button>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                                        <Tag className="h-4 w-4" />
                                        Chọn cách chốt giá
                                    </div>

                                    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={acceptAi}
                                            onChange={(e) => {
                                                const checked = e.target.checked
                                                setAcceptAi(checked)
                                                if (checked && typeof suggestedPrice === "number") {
                                                    setFinalPrice(suggestedPrice)
                                                }
                                            }}
                                            className="mt-1 h-4 w-4 accent-violet-600"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-slate-800">
                                                Dùng giá AI đề xuất
                                            </div>
                                            <div className="mt-1 text-sm text-slate-500">
                                                Khi bật lựa chọn này, giá cuối sẽ bám theo mức AI đề xuất.
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                                        <BadgeDollarSign className="h-4 w-4" />
                                        Giá bán cuối
                                    </div>

                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={typeof finalPrice === "number" ? formatCurrencyVN(finalPrice) : ""}
                                        onChange={(e) => {
                                            setFinalPrice(parseCurrencyVN(e.target.value))
                                            setAcceptAi(false)
                                        }}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        placeholder="Nhập giá bán cuối"
                                    />

                                    <div className="mt-2 text-sm text-slate-500">
                                        Giá hiện tại: <span className="font-medium text-slate-800">{formatCurrencyVN(finalPrice)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block">
                                    <div className="mb-2 text-sm font-medium text-slate-700">
                                        Ghi chú chốt giá
                                    </div>
                                    <textarea
                                        value={priceFeedback}
                                        onChange={(e) => setPriceFeedback(e.target.value)}
                                        placeholder="Ví dụ: Giá thấp hơn đề xuất do hàng cận hạn, bao bì trầy nhẹ..."
                                        className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                {validation.isValid ? (
                                    <div className="flex items-center gap-2 font-medium">
                                        <CheckCircle2 className="h-4.5 w-4.5" />
                                        Dữ liệu đã sẵn sàng để chốt giá
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 font-medium">
                                        <AlertCircle className="h-4.5 w-4.5" />
                                        {validation.message}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Quay lại
                                </button>

                                <button
                                    type="button"
                                    disabled={!validation.isValid || loadingStage === "CONFIRMING"}
                                    onClick={handleConfirmPrice}
                                    className={cn(
                                        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition",
                                        validation.isValid && loadingStage !== "CONFIRMING"
                                            ? "bg-violet-600 text-white shadow-[0_12px_30px_rgba(139,92,246,0.24)] hover:bg-violet-700"
                                            : "cursor-not-allowed bg-slate-100 text-slate-400",
                                    )}
                                >
                                    {loadingStage === "CONFIRMING" ? (
                                        <>
                                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                            Đang chốt giá...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4.5 w-4.5" />
                                            Xác nhận giá và sang bước publish
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
            <span className="text-slate-500">{label}</span>
            <span className="text-right font-medium text-slate-900">{value}</span>
        </div>
    )
}

export default PricingPage
