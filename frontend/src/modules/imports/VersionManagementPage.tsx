import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Popconfirm,
  message,
  Spin,
  Empty,
} from 'antd'
import { CheckCircleOutlined, DeleteOutlined, HistoryOutlined, PlayCircleOutlined, DashboardOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { RootState, AppDispatch } from '@/store'
import { fetchBatches, setActiveBatch, deleteBatch } from '@/features/imports/importsSlice'
import type { ImportBatch } from '@/types'

const { Title, Text } = Typography

const VersionManagementPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { batches, loading } = useSelector((state: RootState) => state.imports)

  useEffect(() => {
    if (projectId) {
      dispatch(fetchBatches({ projectId: Number(projectId) }))
    }
  }, [dispatch, projectId])

  const handleActivate = (batchId: number) => {
    if (!projectId) return
    dispatch(setActiveBatch({ projectId: Number(projectId), batchId }))
      .unwrap()
      .then(() => message.success('已设为激活版本'))
      .catch((err) => message.error(err))
  }

  const handleDelete = (batchId: number) => {
    if (!projectId) return
    dispatch(deleteBatch({ projectId: Number(projectId), batchId }))
      .unwrap()
      .then(() => message.success('已删除'))
      .catch((err) => message.error(err))
  }

  const columns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v: number, record: ImportBatch) =>
        record.is_active ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>v{v}</Tag>
        ) : (
          <Tag>v{v}</Tag>
        ),
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'import_type',
      key: 'import_type',
      width: 120,
      render: (type: string) => (type === 'tb' ? '科目余额表' : '序时账'),
    },
    {
      title: '期间',
      dataIndex: 'period',
      key: 'period',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          uploaded: { color: 'default', text: '已上传' },
          preview: { color: 'blue', text: '预览中' },
          validated: { color: 'orange', text: '已校验' },
          committed: { color: 'success', text: '已入库' },
          failed: { color: 'error', text: '失败' },
          processing: { color: 'processing', text: '处理中' },
        }
        const s = statusMap[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '行数',
      key: 'rows',
      width: 120,
      render: (_: any, record: ImportBatch) => (
        <Text type="secondary">
          {record.parsed_rows}/{record.total_rows}
        </Text>
      ),
    },
    {
      title: '问题',
      key: 'issues',
      width: 120,
      render: (_: any, record: ImportBatch) => (
        <Space size={4}>
          {record.error_rows_count > 0 && (
            <Tag color="error" icon={<ExclamationCircleOutlined />}>
              {record.error_rows_count}
            </Tag>
          )}
          {record.warning_rows_count > 0 && (
            <Tag color="warning" icon={<WarningOutlined />}>
              {record.warning_rows_count}
            </Tag>
          )}
          {record.error_rows_count === 0 && record.warning_rows_count === 0 && (
            <Text type="secondary" className="text-xs">-</Text>
          )}
        </Space>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ImportBatch) => (
        <Space>
          {!record.is_active && record.status === 'committed' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleActivate(record.id)}
            >
              激活
            </Button>
          )}
          <Popconfirm
            title="确认删除？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={4} className="!mb-1">导入版本管理</Title>
          <Text type="secondary">查看和管理项目的数据导入历史版本</Text>
        </div>
        <Space>
          <Button
            icon={<DashboardOutlined />}
            onClick={() => navigate(`/projects/${projectId}/ledger/dashboard`)}
            className="rounded-lg"
          >
            仪表盘
          </Button>
          <Button
            type="primary"
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/projects/${projectId}/ledger/import`)}
            className="rounded-lg"
          >
            去导入
          </Button>
        </Space>
      </div>

      <Card className="rounded-xl shadow-card">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : batches.length === 0 ? (
          <Empty description="暂无导入记录" className="py-20" />
        ) : (
          <Table
            dataSource={batches}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
            className="rounded-lg overflow-hidden border border-slate-200"
          />
        )}
      </Card>
    </div>
  )
}

export default VersionManagementPage
