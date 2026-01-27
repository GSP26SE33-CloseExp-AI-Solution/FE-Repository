import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

interface ImageFile {
    file: File;
    preview: string;
}

const MAX_IMAGES = 5;

const AddProductImages = () => {
    const [images, setImages] = useState<ImageFile[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: ImageFile[] = [];

        Array.from(files).forEach((file) => {
            if (!file.type.startsWith("image/")) return;

            newImages.push({
                file,
                preview: URL.createObjectURL(file),
            });
        });

        setImages((prev) => {
            const combined = [...prev, ...newImages].slice(0, MAX_IMAGES);
            return combined;
        });
    };

    const handleRemoveImage = (index: number) => {
        setImages((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Hình ảnh sản phẩm</h2>

            {/* Upload Box */}
            <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl h-44 flex flex-col items-center justify-center cursor-pointer hover:border-green-600 transition"
            >
                <ImagePlus size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-500">Bấm để tải ảnh lên</p>
                <p className="text-sm text-gray-400">
                    Tối đa {MAX_IMAGES} ảnh
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={handleSelectImages}
            />

            {/* Preview */}
            {images.length > 0 && (
                <div className="grid grid-cols-5 gap-4 mt-6">
                    {images.map((img, index) => (
                        <div
                            key={index}
                            className="relative group border rounded-lg overflow-hidden"
                        >
                            <img
                                src={img.preview}
                                alt="preview"
                                className="w-full h-28 object-cover"
                            />

                            <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AddProductImages;
