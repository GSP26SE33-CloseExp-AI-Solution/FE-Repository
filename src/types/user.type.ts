export interface User {
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    roleName: string;
    roleId: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserPayload {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    roleId: number;
}

export interface UpdateUserPayload {
    fullName: string;
    email: string;
    phone: string;
    status: string;
    roleId: number;
}
