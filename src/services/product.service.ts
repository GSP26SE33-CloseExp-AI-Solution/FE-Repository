import axiosClient from "@/utils/axiosClient"

export const getProductsBySupermarket = async (supermarketId: string) => {
    const res = await axiosClient.get("/Products")

    const products = res.data?.items ?? res.data ?? []

    return {
        items: products.filter((p: any) => p.supermarketId === supermarketId),
    }
}
