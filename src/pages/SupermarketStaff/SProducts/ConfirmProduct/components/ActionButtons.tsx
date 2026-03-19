interface ActionButtonsProps {
    onBack: () => void;
    onSaveDraft: () => void;
    onSubmit: () => void;
    disabled?: boolean;
    missingCount?: number;
    step: "edit" | "ai" | "review";
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    onBack,
    onSaveDraft,
    onSubmit,
    disabled = false,
    missingCount = 0,
    step,
}) => {

    const submitLabelMap = {
        edit: "Gọi AI định giá",
        ai: "Xác nhận giá AI",
        review: "Hoàn tất sản phẩm",
    } as const;

    const submitLabel = submitLabelMap[step];

    return (
        <div className="flex justify-between items-center pt-6 border-t">
            <button
                onClick={onBack}
                className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-100"
            >
                Quay lại
            </button>

            <div className="space-x-3">
                <button
                    onClick={onSaveDraft}
                    className="px-4 py-2 rounded border border-blue-500 text-blue-500 hover:bg-blue-50"
                >
                    Lưu nháp
                </button>

                <button
                    disabled={disabled}
                    title={
                        disabled && missingCount
                            ? `Còn thiếu ${missingCount} trường bắt buộc`
                            : "Xác nhận thông tin sản phẩm"
                    }
                    onClick={onSubmit}
                    className={`px-5 py-2 rounded text-white
                            ${disabled
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"}
                    `}
                >
                    {submitLabel}
                </button>

            </div>
        </div>
    );
};

export default ActionButtons;
