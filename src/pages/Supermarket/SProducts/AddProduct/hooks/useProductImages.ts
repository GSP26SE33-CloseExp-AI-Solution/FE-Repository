import { useEffect, useRef, useState, ChangeEvent } from "react";
import { useImageHash } from "@/hooks/useImageHash";
import type { ImageFile } from "@/types/image";

interface Props {
    maxImages: number;
    hashSize?: number;
}

export const useProductImages = ({
    maxImages,
    hashSize = 6,
}: Props) => {
    const { getHashFromFile, isDuplicateHash } = useImageHash(hashSize);

    /* ================= STATE ================= */

    const [images, setImages] = useState<ImageFile[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);

    /* ================= REFS ================= */

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    /* ================= CAMERA ================= */

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [usingCamera, setUsingCamera] = useState(false);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setUsingCamera(true);
            setUploadError(null);
        } catch {
            setUploadError("Không thể mở camera. Hãy cấp quyền truy cập.");
        }
    };

    const stopCamera = () => {
        stream?.getTracks().forEach(t => t.stop());
        setStream(null);
        setUsingCamera(false);
    };

    useEffect(() => {
        if (!usingCamera || !videoRef.current || !stream) return;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => { });
    }, [usingCamera, stream]);

    useEffect(() => {
        return () => {
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [stream]);

    /* ================= UPLOAD ================= */

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        let updated = [...images];
        let duplicate = 0;
        let overLimit = 0;

        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) continue;

            if (updated.length >= maxImages) {
                overLimit++;
                continue;
            }

            const preview = URL.createObjectURL(file);
            const rawHash = await getHashFromFile(file);
            const hash = rawHash ?? undefined;

            if (hash && isDuplicateHash(hash, updated.map(i => i.hash))) {
                duplicate++;
                URL.revokeObjectURL(preview);
                continue;
            }

            updated.push({
                id: crypto.randomUUID(),
                file,
                preview,
                hash,
                source: "upload",
            });
        }

        setImages(updated);

        const msgs = [];
        if (duplicate) msgs.push(`${duplicate} ảnh bị trùng`);
        if (overLimit) msgs.push(`Tối đa ${maxImages} ảnh`);
        setUploadError(msgs.length ? msgs.join(" • ") : null);

        e.target.value = "";
    };

    /* ================= CAPTURE ================= */

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        if (images.length >= maxImages) {
            setUploadError(`Chỉ được tối đa ${maxImages} ảnh.`);
            stopCamera();
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const preview = canvas.toDataURL("image/png");
        const blob = await fetch(preview).then(r => r.blob());
        const file = new File([blob], `camera-${Date.now()}.png`, {
            type: "image/png",
        });

        const rawHash = await getHashFromFile(file);
        const hash = rawHash ?? undefined;

        if (hash && isDuplicateHash(hash, images.map(i => i.hash))) {
            setUploadError("Ảnh chụp này trùng với ảnh đã có.");
            stopCamera();
            return;
        }

        setImages(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                file,
                preview,
                hash,
                source: "camera",
            },
        ]);

        setUploadError(null);
        stopCamera();
    };

    /* ================= REMOVE ================= */

    const removeImage = (id: string) => {
        setImages(prev => {
            const target = prev.find(i => i.id === id);
            if (target?.source === "upload") {
                URL.revokeObjectURL(target.preview);
            }
            return prev.filter(i => i.id !== id);
        });
    };

    /* ================= RETURN ================= */

    return {
        images,
        uploadError,

        fileInputRef,
        handleUploadClick,
        handleFileChange,

        usingCamera,
        videoRef,
        canvasRef,
        startCamera,
        capturePhoto,
        stopCamera,

        removeImage,
    };
};
