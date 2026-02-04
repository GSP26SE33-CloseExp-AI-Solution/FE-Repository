import { Camera, UploadCloud } from "lucide-react";
import CameraPreview from "./CameraPreview";
import ImagePreviewGrid from "./ImagePreviewGrid";

const ImageUploadCard = ({
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
    removeImage,
}: any) => {
    return (
        <div className="w-[580px] bg-white border border-gray-200 rounded-lg">
            {/* HEADER */}
            <div className="flex justify-between items-center px-5 h-[80px] border-b border-gray-200">
                <button onClick={startCamera} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center">
                        <Camera size={18} className="text-white" />
                    </div>
                    <span className="text-[20px] font-semibold">
                        Chụp ảnh bằng camera
                    </span>
                </button>

                <button onClick={handleUploadClick} className="flex items-center gap-3">
                    <UploadCloud size={24} className="text-blue-500" />
                    <span className="text-[20px] font-semibold">
                        Upload ảnh có sẵn
                    </span>
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

            {/* ERROR */}
            {uploadError && (
                <p className="px-5 pt-3 text-red-600 text-sm">{uploadError}</p>
            )}

            {/* CAMERA */}
            {usingCamera && (
                <CameraPreview
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    onCapture={capturePhoto}
                />
            )}

            {/* PREVIEW */}
            {images.length > 0 && (
                <ImagePreviewGrid images={images} onRemove={removeImage} />
            )}
        </div>
    );
};

export default ImageUploadCard;
