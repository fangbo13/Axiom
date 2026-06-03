import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { ledgerApi } from '@/api/ledgerApi'
import { Account, LedgerEntry, UploadResult } from '@/types'

interface LedgerState {
  accounts: Account[]
  entries: LedgerEntry[]
  uploadResult: UploadResult | null
  loading: boolean
  uploading: boolean
  error: string | null
}

const initialState: LedgerState = {
  accounts: [],
  entries: [],
  uploadResult: null,
  loading: false,
  uploading: false,
  error: null,
}

function extractErrorMessage(error: any): string {
  const data = error.response?.data
  if (!data) return '网络请求失败'
  if (data.details) {
    if (typeof data.details === 'string') return data.details
    if (data.details.detail) return data.details.detail
    const firstKey = Object.keys(data.details)[0]
    if (firstKey) {
      const val = data.details[firstKey]
      if (Array.isArray(val)) return `${firstKey}: ${val[0]}`
      if (typeof val === 'string') return `${firstKey}: ${val}`
    }
  }
  if (data.detail) return data.detail
  if (data.message && data.message !== '请求处理失败') return data.message
  return '操作失败，请检查输入内容'
}

export const fetchAccounts = createAsyncThunk(
  'ledger/fetchAccounts',
  async (projectId: number, { rejectWithValue }) => {
    try {
      const response = await ledgerApi.getAccounts(projectId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error))
    }
  }
)

export const fetchEntries = createAsyncThunk(
  'ledger/fetchEntries',
  async ({ projectId, params }: { projectId: number; params?: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const response = await ledgerApi.getEntries(projectId, params)
      return response.data.results
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error))
    }
  }
)

export const uploadLedgerFile = createAsyncThunk(
  'ledger/uploadLedgerFile',
  async ({ projectId, file }: { projectId: number; file: File }, { rejectWithValue }) => {
    try {
      const response = await ledgerApi.uploadFile(projectId, file)
      return response.data
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error))
    }
  }
)

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    clearUploadResult: (state) => {
      state.uploadResult = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false
        state.accounts = action.payload
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchEntries.fulfilled, (state, action) => {
        state.entries = action.payload
      })
      .addCase(uploadLedgerFile.pending, (state) => {
        state.uploading = true
        state.error = null
      })
      .addCase(uploadLedgerFile.fulfilled, (state, action) => {
        state.uploading = false
        state.uploadResult = action.payload
      })
      .addCase(uploadLedgerFile.rejected, (state, action) => {
        state.uploading = false
        state.error = action.payload as string
      })
  },
})

export const { clearUploadResult } = ledgerSlice.actions
export default ledgerSlice.reducer
