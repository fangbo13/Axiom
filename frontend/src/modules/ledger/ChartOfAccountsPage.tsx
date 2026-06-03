import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Card, Table, Typography, Tag } from 'antd'
import { RootState, AppDispatch } from '@/store'
import { fetchAccounts } from '@/features/ledger/ledgerSlice'

const { Title, Text } = Typography

const categoryColors: Record<string, string> = {
  asset: 'blue',
  liability: 'red',
  equity: 'green',
  revenue: 'purple',
  expense: 'orange',
}

const categoryLabels: Record<string, string> = {
  asset: '资产',
  liability: '负债',
  equity: '所有者权益',
  revenue: '收入',
  expense: '费用',
}

const ChartOfAccountsPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { accounts, loading } = useSelector((state: RootState) => state.ledger)

  useEffect(() => {
    if (projectId) {
      dispatch(fetchAccounts(Number(projectId)))
    }
  }, [projectId, dispatch])

  const columns = [
    { title: '科目代码', dataIndex: 'code', key: 'code', sorter: (a: any, b: any) => a.code.localeCompare(b.code) },
    { title: '科目名称', dataIndex: 'name', key: 'name' },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => (
        <Tag color={categoryColors[cat] || 'default'}>{categoryLabels[cat] || cat}</Tag>
      ),
    },
    { title: '上级科目ID', dataIndex: 'parent', key: 'parent', render: (v: any) => v || '-' },
  ]

  return (
    <div>
      <Title level={4}>会计科目表</Title>
      <Text type="secondary">项目内所有会计科目</Text>
      <Card className="mt-4 rounded-xl shadow-card">
        <Table
          dataSource={accounts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 50 }}
          size="small"
          className="rounded-lg overflow-hidden border border-slate-200"
        />
      </Card>
    </div>
  )
}

export default ChartOfAccountsPage
