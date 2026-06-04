import axiosInstance from './axiosInstance'

const importsApi = {
  uploadFile: (projectId: number, file: File, importType: 'tb' | 'je', overwriteMode: 'append' | 'replace', period: string, headerRowHint?: number | null) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('import_type', importType)
    formData.append('overwrite_mode', overwriteMode)
    formData.append('period', period)
    if (headerRowHint !== undefined && headerRowHint !== null) {
      formData.append('header_row_hint', String(headerRowHint))
    }
    return axiosInstance.post(`/projects/${projectId}/imports/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  previewWithHeaderRow: (projectId: number, batchId: number, headerRow: number, columnMapping: Record<string, string>) =>
    axiosInstance.post(`/projects/${projectId}/imports/preview/`, { batch_id: batchId, header_row: headerRow, column_mapping: columnMapping }),

  confirmColumnMapping: (projectId: number, batchId: number, columnMapping: Record<string, string>, saveTemplate?: boolean, templateName?: string) =>
    axiosInstance.post(`/projects/${projectId}/imports/column_map/`, {
      batch_id: batchId,
      column_mapping: columnMapping,
      save_template: saveTemplate,
      template_name: templateName,
    }),

  validateImport: (projectId: number, batchId: number, columnMapping?: Record<string, string>) =>
    axiosInstance.post(`/projects/${projectId}/imports/validate/`, { batch_id: batchId, column_mapping: columnMapping }),

  commitImport: (projectId: number, batchId: number, setActive = true) =>
    axiosInstance.post(`/projects/${projectId}/imports/commit/`, { batch_id: batchId, set_active: setActive }),

  getBatches: (projectId: number, params?: { status?: string; period?: string; import_type?: string }) =>
    axiosInstance.get(`/projects/${projectId}/imports/batches/`, { params }),

  setActiveBatch: (projectId: number, batchId: number) =>
    axiosInstance.post(`/projects/${projectId}/imports/batches/${batchId}/set_active/`),

  deleteBatch: (projectId: number, batchId: number) =>
    axiosInstance.delete(`/projects/${projectId}/imports/batches/${batchId}/`),

  getErrorRows: (projectId: number, batchId: number, formatParam?: string) =>
    axiosInstance.get(`/projects/${projectId}/imports/batches/${batchId}/error_rows/`, { params: formatParam ? { format: formatParam } : undefined }),

  fixErrorRow: (projectId: number, batchId: number, rowId: number, resolvedData: Record<string, any>) =>
    axiosInstance.post(`/projects/${projectId}/imports/batches/${batchId}/fix_error/`, { row_id: rowId, resolved_data: resolvedData }),

  getCurrentTB: (projectId: number) =>
    axiosInstance.get(`/projects/${projectId}/imports/unaudited-tb/current/`),

  getCurrentJE: (projectId: number) =>
    axiosInstance.get(`/projects/${projectId}/imports/unaudited-je/current/`),

  // Dashboard
  getDashboardBatches: (projectId: number, params?: { period?: string; import_type?: string }) =>
    axiosInstance.get(`/projects/${projectId}/imports/dashboard/`, { params }),

  getBatchDetail: (projectId: number, batchId: number) =>
    axiosInstance.get(`/projects/${projectId}/imports/dashboard/${batchId}/`),

  downloadOriginalFile: (projectId: number, batchId: number) =>
    axiosInstance.get(`/projects/${projectId}/imports/dashboard/${batchId}/download/`, { responseType: 'blob' }),

  remapBatch: (projectId: number, batchId: number) =>
    axiosInstance.post(`/projects/${projectId}/imports/dashboard/${batchId}/remap/`),

  deleteBatchFromDashboard: (projectId: number, batchId: number) =>
    axiosInstance.delete(`/projects/${projectId}/imports/dashboard/${batchId}/`),

  // Templates
  getMappingTemplates: (projectId: number) =>
    axiosInstance.get(`/projects/${projectId}/imports/templates/`),

  saveMappingTemplate: (projectId: number, data: Record<string, any>) =>
    axiosInstance.post(`/projects/${projectId}/imports/templates/`, data),

  matchMappingTemplate: (projectId: number, headerSignature: Record<string, any>, importType: 'tb' | 'je') =>
    axiosInstance.post(`/projects/${projectId}/imports/templates/match/`, { header_signature: headerSignature, import_type: importType }),

  deleteMappingTemplate: (projectId: number, templateId: number) =>
    axiosInstance.delete(`/projects/${projectId}/imports/templates/${templateId}/`),

  // Logs
  getImportLogs: (projectId: number, params?: { action?: string }) =>
    axiosInstance.get(`/projects/${projectId}/imports/logs/`, { params }),

  // Export errors
  exportErrorRows: (projectId: number, batchId: number) =>
    axiosInstance.post(`/projects/${projectId}/imports/export_errors/`, { batch_id: batchId }, { responseType: 'blob' }),

  // Async job status
  getAsyncJobStatus: (projectId: number, jobId: string) =>
    axiosInstance.get(`/projects/${projectId}/imports/job_status/`, { params: { job_id: jobId } }),
}

export default importsApi
