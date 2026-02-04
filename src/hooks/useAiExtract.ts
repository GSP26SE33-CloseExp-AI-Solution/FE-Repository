import { aiService } from "@/services/aiImage.service";

export const extractProductFromImages = async (
    files: File[],
    supermarketId?: string,
    createdBy?: string
) => {
    if (!files.length) {
        throw new Error("Không có ảnh nào được cung cấp");
    }

    if (!supermarketId) {
        throw new Error("Thiếu supermarketId");
    }

    if (!createdBy) {
        throw new Error("Thiếu createdBy");
    }

    const file = files[0];

    const res = await aiService.uploadOcr(
        file,
        supermarketId,
        createdBy
    );

    return res;
};
