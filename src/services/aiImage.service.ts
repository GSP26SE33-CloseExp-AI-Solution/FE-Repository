import axiosClient from "@/utils/axiosClient";

const API_URL = "/Products/upload-ocr";

export const aiService = {
    uploadOcr: async (
        file: File,
        supermarketId: string,
        createdBy: string
    ) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("supermarketId", supermarketId);
        formData.append("createdBy", createdBy);

        const res = await axiosClient.post(API_URL, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;
    },
};
