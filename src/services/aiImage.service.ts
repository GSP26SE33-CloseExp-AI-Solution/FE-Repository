import axios from "axios";

const API_URL = "/api/AI/smart-scan";

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export const aiService = {
    smartScan: async (file: File) => {
        try {
            const imageBase64 = await fileToBase64(file);

            console.log("📸 File:", file.name, file.size);

            const res = await axios.post(API_URL, {
                imageBase64,
                lookupBarcode: true,
            });

            console.log("RAW AI RESPONSE:", res.data);

            return res.data;
        } catch (err: any) {
            console.error("AI ERROR:", err?.response ?? err);
            throw err;
        }
    },
};
