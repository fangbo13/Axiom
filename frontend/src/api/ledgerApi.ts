import axiosInstance from './axiosInstance'
import { Account, LedgerEntry, UploadResult } from '@/types'

export const ledgerApi = {
  uploadFile: (projectId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return axiosInstance.post<UploadResult>(`/projects/${projectId}/ledger/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getAccounts: (projectId: number) =>
    axiosInstance.get<Account[]>(`/projects/${projectId}/ledger/accounts/`),

  getEntries: (projectId: number, params?: Record<string, unknown>) =>
    axiosInstance.get<{ results: LedgerEntry[]; count: number }>(`/projects/${projectId}/ledger/entries/`, { params }),
}
