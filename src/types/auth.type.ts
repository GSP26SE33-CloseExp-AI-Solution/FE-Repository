export interface ILoginRequest {
    email: string;
    password: string;
}

export interface ILoginResponse {
    token: string;
    role: 'ADMIN' | 'STAFF' | 'DELIVER' | 'VENDOR';
    userName: string;
}
export interface ILoginRequest {
    username: string;
    password: string;
}

export interface ILoginResponse {
    accessToken: string;
    refreshToken?: string;
    user: {
        id: string;
        username: string;
        role: string;
    };
}
