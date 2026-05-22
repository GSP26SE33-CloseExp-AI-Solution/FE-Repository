import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import { cartBridge } from "@/utils/cartBridge"
import { cartStorage } from "@/utils/orderStorage"
import type { HomeProductView } from "@/types/home.type"
import type { CartItem } from "@/types/order.type"
import { resolveProductDisplayImageUrl } from "@/utils/productImage"

export type HomeCartLineInput = HomeProductView & {
    expiryDate?: string
    purchaseUnitId?: string
    purchaseUnitName?: string
    purchaseUnitSymbol?: string
    purchaseConversionRate?: number
    /** Price per purchase unit (defaults to lot price). */
    displayPrice?: number
    /** Max qty in purchase unit (defaults to lot stock). */
    maxPurchaseQty?: number
}

export const useHomeCart = () => {
    const [cartCount, setCartCount] = useState(() => cartStorage.getTotalQty())

    useEffect(() => {
        const syncCartCount = () => setCartCount(cartStorage.getTotalQty())

        void cartBridge.refresh().finally(syncCartCount)

        window.addEventListener("cart:updated", syncCartCount)
        return () => window.removeEventListener("cart:updated", syncCartCount)
    }, [])

    const getCartQty = (lotId: string, purchaseUnitId?: string) => {
        const cart = cartStorage.get()
        const key = cartStorage.cartLineKey({
            lotId,
            purchaseUnitId,
            unitId: purchaseUnitId,
        })
        return cart.find((item) => cartStorage.cartLineKey(item) === key)?.qty ?? 0
    }

    const toCartLine = (item: HomeCartLineInput): Omit<CartItem, "qty"> => ({
        lotId: item.lotId,
        productId: item.productId,
        supermarketId: item.supermarketId,
        supermarketName: item.supermarketName || undefined,
        expiryDate: item.expiryDate || undefined,
        name: item.name,
        price: item.displayPrice ?? item.price,
        imageUrl: resolveProductDisplayImageUrl(
            item.preSignedImageUrl,
            item.imageUrl,
        ) || undefined,
        unitId: item.unitId,
        unitName: item.unitName,
        unitSymbol: item.unitSymbol,
        conversionRate: item.conversionRate,
        productUnitId: item.productUnitId,
        productUnitName: item.productUnitName,
        productUnitSymbol: item.productUnitSymbol,
        productConversionRate: item.productConversionRate,
        purchaseUnitId: item.purchaseUnitId ?? item.unitId,
        purchaseUnitName: item.purchaseUnitName ?? item.unitName,
        purchaseUnitSymbol: item.purchaseUnitSymbol ?? item.unitSymbol,
        purchaseConversionRate:
            item.purchaseConversionRate ?? item.conversionRate,
    })

    const increaseCart = (item: HomeCartLineInput) => {
        const stockQty = Math.max(
            0,
            Number(item.maxPurchaseQty ?? item.quantity ?? 0),
        )
        const purchaseUnitId = item.purchaseUnitId ?? item.unitId
        const currentQty = getCartQty(item.lotId, purchaseUnitId)

        if (stockQty <= 0) return
        if (currentQty >= stockQty) return

        void cartBridge
            .add(toCartLine(item), 1)
            .then(() => {
                setCartCount(cartStorage.getTotalQty())
            })
            .catch((error: unknown) => {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Không thể thêm vào giỏ hàng"
                toast.error(message)
            })
    }

    const decreaseCart = (item: HomeCartLineInput) => {
        const cart = cartStorage.get()
        const lineKey = cartStorage.cartLineKey({
            lotId: item.lotId,
            purchaseUnitId: item.purchaseUnitId ?? item.unitId,
            unitId: item.unitId,
        })
        const found = cart.find(
            (cartItem) => cartStorage.cartLineKey(cartItem) === lineKey,
        )

        if (!found) return

        const nextQty = found.qty <= 1 ? 0 : found.qty - 1
        void cartBridge
            .setQuantity(found, nextQty)
            .then(() => {
                setCartCount(cartStorage.getTotalQty())
            })
            .catch((error: unknown) => {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Không thể cập nhật giỏ hàng"
                toast.error(message)
            })
    }

    const addToCart = (item: HomeCartLineInput) => {
        increaseCart(item)
    }

    return {
        cartCount,
        getCartQty,
        addToCart,
        increaseCart,
        decreaseCart,
    }
}
