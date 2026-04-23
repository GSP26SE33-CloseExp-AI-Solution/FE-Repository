import React, {
    DragEvent,
    MouseEvent as ReactMouseEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import {
    Camera,
    CameraOff,
    CheckCircle2,
    Crop,
    ImagePlus,
    Loader2,
    Move,
    RefreshCcw,
    ScanLine,
    Search,
    Upload,
    XCircle,
} from "lucide-react"
import {
    BarcodeFormat,
    BinaryBitmap,
    DecodeHintType,
    HybridBinarizer,
    MultiFormatReader,
    RGBLuminanceSource,
} from "@zxing/library"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"

import { cn, SectionCard } from "./WorkflowShared"

type Props = {
    barcodeInput: string
    setBarcodeInput: (value: string) => void
    loading: null | "IDENTIFY"
    onIdentify: (barcode?: string) => void | Promise<void>
}

type ScanStatus = "IDLE" | "STARTING" | "SCANNING" | "DETECTED" | "ERROR"
type CameraFacingMode = "environment" | "user"

type CropRect = {
    x: number
    y: number
    width: number
    height: number
}

type ImageMeta = {
    naturalWidth: number
    naturalHeight: number
}

type PreviewRect = {
    x: number
    y: number
    width: number
    height: number
}

type CropAction = "move" | "nw" | "ne" | "sw" | "se"

type PointerPoint = {
    x: number
    y: number
}

type CropInteraction = {
    action: CropAction
    startPoint: PointerPoint
    startRect: CropRect
}

const IMAGE_SCAN_FORMATS: BarcodeFormat[] = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
]

const DEFAULT_CROP_RECT: CropRect = {
    x: 0.1,
    y: 0.36,
    width: 0.8,
    height: 0.2,
}

const MIN_CROP_SIZE = 0.04
const HANDLE_SIZE = 14
const DETECT_COOLDOWN_MS = 1200

const normalizeBarcode = (value: string) => value.replace(/\s+/g, "").trim()
const isLikelyBarcode = (value: string) => /^\d{8,14}$/.test(normalizeBarcode(value))
const isImageFile = (file: File) => file.type.startsWith("image/")

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

const createReaderHints = () => {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, IMAGE_SCAN_FORMATS)
    hints.set(DecodeHintType.TRY_HARDER, true)
    return hints
}

const loadImageElement = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("Không thể đọc ảnh đã chọn."))
        img.src = src
    })

const getPreviewRect = (
    containerWidth: number,
    containerHeight: number,
    naturalWidth: number,
    naturalHeight: number,
): PreviewRect => {
    if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) {
        return { x: 0, y: 0, width: 0, height: 0 }
    }

    const containerRatio = containerWidth / containerHeight
    const imageRatio = naturalWidth / naturalHeight

    if (imageRatio > containerRatio) {
        const width = containerWidth
        const height = width / imageRatio
        return {
            x: 0,
            y: (containerHeight - height) / 2,
            width,
            height,
        }
    }

    const height = containerHeight
    const width = height * imageRatio

    return {
        x: (containerWidth - width) / 2,
        y: 0,
        width,
        height,
    }
}

const getCanvasFromImage = (
    image: HTMLImageElement,
    options?: {
        scale?: number
        rotation?: 0 | 90 | 180 | 270
        crop?: { x: number; y: number; width: number; height: number }
        grayscale?: boolean
        contrast?: number
        sharpen?: boolean
    },
) => {
    const {
        scale = 1,
        rotation = 0,
        crop,
        grayscale = false,
        contrast = 0,
        sharpen = false,
    } = options ?? {}

    const sourceX = crop?.x ?? 0
    const sourceY = crop?.y ?? 0
    const sourceWidth = crop?.width ?? image.naturalWidth
    const sourceHeight = crop?.height ?? image.naturalHeight

    const scaledWidth = Math.max(1, Math.round(sourceWidth * scale))
    const scaledHeight = Math.max(1, Math.round(sourceHeight * scale))

    const canvas = document.createElement("canvas")
    const rotated = rotation === 90 || rotation === 270

    canvas.width = rotated ? scaledHeight : scaledWidth
    canvas.height = rotated ? scaledWidth : scaledHeight

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) {
        throw new Error("Không tạo được canvas context.")
    }

    ctx.save()

    if (rotation === 90) {
        ctx.translate(canvas.width, 0)
        ctx.rotate(Math.PI / 2)
    } else if (rotation === 180) {
        ctx.translate(canvas.width, canvas.height)
        ctx.rotate(Math.PI)
    } else if (rotation === 270) {
        ctx.translate(0, canvas.height)
        ctx.rotate(-Math.PI / 2)
    }

    ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        scaledWidth,
        scaledHeight,
    )

    ctx.restore()

    if (!grayscale && !contrast && !sharpen) {
        return canvas
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const { data, width, height } = imageData

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]

        if (grayscale) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b
            r = gray
            g = gray
            b = gray
        }

        if (contrast !== 0) {
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
            r = factor * (r - 128) + 128
            g = factor * (g - 128) + 128
            b = factor * (b - 128) + 128
        }

        data[i] = Math.max(0, Math.min(255, r))
        data[i + 1] = Math.max(0, Math.min(255, g))
        data[i + 2] = Math.max(0, Math.min(255, b))
    }

    if (sharpen) {
        const src = new Uint8ClampedArray(data)
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    let value = 0
                    let k = 0

                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4 + c
                            value += src[idx] * kernel[k++]
                        }
                    }

                    const outIdx = (y * width + x) * 4 + c
                    data[outIdx] = Math.max(0, Math.min(255, value))
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
}

const decodeCanvasWithZxing = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) {
        throw new Error("Không đọc được canvas context.")
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const { data, width, height } = imageData

    const luminanceSource = new RGBLuminanceSource(data, width, height)
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource))

    const reader = new MultiFormatReader()
    reader.setHints(createReaderHints())

    const result = reader.decode(binaryBitmap)
    return result.getText()
}

const toNaturalCrop = (image: HTMLImageElement, cropRect: CropRect) => ({
    x: Math.round(cropRect.x * image.naturalWidth),
    y: Math.round(cropRect.y * image.naturalHeight),
    width: Math.max(1, Math.round(cropRect.width * image.naturalWidth)),
    height: Math.max(1, Math.round(cropRect.height * image.naturalHeight)),
})

const cropImageToObjectUrl = async (imageSrc: string, cropRect: CropRect) => {
    const image = await loadImageElement(imageSrc)
    const crop = toNaturalCrop(image, cropRect)
    const canvas = getCanvasFromImage(image, { crop, scale: 2 })

    return new Promise<{
        objectUrl: string
        meta: ImageMeta
    }>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Không tạo được ảnh sau khi crop."))
                    return
                }

                const objectUrl = URL.createObjectURL(blob)
                resolve({
                    objectUrl,
                    meta: {
                        naturalWidth: canvas.width,
                        naturalHeight: canvas.height,
                    },
                })
            },
            "image/png",
            1,
        )
    })
}

const decodeImageWithVariants = async (image: HTMLImageElement) => {
    const w = image.naturalWidth
    const h = image.naturalHeight

    const centerBandHeight = Math.max(60, Math.round(h * 0.45))
    const centerBandY = Math.max(0, Math.round((h - centerBandHeight) / 2))

    const variants: Array<{ label: string; build: () => HTMLCanvasElement }> = [
        {
            label: "original",
            build: () => getCanvasFromImage(image),
        },
        {
            label: "scaled-2x",
            build: () => getCanvasFromImage(image, { scale: 2 }),
        },
        {
            label: "scaled-3x",
            build: () => getCanvasFromImage(image, { scale: 3 }),
        },
        {
            label: "gray-contrast",
            build: () =>
                getCanvasFromImage(image, {
                    scale: 2,
                    grayscale: true,
                    contrast: 80,
                }),
        },
        {
            label: "gray-contrast-sharpen",
            build: () =>
                getCanvasFromImage(image, {
                    scale: 3,
                    grayscale: true,
                    contrast: 110,
                    sharpen: true,
                }),
        },
        {
            label: "center-band",
            build: () =>
                getCanvasFromImage(image, {
                    crop: {
                        x: 0,
                        y: centerBandY,
                        width: w,
                        height: centerBandHeight,
                    },
                    scale: 3,
                    grayscale: true,
                    contrast: 110,
                    sharpen: true,
                }),
        },
        {
            label: "rot90",
            build: () =>
                getCanvasFromImage(image, {
                    scale: 2,
                    rotation: 90,
                    grayscale: true,
                    contrast: 100,
                }),
        },
        {
            label: "rot180",
            build: () =>
                getCanvasFromImage(image, {
                    scale: 2,
                    rotation: 180,
                    grayscale: true,
                    contrast: 100,
                }),
        },
        {
            label: "rot270",
            build: () =>
                getCanvasFromImage(image, {
                    scale: 2,
                    rotation: 270,
                    grayscale: true,
                    contrast: 100,
                }),
        },
    ]

    let lastError: unknown = null

    for (const variant of variants) {
        try {
            const canvas = variant.build()
            const text = decodeCanvasWithZxing(canvas)

            if (text?.trim()) {
                console.log(
                    "WorkflowScanStep.decodeImageWithVariants -> success:",
                    variant.label,
                )
                return text
            }
        } catch (error) {
            lastError = error
            console.log(
                "WorkflowScanStep.decodeImageWithVariants -> failed variant:",
                variant.label,
                error,
            )
        }
    }

    throw lastError ?? new Error("Không tìm thấy barcode trong ảnh.")
}

const decodeLoadedImage = async (imageSrc: string) => {
    const imageEl = await loadImageElement(imageSrc)

    try {
        const browserReader = new BrowserMultiFormatReader()
        const result = await browserReader.decodeFromImageElement(imageEl)
        const text = result.getText()

        if (text?.trim()) {
            console.log("WorkflowScanStep.decodeLoadedImage -> browser decode success")
            return text
        }
    } catch (firstError) {
        console.log(
            "WorkflowScanStep.decodeLoadedImage -> browser decode failed, fallback to variants:",
            firstError,
        )
    }

    return decodeImageWithVariants(imageEl)
}

const WorkflowScanStep: React.FC<Props> = ({
    barcodeInput,
    setBarcodeInput,
    loading,
    onIdentify,
}) => {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const controlsRef = useRef<IScannerControls | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const previewContainerRef = useRef<HTMLDivElement | null>(null)

    const originalImageUrlRef = useRef<string | null>(null)
    const workingImageUrlRef = useRef<string | null>(null)

    const startingRef = useRef(false)
    const lastDetectedRef = useRef("")
    const lastDetectedAtRef = useRef(0)

    const [scanStatus, setScanStatus] = useState<ScanStatus>("IDLE")
    const [scanError, setScanError] = useState("")
    const [lastScannedBarcode, setLastScannedBarcode] = useState("")
    const [cameraEnabled, setCameraEnabled] = useState(false)
    const [cameraFacingMode, setCameraFacingMode] =
        useState<CameraFacingMode>("environment")

    const [decodingImage, setDecodingImage] = useState(false)
    const [isDraggingFile, setIsDraggingFile] = useState(false)

    const [originalImageSrc, setOriginalImageSrc] = useState("")
    const [workingImageSrc, setWorkingImageSrc] = useState("")
    const [workingImageMeta, setWorkingImageMeta] = useState<ImageMeta | null>(null)

    const [cropMode, setCropMode] = useState(false)
    const [cropRect, setCropRect] = useState<CropRect>(DEFAULT_CROP_RECT)
    const [cropInteraction, setCropInteraction] = useState<CropInteraction | null>(null)

    const [previewFrameSize, setPreviewFrameSize] = useState({
        width: 0,
        height: 0,
    })

    const actionDisabled = loading === "IDENTIFY" || decodingImage
    const hasUploadedImage = Boolean(workingImageSrc)

    const manualBarcodeValid = useMemo(
        () => isLikelyBarcode(barcodeInput),
        [barcodeInput],
    )

    const previewRect = useMemo(() => {
        if (!workingImageMeta) {
            return { x: 0, y: 0, width: 0, height: 0 }
        }

        return getPreviewRect(
            previewFrameSize.width,
            previewFrameSize.height,
            workingImageMeta.naturalWidth,
            workingImageMeta.naturalHeight,
        )
    }, [previewFrameSize, workingImageMeta])

    const revokeOriginalImageUrl = () => {
        if (originalImageUrlRef.current) {
            URL.revokeObjectURL(originalImageUrlRef.current)
            originalImageUrlRef.current = null
        }
    }

    const revokeWorkingImageUrl = () => {
        if (workingImageUrlRef.current) {
            URL.revokeObjectURL(workingImageUrlRef.current)
            workingImageUrlRef.current = null
        }
    }

    const clearUploadedPreview = () => {
        setOriginalImageSrc("")
        setWorkingImageSrc("")
        setWorkingImageMeta(null)
        setCropRect(DEFAULT_CROP_RECT)
        setCropMode(false)
        setCropInteraction(null)
        revokeOriginalImageUrl()
        revokeWorkingImageUrl()
    }

    const stopCamera = () => {
        try {
            controlsRef.current?.stop()
        } catch (error) {
            console.error("WorkflowScanStep.stopCamera -> controls.stop error:", error)
        }

        controlsRef.current = null
        setCameraEnabled(false)

        if (videoRef.current) {
            videoRef.current.srcObject = null
        }

        setScanStatus((prev) => {
            if (prev === "DETECTED" || prev === "ERROR") return prev
            return "IDLE"
        })
    }

    const handleDetected = async (
        rawValue: string,
        options?: { autoIdentify?: boolean },
    ) => {
        const normalized = normalizeBarcode(rawValue)
        if (!normalized) return

        const now = Date.now()
        if (
            lastDetectedRef.current === normalized &&
            now - lastDetectedAtRef.current < DETECT_COOLDOWN_MS
        ) {
            return
        }

        lastDetectedRef.current = normalized
        lastDetectedAtRef.current = now

        setBarcodeInput(normalized)
        setLastScannedBarcode(normalized)
        setScanError("")
        setScanStatus("DETECTED")
        stopCamera()

        if (options?.autoIdentify !== false) {
            await Promise.resolve(onIdentify(normalized))
        }
    }

    const startCamera = async (nextFacingMode?: CameraFacingMode) => {
        if (startingRef.current || decodingImage) return

        const videoEl = videoRef.current
        if (!videoEl) {
            setScanStatus("ERROR")
            setScanError("Không tìm thấy vùng hiển thị camera.")
            return
        }

        startingRef.current = true
        setScanError("")
        setScanStatus("STARTING")
        lastDetectedRef.current = ""
        lastDetectedAtRef.current = 0

        const facingModeToUse = nextFacingMode ?? cameraFacingMode

        try {
            clearUploadedPreview()
            stopCamera()

            const reader = new BrowserMultiFormatReader()

            const advancedConstraints = [
                { focusMode: "continuous" },
                { exposureMode: "continuous" },
            ] as unknown as MediaTrackConstraintSet[]

            const constraints: MediaStreamConstraints = {
                audio: false,
                video: {
                    facingMode: { ideal: facingModeToUse },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    advanced: advancedConstraints,
                },
            }

            const controls = await reader.decodeFromConstraints(
                constraints,
                videoEl,
                (result, error) => {
                    if (result) {
                        void handleDetected(result.getText())
                        return
                    }

                    if (error) {
                        return
                    }
                },
            )

            controlsRef.current = controls
            setCameraEnabled(true)
            setCameraFacingMode(facingModeToUse)
            setScanStatus("SCANNING")

            try {
                await videoEl.play()
            } catch (playError) {
                console.log("WorkflowScanStep.startCamera -> video.play warning:", playError)
            }
        } catch (error) {
            console.error("WorkflowScanStep.startCamera -> error:", error)
            setScanStatus("ERROR")
            setScanError(
                "Không mở được camera hoặc chưa khởi tạo được bộ quét. Bạn kiểm tra quyền camera rồi thử lại nhé.",
            )
            stopCamera()
        } finally {
            startingRef.current = false
        }
    }

    const handleSwitchCamera = async () => {
        const nextMode: CameraFacingMode =
            cameraFacingMode === "environment" ? "user" : "environment"

        await startCamera(nextMode)
    }

    const handleManualIdentify = () => {
        const normalized = normalizeBarcode(barcodeInput)
        setBarcodeInput(normalized)
        setLastScannedBarcode(normalized)
        void onIdentify(normalized)
    }

    const handlePickImage = () => {
        if (actionDisabled || cameraEnabled) return
        fileInputRef.current?.click()
    }

    const applyImageToState = async (objectUrl: string, setAsOriginal = false) => {
        const imageEl = await loadImageElement(objectUrl)

        if (setAsOriginal) {
            setOriginalImageSrc(objectUrl)
        }

        setWorkingImageSrc(objectUrl)
        setWorkingImageMeta({
            naturalWidth: imageEl.naturalWidth,
            naturalHeight: imageEl.naturalHeight,
        })
        setCropRect(DEFAULT_CROP_RECT)
        setCropMode(true)
    }

    const decodeImageFile = async (file: File) => {
        if (!isImageFile(file)) {
            setScanStatus("ERROR")
            setScanError("File này không phải ảnh. Bạn chọn ảnh barcode giúp mình nha.")
            return
        }

        stopCamera()
        setScanError("")
        setScanStatus("IDLE")
        setDecodingImage(true)
        setIsDraggingFile(false)

        revokeOriginalImageUrl()
        revokeWorkingImageUrl()

        try {
            const objectUrl = URL.createObjectURL(file)
            originalImageUrlRef.current = objectUrl
            workingImageUrlRef.current = objectUrl

            await applyImageToState(objectUrl, true)

            try {
                const detectedText = await decodeLoadedImage(objectUrl)
                if (detectedText?.trim()) {
                    lastDetectedRef.current = ""
                    lastDetectedAtRef.current = 0
                    await handleDetected(detectedText)
                    return
                }
            } catch (error) {
                console.log("WorkflowScanStep.decodeImageFile -> initial decode fail:", error)
            }

            setScanStatus("ERROR")
            setScanError(
                "Chưa đọc được barcode từ toàn ảnh. Bạn vui lòng kéo chỉnh khung cắt lại rồi bấm “Cắt & phóng to”.",
            )
        } catch (error) {
            console.error("WorkflowScanStep.decodeImageFile -> error:", error)
            setScanStatus("ERROR")
            setScanError("Không xử lý được ảnh này.")
        } finally {
            setDecodingImage(false)
        }
    }

    const handleDecodeImageFile = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (!file) return

        await decodeImageFile(file)
    }

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()

        if (cameraEnabled || actionDisabled) return
        setIsDraggingFile(true)
    }

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDraggingFile(false)
    }

    const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDraggingFile(false)

        if (cameraEnabled || actionDisabled) return

        const file = event.dataTransfer.files?.[0]
        if (!file) return

        await decodeImageFile(file)
    }

    const handleResetAll = () => {
        stopCamera()
        setScanError("")
        setScanStatus("IDLE")
        setIsDraggingFile(false)
        setLastScannedBarcode("")
        clearUploadedPreview()
    }

    const handleRestoreOriginalImage = async () => {
        if (!originalImageSrc || actionDisabled) return

        setDecodingImage(true)
        try {
            setWorkingImageSrc(originalImageSrc)
            const imageEl = await loadImageElement(originalImageSrc)
            setWorkingImageMeta({
                naturalWidth: imageEl.naturalWidth,
                naturalHeight: imageEl.naturalHeight,
            })
            setCropRect(DEFAULT_CROP_RECT)
            setCropMode(true)
            setScanError("")
            setScanStatus("IDLE")
        } finally {
            setDecodingImage(false)
        }
    }

    const extractPointFromMouse = (
        event: Pick<MouseEvent, "clientX" | "clientY"> | ReactMouseEvent<HTMLDivElement>,
    ) => {
        const container = previewContainerRef.current
        if (!container || !previewRect.width || !previewRect.height) return null

        const bounds = container.getBoundingClientRect()

        const rawX = event.clientX - bounds.left
        const rawY = event.clientY - bounds.top

        const insideX = rawX >= previewRect.x && rawX <= previewRect.x + previewRect.width
        const insideY = rawY >= previewRect.y && rawY <= previewRect.y + previewRect.height

        if (!insideX || !insideY) return null

        const relativeX = (rawX - previewRect.x) / previewRect.width
        const relativeY = (rawY - previewRect.y) / previewRect.height

        return {
            x: clamp(relativeX, 0, 1),
            y: clamp(relativeY, 0, 1),
        }
    }

    const beginCropInteraction = (
        event: ReactMouseEvent<HTMLButtonElement | HTMLDivElement>,
        action: CropAction,
    ) => {
        if (!cropMode || !hasUploadedImage || cameraEnabled || actionDisabled) return

        event.preventDefault()
        event.stopPropagation()

        const point = extractPointFromMouse(event)
        if (!point) return

        setCropInteraction({
            action,
            startPoint: point,
            startRect: cropRect,
        })
    }

    useEffect(() => {
        if (!cropInteraction) return

        const handleWindowMouseMove = (event: MouseEvent) => {
            const point = extractPointFromMouse(event)
            if (!point) return

            const dx = point.x - cropInteraction.startPoint.x
            const dy = point.y - cropInteraction.startPoint.y
            const start = cropInteraction.startRect

            let next = { ...start }

            if (cropInteraction.action === "move") {
                next.x = clamp(start.x + dx, 0, 1 - start.width)
                next.y = clamp(start.y + dy, 0, 1 - start.height)
            }

            if (cropInteraction.action === "nw") {
                const right = start.x + start.width
                const bottom = start.y + start.height
                const x = clamp(start.x + dx, 0, right - MIN_CROP_SIZE)
                const y = clamp(start.y + dy, 0, bottom - MIN_CROP_SIZE)
                next = {
                    x,
                    y,
                    width: right - x,
                    height: bottom - y,
                }
            }

            if (cropInteraction.action === "ne") {
                const left = start.x
                const bottom = start.y + start.height
                const right = clamp(
                    start.x + start.width + dx,
                    left + MIN_CROP_SIZE,
                    1,
                )
                const y = clamp(start.y + dy, 0, bottom - MIN_CROP_SIZE)
                next = {
                    x: left,
                    y,
                    width: right - left,
                    height: bottom - y,
                }
            }

            if (cropInteraction.action === "sw") {
                const top = start.y
                const right = start.x + start.width
                const x = clamp(start.x + dx, 0, right - MIN_CROP_SIZE)
                const bottom = clamp(
                    start.y + start.height + dy,
                    top + MIN_CROP_SIZE,
                    1,
                )
                next = {
                    x,
                    y: top,
                    width: right - x,
                    height: bottom - top,
                }
            }

            if (cropInteraction.action === "se") {
                const left = start.x
                const top = start.y
                const right = clamp(
                    start.x + start.width + dx,
                    left + MIN_CROP_SIZE,
                    1,
                )
                const bottom = clamp(
                    start.y + start.height + dy,
                    top + MIN_CROP_SIZE,
                    1,
                )
                next = {
                    x: left,
                    y: top,
                    width: right - left,
                    height: bottom - top,
                }
            }

            setCropRect(next)
        }

        const handleWindowMouseUp = () => {
            setCropInteraction(null)
        }

        window.addEventListener("mousemove", handleWindowMouseMove)
        window.addEventListener("mouseup", handleWindowMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleWindowMouseMove)
            window.removeEventListener("mouseup", handleWindowMouseUp)
        }
    }, [cropInteraction, previewRect]) // eslint-disable-line react-hooks/exhaustive-deps

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const element = previewContainerRef.current
        if (!element) return

        const updateSize = () => {
            const bounds = element.getBoundingClientRect()
            setPreviewFrameSize({
                width: bounds.width,
                height: bounds.height,
            })
        }

        updateSize()

        const observer = new ResizeObserver(() => updateSize())
        observer.observe(element)
        window.addEventListener("resize", updateSize)

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", updateSize)
        }
    }, [workingImageSrc])

    useEffect(() => {
        return () => {
            stopCamera()
            revokeOriginalImageUrl()
            revokeWorkingImageUrl()
        }
    }, [])

    const handleDecodeWorkingImage = async () => {
        if (!workingImageSrc || actionDisabled) return

        setDecodingImage(true)
        setScanError("")

        try {
            const detectedText = await decodeLoadedImage(workingImageSrc)

            if (!detectedText?.trim()) {
                throw new Error("Không tìm thấy barcode trong ảnh hiện tại.")
            }

            lastDetectedRef.current = ""
            lastDetectedAtRef.current = 0
            await handleDetected(detectedText)
        } catch (error) {
            console.error("WorkflowScanStep.handleDecodeWorkingImage -> error:", error)
            setScanStatus("ERROR")
            setScanError(
                "Chưa đọc được barcode từ ảnh hiện tại. Bạn vui lòng thử crop sát hơn vào phần barcode rồi quét lại.",
            )
        } finally {
            setDecodingImage(false)
        }
    }

    const handleApplyCrop = async () => {
        if (!workingImageSrc || actionDisabled) return

        setDecodingImage(true)
        setScanError("")

        try {
            const { objectUrl, meta } = await cropImageToObjectUrl(workingImageSrc, cropRect)

            revokeWorkingImageUrl()
            workingImageUrlRef.current = objectUrl

            setWorkingImageSrc(objectUrl)
            setWorkingImageMeta(meta)
            setCropRect(DEFAULT_CROP_RECT)
            setCropMode(true)
            setScanStatus("IDLE")
        } catch (error) {
            console.error("WorkflowScanStep.handleApplyCrop -> error:", error)
            setScanStatus("ERROR")
            setScanError("Không cắt được ảnh. Bạn vui lòng thử lại lần nữa.")
        } finally {
            setDecodingImage(false)
        }
    }

    const cropRectStyle = useMemo(() => {
        if (!hasUploadedImage || !previewRect.width || !previewRect.height) {
            return null
        }

        return {
            left: previewRect.x + cropRect.x * previewRect.width,
            top: previewRect.y + cropRect.y * previewRect.height,
            width: cropRect.width * previewRect.width,
            height: cropRect.height * previewRect.height,
        }
    }, [cropRect, previewRect, hasUploadedImage])

    const scanHint = useMemo(() => {
        if (decodingImage) {
            return hasUploadedImage
                ? "Đang xử lý ảnh barcode..."
                : "Đang đọc barcode từ ảnh tải lên..."
        }

        switch (scanStatus) {
            case "STARTING":
                return "Đang khởi động camera..."
            case "SCANNING":
                return cameraFacingMode === "environment"
                    ? "Đang dùng camera sau. Đưa mã vạch vào giữa khung hình, giữ gần và đủ sáng để hệ thống nhận nhanh hơn."
                    : "Đang dùng camera trước. Đưa mã vạch vào giữa khung hình để hệ thống tự nhận diện."
            case "DETECTED":
                return lastScannedBarcode
                    ? `Đã quét thành công barcode: ${lastScannedBarcode}`
                    : "Đã nhận diện barcode thành công."
            case "ERROR":
                return scanError || "Không thể quét barcode."
            default:
                return hasUploadedImage
                    ? "Bạn có thể kéo khung cắt, resize 4 góc hoặc bấm Cắt & phóng to để zoom sát barcode hơn rồi quét lại."
                    : "Bạn có thể nhập tay, bật camera hoặc kéo thả / tải ảnh barcode từ máy lên."
        }
    }, [
        cameraFacingMode,
        decodingImage,
        hasUploadedImage,
        lastScannedBarcode,
        scanError,
        scanStatus,
    ])

    return (
        <div className="space-y-5">
            <SectionCard
                title="Bước 1: Quét hoặc nhập mã vạch"
                description="Bước đầu chỉ xử lý barcode. Hệ thống sẽ kiểm tra barcode trước, rồi mới quyết định có cần sang bước OCR ảnh hay không."
            >
                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Search className="h-4 w-4" />
                            Nhập barcode
                        </div>

                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(normalizeBarcode(e.target.value))}
                            placeholder="Nhập hoặc dán mã vạch"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        />

                        <div className="mt-2 text-xs text-slate-500">
                            Hỗ trợ tốt nhất cho barcode dạng số như EAN/UPC.
                        </div>

                        <button
                            type="button"
                            onClick={handleManualIdentify}
                            disabled={actionDisabled || !barcodeInput.trim()}
                            className={cn(
                                "mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                actionDisabled || !barcodeInput.trim()
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700",
                            )}
                        >
                            {loading === "IDENTIFY" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Kiểm tra barcode
                        </button>

                        {barcodeInput.trim() ? (
                            <div
                                className={cn(
                                    "mt-4 rounded-xl border px-3 py-2 text-xs",
                                    manualBarcodeValid
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-amber-200 bg-amber-50 text-amber-700",
                                )}
                            >
                                {manualBarcodeValid
                                    ? "Barcode có vẻ hợp lệ, bạn có thể kiểm tra ngay."
                                    : "Barcode hiện tại chưa đúng định dạng phổ biến. Bạn vẫn có thể thử gửi nếu BE chấp nhận format này."}
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Camera className="h-4 w-4" />
                            Quét barcode bằng camera hoặc ảnh
                        </div>

                        <div
                            ref={previewContainerRef}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "overflow-hidden rounded-xl border bg-black transition select-none",
                                isDraggingFile && !cameraEnabled
                                    ? "border-emerald-400 ring-4 ring-emerald-100"
                                    : "border-slate-200",
                            )}
                        >
                            <div className="relative aspect-video w-full">
                                {hasUploadedImage && !cameraEnabled ? (
                                    <img
                                        src={workingImageSrc}
                                        alt="Uploaded barcode preview"
                                        className="h-full w-full object-contain"
                                        draggable={false}
                                    />
                                ) : (
                                    <video
                                        ref={videoRef}
                                        className={cn(
                                            "h-full w-full object-cover",
                                            cameraFacingMode === "user" ? "scale-x-[-1]" : "",
                                        )}
                                        muted
                                        playsInline
                                    />
                                )}

                                {!cameraEnabled && !hasUploadedImage ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 px-5 text-center text-slate-200">
                                        <ScanLine className="h-8 w-8 text-emerald-400" />
                                        <div className="max-w-sm text-sm leading-6">
                                            {isDraggingFile
                                                ? "Thả ảnh barcode vào đây để hệ thống đọc tự động."
                                                : scanHint}
                                        </div>
                                        {!isDraggingFile ? (
                                            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-slate-300">
                                                Hỗ trợ kéo & thả ảnh vào khung này
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {hasUploadedImage && !cameraEnabled ? (
                                    <>
                                        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                                            <div className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                                                Ảnh hiện tại để quét barcode
                                            </div>
                                        </div>

                                        {cropMode && cropRectStyle ? (
                                            <>
                                                <div
                                                    className="pointer-events-none absolute bg-black/45"
                                                    style={{
                                                        left: previewRect.x,
                                                        top: previewRect.y,
                                                        width: previewRect.width,
                                                        height:
                                                            cropRect.y * previewRect.height,
                                                    }}
                                                />
                                                <div
                                                    className="pointer-events-none absolute bg-black/45"
                                                    style={{
                                                        left: previewRect.x,
                                                        top:
                                                            previewRect.y +
                                                            (cropRect.y + cropRect.height) *
                                                            previewRect.height,
                                                        width: previewRect.width,
                                                        height:
                                                            previewRect.height -
                                                            (cropRect.y + cropRect.height) *
                                                            previewRect.height,
                                                    }}
                                                />
                                                <div
                                                    className="pointer-events-none absolute bg-black/45"
                                                    style={{
                                                        left: previewRect.x,
                                                        top:
                                                            previewRect.y +
                                                            cropRect.y * previewRect.height,
                                                        width: cropRect.x * previewRect.width,
                                                        height:
                                                            cropRect.height *
                                                            previewRect.height,
                                                    }}
                                                />
                                                <div
                                                    className="pointer-events-none absolute bg-black/45"
                                                    style={{
                                                        left:
                                                            previewRect.x +
                                                            (cropRect.x + cropRect.width) *
                                                            previewRect.width,
                                                        top:
                                                            previewRect.y +
                                                            cropRect.y * previewRect.height,
                                                        width:
                                                            previewRect.width -
                                                            (cropRect.x + cropRect.width) *
                                                            previewRect.width,
                                                        height:
                                                            cropRect.height *
                                                            previewRect.height,
                                                    }}
                                                />

                                                <div
                                                    className="absolute rounded-xl border-2 border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                                                    style={cropRectStyle}
                                                >
                                                    <button
                                                        type="button"
                                                        onMouseDown={(e) =>
                                                            beginCropInteraction(e, "move")
                                                        }
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        <span className="rounded-full bg-emerald-500/90 p-1 text-white shadow">
                                                            <Move className="h-4 w-4" />
                                                        </span>
                                                    </button>

                                                    {(["nw", "ne", "sw", "se"] as const).map(
                                                        (corner) => {
                                                            const positionClass =
                                                                corner === "nw"
                                                                    ? "-left-2 -top-2 cursor-nwse-resize"
                                                                    : corner === "ne"
                                                                        ? "-right-2 -top-2 cursor-nesw-resize"
                                                                        : corner === "sw"
                                                                            ? "-left-2 -bottom-2 cursor-nesw-resize"
                                                                            : "-right-2 -bottom-2 cursor-nwse-resize"

                                                            return (
                                                                <button
                                                                    key={corner}
                                                                    type="button"
                                                                    onMouseDown={(e) =>
                                                                        beginCropInteraction(
                                                                            e,
                                                                            corner,
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "absolute rounded-full border-2 border-white bg-emerald-500 shadow",
                                                                        positionClass,
                                                                    )}
                                                                    style={{
                                                                        width: HANDLE_SIZE,
                                                                        height: HANDLE_SIZE,
                                                                    }}
                                                                />
                                                            )
                                                        },
                                                    )}
                                                </div>
                                            </>
                                        ) : null}
                                    </>
                                ) : null}

                                {cameraEnabled ? (
                                    <>
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                            <div className="h-24 w-[78%] rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.18)]" />
                                        </div>

                                        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                                            <div className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                                                {cameraFacingMode === "environment"
                                                    ? "Đang dùng camera sau"
                                                    : "Đang dùng camera trước"}
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div
                            className={cn(
                                "mt-4 rounded-xl border px-4 py-3 text-xs leading-5",
                                scanStatus === "ERROR"
                                    ? "border-rose-200 bg-rose-50 text-rose-700"
                                    : scanStatus === "DETECTED"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-white text-slate-600",
                            )}
                        >
                            {scanHint}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleDecodeImageFile}
                        />

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {!cameraEnabled ? (
                                <button
                                    type="button"
                                    onClick={() => startCamera()}
                                    disabled={actionDisabled}
                                    className={cn(
                                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                        actionDisabled
                                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                            : "bg-slate-900 text-white hover:bg-slate-800",
                                    )}
                                >
                                    <Camera className="h-4 w-4" />
                                    Bật camera quét
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                                >
                                    <CameraOff className="h-4 w-4" />
                                    Tắt camera
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handlePickImage}
                                disabled={actionDisabled || cameraEnabled}
                                className={cn(
                                    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                    actionDisabled || cameraEnabled
                                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                )}
                            >
                                {decodingImage ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                Tải ảnh từ máy
                            </button>

                            <button
                                type="button"
                                onClick={handleSwitchCamera}
                                disabled={actionDisabled || !cameraEnabled || startingRef.current}
                                className={cn(
                                    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                    actionDisabled || !cameraEnabled || startingRef.current
                                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                )}
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Đổi cam trước / sau
                            </button>

                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <XCircle className="h-4 w-4" />
                                Reset quét
                            </button>
                        </div>

                        {hasUploadedImage && !cameraEnabled ? (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={handleDecodeWorkingImage}
                                    disabled={actionDisabled}
                                    className={cn(
                                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                        actionDisabled
                                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                            : "bg-emerald-600 text-white hover:bg-emerald-700",
                                    )}
                                >
                                    {decodingImage ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ScanLine className="h-4 w-4" />
                                    )}
                                    Quét ảnh hiện tại
                                </button>

                                <button
                                    type="button"
                                    onClick={handleApplyCrop}
                                    disabled={actionDisabled || !cropMode}
                                    className={cn(
                                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                        actionDisabled || !cropMode
                                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                    )}
                                >
                                    <Crop className="h-4 w-4" />
                                    Cắt & phóng to
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCropMode((prev) => !prev)}
                                    disabled={actionDisabled}
                                    className={cn(
                                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                        actionDisabled
                                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                            : cropMode
                                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                    )}
                                >
                                    <Crop className="h-4 w-4" />
                                    {cropMode ? "Ẩn khung cắt" : "Hiện khung cắt"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCropRect(DEFAULT_CROP_RECT)}
                                    disabled={actionDisabled}
                                    className={cn(
                                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                        actionDisabled
                                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                    )}
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Đặt lại khung cắt
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRestoreOriginalImage}
                                    disabled={actionDisabled || !originalImageSrc}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:col-span-2"
                                >
                                    <ImagePlus className="h-4 w-4" />
                                    Quay lại ảnh gốc
                                </button>
                            </div>
                        ) : null}

                        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-700">
                            <div className="flex items-start gap-2">
                                <ImagePlus className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    Với ảnh tải lên, bạn có thể kéo khung cắt, di chuyển khung bằng
                                    nút ở giữa, resize bằng 4 chấm ở 4 góc, rồi bấm “Cắt & phóng
                                    to” để zoom sát barcode hơn trước khi quét.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    )
}

export default WorkflowScanStep
