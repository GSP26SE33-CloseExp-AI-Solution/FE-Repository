export const extractProductFromImages = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append("images", f));

    const res = await fetch("/AI/extract", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("AI extract failed");
    return res.json();
};
