import axiosClient from "./axiosClient";
import {
    User,
    CreateUserPayload,
    UpdateUserPayload,
} from "@/types/user.type";

export const getUsers = () => axiosClient.get<User[]>("/api/Users");

export const getUserById = (id: string) =>
    axiosClient.get<User>(`/api/Users/${id}`);

export const createUser = (payload: CreateUserPayload) =>
    axiosClient.post<User>("/api/Users", payload);

export const updateUser = (id: string, payload: UpdateUserPayload) =>
    axiosClient.put<User>(`/api/Users/${id}`, payload);

export const deleteUser = (id: string) =>
    axiosClient.delete<boolean>(`/api/Users/${id}`);
