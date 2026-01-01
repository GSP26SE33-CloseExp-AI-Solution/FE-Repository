export interface ILoginRequest {
    email: string;
    password: string;
}

export interface ILoginResponse {
    token: string;
    role: 'ADMIN' | 'STAFF' | 'DELIVER' | 'VENDOR';
    userName: string;
}
