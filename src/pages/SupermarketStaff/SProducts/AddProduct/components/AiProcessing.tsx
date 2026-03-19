const AiProcessing = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />

            <p className="mt-4 text-lg font-medium">
                A.I đang phân tích hình ảnh…
            </p>

            <span className="text-sm text-gray-500">
                Quá trình này có thể mất vài giây
            </span>
        </div>
    );
};

export default AiProcessing;
