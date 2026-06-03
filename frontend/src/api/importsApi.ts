import axiosInstance from './axiosInstance'

const importsApi = {
  uploadFile: (projectId: number, file: File, importType: 'tb' | 'je', overwriteMode: 'append' | 'replace', period: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('import_type', importType)
    formData.append('overwrite_mode', overwriteMode)
    formData.append('period', period)
    return axiosInstance.post(`/projects/${projectId}/imports/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  confirmColumnMapping: (projectId: number, batchId: number, columnMapping: Record<string, string>) =>
    axiosInstance.post(`/projects/${projectId}/imports/column_map/`, { batch_id: batchId, column_mapping: columnMapping }),

  validateImport: (projectId: number, batchId: number, columnMapping?: Record<string, string>) =>
    axiosInstance.post(`/projects/${projectId}/imports/validate/`, { batch_id: batchId, column_mapping: columnMapping }),

  commitImport: (projectId: number, batchId: number, setActive = true) =>
    axiosInstance.post(`/projects/${projectId}/imports/commit/`, { batch_id: batchId, set_active: setActive }),

  getBatches: (projectId: number) =>
    axiosInstance.get(`/projects/${projectId}/imports/batches/`),

  setActiveBatch: (projectId: number, batchId: number) =>
    axiosInstance.post(`/projects/${projectId}/imports/batches/${batchId}/set_active/`),

  deleteBatch: (projectId: number, batchId: number) =>
    axiosInstance.delete(`/projects/${projectId}/imports/batches/${batchId}/`),

  getErrorRows: (projectId: number, batchId: number) =>
    axiosInstance.get(`/projects/${projectId}/imports/batches/${batchId}/error_rows/`),

  fixErrorRow: (projectId: number, batchId: number, rowId: number, resolvedData: Record<string, any>) =>
    axiosInstance.post(`/projects/${projectId}/imports/batches/${batchId}/fix_error/`, { row_id: rowId, resolved_data: resolvedData }),

  getCurrentTB: (projectId: number) =>
    axiosInstance.get(`/projects/${projectId}/imports/unaudited-tb/current/`),

  getCurrentJE: (projectId: number) =>
    axiosInstance.get(`/projects/${projectId}/imports/unaudited-je/current/`),
}

export default importsApi
