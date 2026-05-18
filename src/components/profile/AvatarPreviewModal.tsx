import React, { useEffect } from "react"
import { X } from "lucide-react"

type AvatarPreviewModalProps = {
   open: boolean
   imageUrl?: string | null
   title?: string
   onClose: () => void
}

const AvatarPreviewModal: React.FC<AvatarPreviewModalProps> = ({
   open,
   imageUrl,
   title = "Ảnh đại diện",
   onClose,
}) => {
   useEffect(() => {
      if (!open) return

      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === "Escape") onClose()
      }

      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
   }, [open, onClose])

   if (!open || !imageUrl) return null

   return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4">
         <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
            aria-label="Đóng xem trước"
         />
         <div className="relative w-full max-w-[560px] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
               <div className="text-sm font-semibold text-slate-900">{title}</div>
               <button
                  type="button"
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
                  aria-label="Đóng xem trước"
               >
                  <X size={16} />
               </button>
            </div>
            <div className="flex items-center justify-center bg-slate-50 p-6">
               <img
                  src={imageUrl}
                  alt={title}
                  className="max-h-[70vh] w-auto rounded-2xl object-contain"
               />
            </div>
         </div>
      </div>
   )
}

export default AvatarPreviewModal
