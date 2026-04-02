import React, {
    ChangeEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { useNavigate } from "react-router-dom"
import {
    Camera,
    CheckCircle2,
    Loader2,
    Sparkles,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useImageHash } from "@/hooks/useImageHash"
import { productAiService } from "@/services/product-ai.service"
import {
    mapAnalyzeImageResultToWorkflow,
    mapCreateDraftResultToWorkflow,
    mergeWorkflowSnapshots,
} from "@/mappers/product-ai.mapper"
import { showError } from "@/utils/toast"

type PageState = "UPLOAD" | "AI_PROCESSING"
type ImageSource = "upload" | "camera"

type LocalImageFile = {
    id: string
    file: File
    preview: string
    hash?: string
    source: ImageSource
}

const MAX_IMAGES = 5

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

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
        if (!ctx) {
            throw new Error("Không thể chuyển ảnh webp sang png")
        }

        ctx.drawImage(img, 0, 0)

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((result) => resolve(result), "image/png")
        })

        if (!blob) {
            throw new Error("Không thể tạo blob png từ ảnh webp")
        }

        const safeName = file.name.replace(/\.webp$/i, "") || `upload-${Date.now()}`
        return new File([blob], `${safeName}.png`, { type: "image/png" })
    } finally {
        URL.revokeObjectURL(imageUrl)
    }
}

const AddProduct: React.FC = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { getHashFromFile, isDuplicateHash } = useImageHash(6)

    const [pageState, setPageState] = useState<PageState>("UPLOAD")
    const [images, setImages] = useState<LocalImageFile[]>([])
    const [uploadError, setUploadError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [stream, setStream] = useState<MediaStream | null>(null)
    const [usingCamera, setUsingCamera] = useState(false)

    const supermarketId = user?.marketStaffInfo?.supermarket?.supermarketId
    const createdBy = user?.userId

    const canSubmit = images.length > 0 && !usingCamera && pageState !== "AI_PROCESSING"

    const imageCountText = useMemo(() => {
        return `${images.length}/${MAX_IMAGES} ảnh`
    }, [images.length])

    const stopCamera = () => {
        stream?.getTracks().forEach((track) => track.stop())
        setStream(null)
        setUsingCamera(false)
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
            images.forEach((img) => {
                if (img.source === "upload") {
                    URL.revokeObjectURL(img.preview)
                }
            })
        }
    }, [stream, images])

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
            })
            setStream(mediaStream)
            setUsingCamera(true)
            setUploadError(null)
        } catch (error) {
            console.error("AddProduct.startCamera -> error:", error)
            setUploadError("Không thể mở camera. Hãy kiểm tra quyền truy cập.")
        }
    }

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        let updated = [...images]
        let duplicate = 0
        let overLimit = 0

        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) continue

            if (updated.length >= MAX_IMAGES) {
                overLimit++
                continue
            }

            const preview = URL.createObjectURL(file)
            const rawHash = await getHashFromFile(file)
            const hash = rawHash ?? undefined

            if (hash && isDuplicateHash(hash, updated.map((item) => item.hash))) {
                duplicate++
                URL.revokeObjectURL(preview)
                continue
            }

            updated.push({
                id: crypto.randomUUID(),
                file,
                preview,
                hash,
                source: "upload",
            })
        }

        setImages(updated)

        const messages: string[] = []
        if (duplicate > 0) messages.push(`${duplicate} ảnh bị trùng`)
        if (overLimit > 0) messages.push(`Chỉ được tối đa ${MAX_IMAGES} ảnh`)
        setUploadError(messages.length > 0 ? messages.join(" • ") : null)

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

        const rawHash = await getHashFromFile(file)
        const hash = rawHash ?? undefined

        if (hash && isDuplicateHash(hash, images.map((item) => item.hash))) {
            setUploadError("Ảnh chụp này trùng với ảnh đã có.")
            stopCamera()
            return
        }

        setImages((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                file,
                preview,
                hash,
                source: "camera",
            },
        ])

        setUploadError(null)
        stopCamera()
    }

    const removeImage = (id: string) => {
        setImages((prev) => {
            const target = prev.find((item) => item.id === id)
            if (target?.source === "upload") {
                URL.revokeObjectURL(target.preview)
            }
            return prev.filter((item) => item.id !== id)
        })
    }

    const handleConfirmUpload = async () => {
        if (images.length === 0) return

        if (!supermarketId || !createdBy) {
            showError("Thiếu thông tin tài khoản hoặc siêu thị.")
            return
        }

        const rawMainImage = images[0]?.file
        if (!rawMainImage) {
            showError("Bạn chưa chọn ảnh sản phẩm.")
            return
        }

        const mainImage = await convertImageToPng(rawMainImage)

        console.log("AddProduct.handleConfirmUpload -> payload", {
            supermarketId,
            createdBy,
            mainImageName: mainImage?.name,
            mainImageType: mainImage?.type,
            mainImageSize: mainImage?.size,
        })

        setPageState("AI_PROCESSING")

        try {
            console.log("AddProduct.handleConfirmUpload -> payload", {
                supermarketId,
                createdBy,
                mainImageName: mainImage?.name,
                mainImageType: mainImage?.type,
                mainImageSize: mainImage?.size,
            })
            console.log("supermarketId typeof:", typeof supermarketId, "value:", supermarketId)

            const analyzeResult = await productAiService.analyzeImage({
                supermarketId,
                file: mainImage,
            })

            const analyzeWorkflow = mapAnalyzeImageResultToWorkflow(analyzeResult)
            const extractedInfo = analyzeResult.extractedInfo

            const name = extractedInfo?.name?.trim() || "Sản phẩm mới từ AI"
            const barcode = extractedInfo?.barcode?.trim() || ""

            console.log("🧠 AddProduct.analyzeImage -> result:", analyzeResult)
            console.log("🧠 AddProduct.analyzeImage -> workflow:", analyzeWorkflow)

            if (!barcode) {
                console.error("AddProduct.handleConfirmUpload -> missing barcode", {
                    extractedInfo,
                    analyzeResult,
                })
                showError("AI chưa đọc được mã vạch rõ ràng. Bạn hãy thử ảnh khác nét hơn.")
                setPageState("UPLOAD")
                return
            }

            const createDraftResult = await productAiService.createDraftProduct({
                supermarketId,
                createdBy,
                name,
                barcode,
                brand: extractedInfo?.brand?.trim() || undefined,
                category: extractedInfo?.category?.trim() || undefined,
                manufacturer: extractedInfo?.manufacturer?.trim() || undefined,
                ingredients: extractedInfo?.ingredients?.trim() || undefined,
                origin: extractedInfo?.origin?.trim() || undefined,
                ocrConfidence: analyzeResult.confidence,
                ocrExtractedData: analyzeResult.rawOcrData,
                ocrImageUrl: analyzeResult.imageUrl,
                isFreshFood: false,
            })

            const draftWorkflow = mapCreateDraftResultToWorkflow(createDraftResult)
            const workflow = mergeWorkflowSnapshots(analyzeWorkflow, draftWorkflow)

            console.log("🔥 AddProduct.createDraft -> result:", createDraftResult)
            console.log("🔥 AddProduct.finalWorkflow:", workflow)

            navigate(
                `/supermarketStaff/products/${createDraftResult.productId}/confirm`,
                {
                    state: {
                        workflow,
                        uploadedImages: images.map((img) => ({
                            id: img.id,
                            preview: img.preview,
                            source: img.source,
                        })),
                    },
                }
            )
        } catch (error: any) {
            console.error("AddProduct.handleConfirmUpload -> error:", error)
            console.error("AddProduct.handleConfirmUpload -> response status:", error?.response?.status)
            console.error("AddProduct.handleConfirmUpload -> response data:", error?.response?.data)
            console.error("AddProduct.handleConfirmUpload -> response errors:", error?.response?.data?.errors)

            showError(
                error?.response?.data?.errors?.[0] ||
                error?.response?.data?.message ||
                "AI chưa phân tích được ảnh. Bạn hãy thử lại bằng ảnh rõ hơn."
            )
            setPageState("UPLOAD")
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-28">
                <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/60 p-6 shadow-[0_16px_50px_rgba(16,185,129,0.08)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                AI Smart Scan
                            </div>

                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Thêm sản phẩm mới
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Tải lên ảnh sản phẩm để AI đọc nhanh tên, mã vạch và một phần
                                thông tin cơ bản. Ảnh đầu tiên sẽ được dùng làm ảnh chính để xử lý.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            {imageCountText}
                        </div>
                    </div>
                </div>

                {pageState === "UPLOAD" ? (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Ảnh sản phẩm
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Bạn có thể chụp ảnh trực tiếp hoặc tải ảnh có sẵn từ máy.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                    >
                                        <Camera className="h-4.5 w-4.5" />
                                        Chụp ảnh bằng camera
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleUploadClick}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        <UploadCloud className="h-4.5 w-4.5" />
                                        Upload ảnh có sẵn
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {uploadError ? (
                                <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-600">
                                    {uploadError}
                                </div>
                            ) : null}

                            {usingCamera ? (
                                <div className="p-5">
                                    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="h-[420px] w-full object-contain"
                                        />

                                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 via-black/20 to-transparent px-5 pb-5 pt-16">
                                            <button
                                                type="button"
                                                onClick={stopCamera}
                                                className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                                            >
                                                <X className="h-4 w-4" />
                                                Đóng camera
                                            </button>

                                            <button
                                                type="button"
                                                onClick={capturePhoto}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
                                            >
                                                <Camera className="h-4.5 w-4.5" />
                                                Chụp ảnh
                                            </button>
                                        </div>
                                    </div>

                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                            ) : null}

                            {images.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {images.map((img, index) => (
                                        <div
                                            key={img.id}
                                            className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50"
                                        >
                                            <img
                                                src={img.preview}
                                                alt={`Ảnh sản phẩm ${index + 1}`}
                                                className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                            />

                                            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                                                <div className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                    {index === 0 ? "Ảnh chính" : `Ảnh ${index + 1}`}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(img.id)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-10 text-center">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                        <UploadCloud className="h-8 w-8 text-slate-400" />
                                    </div>

                                    <h3 className="text-lg font-semibold text-slate-800">
                                        Chưa có ảnh nào được chọn
                                    </h3>

                                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                        Nên dùng ảnh rõ nét, đủ sáng, thấy được tên sản phẩm và mã
                                        vạch để AI đọc chính xác hơn.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="h-fit rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                            <h3 className="text-base font-semibold text-slate-900">
                                Xác nhận xử lý AI
                            </h3>

                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    Ảnh đầu tiên sẽ được dùng để AI phân tích thông tin chính.
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    Nếu AI không đọc được mã vạch, hệ thống sẽ chưa tạo draft sản phẩm.
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    Sau bước này bạn sẽ sang màn hình xác nhận lại thông tin trước khi đi tiếp.
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleConfirmUpload}
                                disabled={!canSubmit}
                                className={cn(
                                    "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition",
                                    canSubmit
                                        ? "bg-emerald-600 text-white shadow-[0_12px_30px_rgba(16,185,129,0.24)] hover:bg-emerald-700"
                                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                                )}
                            >
                                <CheckCircle2 className="h-4.5 w-4.5" />
                                Xác nhận đăng ảnh
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[32px] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/40 px-6 text-center">
                        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(16,185,129,0.16)]">
                            <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
                        </div>

                        <h2 className="text-2xl font-semibold text-slate-900">
                            AI đang phân tích hình ảnh
                        </h2>

                        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                            Hệ thống đang trích xuất thông tin từ ảnh và tạo bản nháp sản phẩm để bạn
                            xác nhận ở bước tiếp theo.
                        </p>

                        <div className="mt-8 flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-700 shadow-sm">
                            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            Đang xử lý ảnh chính...
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AddProduct
