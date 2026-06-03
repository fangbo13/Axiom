import axiosInstance from './axiosInstance'
import { Project, ProjectOverview } from '@/types'

export const projectApi = {
  list: () => axiosInstance.get<Project[]>('/projects/'),

  get: (id: number) => axiosInstance.get<Project>(`/projects/${id}/`),

  create: (data: Partial<Project>) => axiosInstance.post<Project>('/projects/', data),

  update: (id: number, data: Partial<Project>) =>
    axiosInstance.patch<Project>(`/projects/${id}/`, data),

  delete: (id: number) => axiosInstance.delete(`/projects/${id}/`),

  switch: (id: number) => axiosInstance.post<Project>(`/projects/${id}/switch/`),

  overview: (id: number) => axiosInstance.get<ProjectOverview>(`/projects/${id}/overview/`),
}
