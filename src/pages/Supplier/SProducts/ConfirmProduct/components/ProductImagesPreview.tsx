import React, { useState } from "react";

interface Props {
    images: string[];
}

const ProductImagesPreview: React.FC<Props> = ({ images }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="border border-dashed rounded-lg p-6 text-center text-gray-500">
                Chưa có hình ảnh sản phẩm
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Ảnh lớn */}
            <div className="w-full h-[400px] border rounded-lg overflow-hidden bg-white flex items-center justify-center">
                <img
                    src={images[activeIndex]}
                    alt="preview"
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Thumbnail list */}
            <div className="flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`w-[64px] h-[64px] rounded border overflow-hidden flex-shrink-0
                            ${index === activeIndex
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-300"
                            }
                        `}
                    >
                        <img
                            src={img}
                            alt={`thumb-${index}`}
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProductImagesPreview;
