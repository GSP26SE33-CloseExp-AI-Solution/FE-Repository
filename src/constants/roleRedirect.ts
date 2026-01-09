import { UserRole } from '@/types/auth.type';

export const ROLE_REDIRECT: Record<UserRole, string> = {
    ADMIN: '/admin/dashboard',
    VENDOR: '/vendor',
    SUPERMARKET_STAFF: '/supermarket/products',
    PACKAGE_STAFF: '/package/orders',
    MARKETING_STAFF: '/marketing/promotions',
    GUEST: '/',
};
