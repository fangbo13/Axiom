import { useState, useMemo } from 'react'
import { Table, Select, Card, Typography, Space, Collapse, Tag, Button, Alert } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { PreviewData } from '@/types'

const { Title, Text } = Typography
const { Panel } = Collapse

interface PreviewMappingStepProps {
  previewData: PreviewData
  onConfirmMapping: (mapping: Record<string, string>) => void
  loading: boolean
}

const TB_FIELDS = [
  { key: 'account_code', label: '科目代码', required: true },
  { key: 'account_name', label: '科目名称', required: true },
  { key: 'opening_debit', label: '期初借方', required: false },
  { key: 'opening_credit', label: '期初贷方', required: false },
  { key: 'period_debit', label: '本期借方', required: false },
  { key: 'period_credit', label: '本期贷方', required: false },
  { key: 'closing_debit', label: '期末借方', required: false },
  { key: 'closing_credit', label: '期末贷方', required: false },
  { key: 'direction', label: '方向', required: false },
]

const JE_FIELDS = [
  { key: 'voucher_date', label: '凭证日期', required: false },
  { key: 'voucher_no', label: '凭证号', required: false },
  { key: 'line_no', label: '行号', required: false },
  { key: 'abstract', label: '摘要', required: false },
  { key: 'account_code', label: '科目代码', required: true },
  { key: 'account_name', label: '科目名称', required: true },
  { key: 'debit', label: '借方', required: true },
  { key: 'credit', label: '贷方', required: true },
]

const PreviewMappingStep = ({ previewData, onConfirmMapping, loading }: PreviewMappingStepProps) => {
  const [mapping, setMapping] = useState<Record<string, string>>(previewData.guessed_mapping || {})

  const fields = previewData.import_type === 'tb' ? TB_FIELDS : JE_FIELDS

  const mappedCount = useMemo(() => {
    return fields.filter((f) => mapping[f.key]).length
  }, [mapping, fields])

  const requiredMapped = useMemo(() => {
    return fields.filter((f) => f.required && mapping[f.key]).length
  }, [mapping, fields])

  const requiredTotal = fields.filter((f) => f.required).length

  const handleMappingChange = (fieldKey: string, columnName: string | undefined) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: columnName || '',
    }))
  }

  const columns = previewData.detected_columns.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    width: 140,
  }))

  const tableData = previewData.first_rows.map((row, idx) => ({
    key: idx,
    ...row,
  }))

  const isReady = requiredMapped === requiredTotal

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="rounded-xl shadow-card">
        <Space direction="vertical" size="middle" className="w-full">
          <div className="flex items-center justify-between">
            <div>
              <Title level={5} className="!mb-1">列映射确认</Title>
              <Text type="secondary">
                系统已自动猜测列映射，请检查并修正。已映射 {mappedCount}/{fields.length} 个字段
              </Text>
            </div>
            {isReady ? (
              <Tag icon={<CheckCircleOutlined />} color="success">必填字段已映射</Tag>
            ) : (
              <Tag icon={<ExclamationCircleOutlined />} color="warning">必填字段不完整</Tag>
            )}
          </div>

          {!isReady && (
            <Alert
              message={`必填字段尚有 ${requiredTotal - requiredMapped} 个未映射`}
              type="warning"
              showIcon
              className="rounded-lg"
            />
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fields.map((field) => (
              <div key={field.key}>
                <Text strong className={`block mb-1 ${field.required ? 'text-error' : ''}`}>
                  {field.label}
                  {field.required && <span className="text-error ml-1">*</span>}
                </Text>
                <Select
                  placeholder="选择对应列"
                  value={mapping[field.key] || undefined}
                  onChange={(val) => handleMappingChange(field.key, val)}
                  className="w-full"
                  allowClear
                  options={previewData.detected_columns.map((col) => ({
                    label: col,
                    value: col,
                  }))}
                />
              </div>
            ))}
          </div>
        </Space>
      </Card>

      <Card className="rounded-xl shadow-card" title="数据预览（前100行）">
        <Table
          dataSource={tableData}
          columns={columns}
          scroll={{ x: 'max-content' }}
          size="small"
          pagination={{ pageSize: 10, simple: true }}
          className="rounded-lg overflow-hidden border border-slate-200"
        />
      </Card>

      {previewData.sample_rows.length > 0 && (
        <Collapse className="rounded-xl overflow-hidden">
          <Panel header="随机抽样行（中间/末尾数据）" key="1">
            <Table
              dataSource={previewData.sample_rows.map((row, idx) => ({ key: idx, ...row }))}
              columns={columns}
              scroll={{ x: 'max-content' }}
              size="small"
              pagination={false}
              className="rounded-lg overflow-hidden border border-slate-200"
            />
          </Panel>
        </Collapse>
      )}

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={!isReady}
          onClick={() => onConfirmMapping(mapping)}
          className="rounded-lg"
        >
          确认映射并校验
        </Button>
      </div>
    </div>
  )
}

export default PreviewMappingStep
