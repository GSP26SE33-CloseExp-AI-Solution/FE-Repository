export const getPromotionStatusLabel = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
        case "draft":
            return "Bản nháp"
        case "active":
            return "Đang áp dụng"
        case "expired":
            return "Đã hết hạn"
        case "disabled":
            return "Đã tắt"
        default:
            return status || "--"
    }
}

export const getPromotionStatusClass = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
        case "draft":
            return "bg-slate-100 text-slate-700"
        case "active":
            return "bg-emerald-100 text-emerald-700"
        case "expired":
            return "bg-amber-100 text-amber-700"
        case "disabled":
            return "bg-rose-100 text-rose-700"
        default:
            return "bg-slate-100 text-slate-700"
    }
}
