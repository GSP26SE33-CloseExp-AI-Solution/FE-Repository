const ImagePreviewGrid = ({ images, onRemove }: any) => {
    return (
        <div className="p-5 grid grid-cols-3 gap-4">
            {images.map((img: any) => (
                <div key={img.id} className="relative group">
                    <img
                        src={img.preview}
                        className="h-40 w-full object-cover rounded-lg"
                    />
                    <button
                        onClick={() => onRemove(img.id)}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ImagePreviewGrid;
