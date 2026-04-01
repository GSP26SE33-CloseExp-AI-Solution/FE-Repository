import {
    CART_KEY,
    LAST_ORDER_ID_KEY,
    LAST_ORDER_KEY,
    ORDER_CONTEXT_KEY,
} from "@/constants/storageKeys"
import type {
    CartItem,
    CustomerOrderContext
} from "@/types/order.type"
import { getAuthSession } from "@/utils/authStorage"

const safeParse = <T,>(raw: string | null, fallback: T): T => {
    try {
        return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
        return fallback
    }
}

export const cartStorage = {
    get(): CartItem[] {
        return safeParse<CartItem[]>(localStorage.getItem(CART_KEY), [])
    },

    set(items: CartItem[]) {
        localStorage.setItem(CART_KEY, JSON.stringify(items))
        window.dispatchEvent(new Event("cart:updated"))
    },

    clear() {
        localStorage.removeItem(CART_KEY)
        window.dispatchEvent(new Event("cart:updated"))
    },

    add(item: Omit<CartItem, "qty">, qty = 1) {
        const items = this.get()
        const found = items.find((x) => x.lotId === item.lotId)

        if (found) {
            found.qty += qty
        } else {
            items.push({ ...item, qty })
        }

        this.set(items)
    },

    getTotalQty() {
        return this.get().reduce((sum, item) => sum + item.qty, 0)
    },
}

export const orderContextStorage = {
    get(): CustomerOrderContext {
        return safeParse<CustomerOrderContext>(localStorage.getItem(ORDER_CONTEXT_KEY), {})
    },

    set(value: CustomerOrderContext) {
        localStorage.setItem(ORDER_CONTEXT_KEY, JSON.stringify(value))
        window.dispatchEvent(new Event("order-context:updated"))
    },

    patch(value: Partial<CustomerOrderContext>) {
        const current = this.get()
        this.set({ ...current, ...value })
    },

    clear() {
        localStorage.removeItem(ORDER_CONTEXT_KEY)
        window.dispatchEvent(new Event("order-context:updated"))
    },

    /**
     * ready để đi tiếp từ cart -> checkout
     * chưa ép phải có addressId/timeSlotId ở cart,
     * vì 2 field này có thể được chọn ở checkout
     */
    isReady(ctx?: CustomerOrderContext) {
        const value = ctx ?? this.get()

        if (!value.deliveryMethodId) return false

        if (value.deliveryMethodId === "DELIVERY") {
            return (
                !!value.addressText &&
                typeof value.lat === "number" &&
                typeof value.lng === "number"
            )
        }

        if (value.deliveryMethodId === "PICKUP") {
            return !!(
                value.collectionId ||
                value.collectionPointId ||
                value.pickupPointId
            )
        }

        return false
    },

    getResolvedCollectionId(ctx?: CustomerOrderContext) {
        const value = ctx ?? this.get()
        return value.collectionId || value.collectionPointId || value.pickupPointId || ""
    },

    getResolvedCollectionName(ctx?: CustomerOrderContext) {
        const value = ctx ?? this.get()
        return value.collectionPointName || value.pickupPointName || ""
    },

    getResolvedCollectionAddress(ctx?: CustomerOrderContext) {
        const value = ctx ?? this.get()
        return value.collectionPointAddress || value.pickupPointAddress || ""
    },
}

export const lastOrderStorage = {
    getId() {
        return localStorage.getItem(LAST_ORDER_ID_KEY) ?? ""
    },

    setId(orderId: string) {
        localStorage.setItem(LAST_ORDER_ID_KEY, orderId)
    },

    clearId() {
        localStorage.removeItem(LAST_ORDER_ID_KEY)
    },

    get<T>() {
        return safeParse<T | null>(localStorage.getItem(LAST_ORDER_KEY), null)
    },

    set<T>(value: T) {
        localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(value))
    },

    clear() {
        localStorage.removeItem(LAST_ORDER_KEY)
        localStorage.removeItem(LAST_ORDER_ID_KEY)
    },
}

export const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`

export const googleMapsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`

export const getAuthenticatedUserId = () => {
    const session = getAuthSession()
    const user = session?.user as Record<string, unknown> | undefined

    if (!user) return ""

    const candidate =
        user.userId ??
        user.id ??
        user.userID ??
        user["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]

    return typeof candidate === "string" ? candidate : ""
}

export const getCheckoutUserId = () => {
    return getAuthenticatedUserId()
}
