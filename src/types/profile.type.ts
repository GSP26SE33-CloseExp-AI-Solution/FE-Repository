import type { LucideIcon } from "lucide-react"

export type ProfileRoleConfig = {
    pageTitle: string
    pageDescription: string
    editCardTitle: string
    editCardDescription: string
    saveButtonClassName: string
    securityCardClassName: string
    securityIconWrapClassName: string
    securityIconClassName: string
    securityButtonClassName: string
    securityNoticeClassName: string
    identityIcon: LucideIcon
    identityIconWrapClassName: string
    identityIconClassName: string
}

export type ProfileFormState = {
    fullName: string
    phone: string
}
