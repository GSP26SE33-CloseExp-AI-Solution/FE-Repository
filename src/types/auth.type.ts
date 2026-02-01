export interface IUserFromApi {
  userId: string
  fullName: string
  email: string
  phone: string
  roleName: string
  roleId: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface IAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string // ISO date từ BE
  user: IUserFromApi
}

export interface IAuthResponse {
  success: boolean
  message: string
  data: IAuthTokens | null
  errors: string[] | null
}

export interface ILoginPayload {
  email: string
  password: string
}

export interface IRegisterPayload {
  fullName: string
  email: string
  phone: string
  password: string
}
