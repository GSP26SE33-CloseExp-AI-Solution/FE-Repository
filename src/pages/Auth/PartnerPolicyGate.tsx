import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Download } from "lucide-react"

import { showError, showSuccess } from "@/utils/toast"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type PartnerPolicyGateProps = {
    confirmed: boolean
    onConfirmedChange: (value: boolean) => void
    downloadUrl?: string
}

const DEFAULT_POLICY_DOWNLOAD_URL = "/docs/closeexp-system-policy.pdf"

const POLICY_SECTIONS = [
    {
        title: "1. Phạm vi áp dụng",
        content:
            "Chính sách này áp dụng cho tất cả đối tác gửi hồ sơ mở siêu thị trên hệ thống CloseExp AI. Khi gửi hồ sơ, bạn xác nhận rằng thông tin cung cấp là chính xác, trung thực và có thể được sử dụng để phục vụ quy trình xác minh, phê duyệt và vận hành hệ thống.",
    },
    {
        title: "2. Trách nhiệm cung cấp thông tin",
        content:
            "Đối tác phải cung cấp đúng tên đơn vị, địa chỉ hoạt động, thông tin liên hệ và vị trí địa lý của siêu thị. Trong trường hợp phát hiện thông tin sai lệch, hệ thống có quyền tạm dừng hoặc từ chối hồ sơ mà không cần xử lý tiếp.",
    },
    {
        title: "3. Xác minh và xét duyệt",
        content:
            "CloseExp AI có quyền kiểm tra, xác minh hoặc yêu cầu bổ sung thông tin trước khi phê duyệt hồ sơ. Việc gửi hồ sơ không đồng nghĩa với việc hồ sơ chắc chắn được chấp thuận.",
    },
    {
        title: "4. Nghĩa vụ tuân thủ",
        content:
            "Đối tác cam kết tuân thủ quy định của hệ thống, tiêu chuẩn vận hành, chính sách giá, chính sách sản phẩm, nghĩa vụ phối hợp xác minh và các quy định liên quan khác được CloseExp AI ban hành trong từng thời kỳ.",
    },
    {
        title: "5. Quyền từ chối hoặc tạm ngưng",
        content:
            "Hệ thống có quyền từ chối, tạm ngưng hoặc đóng hồ sơ nếu phát hiện dấu hiệu gian lận, thông tin không hợp lệ, vi phạm quy định vận hành hoặc ảnh hưởng tiêu cực đến trải nghiệm người dùng và uy tín nền tảng.",
    },
    {
        title: "6. Bảo mật và sử dụng dữ liệu",
        content:
            "Thông tin đối tác được sử dụng cho mục đích xác minh, quản lý hồ sơ, hỗ trợ vận hành, liên hệ công việc và cải thiện dịch vụ. CloseExp AI thực hiện các biện pháp hợp lý để bảo vệ dữ liệu nhưng đối tác cũng có trách nhiệm bảo mật thông tin tài khoản của mình.",
    },
    {
        title: "7. Xác nhận đồng ý",
        content:
            "Khi bấm xác nhận đã đọc và đồng ý, đối tác xác nhận đã đọc toàn bộ nội dung chính sách, hiểu rõ quyền và nghĩa vụ của mình, đồng thời chấp nhận việc hồ sơ chỉ được gửi đi sau bước xác nhận này.",
    },
]

const PartnerPolicyGate = ({
    confirmed,
    onConfirmedChange,
    downloadUrl = DEFAULT_POLICY_DOWNLOAD_URL,
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
                        Chính sách hệ thống dành cho đối tác
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                        Bạn cần đọc hết nội dung bên dưới, sau đó xác nhận đã đọc và đồng ý thì
                        mới có thể gửi hồ sơ.
                    </p>
                </div>

                <a
                    href={downloadUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                    <Download className="h-4 w-4" />
                    Tải chính sách
                </a>
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
                        Tôi xác nhận đã đọc đầy đủ chính sách hệ thống, hiểu rõ quy trình xét
                        duyệt và đồng ý với các điều khoản áp dụng cho hồ sơ đăng ký đối tác.
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
