import { useCallback } from "react";

const DEFAULT_SIZE = 256;
const HASH_SIZE = 8;

export const useImageHash = (duplicateThreshold = 10) => {

    /* ===== resize ảnh ===== */
    const resizeImage = useCallback((file: File): Promise<HTMLCanvasElement> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d")!;
                canvas.width = DEFAULT_SIZE;
                canvas.height = DEFAULT_SIZE;
                ctx.drawImage(img, 0, 0, DEFAULT_SIZE, DEFAULT_SIZE);
                URL.revokeObjectURL(img.src);
                img.src = "";
                resolve(canvas);
            };
        });
    }, []);

    /* ===== tạo hash ===== */
    const getImageHash = useCallback((src: string): Promise<string | null> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = src;

            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return resolve(null);

                    canvas.width = HASH_SIZE;
                    canvas.height = HASH_SIZE;
                    ctx.drawImage(img, 0, 0, HASH_SIZE, HASH_SIZE);

                    const { data } = ctx.getImageData(0, 0, HASH_SIZE, HASH_SIZE);
                    const gray: number[] = [];

                    for (let i = 0; i < data.length; i += 4) {
                        gray.push(
                            0.299 * data[i] +
                            0.587 * data[i + 1] +
                            0.114 * data[i + 2]
                        );
                    }

                    const avg = gray.reduce((a, b) => a + b) / gray.length;
                    const hash = gray.map(v => (v > avg ? "1" : "0")).join("");
                    img.src = "";
                    resolve(hash);
                } catch {
                    resolve(null);
                }
            };

            img.onerror = () => resolve(null);
        });
    }, []);

    /* ===== hash từ file ===== */
    const getHashFromFile = useCallback(async (file: File) => {
        const canvas = await resizeImage(file);
        return getImageHash(canvas.toDataURL("image/png"));
    }, [resizeImage, getImageHash]);

    /* ===== so sánh ===== */
    const hammingDistance = useCallback((a: string, b: string) => {
        let dist = 0;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) dist++;
        }
        return dist;
    }, []);

    /* ===== kiểm tra trùng lặp ===== */
    const isDuplicateHash = useCallback(
        (newHash: string, hashes: (string | undefined)[]) =>
            hashes.some(
                h => h && hammingDistance(newHash, h) <= duplicateThreshold
            ),
        [hammingDistance, duplicateThreshold]
    );

    return {
        getHashFromFile,
        isDuplicateHash,
    };
};
