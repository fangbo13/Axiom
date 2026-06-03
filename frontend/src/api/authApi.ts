import axiosInstance from './axiosInstance'
import { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm: string
  firm_name?: string
  phone?: string
}

export interface AuthResponse {
  refresh: string
  access: string
  user: User
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    axiosInstance.post<AuthResponse>('/auth/login/', credentials),

  register: (data: RegisterData) =>
    axiosInstance.post<AuthResponse>('/auth/register/', data),

  refresh: (refreshToken: string) =>
    axiosInstance.post<{ access: string }>('/auth/refresh/', { refresh: refreshToken }),

  me: () => axiosInstance.get<User>('/auth/me/'),

  changePassword: (data: { old_password: string; new_password: string }) =>
    axiosInstance.post('/auth/change-password/', data),
}
