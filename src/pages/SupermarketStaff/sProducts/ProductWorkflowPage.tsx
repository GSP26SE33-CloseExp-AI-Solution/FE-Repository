import React, { ChangeEvent, useEffect, useRef, useState } from "react"
import { ArrowLeft, Loader2, RefreshCcw, Sparkles } from "lucide-react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

import { productAiService } from "@/services/product-ai.service"
import {
    mapWorkflowAnalyzeImageResultToState,
    mapWorkflowCreateAndPublishLotResultToState,
    mapWorkflowCreateProductResultToState,
    mapWorkflowIdentifyResultToState,
} from "@/mappers/product-ai.mapper"
import type {
    ExistingProductSummaryDto,
    LocalImageFile,
    ProductWorkflowState,
    WorkflowCreateAndPublishLotRequestDto,
} from "@/types/product-ai-workflow.type"
import {
    buildInitialWorkflowState,
    joinIngredientsForRequest,
    stringifyNutritionFactsForRequest,
} from "@/types/product-ai-workflow.type"

import WorkflowLotStep from "../sProductWorkflow/WorkflowLotStep"
import WorkflowProductStep from "../sProductWorkflow/WorkflowProductStep"
import WorkflowScanStep from "../sProductWorkflow/WorkflowScanStep"
import WorkflowSummaryAside from "../sProductWorkflow/WorkflowSummaryAside"
import { SectionCard, StepBadge } from "../sProductWorkflow/WorkflowShared"

type LoadingState = null | "IDENTIFY" | "ANALYZE" | "CREATE_PRODUCT" | "CREATE_LOT"

const MAX_IMAGES = 5

const normalizeBarcode = (value: string) => value.replace(/\s+/g, "").trim()

const convertImageToPng = async (file: File): Promise<File> => {
    if (file.type !== "image/webp") return file

    const imageUrl = URL.createObjectURL(file)

    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image()
            image.onload = () => resolve(image)
            image.onerror = reject
            image.src = imageUrl
        })

        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height

        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Không thể chuyển ảnh webp sang png")

        ctx.drawImage(img, 0, 0)

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((result) => resolve(result), "image/png")
        })

        if (!blob) throw new Error("Không thể tạo blob png")

        const safeName = file.name.replace(/\.webp$/i, "") || `upload-${Date.now()}`
        return new File([blob], `${safeName}.png`, { type: "image/png" })
    } finally {
        URL.revokeObjectURL(imageUrl)
    }
}

const ProductWorkflowPage: React.FC = () => {
    const navigate = useNavigate()

    const [workflow, setWorkflow] = useState<ProductWorkflowState>(buildInitialWorkflowState())
    const [barcodeInput, setBarcodeInput] = useState("")
    const [loading, setLoading] = useState<LoadingState>(null)

    const [images, setImages] = useState<LocalImageFile[]>([])
    const [uploadError, setUploadError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [stream, setStream] = useState<MediaStream | null>(null)
    const [usingCamera, setUsingCamera] = useState(false)

    const stopCamera = () => {
        stream?.getTracks().forEach((track) => track.stop())
        setStream(null)
        setUsingCamera(false)
    }

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                },
                audio: false,
            })

            setStream(mediaStream)
            setUsingCamera(true)
            setUploadError(null)
        } catch (error) {
            console.error("ProductWorkflowPage.startCamera -> error:", error)
            setUploadError("Không thể mở camera. Hãy kiểm tra quyền truy cập.")
        }
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        let updated = [...images]
        let overLimit = 0

        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) continue

            if (updated.length >= MAX_IMAGES) {
                overLimit++
                continue
            }

            updated.push({
                id: crypto.randomUUID(),
                file,
                preview: URL.createObjectURL(file),
                source: "upload",
            })
        }

        setImages(updated)
        setUploadError(overLimit > 0 ? `Chỉ được tối đa ${MAX_IMAGES} ảnh` : null)
        e.target.value = ""
    }

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return

        if (images.length >= MAX_IMAGES) {
            setUploadError(`Chỉ được tối đa ${MAX_IMAGES} ảnh.`)
            stopCamera()
            return
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        if (!ctx) {
            setUploadError("Không thể xử lý ảnh từ camera.")
            stopCamera()
            return
        }

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        const preview = canvas.toDataURL("image/png")
        const blob = await fetch(preview).then((res) => res.blob())
        const file = new File([blob], `camera-${Date.now()}.png`, {
            type: "image/png",
        })

        setImages((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                file,
                preview,
                source: "camera",
            },
        ])

        setUploadError(null)
        stopCamera()
    }

    const removeImage = (id: string) => {
        setImages((prev) => {
            const target = prev.find((item) => item.id === id)
            if (target) URL.revokeObjectURL(target.preview)
            return prev.filter((item) => item.id !== id)
        })
    }

    const clearImages = () => {
        images.forEach((img) => URL.revokeObjectURL(img.preview))
        setImages([])
        setUploadError(null)
        stopCamera()
    }

    useEffect(() => {
        if (!usingCamera || !videoRef.current || !stream) return

        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {
            setUploadError("Không thể phát camera trên trình duyệt này.")
        })
    }, [usingCamera, stream])

    useEffect(() => {
        return () => {
            stream?.getTracks().forEach((track) => track.stop())
            images.forEach((img) => URL.revokeObjectURL(img.preview))
        }
    }, [stream, images])

    const resetAllWorkflow = () => {
        clearImages()
        setBarcodeInput("")
        setLoading(null)
        setWorkflow(buildInitialWorkflowState())
    }

    const handleIdentify = async (barcodeOverride?: string) => {
        const barcode = normalizeBarcode(barcodeOverride ?? barcodeInput)

        if (!barcode) {
            toast.error("Bạn chưa nhập mã vạch")
            return
        }

        setBarcodeInput(barcode)
        setLoading("IDENTIFY")

        try {
            const result = await productAiService.identifyWorkflow({ barcode })
            const next = mapWorkflowIdentifyResultToState(result)

            setWorkflow(next)
            setBarcodeInput(result.barcode || barcode)
            clearImages()

            toast.success(
                next.statusText ||
                `Đã quét thành công barcode: ${result.barcode || barcode}`,
            )
        } catch (error: any) {
            console.error("ProductWorkflowPage.handleIdentify -> error:", error)
            console.error(
                "ProductWorkflowPage.handleIdentify -> response data:",
                error?.response?.data,
            )

            toast.error(
                error?.response?.data?.errors?.[0] ||
                error?.response?.data?.message ||
                error?.message ||
                "Không nhận diện được barcode",
            )
        } finally {
            setLoading(null)
        }
    }

    const handleAnalyzeImage = async () => {
        if (workflow.mode !== "CREATE_NEW_PRODUCT" || workflow.nextAction !== "CREATE_PRODUCT") {
            toast.error("Chỉ được OCR ảnh khi hệ thống yêu cầu tạo sản phẩm mới")
            return
        }

        const rawMainImage = images[0]?.file
        if (!rawMainImage) {
            toast.error("Bạn chưa chọn ảnh sản phẩm")
            return
        }

        setLoading("ANALYZE")

        try {
            const mainImage = await convertImageToPng(rawMainImage)
            const result = await productAiService.analyzeWorkflowImage(
                mainImage,
                workflow.productForm.isManualFallback,
            )

            const next = mapWorkflowAnalyzeImageResultToState(workflow, result)
            setWorkflow(next)

            const extractedBarcode =
                result.extractedInfo?.barcode?.trim() ||
                result.barcodeLookupInfo?.barcode?.trim() ||
                ""

            if (extractedBarcode) {
                setWorkflow((prev) => ({
                    ...prev,
                    barcode: extractedBarcode,
                    productForm: {
                        ...prev.productForm,
                        barcode: extractedBarcode,
                    },
                }))
            }

            toast.success("Đã phân tích ảnh và điền sẵn thông tin")
        } catch (error: any) {
            console.error("ProductWorkflowPage.handleAnalyzeImage -> error:", error)
            console.error(
                "ProductWorkflowPage.handleAnalyzeImage -> response data:",
                error?.response?.data,
            )

            toast.error(
                error?.response?.data?.errors?.[0] ||
                error?.response?.data?.message ||
                error?.message ||
                "AI chưa phân tích được ảnh",
            )
        } finally {
            setLoading(null)
        }
    }

    const handleChooseReference = (product: ExistingProductSummaryDto) => {
        setWorkflow((prev) => ({
            ...prev,
            referenceProduct: product,
            productForm: {
                ...prev.productForm,
                name: product.name || prev.productForm.name,
                brand: product.brand || prev.productForm.brand,
                categoryName: product.category || prev.productForm.categoryName,
                barcode: product.barcode || prev.productForm.barcode,
                manufacturer: product.manufacturer || prev.productForm.manufacturer,
                ingredients:
                    product.ingredients?.join(", ") || prev.productForm.ingredients,
            },
        }))
        toast.success("Đã dùng sản phẩm này làm dữ liệu tham khảo")
    }

    const handleSubmitProduct = async () => {
        const form = workflow.productForm

        if (!form.name.trim() || !form.categoryName.trim() || !form.barcode.trim()) {
            toast.error("Còn thiếu tên sản phẩm, danh mục hoặc barcode")
            return
        }

        setLoading("CREATE_PRODUCT")

        try {
            const result = await productAiService.createWorkflowProduct({
                barcode: form.barcode.trim(),
                name: form.name.trim(),
                categoryName: form.categoryName.trim(),
                detail: {
                    brand: form.brand.trim() || undefined,
                    ingredients: joinIngredientsForRequest(form.ingredients),
                    nutritionFactsJson: stringifyNutritionFactsForRequest(
                        form.nutritionFacts,
                    ),
                    usageInstructions: form.usageInstructions.trim() || undefined,
                    storageInstructions: form.storageInstructions.trim() || undefined,
                    manufacturer: form.manufacturer.trim() || undefined,
                    origin: form.origin.trim() || undefined,
                    description: form.description.trim() || undefined,
                    safetyWarnings: form.safetyWarnings.trim() || undefined,
                },
                ocrImageUrl: workflow.analyzeResult?.imageUrl || undefined,
                ocrExtractedData: workflow.analyzeResult?.rawOcrData || undefined,
                ocrConfidence: workflow.analyzeResult?.confidence || undefined,
                isManualFallback: form.isManualFallback,
            })

            const next = mapWorkflowCreateProductResultToState(workflow, result)
            setWorkflow(next)

            toast.success(
                workflow.mode === "VERIFY_OWN_PRODUCT"
                    ? "Đã xác nhận sản phẩm thành công"
                    : "Đã tạo product thành công",
            )
        } catch (error: any) {
            console.error("ProductWorkflowPage.handleSubmitProduct -> error:", error)
            console.error(
                "ProductWorkflowPage.handleSubmitProduct -> response data:",
                error?.response?.data,
            )

            toast.error(
                error?.response?.data?.errors?.[0] ||
                error?.response?.data?.message ||
                error?.message ||
                "Không thể xác nhận/tạo product",
            )
        } finally {
            setLoading(null)
        }
    }

    const handleSubmitLot = async () => {
        const form = workflow.lotForm
        const productId = workflow.createdProduct?.productId || workflow.ownProduct?.productId

        if (!productId) {
            toast.error("Thiếu productId để tạo lô")
            return
        }

        const originalUnitPrice =
            typeof form.originalUnitPrice === "number" ? form.originalUnitPrice : 0

        const finalUnitPrice =
            typeof form.finalUnitPrice === "number" && form.finalUnitPrice > 0
                ? form.finalUnitPrice
                : undefined

        if (!form.expiryDate) {
            toast.error("Thiếu hạn sử dụng")
            return
        }

        if (!(originalUnitPrice > 0)) {
            toast.error("Thiếu giá gốc hợp lệ")
            return
        }

        if (
            !(
                (typeof form.quantity === "number" && form.quantity > 0) ||
                (typeof form.weight === "number" && form.weight > 0)
            )
        ) {
            toast.error("Bạn cần nhập số lượng hoặc khối lượng")
            return
        }

        if (!form.acceptedSuggestion && !finalUnitPrice) {
            toast.error("Khi không dùng giá AI, bạn cần nhập giá cuối mong muốn")
            return
        }

        const payload: WorkflowCreateAndPublishLotRequestDto = {
            productId,
            expiryDate: new Date(form.expiryDate).toISOString(),
            manufactureDate: form.manufactureDate
                ? new Date(form.manufactureDate).toISOString()
                : undefined,
            quantity:
                typeof form.quantity === "number" && form.quantity > 0
                    ? form.quantity
                    : undefined,
            weight:
                typeof form.weight === "number" && form.weight > 0
                    ? form.weight
                    : undefined,
            originalUnitPrice,
            finalUnitPrice,
            acceptedSuggestion: form.acceptedSuggestion,
            priceFeedback: form.priceFeedback.trim() || undefined,
            isManualFallback: form.isManualFallback,
        }

        console.log("ProductWorkflowPage.handleSubmitLot -> payload:", payload)

        setLoading("CREATE_LOT")

        try {
            const result = await productAiService.createAndPublishWorkflowLot(payload)
            const next = mapWorkflowCreateAndPublishLotResultToState(workflow, result)

            console.log("ProductWorkflowPage.handleSubmitLot -> result:", result)

            setWorkflow(next)
            toast.success(
                result.pricingSuggestionResolvedBeforePublish
                    ? "Tạo lot + xử lý giá + publish thành công"
                    : "Tạo lot + định giá + publish thành công",
            )
        } catch (error: any) {
            console.error("ProductWorkflowPage.handleSubmitLot -> error:", error)
            console.error(
                "ProductWorkflowPage.handleSubmitLot -> response data:",
                error?.response?.data,
            )

            toast.error(
                error?.response?.data?.errors?.[0] ||
                error?.response?.data?.message ||
                error?.message ||
                "Không tạo và publish được lô hàng",
            )
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-[1380px] px-4 pb-10 pt-4 md:px-5 md:pt-6">
                <div className="mb-5 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                <Sparkles className="h-3.5 w-3.5" />
                                Thêm sản phẩm
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
                                Thêm sản phẩm cho siêu thị
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Luồng đúng: nhập hoặc quét barcode trước, hệ thống kiểm tra trong DB,
                                chỉ khi chưa có sản phẩm phù hợp mới chuyển sang bước OCR ảnh.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <StepBadge active={workflow.step === "SCAN"}>Scan mã vạch</StepBadge>
                            <StepBadge active={workflow.step === "PRODUCT"}>Sản phẩm</StepBadge>
                            <StepBadge active={workflow.step === "LOT"}>Lô hàng</StepBadge>
                            <StepBadge active={workflow.step === "DONE"}>Hoàn thành</StepBadge>

                            <button
                                type="button"
                                onClick={() => {
                                    resetAllWorkflow()
                                    toast.success("Đã reset toàn bộ workflow")
                                }}
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-5">
                        {workflow.step === "SCAN" ? (
                            <WorkflowScanStep
                                barcodeInput={barcodeInput}
                                setBarcodeInput={setBarcodeInput}
                                loading={loading === "IDENTIFY" ? "IDENTIFY" : null}
                                onIdentify={handleIdentify}
                            />
                        ) : null}

                        {workflow.step === "PRODUCT" ? (
                            <WorkflowProductStep
                                mode={workflow.mode}
                                nextAction={workflow.nextAction}
                                form={workflow.productForm}
                                loading={
                                    loading === "CREATE_PRODUCT"
                                        ? "CREATE_PRODUCT"
                                        : loading === "ANALYZE"
                                            ? "ANALYZE"
                                            : null
                                }
                                externalProducts={workflow.externalProducts}
                                selectedReferenceProductId={workflow.referenceProduct?.productId}
                                analyzeResult={workflow.analyzeResult}
                                images={images}
                                uploadError={uploadError}
                                usingCamera={usingCamera}
                                fileInputRef={fileInputRef}
                                videoRef={videoRef}
                                canvasRef={canvasRef}
                                onChooseReference={handleChooseReference}
                                onChange={(next) =>
                                    setWorkflow((prev) => ({ ...prev, productForm: next }))
                                }
                                onSubmit={handleSubmitProduct}
                                onBack={() => {
                                    clearImages()
                                    setWorkflow((prev) => ({
                                        ...prev,
                                        step: "SCAN",
                                    }))
                                }}
                                onAnalyzeImage={handleAnalyzeImage}
                                onStartCamera={startCamera}
                                onStopCamera={stopCamera}
                                onCapturePhoto={capturePhoto}
                                onTriggerUpload={() => fileInputRef.current?.click()}
                                onRemoveImage={removeImage}
                                onFileChange={handleFileChange}
                            />
                        ) : null}

                        {workflow.step === "LOT" ? (
                            <WorkflowLotStep
                                ownProduct={workflow.ownProduct}
                                createdProduct={workflow.createdProduct}
                                form={workflow.lotForm}
                                loading={loading === "CREATE_LOT"}
                                createdLot={workflow.createdLot}
                                onChange={(next) =>
                                    setWorkflow((prev) => ({ ...prev, lotForm: next }))
                                }
                                onBack={() => {
                                    if (workflow.createdProduct) {
                                        setWorkflow((prev) => ({
                                            ...prev,
                                            step: "PRODUCT",
                                        }))
                                        return
                                    }

                                    setWorkflow((prev) => ({
                                        ...prev,
                                        step: "SCAN",
                                    }))
                                }}
                                onSubmit={handleSubmitLot}
                            />
                        ) : null}

                        {workflow.step === "DONE" ? (
                            <SectionCard
                                title="Hoàn tất workflow"
                                description="Lot đã được tạo thành công."
                            >
                                <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="text-base font-semibold text-emerald-900">
                                        Đã tạo lot thành công
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                                        Bạn có thể quay về danh sách sản phẩm hoặc bắt đầu một workflow mới.
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => navigate("/supermarketStaff/products")}
                                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                        >
                                            Danh sách sản phẩm
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                resetAllWorkflow()
                                                toast.success("Đã reset toàn bộ workflow")
                                            }}
                                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                        >
                                            Tạo workflow mới
                                        </button>
                                    </div>
                                </div>
                            </SectionCard>
                        ) : null}

                        {loading && workflow.step === "DONE" ? (
                            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang xử lý...
                            </div>
                        ) : null}
                    </div>

                    <WorkflowSummaryAside workflow={workflow} images={images} />
                </div>

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductWorkflowPage
