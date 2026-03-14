export interface User {
    userId: string
    fullName: string
    email: string
    phone: string
    roleName: string
    roleId: number
    status: number
    createdAt: string
    updatedAt: string
}

export interface CreateUserPayload {
    fullName: string
    email: string
    phone: string
    password: string
    roleId: number
}

export interface UpdateUserPayload {
    fullName: string
    email: string
    phone: string
    status: number
    roleId: number
}

export interface UpdateUserStatusPayload {
    status: number
}
