import { useNavigate, useParams } from 'react-router-dom'
import { Result, Button, Space } from 'antd'
import { CheckCircleOutlined, FileSearchOutlined, BookOutlined, ReloadOutlined } from '@ant-design/icons'

interface ImportSuccessProps {
  onReset: () => void
}

const ImportSuccess = ({ onReset }: ImportSuccessProps) => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="animate-fade-in py-10">
      <Result
        icon={<CheckCircleOutlined className="text-success" />}
        status="success"
        title="导入成功"
        subTitle="数据已写入未审财务数据池，试算平衡已更新"
        extra={
          <Space>
            <Button
              icon={<BookOutlined />}
              onClick={() => navigate(`/projects/${projectId}/ledger/accounts`)}
              className="rounded-lg"
            >
              查看科目表
            </Button>
            <Button
              icon={<FileSearchOutlined />}
              onClick={() => navigate(`/projects/${projectId}/ledger/versions`)}
              className="rounded-lg"
            >
              查看导入版本
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={onReset}
              className="rounded-lg"
            >
              继续导入
            </Button>
          </Space>
        }
      />
    </div>
  )
}

export default ImportSuccess
