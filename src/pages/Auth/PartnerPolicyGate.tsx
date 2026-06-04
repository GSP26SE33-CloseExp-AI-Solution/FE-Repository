import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Download, ExternalLink } from "lucide-react"

import { showError, showSuccess } from "@/utils/toast"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type PartnerPolicyGateProps = {
    confirmed: boolean
    onConfirmedChange: (value: boolean) => void
    viewUrl?: string
    downloadUrl?: string
}

export const SUPERMARKET_PARTNER_POLICY_VIEW_URL =
    "/docs/supermarket-partner-policy.html"

export const SUPERMARKET_PARTNER_POLICY_DOWNLOAD_URL =
    "/docs/supermarket-partner-policy.html"

const POLICY_SECTIONS = [
    {
        title: "1. Phạm vi áp dụng",
        content:
            "Áp dụng cho chủ siêu thị, nhân sự supermarket staff và mọi tài khoản vận hành sau khi hồ sơ được phê duyệt trên CloseExp AI.",
    },
    {
        title: "2. Thông tin & nguồn hàng",
        content:
            "Cung cấp thông tin đơn vị chính xác. Chỉ bán hàng có nguồn gốc hợp pháp, còn hạn, đúng mô tả; tồn kho đăng bán phải khớp hàng thực tế; không bán hàng cấm hoặc hàng giả.",
    },
    {
        title: "3. Quy trình đưa sản phẩm (Product Workflow)",
        content:
            "Thực hiện đúng workflow: quét/nhập sản phẩm, xác nhận lô, thiết lập giá, kiểm tra hạn dùng trước khi publish. Không bỏ qua bước xác minh bắt buộc. Cập nhật giá và tồn kho theo thực tế.",
    },
    {
        title: "4. Quản lý lô hàng & hạn sử dụng",
        content:
            "Theo dõi hạn dùng từng lô; không để lô quá hạn vẫn bán. Tuân thủ cutoff đặt hàng trong ngày với hàng sắp hết hạn. Phối hợp khi hệ thống tự expire lô hoặc hủy đơn liên quan.",
    },
    {
        title: "5. Đóng gói, giao hàng & hoàn tiền",
        content:
            "Đóng gói đúng số lượng và đúng siêu thị phụ trách từng dòng đơn. Báo thất bại đóng gói trung thực; chấp nhận hoàn tiền theo quy tắc hệ thống (từng dòng hoặc cả đơn kèm phí).",
    },
    {
        title: "6. Giá bán & khuyến mãi",
        content:
            "Giá minh bạch, hợp lý; tuân thủ hướng dẫn giá tham chiếu khi có. Không thao túng giá hoặc gian lận khuyến mãi.",
    },
    {
        title: "7. Xét duyệt, tạm ngưng & chấm dứt",
        content:
            "CloseExp AI có quyền từ chối, tạm ngưng hoặc đóng siêu thị khi vi phạm chính sách, sai quy trình product workflow hoặc gian lận nguồn hàng.",
    },
    {
        title: "8. Bảo mật dữ liệu",
        content:
            "Bảo mật tài khoản đăng nhập; không chia sẻ cho bên thứ ba. Dữ liệu hồ sơ chỉ dùng cho vận hành hợp pháp trên hệ thống.",
    },
    {
        title: "9. Xác nhận đồng ý",
        content:
            "Khi tick xác nhận, bạn đồng ý tuân thủ toàn bộ điều khoản và chỉ gửi hồ sơ sau khi đã đọc hết chính sách (trên màn hình hoặc bản tải về).",
    },
]

const PartnerPolicyGate = ({
    confirmed,
    onConfirmedChange,
    viewUrl = SUPERMARKET_PARTNER_POLICY_VIEW_URL,
    downloadUrl = SUPERMARKET_PARTNER_POLICY_DOWNLOAD_URL,
}: PartnerPolicyGateProps) => {
    const policyScrollRef = useRef<HTMLDivElement | null>(null)

    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)
    const [checked, setChecked] = useState(false)

    const handleScroll = () => {
        const element = policyScrollRef.current
        if (!element) return

        const reachedBottom =
            element.scrollTop + element.clientHeight >= element.scrollHeight - 8

        if (reachedBottom) {
            setHasScrolledToEnd(true)
        }
    }

    useEffect(() => {
        if (!hasScrolledToEnd) {
            setChecked(false)
            onConfirmedChange(false)
        }
    }, [hasScrolledToEnd, onConfirmedChange])

    const handleConfirm = () => {
        if (!hasScrolledToEnd) {
            showError("Vui lòng cuộn đọc hết chính sách hệ thống trước")
            return
        }

        if (!checked) {
            showError("Vui lòng xác nhận rằng bạn đã đọc và đồng ý với chính sách")
            return
        }

        onConfirmedChange(true)
        showSuccess("Đã xác nhận đọc và đồng ý với chính sách hệ thống")
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900">
                        Chính sách đăng ký đối tác siêu thị
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                        Bạn cần đọc hết nội dung bên dưới, có thể mở bản đầy đủ hoặc tải về, sau đó xác nhận
                        đồng ý mới được gửi hồ sơ.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Xem bản đầy đủ
                    </a>
                    <a
                        href={downloadUrl}
                        download="closeexp-supermarket-partner-policy.html"
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                        <Download className="h-4 w-4" />
                        Tải chính sách
                    </a>
                </div>
            </div>

            <div
                ref={policyScrollRef}
                onScroll={handleScroll}
                className="mt-4 h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
                <div className="space-y-4">
                    {POLICY_SECTIONS.map((section) => (
                        <div key={section.title} className="rounded-xl bg-white p-4 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-900">{section.title}</h4>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {section.content}
                            </p>
                        </div>
                    ))}

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        Bạn đã đến cuối nội dung chính sách. Bây giờ bạn có thể xác nhận đã đọc
                        và đồng ý.
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <input
                        id="policy-confirm-checkbox"
                        type="checkbox"
                        checked={checked}
                        disabled={!hasScrolledToEnd}
                        onChange={(e) => {
                            setChecked(e.target.checked)
                            if (!e.target.checked) {
                                onConfirmedChange(false)
                            }
                        }}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <label
                        htmlFor="policy-confirm-checkbox"
                        className={cn(
                            "text-sm leading-6",
                            hasScrolledToEnd ? "text-slate-700" : "text-slate-400"
                        )}
                    >
                        Tôi xác nhận đã đọc đầy đủ chính sách đăng ký đối tác siêu thị, hiểu rõ quy trình
                        xét duyệt và đồng ý với các điều khoản áp dụng cho hồ sơ đăng ký.
                    </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!hasScrolledToEnd || !checked}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Tôi đã đọc và đồng ý
                    </button>

                    <span
                        className={cn(
                            "text-sm font-medium",
                            confirmed ? "text-emerald-700" : "text-slate-500"
                        )}
                    >
                        {confirmed
                            ? "Bạn đã xác nhận chính sách thành công."
                            : hasScrolledToEnd
                                ? "Hãy tick xác nhận rồi bấm nút đồng ý."
                                : "Vui lòng cuộn đọc hết nội dung chính sách trước."}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default PartnerPolicyGate
