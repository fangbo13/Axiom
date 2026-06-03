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

export const fetchAccounts = createAsyncThunk(
  'ledger/fetchAccounts',
  async (projectId: number, { rejectWithValue }) => {
    try {
      const response = await ledgerApi.getAccounts(projectId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取科目失败')
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
      return rejectWithValue(error.response?.data?.detail || '获取分录失败')
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
      return rejectWithValue(error.response?.data?.detail || '上传失败')
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
