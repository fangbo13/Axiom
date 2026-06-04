import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import AppLayout from '@/components/Layout/AppLayout'
import ProjectLayout from '@/components/Layout/ProjectLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'

const LoginPage = lazy(() => import('@/modules/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/modules/auth/RegisterPage'))
const ProjectListPage = lazy(() => import('@/modules/projects/ProjectListPage'))
const WorkpaperOverviewPage = lazy(() => import('@/modules/overview/WorkpaperOverviewPage'))
const ImportPage = lazy(() => import('@/modules/imports/ImportPage'))
const VersionManagementPage = lazy(() => import('@/modules/imports/VersionManagementPage'))
const ImportDashboardPage = lazy(() => import('@/modules/imports/ImportDashboardPage'))
const ChartOfAccountsPage = lazy(() => import('@/modules/ledger/ChartOfAccountsPage'))
const A300ChecksPage = lazy(() => import('@/modules/a300/A300ChecksPage'))
const AdminDashboard = lazy(() => import('@/modules/admin/AdminDashboard'))
const NotFoundPage = lazy(() => import('@/modules/errors/NotFoundPage'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Spin size="large" tip="加载中..." />
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: 'login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: '',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <ProjectListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'projects/:projectId',
        element: (
          <ProtectedRoute>
            <ErrorBoundary>
              <ProjectLayout />
            </ErrorBoundary>
          </ProtectedRoute>
        ),
        children: [
          {
            path: '',
            element: <Navigate to="overview" replace />,
          },
          {
            path: 'overview',
            element: (
              <Suspense fallback={<PageLoader />}>
                <WorkpaperOverviewPage />
              </Suspense>
            ),
          },
          {
            path: 'ledger/import',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ImportPage />
              </Suspense>
            ),
          },
          {
            path: 'ledger/versions',
            element: (
              <Suspense fallback={<PageLoader />}>
                <VersionManagementPage />
              </Suspense>
            ),
          },
          {
            path: 'ledger/dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ImportDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'ledger/accounts',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ChartOfAccountsPage />
              </Suspense>
            ),
          },
          {
            path: 'a300',
            element: (
              <Suspense fallback={<PageLoader />}>
                <A300ChecksPage />
              </Suspense>
            ),
          },
          {
            path: 'admin',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
])
