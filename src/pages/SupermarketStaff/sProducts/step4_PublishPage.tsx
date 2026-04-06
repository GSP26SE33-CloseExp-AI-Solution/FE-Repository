import React, { useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Image as ImageIcon,
    Loader2,
    Megaphone,
    Sparkles,
} from "lucide-react"
import toast from "react-hot-toast"

import { useAuth } from "@/hooks/useAuth"
import { productAiService } from "@/services/product-ai.service"
import {
    mapPublishLotResultToWorkflow,
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

const PublishPage: React.FC = () => {
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
    const [publishing, setPublishing] = useState(false)

    const previewImages = useMemo(() => {
        if (uploadedImages.length > 0) return uploadedImages.map((item) => item.preview)
        if (currentWorkflow?.productImages?.length) {
            return currentWorkflow.productImages.map((item) => item.imageUrl).filter(Boolean)
        }
        if (currentWorkflow?.mainImageUrl) return [currentWorkflow.mainImageUrl]
        return []
    }, [uploadedImages, currentWorkflow])

    const validation = useMemo(() => {
        if (!currentWorkflow) {
            return {
                isValid: false,
                message: "Không có workflow để publish",
            }
        }

        if (!currentWorkflow.productId && !productId) {
            return {
                isValid: false,
                message: "Thiếu productId",
            }
        }

        if (!currentWorkflow.lot.lotId) {
            return {
                isValid: false,
                message: "Thiếu lotId để đăng bán",
            }
        }

        if (!user?.userId) {
            return {
                isValid: false,
                message: "Không xác định được người đăng bán",
            }
        }

        if (
            typeof currentWorkflow.pricing.finalPrice !== "number" ||
            currentWorkflow.pricing.finalPrice <= 0
        ) {
            return {
                isValid: false,
                message: "Sản phẩm chưa được chốt giá hợp lệ",
            }
        }

        return {
            isValid: true,
            message: "",
        }
    }, [currentWorkflow, productId, user?.userId])

    const handlePublish = async () => {
        if (!currentWorkflow?.lot.lotId) {
            toast.error("Thiếu lotId để đăng bán")
            return
        }

        if (!user?.userId) {
            toast.error("Không xác định được người đăng bán")
            return
        }

        setPublishing(true)

        try {
            const publishResult = await productAiService.publishLot(
                currentWorkflow.lot.lotId,
                {
                    publishedBy: user.userId,
                },
            )

            const publishedWorkflow = mapPublishLotResultToWorkflow(publishResult)
            const nextWorkflow = mergeWorkflowSnapshots(currentWorkflow, publishedWorkflow)

            console.log("🚀 PublishPage.publishResult:", publishResult)
            console.log("🚀 PublishPage.nextWorkflow:", nextWorkflow)

            setCurrentWorkflow(nextWorkflow)
            toast.success("Đăng bán sản phẩm thành công")

            navigate("/supermarketStaff/products")
        } catch (error) {
            console.error("❌ PublishPage.handlePublish -> error:", error)
            toast.error("Đăng bán không thành công")
        } finally {
            setPublishing(false)
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
                        Không có workflow để publish
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Bạn hãy quay lại bước chốt giá trước khi đăng bán.
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
                <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/60 p-6 shadow-[0_16px_50px_rgba(16,185,129,0.08)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                Ready to Publish
                            </div>

                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Xác nhận đăng bán sản phẩm
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Kiểm tra lần cuối thông tin sản phẩm, lô hàng và giá bán trước khi
                                hiển thị cho khách hàng.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                            Trạng thái hiện tại:{" "}
                            <span className="font-semibold text-slate-900">
                                {String(currentWorkflow.productState ?? "Priced")}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Hình ảnh sản phẩm
                                </h2>
                            </div>

                            {previewImages.length > 0 ? (
                                <div className="p-5">
                                    <div className="flex h-[320px] items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                                        <img
                                            src={previewImages[0]}
                                            alt={currentWorkflow.name ?? "Ảnh sản phẩm"}
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                        <ImageIcon className="h-7 w-7 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Chưa có hình ảnh sản phẩm
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                            <h3 className="text-base font-semibold text-slate-900">
                                Tóm tắt hệ thống
                            </h3>

                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <InfoRow label="Product ID" value={currentWorkflow.productId || "—"} />
                                <InfoRow label="Lot ID" value={currentWorkflow.lot.lotId || "—"} />
                                <InfoRow
                                    label="Ngày publish dự kiến"
                                    value={new Date().toLocaleDateString("vi-VN")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Thông tin sẽ hiển thị khi đăng bán
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Bạn kiểm tra lại lần cuối trước khi đẩy sản phẩm lên danh sách bán.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card title="Thông tin sản phẩm">
                                <InfoRow label="Tên sản phẩm" value={currentWorkflow.name || "—"} />
                                <InfoRow label="Thương hiệu" value={currentWorkflow.brand || "—"} />
                                <InfoRow label="Danh mục" value={currentWorkflow.category || "—"} />
                                <InfoRow label="Mã vạch" value={currentWorkflow.barcode || "—"} />
                                <InfoRow
                                    label="Thực phẩm tươi"
                                    value={currentWorkflow.draft.isFreshFood ? "Có" : "Không"}
                                />
                            </Card>

                            <Card title="Thông tin hạn dùng">
                                <InfoRow
                                    label="Hạn sử dụng"
                                    value={
                                        currentWorkflow.verification.expiryDate
                                            ? new Date(
                                                currentWorkflow.verification.expiryDate,
                                            ).toLocaleDateString("vi-VN")
                                            : "—"
                                    }
                                />
                                <InfoRow
                                    label="Ngày sản xuất"
                                    value={
                                        currentWorkflow.verification.manufactureDate
                                            ? new Date(
                                                currentWorkflow.verification.manufactureDate,
                                            ).toLocaleDateString("vi-VN")
                                            : "—"
                                    }
                                />
                                <InfoRow
                                    label="Số ngày còn lại"
                                    value={
                                        typeof currentWorkflow.verification.daysToExpiry === "number"
                                            ? `${currentWorkflow.verification.daysToExpiry} ngày`
                                            : "—"
                                    }
                                />
                            </Card>

                            <Card title="Thông tin giá">
                                <InfoRow
                                    label="Giá gốc"
                                    value={formatCurrencyVN(currentWorkflow.pricing.originalPrice)}
                                />
                                <InfoRow
                                    label="Giá AI đề xuất"
                                    value={formatCurrencyVN(currentWorkflow.pricing.suggestedPrice)}
                                />
                                <InfoRow
                                    label="Giá bán cuối"
                                    value={
                                        <span className="font-semibold text-emerald-700">
                                            {formatCurrencyVN(currentWorkflow.pricing.finalPrice)}
                                        </span>
                                    }
                                />
                                <InfoRow
                                    label="Chấp nhận giá AI"
                                    value={
                                        currentWorkflow.pricing.acceptedSuggestion ? "Có" : "Không"
                                    }
                                />
                            </Card>

                            <Card title="Phân tích AI">
                                <InfoRow
                                    label="Độ tin cậy OCR"
                                    value={
                                        typeof currentWorkflow.draft.ocrConfidence === "number"
                                            ? `${Math.round(currentWorkflow.draft.ocrConfidence * 100)}%`
                                            : "—"
                                    }
                                />
                                <InfoRow
                                    label="Độ tin cậy định giá"
                                    value={
                                        typeof currentWorkflow.pricing.pricingConfidence === "number"
                                            ? `${Math.round(currentWorkflow.pricing.pricingConfidence * 100)}%`
                                            : "—"
                                    }
                                />

                                {currentWorkflow.pricing.pricingReasons.length > 0 ? (
                                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                        <div className="mb-2 text-sm font-semibold text-amber-800">
                                            Lý do AI đề xuất
                                        </div>
                                        <ul className="space-y-2 text-sm text-amber-700">
                                            {currentWorkflow.pricing.pricingReasons.map((reason, index) => (
                                                <li key={`${reason}-${index}`} className="flex gap-2">
                                                    <span>•</span>
                                                    <span>{reason}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </Card>
                        </div>

                        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            {validation.isValid ? (
                                <div className="flex items-center gap-2 font-medium">
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                    Sản phẩm đã sẵn sàng để đăng bán
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
                                disabled={!validation.isValid || publishing}
                                onClick={handlePublish}
                                className={cn(
                                    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition",
                                    validation.isValid && !publishing
                                        ? "bg-emerald-600 text-white shadow-[0_12px_30px_rgba(16,185,129,0.24)] hover:bg-emerald-700"
                                        : "cursor-not-allowed bg-slate-100 text-slate-400",
                                )}
                            >
                                {publishing ? (
                                    <>
                                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                        Đang đăng bán...
                                    </>
                                ) : (
                                    <>
                                        <Megaphone className="h-4.5 w-4.5" />
                                        Đăng bán sản phẩm
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Card = ({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) => {
    return (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-base font-semibold text-slate-900">{title}</h3>
            <div className="space-y-3">{children}</div>
        </section>
    )
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-3 last:border-b-0 last:pb-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-right text-sm font-medium text-slate-900">{value}</span>
        </div>
    )
}

export default PublishPage
