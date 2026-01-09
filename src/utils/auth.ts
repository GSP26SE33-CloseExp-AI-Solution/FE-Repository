import { ILoginResponse } from '@/types/auth.type';

const AUTH_KEY = 'closeexp_auth';

export const saveAuth = (data: ILoginResponse) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
};

export const getAuth = (): ILoginResponse | null => {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        clearAuth();
        return null;
    }
};

export const clearAuth = () => {
    localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
    const auth = getAuth();
    return Boolean(auth?.token);
};
