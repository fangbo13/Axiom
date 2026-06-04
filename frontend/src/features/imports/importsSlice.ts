import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import importsApi from '@/api/importsApi'
import { PreviewData, ValidationResult, ImportBatch, ImportErrorRow, MappingTemplate } from '@/types'

interface ImportsState {
  previewData: PreviewData | null
  validationResult: ValidationResult | null
  batches: ImportBatch[]
  activeBatchId: number | null
  errorRows: ImportErrorRow[]
  loading: boolean
  uploading: boolean
  validating: boolean
  committing: boolean
  error: string | null
  // Dashboard
  dashboardBatches: ImportBatch[]
  dashboardFilters: { period?: string; import_type?: 'tb' | 'je' }
  batchDetail: {
    batch: ImportBatch
    previewRows: Record<string, any>[]
    columnMapping: Record<string, string>
  } | null
  // Templates
  mappingTemplates: MappingTemplate[]
  // Header detection
  headerDetection: {
    detectedRow: number
    confidence: number
    isMultiline: boolean
  } | null
  // Async job
  asyncJob: { jobId: string; status: string; progress: number } | null
}

const initialState: ImportsState = {
  previewData: null,
  validationResult: null,
  batches: [],
  activeBatchId: null,
  errorRows: [],
  loading: false,
  uploading: false,
  validating: false,
  committing: false,
  error: null,
  dashboardBatches: [],
  dashboardFilters: {},
  batchDetail: null,
  mappingTemplates: [],
  headerDetection: null,
  asyncJob: null,
}

export const uploadImportFile = createAsyncThunk(
  'imports/uploadImportFile',
  async (
    { projectId, file, importType, overwriteMode, period, headerRowHint }: {
      projectId: number; file: File; importType: 'tb' | 'je'; overwriteMode: 'append' | 'replace'; period: string; headerRowHint?: number | null
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.uploadFile(projectId, file, importType, overwriteMode, period, headerRowHint)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '上传失败')
    }
  }
)

export const confirmColumnMapping = createAsyncThunk(
  'imports/confirmColumnMapping',
  async (
    { projectId, batchId, columnMapping, saveTemplate, templateName }: {
      projectId: number; batchId: number; columnMapping: Record<string, string>; saveTemplate?: boolean; templateName?: string
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.confirmColumnMapping(projectId, batchId, columnMapping, saveTemplate, templateName)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '列映射确认失败')
    }
  }
)

export const validateImport = createAsyncThunk(
  'imports/validateImport',
  async (
    { projectId, batchId, columnMapping }: { projectId: number; batchId: number; columnMapping?: Record<string, string> },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.validateImport(projectId, batchId, columnMapping)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '校验失败')
    }
  }
)

export const commitImport = createAsyncThunk(
  'imports/commitImport',
  async (
    { projectId, batchId, setActive }: { projectId: number; batchId: number; setActive?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.commitImport(projectId, batchId, setActive)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '提交失败')
    }
  }
)

export const fetchBatches = createAsyncThunk(
  'imports/fetchBatches',
  async ({ projectId, params }: { projectId: number; params?: { status?: string; period?: string; import_type?: string } }, { rejectWithValue }) => {
    try {
      const response = await importsApi.getBatches(projectId, params)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取批次失败')
    }
  }
)

export const setActiveBatch = createAsyncThunk(
  'imports/setActiveBatch',
  async (
    { projectId, batchId }: { projectId: number; batchId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.setActiveBatch(projectId, batchId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '激活失败')
    }
  }
)

export const deleteBatch = createAsyncThunk(
  'imports/deleteBatch',
  async (
    { projectId, batchId }: { projectId: number; batchId: number },
    { rejectWithValue }
  ) => {
    try {
      await importsApi.deleteBatch(projectId, batchId)
      return batchId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '删除失败')
    }
  }
)

export const fetchErrorRows = createAsyncThunk(
  'imports/fetchErrorRows',
  async (
    { projectId, batchId }: { projectId: number; batchId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.getErrorRows(projectId, batchId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取错误行失败')
    }
  }
)

export const fixErrorRow = createAsyncThunk(
  'imports/fixErrorRow',
  async (
    { projectId, batchId, rowId, resolvedData }: {
      projectId: number; batchId: number; rowId: number; resolvedData: Record<string, any>
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.fixErrorRow(projectId, batchId, rowId, resolvedData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '修正失败')
    }
  }
)

// Dashboard thunks
export const fetchDashboardBatches = createAsyncThunk(
  'imports/fetchDashboardBatches',
  async ({ projectId, params }: { projectId: number; params?: { period?: string; import_type?: 'tb' | 'je' } }, { rejectWithValue }) => {
    try {
      const response = await importsApi.getDashboardBatches(projectId, params)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取仪表盘数据失败')
    }
  }
)

export const fetchBatchDetail = createAsyncThunk(
  'imports/fetchBatchDetail',
  async ({ projectId, batchId }: { projectId: number; batchId: number }, { rejectWithValue }) => {
    try {
      const response = await importsApi.getBatchDetail(projectId, batchId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取批次详情失败')
    }
  }
)

export const remapBatch = createAsyncThunk(
  'imports/remapBatch',
  async ({ projectId, batchId }: { projectId: number; batchId: number }, { rejectWithValue }) => {
    try {
      const response = await importsApi.remapBatch(projectId, batchId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '重新映射失败')
    }
  }
)

export const deleteBatchFromDashboard = createAsyncThunk(
  'imports/deleteBatchFromDashboard',
  async ({ projectId, batchId }: { projectId: number; batchId: number }, { rejectWithValue }) => {
    try {
      await importsApi.deleteBatchFromDashboard(projectId, batchId)
      return batchId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '删除失败')
    }
  }
)

// Template thunks
export const fetchMappingTemplates = createAsyncThunk(
  'imports/fetchMappingTemplates',
  async (projectId: number, { rejectWithValue }) => {
    try {
      const response = await importsApi.getMappingTemplates(projectId)
      return response.data.results || response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取模板失败')
    }
  }
)

export const saveMappingTemplate = createAsyncThunk(
  'imports/saveMappingTemplate',
  async ({ projectId, data }: { projectId: number; data: Record<string, any> }, { rejectWithValue }) => {
    try {
      const response = await importsApi.saveMappingTemplate(projectId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '保存模板失败')
    }
  }
)

export const matchMappingTemplate = createAsyncThunk(
  'imports/matchMappingTemplate',
  async (
    { projectId, headerSignature, importType }: { projectId: number; headerSignature: Record<string, any>; importType: 'tb' | 'je' },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.matchMappingTemplate(projectId, headerSignature, importType)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '匹配模板失败')
    }
  }
)

export const pollAsyncJob = createAsyncThunk(
  'imports/pollAsyncJob',
  async ({ projectId, jobId }: { projectId: number; jobId: string }, { rejectWithValue }) => {
    try {
      const response = await importsApi.getAsyncJobStatus(projectId, jobId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取任务状态失败')
    }
  }
)

const importsSlice = createSlice({
  name: 'imports',
  initialState,
  reducers: {
    clearImportSession: (state) => {
      state.previewData = null
      state.validationResult = null
      state.errorRows = []
      state.error = null
      state.asyncJob = null
    },
    clearError: (state) => {
      state.error = null
    },
    setDashboardFilters: (state, action) => {
      state.dashboardFilters = action.payload
    },
    clearBatchDetail: (state) => {
      state.batchDetail = null
    },
    clearAsyncJob: (state) => {
      state.asyncJob = null
    },
    setHeaderDetection: (state, action) => {
      state.headerDetection = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadImportFile.pending, (state) => {
        state.uploading = true
        state.error = null
      })
      .addCase(uploadImportFile.fulfilled, (state, action) => {
        state.uploading = false
        state.previewData = action.payload
        state.headerDetection = {
          detectedRow: action.payload.detected_header_row ?? 0,
          confidence: action.payload.header_confidence ?? 0,
          isMultiline: action.payload.is_multiline_header ?? false,
        }
      })
      .addCase(uploadImportFile.rejected, (state, action) => {
        state.uploading = false
        state.error = action.payload as string
      })
      .addCase(confirmColumnMapping.pending, (state) => {
        state.loading = true
      })
      .addCase(confirmColumnMapping.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(confirmColumnMapping.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(validateImport.pending, (state) => {
        state.validating = true
        state.error = null
      })
      .addCase(validateImport.fulfilled, (state, action) => {
        state.validating = false
        state.validationResult = action.payload
      })
      .addCase(validateImport.rejected, (state, action) => {
        state.validating = false
        state.error = action.payload as string
      })
      .addCase(commitImport.pending, (state) => {
        state.committing = true
        state.error = null
      })
      .addCase(commitImport.fulfilled, (state, action) => {
        state.committing = false
        if (action.payload.job_id) {
          state.asyncJob = { jobId: action.payload.job_id, status: action.payload.status, progress: 0 }
        }
      })
      .addCase(commitImport.rejected, (state, action) => {
        state.committing = false
        state.error = action.payload as string
      })
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.loading = false
        state.batches = action.payload
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchErrorRows.fulfilled, (state, action) => {
        state.errorRows = action.payload
      })
      // Dashboard
      .addCase(fetchDashboardBatches.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchDashboardBatches.fulfilled, (state, action) => {
        state.loading = false
        state.dashboardBatches = action.payload
      })
      .addCase(fetchDashboardBatches.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchBatchDetail.fulfilled, (state, action) => {
        state.batchDetail = action.payload
      })
      .addCase(remapBatch.fulfilled, (state, action) => {
        state.previewData = { batch_id: action.payload.batch_id } as PreviewData
      })
      .addCase(deleteBatchFromDashboard.fulfilled, (state, action) => {
        state.dashboardBatches = state.dashboardBatches
          .map((group: any) => ({
            ...group,
            batches: group.batches.filter((b: ImportBatch) => b.id !== action.payload),
          }))
          .filter((group: any) => group.batches.length > 0)
      })
      // Templates
      .addCase(fetchMappingTemplates.fulfilled, (state, action) => {
        state.mappingTemplates = action.payload
      })
      .addCase(saveMappingTemplate.fulfilled, (state, action) => {
        state.mappingTemplates.push(action.payload)
      })
      // Async job
      .addCase(pollAsyncJob.fulfilled, (state, action) => {
        if (state.asyncJob) {
          state.asyncJob.status = action.payload.status
          state.asyncJob.progress = action.payload.progress ?? 0
        }
      })
  },
})

export const {
  clearImportSession,
  clearError,
  setDashboardFilters,
  clearBatchDetail,
  clearAsyncJob,
  setHeaderDetection,
} = importsSlice.actions
export default importsSlice.reducer
