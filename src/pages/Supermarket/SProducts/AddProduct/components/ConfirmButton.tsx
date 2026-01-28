import { CheckCircle } from "lucide-react";

const ConfirmButton = () => {
    return (
        <div className="mt-5 pl-0 pb-5">
            <button className="w-[360px] h-[50px] bg-[#1E8449] rounded-[8px] flex items-center justify-center gap-4 text-white text-[20px] font-semibold hover:opacity-90 transition">
                <CheckCircle className="w-[30px] h-[30px]" strokeWidth={2} />
                <span>Xác nhận đăng ảnh</span>
            </button>
        </div>
    );
};

export default ConfirmButton;
