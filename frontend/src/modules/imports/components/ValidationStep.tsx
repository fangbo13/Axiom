import { Card, Typography, Space, Tag, Alert, Button, Table, Statistic, Row, Col } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, ArrowRightOutlined } from '@ant-design/icons'
import type { ValidationResult } from '@/types'

const { Text } = Typography

interface ValidationStepProps {
  validationResult: ValidationResult
  onProceed: () => void
  onFixErrors: () => void
}

const ValidationStep = ({ validationResult, onProceed, onFixErrors }: ValidationStepProps) => {
  const { is_valid, summary, checks, errors } = validationResult

  const checkItems = Object.entries(checks).map(([key, value]) => ({
    key,
    name: {
      auto_balance: '自动平衡检查',
      account_code_format: '科目编码格式',
      duplicate_accounts: '重复科目检测',
      period_consistency: '期间一致性',
      voucher_uniqueness: '凭证唯一性',
    }[key] || key,
    ...value,
  }))

  const errorColumns = [
    { title: '行号', dataIndex: 'row_number', key: 'row_number', width: 80 },
    { title: '错误类型', dataIndex: 'error_type', key: 'error_type', width: 120,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          format: 'orange',
          balance: 'red',
          duplicate: 'volcano',
          consistency: 'magenta',
          other: 'default',
        }
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>
      }
    },
    { title: '错误信息', dataIndex: 'error_message', key: 'error_message' },
  ]

  const hasErrors = errors.length > 0
  const unresolvedErrors = errors.filter((e) => e.row_number !== null)

  return (
    <div className="animate-fade-in space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" className="rounded-xl shadow-card border-l-4 border-primary">
            <Statistic title="总行数" value={summary.total_rows} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" className="rounded-xl shadow-card border-l-4 border-success">
            <Statistic title="有效行数" value={summary.parsed_rows} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" className={`rounded-xl shadow-card border-l-4 ${hasErrors ? 'border-error' : 'border-success'}`}>
            <Statistic
              title="错误行数"
              value={summary.error_rows}
              valueStyle={{ color: hasErrors ? '#ef4444' : '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small" className={`rounded-xl shadow-card border-l-4 ${is_valid ? 'border-success' : 'border-warning'}`}>
            <Statistic
              title="校验结果"
              value={is_valid ? '通过' : '未通过'}
              valueStyle={{ color: is_valid ? '#10b981' : '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="rounded-xl shadow-card" title="校验项详情">
        <Space direction="vertical" className="w-full">
          {checkItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <Text>{item.name}</Text>
              <div className="flex items-center gap-2">
                <Text type="secondary" className="text-xs">{item.message}</Text>
                {item.passed ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">通过</Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
                )}
              </div>
            </div>
          ))}
        </Space>
      </Card>

      {hasErrors && (
        <Alert
          message="导入存在错误"
          description={`共有 ${summary.error_rows} 行数据校验失败，请在下表中查看详情。您可以修正错误后重新校验，或直接前往提交步骤（不推荐）。`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          className="rounded-lg"
        />
      )}

      {unresolvedErrors.length > 0 && (
        <Card className="rounded-xl shadow-card" title="错误明细">
          <Table
            dataSource={unresolvedErrors}
            columns={errorColumns}
            rowKey={(record) => `error-${record.row_number}-${record.error_type}`}
            pagination={{ pageSize: 10, simple: true }}
            size="small"
            className="rounded-lg overflow-hidden border border-slate-200"
          />
        </Card>
      )}

      <div className="flex justify-between">
        <Button size="large" onClick={onFixErrors} className="rounded-lg">
          前往错误修正工作台
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={onProceed}
          className="rounded-lg"
        >
          前往提交
        </Button>
      </div>
    </div>
  )
}

export default ValidationStep
