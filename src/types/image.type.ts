export interface ImageFile {
    id: string;
    file: File;
    preview: string;
    hash?: string;
    source: "upload" | "camera";
}
