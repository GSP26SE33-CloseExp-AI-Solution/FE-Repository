import toast from "react-hot-toast";

/** Thành công */
export const showSuccess = (message: string) =>
    toast.success(message, { className: "toast-success" });

/** Lỗi */
export const showError = (message: string) =>
    toast.error(message, { className: "toast-error" });

/** Cảnh báo */
export const showWarning = (message: string) =>
    toast(message, { className: "toast-warning" });

/** Thông tin */
export const showInfo = (message: string) =>
    toast(message, { className: "toast-info" });
