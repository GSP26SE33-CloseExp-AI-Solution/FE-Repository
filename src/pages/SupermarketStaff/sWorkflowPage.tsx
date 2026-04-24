import React, { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { ArrowLeft, Loader2, RefreshCcw, Sparkles } from "lucide-react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

import { productAiService } from "@/services/product-ai-workflow.service"
import { categoryService } from "@/services/category.service"
import { unitService } from "@/services/unit.service"

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
import type { CategoryItem } from "@/types/category.type"
import type { UnitOption } from "@/types/unit.type"

import WorkflowLotStep from "./sProductWorkflow/LotStep"
import WorkflowProductStep from "./sProductWorkflow/ProductStep"
import WorkflowScanStep from "./sProductWorkflow/ScanStep"
import WorkflowSummaryAside from "./sProductWorkflow/SummaryAside"
import { SectionCard, StepBadge } from "./sProductWorkflow/WorkflowShared"

type LoadingState = null | "IDENTIFY" | "ANALYZE" | "CREATE_PRODUCT" | "CREATE_LOT"

type ProductCategoryOption = {
    categoryId: string
    label: string
    value: string
    isFreshFood: boolean
}

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

    const [categories, setCategories] = useState<CategoryItem[]>([])
    const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])

    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const streamRef = useRef<MediaStream | null>(null)
    const imagesRef = useRef<LocalImageFile[]>([])

    const [stream, setStream] = useState<MediaStream | null>(null)
    const [usingCamera, setUsingCamera] = useState(false)

    const categoryOptions = useMemo<ProductCategoryOption[]>(
        () =>
            categories.map((item) => ({
                categoryId: item.categoryId,
                label: item.name,
                value: item.categoryId,
                isFreshFood: item.isFreshFood,
            })),
        [categories],
    )

    const resolveCategoryMeta = (categoryName?: string | null, categoryId?: string | null) => {
        const normalizedId = categoryId?.trim() || ""
        if (normalizedId) {
            const matchedById = categories.find((item) => item.categoryId === normalizedId)
            if (matchedById) {
                return {
                    categoryId: matchedById.categoryId,
                    categoryName: matchedById.name,
                    isFreshFood: matchedById.isFreshFood,
                }
            }
        }

        const normalizedName = categoryName?.trim().toLowerCase() || ""
        if (normalizedName) {
            const matchedByName = categories.find(
                (item) => item.name.trim().toLowerCase() === normalizedName,
            )
            if (matchedByName) {
                return {
                    categoryId: matchedByName.categoryId,
                    categoryName: matchedByName.name,
                    isFreshFood: matchedByName.isFreshFood,
                }
            }
        }

        return {
            categoryId: "",
            categoryName: categoryName?.trim() || "",
            isFreshFood: false,
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop())
        }
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
            setUploadError("Không thể mở camera. Vui lòng kiểm tra quyền truy cập.")
        }
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        setImages((prev) => {
            const updated = [...prev]
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

            setUploadError(overLimit > 0 ? `Chỉ được tối đa ${MAX_IMAGES} ảnh` : null)
            return updated
        })

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
            if (target) {
                URL.revokeObjectURL(target.preview)
            }
            return prev.filter((item) => item.id !== id)
        })
    }

    const clearImages = () => {
        setImages((prev) => {
            prev.forEach((img) => URL.revokeObjectURL(img.preview))
            return []
        })
        setUploadError(null)
        stopCamera()
    }

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await categoryService.getCategories(false)
                setCategories(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error("ProductWorkflowPage.loadCategories -> error:", error)
                toast.error("Không tải được danh mục sản phẩm")
            }
        }

        const loadUnits = async () => {
            try {
                const data = await unitService.getUnits()

                setUnitOptions(
                    Array.isArray(data)
                        ? data.map((item) => ({
                            unitId: item.unitId,
                            label: item.symbol ? `${item.name} (${item.symbol})` : item.name,
                            value: item.unitId,
                            unitType: item.type || undefined,
                            unitSymbol: item.symbol || undefined,
                        }))
                        : [],
                )
            } catch (error) {
                console.error("ProductWorkflowPage.loadUnits -> error:", error)
                toast.error("Không tải được đơn vị sản phẩm")
            }
        }

        void loadCategories()
        void loadUnits()
    }, [])

    useEffect(() => {
        if (!usingCamera || !videoRef.current || !stream) return

        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {
            setUploadError("Không thể phát camera trên trình duyệt này.")
        })
    }, [usingCamera, stream])

    useEffect(() => {
        streamRef.current = stream
    }, [stream])

    useEffect(() => {
        imagesRef.current = images
    }, [images])

    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop())
            imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview))
        }
    }, [])

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

            const categoryMeta = resolveCategoryMeta(
                next.productForm.categoryName,
                next.productForm.categoryId,
            )

            setWorkflow({
                ...next,
                productForm: {
                    ...next.productForm,
                    categoryId: categoryMeta.categoryId,
                    categoryName: categoryMeta.categoryName || next.productForm.categoryName,
                    isFreshFood: categoryMeta.isFreshFood,
                },
            })
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
        if (
            workflow.mode !== "CREATE_NEW_PRODUCT" ||
            workflow.nextAction !== "CREATE_PRODUCT"
        ) {
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
            const extractedBarcode =
                result.extractedInfo?.barcode?.trim() ||
                result.barcodeLookupInfo?.barcode?.trim() ||
                ""

            const categoryMeta = resolveCategoryMeta(
                next.productForm.categoryName,
                next.productForm.categoryId,
            )

            setWorkflow({
                ...next,
                barcode: extractedBarcode || next.barcode,
                productForm: {
                    ...next.productForm,
                    barcode: extractedBarcode || next.productForm.barcode,
                    categoryId: categoryMeta.categoryId,
                    categoryName: categoryMeta.categoryName || next.productForm.categoryName,
                    isFreshFood: categoryMeta.isFreshFood,
                },
            })

            if (extractedBarcode) {
                setBarcodeInput(extractedBarcode)
            }

            toast.success("Hệ thống đã phân tích ảnh và điền sẵn thông tin")
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
                "Hệ thống chưa phân tích được ảnh",
            )
        } finally {
            setLoading(null)
        }
    }

    const handleChooseReference = (product: ExistingProductSummaryDto) => {
        setWorkflow((prev) => {
            const categoryMeta = resolveCategoryMeta(product.category, "")

            return {
                ...prev,
                referenceProduct: product,
                productForm: {
                    ...prev.productForm,
                    name: product.name || prev.productForm.name,
                    brand: product.brand || prev.productForm.brand,
                    categoryId: categoryMeta.categoryId,
                    categoryName: categoryMeta.categoryName || prev.productForm.categoryName,
                    isFreshFood: categoryMeta.isFreshFood,
                    barcode: product.barcode || prev.productForm.barcode,
                    manufacturer: product.manufacturer || prev.productForm.manufacturer,
                    ingredients:
                        product.ingredients?.join(", ") || prev.productForm.ingredients,
                },
            }
        })

        toast.success("Đã dùng sản phẩm này làm dữ liệu tham khảo")
    }

    const handleSubmitProduct = async () => {
        const form = workflow.productForm

        if (
            !form.name.trim() ||
            !form.categoryName.trim() ||
            !form.barcode.trim() ||
            !form.unitId.trim()
        ) {
            toast.error("Còn thiếu tên sản phẩm, danh mục, barcode hoặc đơn vị")
            return
        }

        setLoading("CREATE_PRODUCT")

        try {
            const result = await productAiService.createWorkflowProduct({
                barcode: form.barcode.trim(),
                name: form.name.trim(),
                categoryName: form.categoryName.trim(),
                unitId: form.unitId.trim(),
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
            const categoryMeta = resolveCategoryMeta(
                next.productForm.categoryName,
                next.productForm.categoryId,
            )

            setWorkflow({
                ...next,
                productForm: {
                    ...next.productForm,
                    categoryId: categoryMeta.categoryId,
                    categoryName: categoryMeta.categoryName || next.productForm.categoryName,
                    isFreshFood: categoryMeta.isFreshFood,
                },
            })

            toast.success(
                workflow.mode === "VERIFY_OWN_PRODUCT"
                    ? "Đã xác nhận sản phẩm thành công"
                    : "Đã tạo sản phẩm thành công",
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
                "Không thể xác nhận/tạo sản phẩm",
            )
        } finally {
            setLoading(null)
        }
    }

    const handleSubmitLot = async () => {
        const form = workflow.lotForm
        const productId = workflow.createdProduct?.productId || workflow.ownProduct?.productId

        if (!productId) {
            toast.error("Thiếu mã sản phẩm để tạo lô hàng")
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
            toast.error("Khi không dùng giá gợi ý từ hệ thống, bạn cần nhập giá cuối mong muốn")
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
            unitId: workflow.createdProduct?.unitId || workflow.productForm.unitId || undefined,
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
                    ? "Tạo lot + xử lý giá + đăng bán thành công"
                    : "Tạo lot + định giá + đăng bán thành công",
            )
        } catch (error: any) {
            console.error("ProductWorkflowPage.handleSubmitLot -> error:", error)
            console.error(
                "ProductWorkflowPage.handleSubmitLot -> response data:",
                error?.response?.data,
            )

            const responseMessage = error?.response?.data?.message || ""
            const responseErrors = error?.response?.data?.errors || []

            let uiMessage = "Không tạo và đăng bán được lô hàng"

            if (
                responseMessage.includes("Remaining shelf life must be > 24 hours")
            ) {
                uiMessage = "Hạn sử dụng sản phẩm phải trên 24 tiếng"
            } else if (
                Array.isArray(responseErrors) &&
                responseErrors.includes("workflow_conflict")
            ) {
                uiMessage = responseMessage || "Thao tác hiện tại không phù hợp với quy trình hệ thống"
            } else {
                uiMessage =
                    responseMessage ||
                    responseErrors?.[0] ||
                    error?.message ||
                    uiMessage
            }

            toast.error(uiMessage)
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
                                categoryOptions={categoryOptions}
                                unitOptions={unitOptions}
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
                                selectedUnit={unitOptions.find(
                                    (item) => item.unitId === workflow.productForm.unitId,
                                )}
                                form={workflow.lotForm}
                                loading={loading === "CREATE_LOT"}
                                createdLot={workflow.createdLot}
                                isFreshFood={workflow.productForm.isFreshFood}
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

                    <WorkflowSummaryAside
                        workflow={workflow}
                        images={images}
                        unitOptions={unitOptions}
                    />
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
