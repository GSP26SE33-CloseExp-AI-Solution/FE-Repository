export type ImageSource = "upload" | "camera";

export interface ImageFile {
    id: string;              // UUID / timestamp
    file?: File;             // có khi upload, có khi camera
    preview: string;         // luôn có (URL hoặc base64)
    hash?: string;           // để check trùng
    source: ImageSource;     // upload | camera
}
