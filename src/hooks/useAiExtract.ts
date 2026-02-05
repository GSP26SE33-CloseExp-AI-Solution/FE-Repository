import { useEffect, useState } from "react"
import { productService } from "@/services/product.service"
import { Product } from "@/types/aiProduct.type"

interface UseAiExtractParams {
    supermarketId: string
    createdBy: string
}

export const useAiExtract = ({
    supermarketId,
    createdBy,
}: UseAiExtractParams) => {
    const [loading, setLoading] = useState(false)
    const [product, setProduct] = useState<Product | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    const uploadAndExtract = async (file: File): Promise<Product> => {
        console.group("🧠 AI OCR FLOW")

        try {
            setLoading(true)
            setError(null)

            // preview ảnh cho UI
            const previewUrl = URL.createObjectURL(file)
            setPreviewImage(previewUrl)

            // 1️⃣ Upload ảnh → BE tạo Product Draft
            const uploadRes = await productService.uploadOcr({
                supermarketId,
                createdBy,
                file,
            })

            // ✅ ĐÚNG THEO API
            const draftProduct = uploadRes.data.data

            console.log("🧾 Draft product from BE", draftProduct)
            console.log("🆔 ProductId:", draftProduct.productId)

            setProduct(draftProduct)
            return draftProduct
        } catch (err: any) {
            console.error("❌ AI OCR ERROR", err)
            setError(err?.message ?? "Upload OCR failed")
            throw err
        } finally {
            setLoading(false)
            console.groupEnd()
        }
    }

    // cleanup preview image
    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage)
            }
        }
    }, [previewImage])

    return {
        uploadAndExtract,
        product,
        previewImage,
        loading,
        error,
    }
}
