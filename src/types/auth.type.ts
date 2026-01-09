export type UserRole = 'ADMIN' | 'VENDOR' | 'SUPERMARKET_STAFF' | 'PACKAGE_STAFF' | 'MARKETING_STAFF' | 'GUEST';

export interface IUser {
    id: number;
    email: string;
    role: UserRole;
}

export interface ILoginResponse {
    token: string;
    user: IUser;
}
