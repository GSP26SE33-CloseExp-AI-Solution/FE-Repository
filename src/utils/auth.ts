import { ILoginResponse } from '../types/auth.type';

const AUTH_KEY = 'closeexp_auth';

export const saveAuth = (data: ILoginResponse) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
};

export const getAuth = (): ILoginResponse | null => {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
};

export const clearAuth = () => {
    localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
    const raw = localStorage.getItem('closeexp_auth');
    if (!raw) return false;

    const auth = JSON.parse(raw);
    return !!auth.token;
};
