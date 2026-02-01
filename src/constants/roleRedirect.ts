import { UserRole } from '@/types/auth.model'

export const ROLE_REDIRECT: Record<UserRole, string> = {
    ADMIN: '/admin/dashboard',
    SUPERMARKET: '/supermarket/products',
    VENDOR: '/vendor',
    PACKAGE: '/package/orders',
    MARKETING: '/marketing/promotions',
    '': '/',
}
