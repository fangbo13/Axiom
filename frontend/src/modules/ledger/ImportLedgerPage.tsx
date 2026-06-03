import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Card,
  Upload,
  Button,
  Table,
  Typography,
  message,
  Alert,
  Statistic,
  Row,
  Col,
  Divider,
  Space,
} from 'antd'
import { InboxOutlined, UploadOutlined, FileExcelOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { RootState, AppDispatch } from '@/store'
import { uploadLedgerFile, clearUploadResult } from '@/features/ledger/ledgerSlice'

const { Title, Text } = Typography
const { Dragger } = Upload

const ImportLedgerPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { uploadResult, uploading } = useSelector((state: RootState) => state.ledger)
  const [fileList, setFileList] = useState<any[]>([])

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件')
      return
    }
    const file = fileList[0].originFileObj || fileList[0]
    if (!projectId) return
    dispatch(uploadLedgerFile({ projectId: Number(projectId), file }))
  }

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
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB')
        return Upload.LIST_IGNORE
      }
      return false
    },
    onChange: (info) => {
      setFileList(info.fileList.slice(-1))
    },
    onRemove: () => {
      setFileList([])
      dispatch(clearUploadResult())
    },
  }

  const errorColumns = [
    { title: '行号', dataIndex: 'row', key: 'row', width: 80 },
    { title: '错误信息', dataIndex: 'error', key: 'error' },
  ]

  return (
    <div>
      <Title level={4}>导入账簿</Title>
      <Text type="secondary">支持 CSV、Excel (.xlsx, .xls) 格式</Text>
      <Divider />

      <Card className="mb-6">
        <Dragger {...uploadProps} className="py-8">
          <p className="ant-upload-drag-icon">
            <InboxOutlined className="text-4xl text-primary" />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">
            文件需包含以下列：科目代码、科目名称、借方、贷方。可选列：期间、摘要
          </p>
        </Dragger>

        <div className="mt-4 flex justify-end">
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={uploading}
            onClick={handleUpload}
            disabled={fileList.length === 0}
            size="large"
          >
            开始导入
          </Button>
        </div>
      </Card>

      {uploadResult && (
        <>
          <Row gutter={[24, 24]} className="mb-6">
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic
                  title="总行数"
                  value={uploadResult.summary.total_rows}
                  prefix={<FileExcelOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic title="成功解析" value={uploadResult.summary.parsed_rows} />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic
                  title="错误行数"
                  value={uploadResult.summary.error_rows}
                  valueStyle={{ color: uploadResult.summary.error_rows > 0 ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic title="新建科目" value={uploadResult.accounts_created} />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic title="新建分录" value={uploadResult.entries_created} />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Space direction="vertical" size={0}>
                  <Text type="secondary">借方合计</Text>
                  <Text strong>{uploadResult.summary.total_debit.toFixed(2)}</Text>
                  <Text type="secondary">贷方合计</Text>
                  <Text strong>{uploadResult.summary.total_credit.toFixed(2)}</Text>
                </Space>
              </Card>
            </Col>
          </Row>

          {uploadResult.summary.error_rows > 0 && (
            <Alert
              message="导入存在错误"
              description={`共有 ${uploadResult.summary.error_rows} 行数据解析失败，请检查下表。`}
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          {uploadResult.errors.length > 0 && (
            <Card title="错误明细" size="small" className="mb-4">
              <Table
                dataSource={uploadResult.errors}
                columns={errorColumns}
                rowKey={(record) => `error-${record.row}`}
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {uploadResult.summary.parsed_rows > 0 && uploadResult.summary.error_rows === 0 && (
            <Alert
              message="导入成功"
              description={`已成功导入 ${uploadResult.entries_created} 条分录，创建 ${uploadResult.accounts_created} 个科目。`}
              type="success"
              showIcon
            />
          )}
        </>
      )}
    </div>
  )
}

export default ImportLedgerPage
