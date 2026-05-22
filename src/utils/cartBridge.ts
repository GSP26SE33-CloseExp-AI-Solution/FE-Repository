import type { CartItem } from "@/types/order.type"
import type { ApiCartItem, ApiCart } from "@/types/cart.type"
import { cartService } from "@/services/cart.service"
import { cartStorage } from "@/utils/orderStorage"
import { getAuthSession } from "@/utils/authStorage"
import { resolveProductDisplayImageUrl } from "@/utils/productImage"

const CART_ITEM_ID_KEY = "cartItemIdByLine"

type CartLineMeta = Record<string, string>

const readCartItemIds = (): CartLineMeta =>
    cartStorage.get().length
        ? safeParse<CartLineMeta>(localStorage.getItem(CART_ITEM_ID_KEY), {})
        : safeParse<CartLineMeta>(localStorage.getItem(CART_ITEM_ID_KEY), {})

const writeCartItemIds = (map: CartLineMeta) => {
    localStorage.setItem(CART_ITEM_ID_KEY, JSON.stringify(map))
}

const safeParse = <T,>(raw: string | null, fallback: T): T => {
    try {
        return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
        return fallback
    }
}

export const isServerCartEnabled = () => Boolean(getAuthSession()?.accessToken)

const mapApiItemToCartItem = (item: ApiCartItem): CartItem => ({
    cartItemId: item.cartItemId,
    lotId: item.lotId,
    productId: item.productId,
    supermarketId: item.supermarketId,
    supermarketName: item.supermarketName ?? undefined,
    expiryDate: item.expiryDate || undefined,
    name: item.productName,
    price: item.unitPrice,
    imageUrl:
        resolveProductDisplayImageUrl(
            item.productImagePreSignedUrl,
            item.productImageUrl,
        ) || undefined,
    unitId: item.unitId,
    unitName: item.unitName ?? undefined,
    unitSymbol: item.unitSymbol ?? undefined,
    conversionRate: item.conversionRate,
    productUnitId: item.productUnitId,
    productUnitName: item.productUnitName ?? undefined,
    productUnitSymbol: item.productUnitSymbol ?? undefined,
    productConversionRate: item.productConversionRate,
    purchaseUnitId: item.purchaseUnitId ?? item.unitId,
    purchaseUnitName: item.purchaseUnitName ?? item.unitName ?? undefined,
    purchaseUnitSymbol: item.purchaseUnitSymbol ?? item.unitSymbol ?? undefined,
    qty: Number(item.quantity) || 0,
})

const syncCartItemIdMap = (apiCart: ApiCart) => {
    const next: CartLineMeta = {}
    apiCart.items.forEach((item) => {
        const lineKey = cartStorage.cartLineKey({
            lotId: item.lotId,
            purchaseUnitId: item.purchaseUnitId ?? item.unitId,
            unitId: item.unitId,
        })
        next[lineKey] = item.cartItemId
    })
    writeCartItemIds(next)
}

const applyApiCartToLocal = (apiCart: ApiCart) => {
    const items = apiCart.items.map(mapApiItemToCartItem)
    cartStorage.set(items)
    syncCartItemIdMap(apiCart)
}

export const cartBridge = {
    async refresh(): Promise<CartItem[]> {
        if (!isServerCartEnabled()) {
            return cartStorage.get()
        }

        const apiCart = await cartService.getMyCart()
        applyApiCartToLocal(apiCart)
        return cartStorage.get()
    },

    async add(
        line: Omit<CartItem, "qty">,
        qty = 1,
    ): Promise<CartItem[]> {
        if (!isServerCartEnabled()) {
            cartStorage.add(line, qty)
            return cartStorage.get()
        }

        const apiCart = await cartService.addItem({
            lotId: line.lotId,
            purchaseUnitId: line.purchaseUnitId ?? line.unitId,
            quantity: qty,
        })
        applyApiCartToLocal(apiCart)
        return cartStorage.get()
    },

    async setQuantity(line: CartItem, nextQty: number): Promise<CartItem[]> {
        if (!isServerCartEnabled()) {
            const key = cartStorage.cartLineKey(line)
            const items = cartStorage.get()
            const next =
                nextQty <= 0
                    ? items.filter((x) => cartStorage.cartLineKey(x) !== key)
                    : items.map((x) =>
                        cartStorage.cartLineKey(x) === key
                            ? { ...x, qty: nextQty }
                            : x,
                    )
            cartStorage.set(next)
            return next
        }

        const lineKey = cartStorage.cartLineKey(line)
        const idMap = readCartItemIds()
        const cartItemId = line.cartItemId ?? idMap[lineKey]

        if (!cartItemId) {
            if (nextQty <= 0) return cartStorage.get()
            return this.add(line, nextQty)
        }

        if (nextQty <= 0) {
            const apiCart = await cartService.removeItem(cartItemId)
            applyApiCartToLocal(apiCart)
            return cartStorage.get()
        }

        const apiCart = await cartService.updateItem(cartItemId, nextQty)
        applyApiCartToLocal(apiCart)
        return cartStorage.get()
    },

    async clear(): Promise<void> {
        if (isServerCartEnabled()) {
            await cartService.clear()
        }
        writeCartItemIds({})
        cartStorage.clear()
    },
}
