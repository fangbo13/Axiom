import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Spin,
  Empty,
  Select,
  Drawer,
  Descriptions,
  Popconfirm,
  message,
  Badge,
  Tooltip,
} from 'antd'
import {
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  FileExcelOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { RootState, AppDispatch } from '@/store'
import {
  fetchDashboardBatches,
  fetchBatchDetail,
  deleteBatchFromDashboard,
  remapBatch,
  setDashboardFilters,
  clearBatchDetail,
} from '@/features/imports/importsSlice'
import importsApi from '@/api/importsApi'
import type { ImportBatch } from '@/types'

const { Title, Text } = Typography

interface PeriodGroup {
  period: string
  batches: ImportBatch[]
}

const ImportDashboardPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)

  const { dashboardBatches, loading, dashboardFilters, batchDetail } = useSelector(
    (state: RootState) => state.imports
  )

  useEffect(() => {
    if (projectId) {
      dispatch(
        fetchDashboardBatches({
          projectId: Number(projectId),
          params: dashboardFilters,
        })
      )
    }
  }, [dispatch, projectId, dashboardFilters])

  useEffect(() => {
    if (selectedBatchId && projectId) {
      dispatch(fetchBatchDetail({ projectId: Number(projectId), batchId: selectedBatchId }))
    }
  }, [selectedBatchId, projectId, dispatch])

  const handleFilterChange = (key: 'period' | 'import_type', value: string | undefined) => {
    dispatch(
      setDashboardFilters({
        ...dashboardFilters,
        [key]: value || undefined,
      })
    )
  }

  const handleDownload = async (batchId: number, fileName: string) => {
    if (!projectId) return
    try {
      const response = await importsApi.downloadOriginalFile(Number(projectId), batchId)
      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      link.click()
      message.success('开始下载')
    } catch {
      message.error('下载失败')
    }
  }

  const handleRemap = (batchId: number) => {
    if (!projectId) return
    dispatch(remapBatch({ projectId: Number(projectId), batchId }))
      .unwrap()
      .then(() => {
        message.success('已重置为待映射状态，前往导入页面')
        navigate(`/projects/${projectId}/ledger/import?remapBatchId=${batchId}`)
      })
      .catch((err: string) => message.error(err))
  }

  const handleDelete = (batchId: number) => {
    if (!projectId) return
    dispatch(deleteBatchFromDashboard({ projectId: Number(projectId), batchId }))
      .unwrap()
      .then(() => {
        message.success('已删除')
        setDetailDrawerOpen(false)
        setSelectedBatchId(null)
      })
      .catch((err: string) => message.error(err))
  }

  const openDetail = (batchId: number) => {
    setSelectedBatchId(batchId)
    setDetailDrawerOpen(true)
  }

  const closeDetail = () => {
    setDetailDrawerOpen(false)
    setSelectedBatchId(null)
    dispatch(clearBatchDetail())
  }

  const columns = [
    {
      title: '期间',
      dataIndex: 'period',
      key: 'period',
      width: 100,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v: number, record: ImportBatch) =>
        record.is_active ? (
          <Tooltip title="当前激活版本">
            <Tag color="success" icon={<CheckCircleOutlined />}>v{v}</Tag>
          </Tooltip>
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
      width: 110,
      render: (type: string) =>
        type === 'tb' ? (
          <Tag color="blue">科目余额表</Tag>
        ) : (
          <Tag color="purple">序时账</Tag>
        ),
    },
    {
      title: '数据质量',
      key: 'quality',
      width: 140,
      render: (_: any, record: ImportBatch) => (
        <Space size={4}>
          {record.error_rows_count > 0 && (
            <Badge
              count={record.error_rows_count}
              style={{ backgroundColor: '#ef4444' }}
              overflowCount={99}
            />
          )}
          {record.warning_rows_count > 0 && (
            <Badge
              count={record.warning_rows_count}
              style={{ backgroundColor: '#f59e0b' }}
              overflowCount={99}
            />
          )}
          {record.error_rows_count === 0 && record.warning_rows_count === 0 && (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              干净
            </Tag>
          )}
        </Space>
      ),
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
      title: '上传者',
      dataIndex: ['uploaded_by', 'username'],
      key: 'uploaded_by',
      width: 120,
      render: (_: any, record: ImportBatch) => record.uploaded_by?.username || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ImportBatch) => (
        <Space>
          <Button
            size="small"
            icon={<FileExcelOutlined />}
            onClick={() => openDetail(record.id)}
          >
            详情
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id, record.file_name)}
          >
            下载
          </Button>
          <Popconfirm
            title="确认删除？"
            description="删除后将无法恢复"
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

  const periodGroups: PeriodGroup[] = dashboardBatches as unknown as PeriodGroup[]

  const allBatches = periodGroups.flatMap((g) => g.batches)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={4} className="!mb-1">导入仪表盘</Title>
          <Text type="secondary">查看已入库的导入批次，按期间分组管理</Text>
        </div>
        <Button
          type="primary"
          icon={<HistoryOutlined />}
          onClick={() => navigate(`/projects/${projectId}/ledger/import`)}
          className="rounded-lg"
        >
          去导入
        </Button>
      </div>

      <Card className="rounded-xl shadow-card mb-6">
        <Space wrap>
          <div>
            <Text strong className="block mb-1">期间筛选</Text>
            <Select
              placeholder="全部期间"
              allowClear
              style={{ width: 160 }}
              value={dashboardFilters.period}
              onChange={(val) => handleFilterChange('period', val)}
              options={Array.from(new Set(allBatches.map((b) => b.period))).map((p) => ({
                label: p,
                value: p,
              }))}
            />
          </div>
          <div>
            <Text strong className="block mb-1">类型筛选</Text>
            <Select
              placeholder="全部类型"
              allowClear
              style={{ width: 160 }}
              value={dashboardFilters.import_type}
              onChange={(val) => handleFilterChange('import_type', val)}
              options={[
                { label: '科目余额表', value: 'tb' },
                { label: '序时账', value: 'je' },
              ]}
            />
          </div>
          <div className="flex items-end">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(setDashboardFilters({}))}
            >
              重置筛选
            </Button>
          </div>
        </Space>
      </Card>

      <Card className="rounded-xl shadow-card">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : periodGroups.length === 0 ? (
          <Empty description="暂无已入库的导入记录" className="py-20" />
        ) : (
          <Space direction="vertical" className="w-full" size="large">
            {periodGroups.map((group) => (
              <div key={group.period}>
                <div className="flex items-center gap-2 mb-3">
                  <Title level={5} className="!mb-0">{group.period}</Title>
                  <Tag color="processing">{group.batches.length} 个版本</Tag>
                </div>
                <Table
                  dataSource={group.batches}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  className="rounded-lg overflow-hidden border border-slate-200"
                />
              </div>
            ))}
          </Space>
        )}
      </Card>

      <Drawer
        title="批次详情"
        width={720}
        open={detailDrawerOpen}
        onClose={closeDetail}
      >
        {batchDetail ? (
          <Space direction="vertical" className="w-full" size="large">
            <Card size="small" className="rounded-xl shadow-card">
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="文件名">
                  {batchDetail.batch.file_name}
                </Descriptions.Item>
                <Descriptions.Item label="类型">
                  {batchDetail.batch.import_type === 'tb' ? '科目余额表' : '序时账'}
                </Descriptions.Item>
                <Descriptions.Item label="期间">
                  {batchDetail.batch.period}
                </Descriptions.Item>
                <Descriptions.Item label="版本">
                  v{batchDetail.batch.version}
                  {batchDetail.batch.is_active && (
                    <Tag color="success" className="ml-2">激活</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="总行数">
                  {batchDetail.batch.total_rows}
                </Descriptions.Item>
                <Descriptions.Item label="有效行数">
                  {batchDetail.batch.parsed_rows}
                </Descriptions.Item>
                <Descriptions.Item label="错误行">
                  <Tag color={batchDetail.batch.error_rows_count > 0 ? 'error' : 'success'}>
                    {batchDetail.batch.error_rows_count}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="警告行">
                  <Tag color={batchDetail.batch.warning_rows_count > 0 ? 'warning' : 'success'}>
                    {batchDetail.batch.warning_rows_count}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    handleDownload(batchDetail.batch.id, batchDetail.batch.file_name)
                  }
                >
                  下载原文件
                </Button>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleRemap(batchDetail.batch.id)}
                >
                  重新映射
                </Button>
                <Popconfirm
                  title="确认删除？"
                  description="删除后将无法恢复"
                  onConfirm={() => handleDelete(batchDetail.batch.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </div>
            </Card>

            {Object.keys(batchDetail.columnMapping || {}).length > 0 && (
              <Card size="small" title="列映射" className="rounded-xl shadow-card">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(batchDetail.columnMapping).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-slate-50">
                      <Text type="secondary" className="text-xs">{key}</Text>
                      <Text className="text-xs">{String(val)}</Text>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {batchDetail.previewRows.length > 0 && (
              <Card size="small" title="数据预览（前200行）" className="rounded-xl shadow-card">
                <Table
                  dataSource={batchDetail.previewRows.map((row, idx) => ({ key: idx, ...row }))}
                  columns={Object.keys(batchDetail.previewRows[0]).map((col) => ({
                    title: col,
                    dataIndex: col,
                    key: col,
                    ellipsis: true,
                    width: 120,
                  }))}
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10, simple: true }}
                  size="small"
                  className="rounded-lg overflow-hidden border border-slate-200"
                />
              </Card>
            )}
          </Space>
        ) : (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default ImportDashboardPage
