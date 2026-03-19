const CameraPreview = ({ videoRef, canvasRef, onCapture }: any) => {
    return (
        <div className="p-5">
            <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-contain"
                />
                <button
                    onClick={onCapture}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-700 text-white px-6 py-2 rounded-lg text-lg font-semibold"
                >
                    Chụp ảnh
                </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraPreview;
