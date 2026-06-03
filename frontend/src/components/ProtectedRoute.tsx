import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { RootState, AppDispatch } from '@/store'
import { fetchCurrentUser } from '@/features/auth/authSlice'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser())
    }
    if (!isAuthenticated && !loading) {
      navigate('/login')
    }
  }, [isAuthenticated, user, loading, dispatch, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="验证中..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
