import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { projectApi } from '@/api/projectApi'
import { Project, ProjectOverview } from '@/types'

interface ProjectState {
  projects: Project[]
  activeProject: Project | null
  overview: ProjectOverview | null
  loading: boolean
  error: string | null
}

const initialState: ProjectState = {
  projects: [],
  activeProject: null,
  overview: null,
  loading: false,
  error: null,
}

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectApi.list()
      // DRF paginated response
      return Array.isArray(response.data) ? response.data : response.data.results || []
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取项目列表失败')
    }
  }
)

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (data: Partial<Project>, { rejectWithValue }) => {
    try {
      const response = await projectApi.create(data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '创建项目失败')
    }
  }
)

export const fetchOverview = createAsyncThunk(
  'projects/fetchOverview',
  async (projectId: number, { rejectWithValue }) => {
    try {
      const response = await projectApi.overview(projectId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取概览失败')
    }
  }
)

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setActiveProject: (state, action) => {
      state.activeProject = action.payload
      localStorage.setItem('activeProjectId', String(action.payload.id))
    },
    clearActiveProject: (state) => {
      state.activeProject = null
      state.overview = null
      localStorage.removeItem('activeProjectId')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.push(action.payload)
        state.activeProject = action.payload
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.overview = action.payload
      })
  },
})

export const { setActiveProject, clearActiveProject } = projectSlice.actions
export default projectSlice.reducer
