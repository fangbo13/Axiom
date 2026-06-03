import axios from 'axios'
import { store } from '@/store'
import { logout, setCredentials } from '@/features/auth/authSlice'

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = store.getState().auth.refreshToken

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh/', {
            refresh: refreshToken,
          })
          const newAccessToken = res.data.access
          store.dispatch(
            setCredentials({
              accessToken: newAccessToken,
              refreshToken,
              user: store.getState().auth.user,
            })
          )
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          store.dispatch(logout())
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        store.dispatch(logout())
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
