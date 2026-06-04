import { Card, Typography, Space, Tag, Alert, Button, Table, Statistic, Row, Col } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, ArrowRightOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ValidationResult } from '@/types'
import importsApi from '@/api/importsApi'

const { Text } = Typography

interface ValidationStepProps {
  validationResult: ValidationResult
  onProceed: () => void
  onFixErrors: () => void
  projectId: number
}

const ValidationStep = ({ validationResult, onProceed, onFixErrors, projectId }: ValidationStepProps) => {
  const { is_valid, summary, checks, errors, warnings } = validationResult

  const checkItems = Object.entries(checks).map(([key, value]) => ({
    key,
    name: {
      auto_balance: '自动平衡检查',
      account_code_format: '科目编码格式',
      duplicate_accounts: '重复科目检测',
      period_consistency: '期间一致性',
      voucher_uniqueness: '凭证唯一性',
      direction_check: '方向异常检查',
      closing_calculation: '期末计算校验',
      foreign_currency: '外币校验',
    }[key] || key,
    ...value,
  }))

  const errorColumns = [
    { title: '行号', dataIndex: 'row_number', key: 'row_number', width: 80 },
    { title: '类型', dataIndex: 'severity', key: 'severity', width: 90,
      render: (severity: string) => (
        <Tag color={severity === 'error' ? 'red' : 'orange'}>
          {severity === 'error' ? '错误' : '警告'}
        </Tag>
      )
    },
    { title: '错误类型', dataIndex: 'error_type', key: 'error_type', width: 140,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          format: 'orange',
          balance: 'red',
          duplicate: 'volcano',
          consistency: 'magenta',
          direction_mismatch: 'gold',
          closing_calculation: 'cyan',
          foreign_currency: 'blue',
          other: 'default',
        }
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>
      }
    },
    { title: '信息', dataIndex: 'error_message', key: 'error_message' },
  ]

  const allIssues = [
    ...(errors || []).map(e => ({ ...e, severity: e.severity || 'error' })),
    ...(warnings || []).map(w => ({ ...w, severity: w.severity || 'warning' })),
  ]

  const hasErrors = (errors || []).length > 0
  const hasWarnings = (warnings || []).length > 0

  const handleExportErrors = () => {
    if (!validationResult.batch_id) return
    importsApi.exportErrorRows(projectId, validationResult.batch_id)
      .then(() => {
        // File download handled by browser
      })
      .catch(() => {
        // Error handling
      })
  }

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
          <Card size="small" className={`rounded-xl shadow-card border-l-4 ${hasWarnings ? 'border-warning' : 'border-success'}`}>
            <Statistic
              title="警告行数"
              value={summary.warning_rows || 0}
              valueStyle={{ color: hasWarnings ? '#f59e0b' : '#10b981' }}
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
          type="error"
          showIcon
          icon={<WarningOutlined />}
          className="rounded-lg"
        />
      )}

      {hasWarnings && !hasErrors && (
        <Alert
          message="导入存在警告"
          description={`共有 ${summary.warning_rows} 行数据存在警告（如方向异常、期末计算差异等），不影响提交，但建议核对。`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          className="rounded-lg"
        />
      )}

      {allIssues.length > 0 && (
        <Card
          className="rounded-xl shadow-card"
          title={
            <div className="flex items-center justify-between">
              <span>错误/警告明细</span>
              <Button size="small" icon={<DownloadOutlined />} onClick={handleExportErrors}>
                导出Excel
              </Button>
            </div>
          }
        >
          <Table
            dataSource={allIssues}
            columns={errorColumns}
            rowKey={(record, idx) => `issue-${record.row_number}-${record.error_type}-${idx}`}
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
