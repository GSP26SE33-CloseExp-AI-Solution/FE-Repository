import api from './api';
import { ILoginRequest, ILoginResponse } from '@/types/auth.type';

export const login = async (
    payload: ILoginRequest
): Promise<ILoginResponse> => {
    const response = await api.post<ILoginResponse>(
        '/auth/login',
        payload
    );
    return response.data;
};
