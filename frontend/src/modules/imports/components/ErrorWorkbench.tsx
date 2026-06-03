import { useState } from 'react'
import { Table, Button, Tag, Typography, Card, Space, message } from 'antd'
import { CheckOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ImportErrorRow } from '@/types'

const { Text } = Typography

interface ErrorWorkbenchProps {
  errorRows: ImportErrorRow[]
  onFix: (rowId: number, resolvedData: Record<string, any>) => void
  onRevalidate: () => void
}

const ErrorWorkbench = ({ errorRows, onFix, onRevalidate }: ErrorWorkbenchProps) => {
  const [editing, setEditing] = useState<Record<number, Record<string, any>>>({})

  const unresolvedRows = errorRows.filter((r) => !r.is_resolved)

  const handleCellChange = (rowId: number, key: string, value: any) => {
    setEditing((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [key]: value,
      },
    }))
  }

  const handleSave = (row: ImportErrorRow) => {
    const data = editing[row.id]
    if (!data || Object.keys(data).length === 0) {
      message.warning('请先修改数据')
      return
    }
    onFix(row.id, { ...row.raw_data, ...data })
    message.success('已保存修正')
  }

  const handleDownload = () => {
    const headers = Object.keys(unresolvedRows[0]?.raw_data || {})
    const rows = unresolvedRows.map((r) =>
      headers.map((h) => r.raw_data[h] ?? '').join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'error_rows.csv'
    link.click()
  }

  const columns = [
    { title: '行号', dataIndex: 'row_number', key: 'row_number', width: 80 },
    {
      title: '错误类型',
      dataIndex: 'error_type',
      key: 'error_type',
      width: 120,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          format: 'orange',
          balance: 'red',
          duplicate: 'volcano',
          consistency: 'magenta',
          other: 'default',
        }
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>
      },
    },
    { title: '错误信息', dataIndex: 'error_message', key: 'error_message' },
    {
      title: '状态',
      dataIndex: 'is_resolved',
      key: 'is_resolved',
      width: 100,
      render: (resolved: boolean) =>
        resolved ? <Tag color="success">已解决</Tag> : <Tag color="error">待修正</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ImportErrorRow) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          onClick={() => handleSave(record)}
          disabled={record.is_resolved}
        >
          保存
        </Button>
      ),
    },
  ]

  const expandedRowRender = (record: ImportErrorRow) => {
    const data = record.raw_data as Record<string, any>
    return (
      <Card size="small" className="rounded-lg bg-slate-50 border-0">
        <Space direction="vertical" className="w-full">
          <Text type="secondary" className="text-xs">原始数据（可编辑字段值后点击保存）：</Text>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data).map(([key, value]) => (
              <div key={key}>
                <Text strong className="text-xs block">{key}</Text>
                <input
                  type="text"
                  defaultValue={value}
                  disabled={record.is_resolved}
                  onChange={(e) => handleCellChange(record.id, key, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:border-primary focus:outline-none disabled:bg-slate-100"
                />
              </div>
            ))}
          </div>
        </Space>
      </Card>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <Card className="rounded-xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Text strong className="text-lg">错误修正工作台</Text>
            <Text type="secondary" className="block">
              待修正 {unresolvedRows.length} 行，已解决 {errorRows.length - unresolvedRows.length} 行
            </Text>
          </div>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={unresolvedRows.length === 0}>
              下载错误行
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={onRevalidate}>
              重新校验
            </Button>
          </Space>
        </div>

        <Table
          dataSource={errorRows}
          columns={columns}
          rowKey="id"
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 10 }}
          size="small"
          className="rounded-lg overflow-hidden border border-slate-200"
          rowClassName={(record) => (!record.is_resolved ? 'row-error-highlight' : '')}
        />
      </Card>
    </div>
  )
}

export default ErrorWorkbench
