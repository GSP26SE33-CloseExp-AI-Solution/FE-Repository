import { ShieldCheck } from "lucide-react"

const STEPS = [
    {
        index: "01",
        title: "Điền thông tin siêu thị",
        text: "Nhập tên siêu thị, địa chỉ, vị trí và thông tin liên hệ.",
    },
    {
        index: "02",
        title: "Đọc chính sách hệ thống",
        text: "Cuộn đọc đầy đủ nội dung chính sách, xác nhận đã đọc và đồng ý.",
    },
    {
        index: "03",
        title: "Gửi hồ sơ đăng ký",
        text: "Sau khi xác nhận chính sách, hệ thống mới cho phép gửi hồ sơ.",
    },
    {
        index: "04",
        title: "Theo dõi trạng thái",
        text: "Sau khi gửi thành công, bạn có thể kiểm tra lại trạng thái hồ sơ.",
    },
]

const NOTES = [
    "Nên chọn địa chỉ từ gợi ý hoặc vị trí hiện tại để có tọa độ chính xác.",
    "Tọa độ Lat/Lng sẽ được hệ thống ghi nhận theo địa chỉ bạn chọn.",
    "Bạn bắt buộc phải đọc và xác nhận chính sách trước khi gửi hồ sơ.",
    "Sau khi gửi hồ sơ thành công, bạn cần kiểm tra trạng thái xét duyệt.",
]

const PartnerRegisterGuide = () => {
    return (
        <div className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Hướng dẫn đăng ký</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Xem nhanh quy trình và các lưu ý trước khi gửi hồ sơ.
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-4">
                {STEPS.map((step) => (
                    <StepItem
                        key={step.index}
                        index={step.index}
                        title={step.title}
                        text={step.text}
                    />
                ))}
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                <h4 className="text-base font-bold text-slate-900">Lưu ý khi đăng ký</h4>

                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    {NOTES.map((note) => (
                        <p key={note}>• {note}</p>
                    ))}
                </div>
            </div>
        </div>
    )
}

const StepItem = ({
    index,
    title,
    text,
}: {
    index: string
    title: string
    text: string
}) => {
    return (
        <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                {index}
            </div>
            <div>
                <h4 className="font-semibold text-slate-900">{title}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
            </div>
        </div>
    )
}

export default PartnerRegisterGuide
