import axiosClient from "./axiosClient"

export const getProductsBySupermarket = async (supermarketId: string) => {
    const res = await axiosClient.get(
        `/api/supermarket/products/supermarket/${supermarketId}`
    )
    return res.data
}