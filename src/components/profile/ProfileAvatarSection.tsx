import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react"
import { Eye, Loader2, type LucideIcon } from "lucide-react"

import AvatarPreviewModal from "@/components/profile/AvatarPreviewModal"
import { useAuthContext } from "@/contexts/AuthContext"
import {
    deleteMyImageApi,
    getMyPrimaryImageApi,
    uploadMyAvatarApi,
    type UserImage,
} from "@/services/user.service"
import { showError, showSuccess } from "@/utils/toast"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const getAvatarUrl = (image: UserImage | null) =>
    image?.preSignedUrl || image?.imageUrl || null

export type ProfileAvatarSectionProps = {
    identityIcon: LucideIcon
    fallbackWrapClassName?: string
    fallbackIconClassName?: string
    uploadButtonClassName?: string
    deleteButtonClassName?: string
    viewButtonClassName?: string
    onAvatarChange?: (image: UserImage | null) => void
}

const ProfileAvatarSection = ({
    identityIcon: IdentityIcon,
    fallbackWrapClassName = "flex h-20 w-20 items-center justify-center rounded-full bg-slate-100",
    fallbackIconClassName = "h-10 w-10 text-slate-600",
    uploadButtonClassName = "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
    deleteButtonClassName = "inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60",
    viewButtonClassName = "inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
    onAvatarChange,
}: ProfileAvatarSectionProps) => {
    const { refreshPrimaryAvatar } = useAuthContext()
    const [avatarImage, setAvatarImage] = useState<UserImage | null>(null)
    const [loadingAvatar, setLoadingAvatar] = useState(true)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [deletingAvatar, setDeletingAvatar] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const avatarUrl = getAvatarUrl(avatarImage)
    const busy = uploadingAvatar || deletingAvatar

    const applyAvatar = useCallback(
        (image: UserImage | null) => {
            setAvatarImage(image)
            onAvatarChange?.(image)
        },
        [onAvatarChange]
    )

    const loadPrimaryAvatar = useCallback(async () => {
        try {
            setLoadingAvatar(true)
            const image = await getMyPrimaryImageApi()
            applyAvatar(image)
            void refreshPrimaryAvatar()
        } catch {
            applyAvatar(null)
            void refreshPrimaryAvatar()
        } finally {
            setLoadingAvatar(false)
        }
    }, [applyAvatar, refreshPrimaryAvatar])

    useEffect(() => {
        void loadPrimaryAvatar()
    }, [loadPrimaryAvatar])

    const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            showError("Chỉ chấp nhận file ảnh: JPEG, PNG, GIF, WebP")
            return
        }

        if (file.size > MAX_IMAGE_SIZE) {
            showError("File ảnh không được vượt quá 5MB")
            return
        }

        try {
            setUploadingAvatar(true)
            const uploaded = await uploadMyAvatarApi(file, "avatar", true)
            applyAvatar(uploaded)
            showSuccess("Cập nhật ảnh đại diện thành công")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Không thể tải ảnh lên"
            showError(message)
        } finally {
            setUploadingAvatar(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleDeleteAvatar = async () => {
        if (!avatarImage?.imageId) return

        const confirmed = window.confirm("Bạn có chắc muốn xóa ảnh đại diện này không?")
        if (!confirmed) return

        try {
            setDeletingAvatar(true)
            await deleteMyImageApi(avatarImage.imageId)
            applyAvatar(null)
            void refreshPrimaryAvatar()
            showSuccess("Đã xóa ảnh đại diện")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Không thể xóa ảnh"
            showError(message)
        } finally {
            setDeletingAvatar(false)
        }
    }

    const openPreview = () => {
        if (avatarUrl) setPreviewOpen(true)
    }

    return (
        <>
            <AvatarDisplay
                loadingAvatar={loadingAvatar}
                avatarUrl={avatarUrl}
                busy={busy}
                IdentityIcon={IdentityIcon}
                fallbackWrapClassName={fallbackWrapClassName}
                fallbackIconClassName={fallbackIconClassName}
                onOpenPreview={openPreview}
            />

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
            />

            <p className="mt-2 text-center text-[11px] text-slate-400">
                {avatarUrl ? "Nhấn vào ảnh để xem kích thước lớn" : "Chưa có ảnh đại diện"}
            </p>

            <AvatarActions
                avatarUrl={avatarUrl}
                busy={busy}
                uploadingAvatar={uploadingAvatar}
                deletingAvatar={deletingAvatar}
                uploadButtonClassName={uploadButtonClassName}
                deleteButtonClassName={deleteButtonClassName}
                viewButtonClassName={viewButtonClassName}
                onUpload={() => fileInputRef.current?.click()}
                onView={openPreview}
                onDelete={() => void handleDeleteAvatar()}
            />

            <AvatarPreviewModal
                open={previewOpen}
                imageUrl={avatarUrl}
                title="Ảnh đại diện"
                onClose={() => setPreviewOpen(false)}
            />
        </>
    )
}

type AvatarDisplayProps = {
    loadingAvatar: boolean
    avatarUrl: string | null
    busy: boolean
    IdentityIcon: LucideIcon
    fallbackWrapClassName: string
    fallbackIconClassName: string
    onOpenPreview: () => void
}

function AvatarDisplay({
    loadingAvatar,
    avatarUrl,
    busy,
    IdentityIcon,
    fallbackWrapClassName,
    fallbackIconClassName,
    onOpenPreview,
}: AvatarDisplayProps) {
    return (
        <div className="relative flex justify-center">
            <button
                type="button"
                onClick={onOpenPreview}
                disabled={!avatarUrl || busy}
                className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full transition ${
                    avatarUrl
                        ? "cursor-zoom-in ring-offset-2 hover:ring-2 hover:ring-slate-300"
                        : "cursor-default"
                }`}
                aria-label={avatarUrl ? "Xem ảnh đại diện" : "Ảnh đại diện"}
            >
                {loadingAvatar ? (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" />
                ) : (
                    <AvatarFallback
                        IdentityIcon={IdentityIcon}
                        fallbackWrapClassName={fallbackWrapClassName}
                        fallbackIconClassName={fallbackIconClassName}
                    />
                )}

                {busy && !loadingAvatar ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
                    </div>
                ) : null}
            </button>
        </div>
    )
}

function AvatarFallback({
    IdentityIcon,
    fallbackWrapClassName,
    fallbackIconClassName,
}: Pick<AvatarDisplayProps, "IdentityIcon" | "fallbackWrapClassName" | "fallbackIconClassName">) {
    return (
        <div className={fallbackWrapClassName}>
            <IdentityIcon className={fallbackIconClassName} />
        </div>
    )
}

type AvatarActionsProps = {
    avatarUrl: string | null
    busy: boolean
    uploadingAvatar: boolean
    deletingAvatar: boolean
    uploadButtonClassName: string
    deleteButtonClassName: string
    viewButtonClassName: string
    onUpload: () => void
    onView: () => void
    onDelete: () => void
}

function AvatarActions({
    avatarUrl,
    busy,
    uploadingAvatar,
    deletingAvatar,
    uploadButtonClassName,
    deleteButtonClassName,
    viewButtonClassName,
    onUpload,
    onView,
    onDelete,
}: AvatarActionsProps) {
    return (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={onUpload} disabled={busy} className={uploadButtonClassName}>
                {uploadingAvatar ? "Đang tải..." : avatarUrl ? "Thay đổi ảnh" : "Tải ảnh lên"}
            </button>

            {avatarUrl ? (
                <button type="button" onClick={onView} disabled={busy} className={viewButtonClassName}>
                    <Eye className="h-3.5 w-3.5" />
                    Xem ảnh
                </button>
            ) : null}

            {avatarUrl ? (
                <button type="button" onClick={onDelete} disabled={busy} className={deleteButtonClassName}>
                    {deletingAvatar ? "Đang xóa..." : "Xóa ảnh"}
                </button>
            ) : null}
        </div>
    )
}

export default ProfileAvatarSection
