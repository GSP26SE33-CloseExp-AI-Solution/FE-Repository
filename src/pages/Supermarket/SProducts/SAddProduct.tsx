import { useRef, useState, ChangeEvent, useEffect } from "react";
import { Camera, UploadCloud, CheckCircle } from "lucide-react";

const SAddProduct: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [image, setImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [usingCamera, setUsingCamera] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(URL.createObjectURL(file));
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            setStream(mediaStream);
            setUsingCamera(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            alert("Không thể truy cập camera. Vui lòng cho phép quyền sử dụng camera.");
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/png");
        setImage(imageData);

        stopCamera();
    };

    const stopCamera = () => {
        stream?.getTracks().forEach((track) => track.stop());
        setUsingCamera(false);
    };

    useEffect(() => {
        return () => {
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [stream]);

    const retakePhoto = async () => {
        setImage(null);
        await startCamera();
    };

    return (
        <div className="w-full bg-white min-h-screen px-10 py-8">
            {/* TITLE + EXIT */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-[48px] font-bold text-gray-900">
                    Đăng tải Sản phẩm
                </h1>

                <button className="w-[240px] h-[60px] border border-gray-200 rounded-lg text-[20px] font-medium hover:bg-gray-50">
                    Thoát
                </button>
            </div>

            {/* UPLOAD CARD */}
            <div className="w-[580px] bg-white border border-gray-200 rounded-lg">
                {/* CARD HEADER */}
                <div className="flex justify-between items-center px-5 h-[80px] border-b border-gray-200 rounded-t-lg">
                    <button onClick={startCamera} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center">
                            <Camera size={18} className="text-white" />
                        </div>
                        <span className="text-[20px] font-semibold">
                            Chụp ảnh bằng camera
                        </span>
                    </button>

                    <button
                        onClick={handleUploadClick}
                        className="flex items-center gap-3"
                    >
                        <UploadCloud size={24} className="text-blue-500" />
                        <span className="text-[20px] font-semibold">
                            Upload ảnh có sẵn
                        </span>
                    </button>

                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {/* IMAGE PREVIEW */}
                <div className="p-5">
                    <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">

                        {usingCamera ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    className="h-full object-contain"
                                />
                                <button
                                    onClick={capturePhoto}
                                    className="absolute bottom-4 bg-green-700 text-white px-6 py-2 rounded-lg text-lg font-semibold"
                                >
                                    Chụp ảnh
                                </button>
                            </>
                        ) : image ? (
                            <img src={image} alt="preview" className="object-contain h-full" />
                        ) : (
                            <span className="text-gray-400">Ảnh xem trước sẽ hiển thị ở đây</span>
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                {image && !usingCamera && (
                    <div className="mt-5 px-5 pb-5 flex gap-5">

                        {/* CONFIRM */}
                        <button className="flex-1 h-[50px] bg-green-700 text-white rounded-lg text-[20px] font-semibold hover:opacity-90 transition">
                            Xác nhận đăng ảnh
                        </button>

                        {/* RETAKE */}
                        <button
                            onClick={retakePhoto}
                            className="w-[180px] h-[50px] bg-white border border-gray-400 rounded-lg text-[20px] font-semibold hover:bg-gray-50 transition"
                        >
                            Chụp lại
                        </button>

                    </div>
                )}

            </div>
        </div>
    );
};

export default SAddProduct;
