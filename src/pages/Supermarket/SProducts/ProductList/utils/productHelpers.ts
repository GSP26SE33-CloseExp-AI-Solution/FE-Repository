// FORMAT DAY
export const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

// FORMAT TIỀN
export const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + "đ"

// % GIẢM GIÁ
export const calcDiscount = (original: number, sale: number) =>
    Math.round(((original - sale) / original) * 100)

// TRẠNG THÁI HẠN
export const getExpiryStatus = (expiryDate: string) => {
    const today = new Date()
    const exp = new Date(expiryDate)
    today.setHours(0, 0, 0, 0)
    exp.setHours(0, 0, 0, 0)

    const diffTime = exp.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays >= 8)
        return { label: "Còn dài hạn", color: "bg-green-100 text-green-700" }
    if (diffDays >= 3 && diffDays <= 7)
        return { label: "Còn ngắn hạn", color: "bg-blue-100 text-blue-700" }
    if (diffDays >= 1 && diffDays <= 2)
        return { label: "Sắp hết hạn", color: "bg-yellow-100 text-yellow-700" }
    if (diffDays === 0)
        return { label: "Trong ngày", color: "bg-orange-100 text-orange-700" }

    return { label: "Hết hạn", color: "bg-red-100 text-red-700" }
}

// SỐ NGÀY CÒN LẠI
export const getDaysLeft = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)

    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
}
