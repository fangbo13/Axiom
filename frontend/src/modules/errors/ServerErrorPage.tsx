import { useNavigate } from 'react-router-dom'
import { Result, Button } from 'antd'
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons'

interface ServerErrorPageProps {
  onRetry?: () => void
}

const ServerErrorPage = ({ onRetry }: ServerErrorPageProps) => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Result
        status="500"
        title="500"
        subTitle="抱歉，服务器发生了错误，请稍后重试"
        extra={
          <div className="flex items-center justify-center gap-3">
            {onRetry && (
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={onRetry}
                className="rounded-lg"
              >
                重新加载
              </Button>
            )}
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              className="rounded-lg"
            >
              返回首页
            </Button>
          </div>
        }
      />
    </div>
  )
}

export default ServerErrorPage
