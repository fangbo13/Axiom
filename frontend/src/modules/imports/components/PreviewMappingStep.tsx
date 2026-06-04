import { useState, useMemo } from 'react'
import { Table, Select, Card, Typography, Space, Collapse, Tag, Button, Alert, Input } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined, ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons'
import type { PreviewData, MappingTemplate } from '@/types'

const { Title, Text } = Typography
const { Panel } = Collapse

interface PreviewMappingStepProps {
  previewData: PreviewData
  mappingTemplates: MappingTemplate[]
  onConfirmMapping: (mapping: Record<string, string>, saveTemplate?: boolean, templateName?: string) => void
  onBackToUpload: () => void
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
  // 多币种字段
  { key: 'currency', label: '币种', required: false },
  { key: 'foreign_opening_debit', label: '原币期初借方', required: false },
  { key: 'foreign_opening_credit', label: '原币期初贷方', required: false },
  { key: 'foreign_period_debit', label: '原币本期借方', required: false },
  { key: 'foreign_period_credit', label: '原币本期贷方', required: false },
  { key: 'foreign_closing_debit', label: '原币期末借方', required: false },
  { key: 'foreign_closing_credit', label: '原币期末贷方', required: false },
  { key: 'exchange_rate', label: '汇率', required: false },
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
  // 多币种与辅助核算
  { key: 'currency', label: '币种', required: false },
  { key: 'foreign_debit', label: '原币借方', required: false },
  { key: 'foreign_credit', label: '原币贷方', required: false },
  { key: 'exchange_rate', label: '汇率', required: false },
  { key: 'department', label: '部门', required: false },
  { key: 'customer', label: '客户', required: false },
  { key: 'supplier', label: '供应商', required: false },
]

const PreviewMappingStep = ({ previewData, mappingTemplates, onConfirmMapping, onBackToUpload, loading }: PreviewMappingStepProps) => {
  const [mapping, setMapping] = useState<Record<string, string>>(previewData.guessed_mapping || {})
  const [saveTemplate, setSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  const fields = previewData.import_type === 'tb' ? TB_FIELDS : JE_FIELDS

  const applicableTemplates = useMemo(() => {
    return mappingTemplates.filter((t) => t.import_type === previewData.import_type)
  }, [mappingTemplates, previewData.import_type])

  const handleApplyTemplate = (templateId: number | null) => {
    setSelectedTemplateId(templateId)
    if (!templateId) {
      setMapping(previewData.guessed_mapping || {})
      return
    }
    const tmpl = applicableTemplates.find((t) => t.id === templateId)
    if (tmpl?.column_mapping) {
      setMapping(tmpl.column_mapping)
    }
  }

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

          {previewData.detected_header_row !== undefined && (
            <Alert
              message={`系统检测到表头位于第 ${(previewData.detected_header_row ?? 0) + 1} 行，置信度 ${Math.round((previewData.header_confidence ?? 0) * 100)}%`}
              type="info"
              showIcon
              className="rounded-lg"
            />
          )}

          {previewData.detected_currencies && previewData.detected_currencies.length > 0 && (
            <Alert
              message={`检测到币种：${previewData.detected_currencies.join('、')}`}
              type="info"
              showIcon
              className="rounded-lg"
            />
          )}

          {applicableTemplates.length > 0 && (
            <div className="flex items-center gap-4">
              <Text strong className="whitespace-nowrap">
                <FileTextOutlined className="mr-1" />
                应用映射模板
              </Text>
              <Select
                placeholder="选择已保存的模板"
                allowClear
                style={{ width: 280 }}
                value={selectedTemplateId}
                onChange={(val) => handleApplyTemplate(val)}
                options={applicableTemplates.map((t) => ({
                  label: t.name + (t.is_auto_saved ? ' (自动保存)' : ''),
                  value: t.id,
                }))}
              />
            </div>
          )}

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

          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <Button onClick={() => setSaveTemplate(!saveTemplate)}>
              {saveTemplate ? '取消保存' : '保存为模板'}
            </Button>
            {saveTemplate && (
              <Input
                placeholder="模板名称"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-64"
              />
            )}
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

      <div className="flex justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBackToUpload}
          size="large"
          className="rounded-lg"
        >
          上一步
        </Button>
        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={!isReady}
          onClick={() => onConfirmMapping(mapping, saveTemplate, templateName || undefined)}
          className="rounded-lg"
        >
          确认映射并校验
        </Button>
      </div>
    </div>
  )
}

export default PreviewMappingStep
