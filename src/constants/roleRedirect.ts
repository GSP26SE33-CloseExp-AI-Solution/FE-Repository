import { UserRole } from '@/types/auth.model'

export const ROLE_REDIRECT: Record<UserRole, string> = {
    ADMIN: '/admin',
    SUPERMARKET: '/supermarket/dashboard',
    VENDOR: '/vendor',
    MARKETING: '/marketing',
    PACKAGE: '/package',
    '': '/',
}
