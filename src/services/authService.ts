import { ILoginRequest, ILoginResponse } from '../types/auth.type';

/**
 * Mock API login
 * Sau này thay bằng axios gọi BE
 */
export const login = async (
    payload: ILoginRequest
): Promise<ILoginResponse> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (
                payload.email === 'admin@gmail.com' &&
                payload.password === '123456'
            ) {
                resolve({
                    token: 'mock-access-token',
                    role: 'ADMIN',
                    userName: 'Admin System',
                });
            } else {
                reject(new Error('Email hoặc mật khẩu không đúng'));
            }
        }, 800);
    });
};
