import { UserRole } from '@/types/auth.type';
import { ROLE_REDIRECT } from '@/constants/roleRedirect';

export const getRedirectByRole = (role: UserRole): string => {
    return ROLE_REDIRECT[role] ?? '/';
};
