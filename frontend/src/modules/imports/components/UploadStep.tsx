import { useState } from 'react'
import { Upload, Button, Radio, Input, message, Card, Typography, Space } from 'antd'
import { InboxOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Dragger } = Upload
const { Title, Text } = Typography

interface UploadStepProps {
  uploading: boolean
  onUpload: (file: File, importType: 'tb' | 'je', overwriteMode: 'append' | 'replace', period: string) => void
}

const UploadStep = ({ uploading, onUpload }: UploadStepProps) => {
  const [fileList, setFileList] = useState<any[]>([])
  const [importType, setImportType] = useState<'tb' | 'je'>('tb')
  const [overwriteMode, setOverwriteMode] = useState<'append' | 'replace'>('replace')
  const [period, setPeriod] = useState('')

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      const isValid =
        file.type === 'text/csv' ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      if (!isValid) {
        message.error('只支持 CSV 或 Excel 文件')
        return Upload.LIST_IGNORE
      }
      const isLt50M = file.size / 1024 / 1024 < 50
      if (!isLt50M) {
        message.error('文件大小不能超过 50MB')
        return Upload.LIST_IGNORE
      }
      return false
    },
    onChange: (info) => {
      setFileList(info.fileList.slice(-1))
    },
    onRemove: () => {
      setFileList([])
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
    const file = fileList[0].originFileObj || fileList[0]
    onUpload(file, importType, overwriteMode, period.trim())
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
                onChange={(e) => setImportType(e.target.value)}
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
                onChange={(e) => setOverwriteMode(e.target.value)}
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
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
          </div>
        </Space>
      </Card>

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
            支持 CSV、Excel (.xlsx, .xls) 格式，文件大小不超过 50MB
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
