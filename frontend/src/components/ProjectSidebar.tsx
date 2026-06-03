import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Layout, Menu, Button } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  EditOutlined,
  BarChartOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  AuditOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

const { Sider } = Layout

const menuItems = [
  { key: 'overview', icon: <DashboardOutlined />, label: '底稿总览' },
  { key: 'ledger/import', icon: <BookOutlined />, label: '导入账簿' },
  { key: 'ledger/versions', icon: <HistoryOutlined />, label: '导入版本' },
  { key: 'workpapers', icon: <FileTextOutlined />, label: '审计底稿' },
  { key: 'adjustments', icon: <EditOutlined />, label: '调整分录' },
  { key: 'trial-balance', icon: <BarChartOutlined />, label: '试算平衡' },
  { key: 'returns', icon: <FileDoneOutlined />, label: '申报表' },
  { key: 'notes', icon: <FileSearchOutlined />, label: '附注草稿' },
  { key: 'finalised', icon: <AuditOutlined />, label: '审定底稿' },
  { key: 'a300', icon: <CheckCircleOutlined />, label: 'A300勾稽' },
  { key: 'export', icon: <DownloadOutlined />, label: '导出底稿' },
]

const ProjectSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId } = useParams<{ projectId: string }>()
  const { activeProject } = useSelector((state: RootState) => state.projects)

  const selectedKey = location.pathname.split('/').slice(3).join('/') || 'overview'

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'returns') {
      navigate(`/projects/${projectId}/returns/unfiled`)
    } else {
      navigate(`/projects/${projectId}/${key}`)
    }
  }

  return (
    <Sider width={220} theme="light" className="shadow-md">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="text-xl font-bold text-primary">Axiom</div>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-800 truncate">
          {activeProject?.name || '未选择项目'}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {activeProject?.client_name || ''}
        </div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-white">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          block
          onClick={() => navigate('/')}
        >
          返回项目列表
        </Button>
      </div>
    </Sider>
  )
}

export default ProjectSidebar
