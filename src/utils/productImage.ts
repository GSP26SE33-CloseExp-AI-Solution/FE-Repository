export function resolveProductDisplayImageUrl(
    preSigned?: string | null,
    raw?: string | null,
): string {
    const resolved = preSigned?.trim() || raw?.trim() || ""
    return resolved
}

export function resolveProductImageFromDto(
    image?: { preSignedUrl?: string | null; imageUrl?: string | null } | null,
    fallbackRaw?: string | null,
): string {
    return resolveProductDisplayImageUrl(
        image?.preSignedUrl,
        image?.imageUrl ?? fallbackRaw,
    )
}
