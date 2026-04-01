import { useEffect, useState } from "react"

import { cartStorage } from "@/utils/orderStorage"
import type { HomeProductView } from "@/types/home.type"

export const useHomeCart = () => {
    const [cartCount, setCartCount] = useState(() => cartStorage.getTotalQty())

    useEffect(() => {
        const syncCartCount = () => setCartCount(cartStorage.getTotalQty())

        window.addEventListener("cart:updated", syncCartCount)
        return () => window.removeEventListener("cart:updated", syncCartCount)
    }, [])

    const getCartQty = (lotId: string) => {
        const cart = cartStorage.get()
        return cart.find((item) => item.lotId === lotId)?.qty ?? 0
    }

    const increaseCart = (item: HomeProductView) => {
        const stockQty = Math.max(0, Number(item.quantity ?? 0))
        const currentQty = getCartQty(item.lotId)

        if (stockQty <= 0) return
        if (currentQty >= stockQty) return

        cartStorage.add({
            lotId: item.lotId,
            productId: item.productId,
            supermarketId: item.supermarketId,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
        })

        setCartCount(cartStorage.getTotalQty())
    }

    const decreaseCart = (item: HomeProductView) => {
        const cart = cartStorage.get()
        const found = cart.find((cartItem) => cartItem.lotId === item.lotId)

        if (!found) return

        const nextCart =
            found.qty <= 1
                ? cart.filter((cartItem) => cartItem.lotId !== item.lotId)
                : cart.map((cartItem) =>
                    cartItem.lotId === item.lotId
                        ? { ...cartItem, qty: cartItem.qty - 1 }
                        : cartItem
                )

        cartStorage.set(nextCart)
        setCartCount(cartStorage.getTotalQty())
    }

    const addToCart = (item: HomeProductView) => {
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
