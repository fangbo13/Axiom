import { Layout, Breadcrumb, Avatar, Dropdown, Badge } from 'antd'
import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/store'
import { logout } from '@/features/auth/authSlice'
import { clearActiveProject } from '@/features/projects/projectSlice'

const { Header } = Layout

const ProjectHeader = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { activeProject } = useSelector((state: RootState) => state.projects)

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearActiveProject())
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ]

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const breadcrumbItems = [
    { title: '首页' },
    ...(activeProject ? [{ title: activeProject.name }] : []),
    { title: getPageTitle(pathSegments) },
  ]

  return (
    <Header className="bg-white px-6 flex items-center justify-between shadow-sm h-16">
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex items-center gap-4">
        <Badge count={0} size="small">
          <BellOutlined className="text-lg text-gray-600 cursor-pointer" />
        </Badge>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar size="small" icon={<UserOutlined />} />
            <span className="text-sm text-gray-700">{user?.email}</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  )
}

function getPageTitle(segments: string[]): string {
  const map: Record<string, string> = {
    overview: '底稿总览',
    import: '导入账簿',
    accounts: '科目表',
    workpapers: '审计底稿',
    adjustments: '调整分录',
    'trial-balance': '试算平衡',
    returns: '申报表',
    notes: '附注草稿',
    finalised: '审定底稿',
    a300: 'A300勾稽校验',
    export: '导出底稿',
    admin: '管理后台',
  }
  const last = segments[segments.length - 1]
  return map[last] || last
}

export default ProjectHeader
