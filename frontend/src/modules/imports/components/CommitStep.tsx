import { useState } from 'react'
import { Card, Typography, Radio, Space, Button, Descriptions, Tag, Popconfirm, Alert, Progress } from 'antd'
import { CloudUploadOutlined, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import type { PreviewData, ValidationResult } from '@/types'

const { Title, Text } = Typography

interface CommitStepProps {
  previewData: PreviewData
  validationResult: ValidationResult
  committing: boolean
  asyncJob: { jobId: string; status: string; progress: number } | null
  onCommit: (mode: 'append' | 'replace') => void
}

const CommitStep = ({ previewData, validationResult, committing, asyncJob, onCommit }: CommitStepProps) => {
  const [mode, setMode] = useState<'append' | 'replace'>(previewData.overwrite_mode as 'append' | 'replace')

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="rounded-xl shadow-card">
        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Title level={5} className="!mb-1">提交导入</Title>
            <Text type="secondary">确认以下信息后执行导入操作</Text>
          </div>

          <Descriptions bordered size="small" className="rounded-lg overflow-hidden">
            <Descriptions.Item label="文件名">{previewData.file_name}</Descriptions.Item>
            <Descriptions.Item label="导入类型">
              {previewData.import_type === 'tb' ? '科目余额表' : '序时账'}
            </Descriptions.Item>
            <Descriptions.Item label="总行数">{validationResult.summary.total_rows}</Descriptions.Item>
            <Descriptions.Item label="有效行数">{validationResult.summary.parsed_rows}</Descriptions.Item>
            <Descriptions.Item label="错误行数">
              <Tag color={validationResult.summary.error_rows > 0 ? 'error' : 'success'}>
                {validationResult.summary.error_rows}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="校验结果">
              {validationResult.is_valid ? (
                <Tag color="success">通过</Tag>
              ) : (
                <Tag color="warning">未通过（含错误）</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>

      <Card className="rounded-xl shadow-card">
        <Space direction="vertical" className="w-full">
          <Title level={5}>覆盖模式</Title>
          <Radio.Group
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="replace">覆盖当前期间数据</Radio.Button>
            <Radio.Button value="append">追加为新版本</Radio.Button>
          </Radio.Group>
          <Text type="secondary" className="text-sm">
            {mode === 'replace'
              ? '将停用同一期间的旧版本，新版本设为激活状态'
              : '保留旧版本，新版本需手动激活'}
          </Text>
        </Space>
      </Card>

      {asyncJob && asyncJob.status === 'processing' && (
        <Card className="rounded-xl shadow-card border-blue-200">
          <Space direction="vertical" className="w-full">
            <div className="flex items-center gap-2">
              <LoadingOutlined className="text-primary" />
              <Text strong>异步导入处理中</Text>
            </div>
            <Progress percent={asyncJob.progress} status="active" />
            <Text type="secondary" className="text-sm">
              任务 ID: {asyncJob.jobId}，请勿关闭页面，系统将自动刷新状态
            </Text>
          </Space>
        </Card>
      )}

      {!validationResult.is_valid && (
        <Alert
          message="警告：当前数据存在校验错误"
          description="提交存在错误的数据可能导致试算不平衡或后续底稿异常，建议先修正错误。"
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className="rounded-lg"
        />
      )}

      <div className="flex justify-end">
        <Popconfirm
          title="确认导入？"
          description="导入后将更新项目财务数据池"
          onConfirm={() => onCommit(mode)}
          okText="确认"
          cancelText="取消"
        >
          <Button
            type="primary"
            size="large"
            icon={<CloudUploadOutlined />}
            loading={committing}
            className="rounded-lg"
          >
            确认导入
          </Button>
        </Popconfirm>
      </div>
    </div>
  )
}

export default CommitStep
