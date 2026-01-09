import { UserRole } from '@/types/auth.type';

export interface MockUser {
    id: number;
    email: string;
    password: string;
    role: UserRole;
}

export const mockUsers: MockUser[] = [
    /* ===== ADMIN ===== */
    {
        id: 1,
        email: 'admin@test.com',
        password: '123456',
        role: 'ADMIN',
    },

    /* ===== VENDOR ===== */
    {
        id: 2,
        email: 'vendor@test.com',
        password: '123456',
        role: 'VENDOR',
    },

    /* ===== SUPERMARKET STAFF ===== */
    {
        id: 3,
        email: 'supermarket@test.com',
        password: '123456',
        role: 'SUPERMARKET_STAFF',
    },

    /* ===== PACKAGE STAFF ===== */
    {
        id: 4,
        email: 'package@test.com',
        password: '123456',
        role: 'PACKAGE_STAFF',
    },

    /* ===== MARKETING STAFF ===== */
    {
        id: 5,
        email: 'marketing@test.com',
        password: '123456',
        role: 'MARKETING_STAFF',
    },
];
