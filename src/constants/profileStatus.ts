export const PROFILE_STATUS_LABEL: Record<number, string> = {
    0: "Chưa xác thực",
    1: "Chờ phê duyệt",
    2: "Đang hoạt động",
    3: "Bị từ chối",
    4: "Đã khóa",
    5: "Bị cấm",
    6: "Đã xóa",
    7: "Đã ẩn",
}

export const PROFILE_STATUS_CLASS: Record<number, string> = {
    0: "border border-slate-200 bg-slate-50 text-slate-700",
    1: "border border-amber-200 bg-amber-50 text-amber-700",
    2: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    3: "border border-rose-200 bg-rose-50 text-rose-700",
    4: "border border-rose-200 bg-rose-50 text-rose-700",
    5: "border border-rose-200 bg-rose-50 text-rose-700",
    6: "border border-slate-200 bg-slate-50 text-slate-700",
    7: "border border-slate-200 bg-slate-50 text-slate-700",
}

export const getProfileStatusLabel = (status?: number) => {
    if (typeof status !== "number") return "Chưa rõ"
    return PROFILE_STATUS_LABEL[status] ?? "Chưa rõ"
}

export const getProfileStatusClass = (status?: number) => {
    if (typeof status !== "number") {
        return "border border-slate-200 bg-slate-50 text-slate-700"
    }

    return (
        PROFILE_STATUS_CLASS[status] ??
        "border border-slate-200 bg-slate-50 text-slate-700"
    )
}
