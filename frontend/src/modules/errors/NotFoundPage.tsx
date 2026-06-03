import { useNavigate } from 'react-router-dom'
import { Result, Button } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            className="rounded-lg"
          >
            返回首页
          </Button>
        }
      />
    </div>
  )
}

export default NotFoundPage
