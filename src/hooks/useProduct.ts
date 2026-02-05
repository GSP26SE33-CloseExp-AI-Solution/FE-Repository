import { useEffect, useState } from "react"
import { productService } from "@/services/product.service"
import { Product } from "@/types/aiProduct.type"

export const useProduct = (productId: string) => {
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!productId) return

        setLoading(true)
        productService
            .getById(productId)
            .then((res) => setProduct(res.data))
            .finally(() => setLoading(false))
    }, [productId])

    return { product, loading }
}
