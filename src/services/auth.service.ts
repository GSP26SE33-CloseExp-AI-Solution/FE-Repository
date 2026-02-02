import axiosClient from '@/utils/axiosClient'
import { ILoginPayload, IAuthTokens } from '@/types/auth.api.type'
import { AuthSession } from '@/types/auth.model'
import { mapAuthSession } from '../mappers/auth.mapper'

export const loginApi = async (payload: ILoginPayload): Promise<AuthSession> => {
    const res = await axiosClient.post<IAuthTokens>('/api/Auth/login', payload)
    return mapAuthSession(res.data)
}

export const logoutApi = () => {
    // hehe
}