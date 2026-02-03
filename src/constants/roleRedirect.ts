import { UserRole } from '@/types/auth.model'

export const ROLE_REDIRECT: Record<UserRole, string> = {
    ADMIN: '/admin/dashboard',
    SUPERMARKET: '/supermarket/dashboard',
    VENDOR: '/vendor/dashboard',
    MARKETING: '/marketing/dashboard',
    PACKAGE: '/package/dashboard',
    '': '/'
}
