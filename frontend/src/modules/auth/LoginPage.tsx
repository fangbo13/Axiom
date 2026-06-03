import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { LoginOutlined } from '@ant-design/icons'
import { RootState, AppDispatch } from '@/store'
import { login, clearError } from '@/features/auth/authSlice'

const { Title, Text, Link } = Typography

const LoginPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth)
  const [form] = Form.useForm()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const onFinish = (values: { email: string; password: string }) => {
    dispatch(login(values))
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl rounded-xl">
        <div className="text-center mb-8">
          <Title level={2} className="!mb-2 text-primary">Axiom</Title>
          <Text type="secondary">审计工作底稿平台</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input size="large" placeholder="your@email.com" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password size="large" placeholder="请输入密码" />
          </Form.Item>

          <Form.Item className="mb-4">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              icon={<LoginOutlined />}
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>

          <div className="text-center">
            <Text type="secondary">
              还没有账号？ <Link onClick={() => navigate('/register')}>立即注册</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage
