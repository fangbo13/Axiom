import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import importsApi from '@/api/importsApi'
import { PreviewData, ValidationResult, ImportBatch, ImportErrorRow } from '@/types'

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
}

export const uploadImportFile = createAsyncThunk(
  'imports/uploadImportFile',
  async (
    { projectId, file, importType, overwriteMode, period }: {
      projectId: number; file: File; importType: 'tb' | 'je'; overwriteMode: 'append' | 'replace'; period: string
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.uploadFile(projectId, file, importType, overwriteMode, period)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '上传失败')
    }
  }
)

export const confirmColumnMapping = createAsyncThunk(
  'imports/confirmColumnMapping',
  async (
    { projectId, batchId, columnMapping }: { projectId: number; batchId: number; columnMapping: Record<string, string> },
    { rejectWithValue }
  ) => {
    try {
      const response = await importsApi.confirmColumnMapping(projectId, batchId, columnMapping)
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
  async (projectId: number, { rejectWithValue }) => {
    try {
      const response = await importsApi.getBatches(projectId)
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

const importsSlice = createSlice({
  name: 'imports',
  initialState,
  reducers: {
    clearImportSession: (state) => {
      state.previewData = null
      state.validationResult = null
      state.errorRows = []
      state.error = null
    },
    clearError: (state) => {
      state.error = null
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
      .addCase(commitImport.fulfilled, (state) => {
        state.committing = false
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
  },
})

export const { clearImportSession, clearError } = importsSlice.actions
export default importsSlice.reducer
