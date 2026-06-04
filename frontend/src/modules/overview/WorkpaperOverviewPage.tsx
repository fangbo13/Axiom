import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Typography,
  Divider,
  Skeleton,
} from 'antd'
import {
  FileTextOutlined,
  BookOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { RootState, AppDispatch } from '@/store'
import { fetchOverview } from '@/features/projects/projectSlice'

const { Title, Text } = Typography

const WorkpaperOverviewPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { overview, loading } = useSelector((state: RootState) => state.projects)

  useEffect(() => {
    if (projectId) {
      dispatch(fetchOverview(Number(projectId)))
    }
  }, [projectId, dispatch])

  if (loading || !overview) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const totalWorkpapers = overview.workpaper_total || 0
  const finalisedCount = overview.workpaper_by_status?.finalised || 0
  const completionPercent = totalWorkpapers > 0 ? Math.round((finalisedCount / totalWorkpapers) * 100) : 0
  const importedTb = overview.imported_tb_count || 0
  const importedJe = overview.imported_je_count || 0
  const importedTotal = importedTb + importedJe

  return (
    <div>
      <Title level={4}>底稿总览</Title>
      <Text type="secondary">项目：{overview.name}</Text>
      <Divider />

      {completionPercent < 100 && (
        <Alert
          message="项目进行中"
          description={`当前完成度 ${completionPercent}%，尚有 ${totalWorkpapers - finalisedCount} 份底稿待审定。`}
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className="mb-6 rounded-lg shadow-sm"
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl shadow-card border-l-4 border-primary hover:shadow-card-hover transition-all">
            <Statistic
              title="底稿总数"
              value={totalWorkpapers}
              prefix={<FileTextOutlined className="text-primary" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="rounded-xl shadow-card border-l-4 border-success hover:shadow-card-hover transition-all cursor-pointer"
            onClick={() => navigate(`/projects/${projectId}/ledger/import`)}
          >
            <Statistic
              title="已导入账簿"
              value={importedTotal}
              prefix={<BookOutlined className="text-success" />}
            />
            <div className="mt-1 text-xs text-gray-500">
              科目余额表 {importedTb} / 序时账 {importedJe}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl shadow-card border-l-4 border-warning hover:shadow-card-hover transition-all">
            <Statistic
              title="待处理调整"
              value={overview.open_adjustments}
              prefix={<EditOutlined className="text-warning" />}
              valueStyle={{ color: overview.open_adjustments > 0 ? '#f59e0b' : '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl shadow-card border-l-4 border-purple-500 hover:shadow-card-hover transition-all">
            <Statistic
              title="已审定"
              value={finalisedCount}
              prefix={<CheckCircleOutlined className="text-purple-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card title="底稿完成进度" className="rounded-xl shadow-card">
            <div className="flex items-center justify-center py-8">
              <Progress
                type="circle"
                percent={completionPercent}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                format={(percent) => <Text strong>{percent}%</Text>}
                size={180}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Text type="secondary">草稿</Text>
                <div className="text-lg font-semibold">{overview.workpaper_by_status?.draft || 0}</div>
              </div>
              <div>
                <Text type="secondary">复核中</Text>
                <div className="text-lg font-semibold">{overview.workpaper_by_status?.review || 0}</div>
              </div>
              <div>
                <Text type="secondary">已审定</Text>
                <div className="text-lg font-semibold">{overview.workpaper_by_status?.finalised || 0}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="项目信息" className="rounded-xl shadow-card">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <Text type="secondary">客户名称</Text>
                <Text strong>{overview.client_name}</Text>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <Text type="secondary">会计年度结束日</Text>
                <Text strong>{overview.fiscal_year_end}</Text>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <Text type="secondary">项目状态</Text>
                <Text strong>{overview.status === 'active' ? '进行中' : overview.status}</Text>
              </div>
              <div className="flex justify-between py-2">
                <Text type="secondary">底稿总数</Text>
                <Text strong>{totalWorkpapers}</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default WorkpaperOverviewPage
