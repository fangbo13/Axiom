import { Upload, Button, Radio, Input, InputNumber, message, Card, Typography, Space, Alert, Tag } from 'antd'
import { InboxOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Dragger } = Upload
const { Title, Text } = Typography

interface UploadStepProps {
  uploading: boolean
  importType: 'tb' | 'je'
  overwriteMode: 'append' | 'replace'
  period: string
  headerRowHint: number | undefined
  fileList: any[]
  existingBatches?: any[]
  onImportTypeChange: (v: 'tb' | 'je') => void
  onOverwriteModeChange: (v: 'append' | 'replace') => void
  onPeriodChange: (v: string) => void
  onHeaderRowHintChange: (v: number | undefined) => void
  onFileListChange: (v: any[]) => void
  onUpload: () => void
}

const UploadStep = ({
  uploading,
  importType,
  overwriteMode,
  period,
  headerRowHint,
  fileList,
  existingBatches,
  onImportTypeChange,
  onOverwriteModeChange,
  onPeriodChange,
  onHeaderRowHintChange,
  onFileListChange,
  onUpload,
}: UploadStepProps) => {
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const isValid = ['csv', 'xlsx', 'xls', 'tsv', 'txt'].includes(ext || '')
      if (!isValid) {
        message.error('只支持 CSV、TSV、TXT 或 Excel 文件')
        return Upload.LIST_IGNORE
      }
      const isLt50M = file.size / 1024 / 1024 < 50
      if (!isLt50M) {
        message.error('文件大小不能超过 50MB')
        return Upload.LIST_IGNORE
      }
      return false
    },
    customRequest: () => {},
    onChange: (info) => {
      onFileListChange(info.fileList.slice(-1))
    },
    onRemove: () => {
      onFileListChange([])
    },
  }

  const handleUpload = () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件')
      return
    }
    if (!period.trim()) {
      message.warning('请输入会计期间')
      return
    }
    onUpload()
  }

  return (
    <div className="animate-fade-in">
      <Card className="mb-6 rounded-xl shadow-card">
        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Title level={5}>导入设置</Title>
            <Text type="secondary">选择导入类型和期间信息</Text>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <Text strong className="block mb-2">导入类型</Text>
              <Radio.Group
                value={importType}
                onChange={(e) => onImportTypeChange(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="tb">科目余额表 (TB)</Radio.Button>
                <Radio.Button value="je">序时账 (JE)</Radio.Button>
              </Radio.Group>
            </div>

            <div>
              <Text strong className="block mb-2">覆盖模式</Text>
              <Radio.Group
                value={overwriteMode}
                onChange={(e) => onOverwriteModeChange(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="replace">覆盖更新</Radio.Button>
                <Radio.Button value="append">追加版本</Radio.Button>
              </Radio.Group>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Text strong className="block mb-2">会计期间</Text>
              <Input
                placeholder="例如：2024-12"
                value={period}
                onChange={(e) => onPeriodChange(e.target.value)}
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Text strong className="block mb-2">表头行号（可选，从1开始）</Text>
              <InputNumber
                min={1}
                max={50}
                placeholder="自动识别"
                value={headerRowHint}
                onChange={(val) => onHeaderRowHintChange(val ?? undefined)}
                className="w-full"
              />
              <Text type="secondary" className="text-xs">留空则由系统自动识别，范围 1–50</Text>
            </div>
          </div>
        </Space>
      </Card>

      {existingBatches && existingBatches.length > 0 && (
        <Alert
          message="该期间已存在导入记录"
          description={
            <div className="space-y-2">
              <Text>当前期间已有以下已提交版本，继续导入将影响现有数据：</Text>
              <div className="flex flex-wrap gap-2">
                {existingBatches.map((b: any) => (
                  <Tag key={b.id} color={b.is_active ? 'success' : 'default'}>
                    v{b.version} {b.file_name} {b.is_active ? '(激活)' : ''}
                  </Tag>
                ))}
              </div>
              <Text type="secondary" className="text-xs">
                覆盖模式为「覆盖更新」时将停用旧版本；「追加版本」时将保留旧版本。
              </Text>
            </div>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          className="rounded-lg mb-6"
        />
      )}

      <Card className="rounded-xl shadow-card">
        <Dragger
          {...uploadProps}
          className="py-10 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-blue-50/30 transition-all duration-300"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined className="text-4xl text-primary" />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">
            支持 CSV、TSV、TXT、Excel (.xlsx, .xls) 格式，文件大小不超过 50MB
          </p>
        </Dragger>

        <div className="mt-6 flex justify-end">
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={uploading}
            onClick={handleUpload}
            disabled={fileList.length === 0}
            size="large"
            className="rounded-lg"
          >
            上传并预览
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default UploadStep
