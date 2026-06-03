import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import { RootState, AppDispatch } from '@/store'
import { register, clearError } from '@/features/auth/authSlice'

const { Title, Text, Link } = Typography

const RegisterPage = () => {
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

  const onFinish = (values: any) => {
    dispatch(register(values))
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <Card className="w-full max-w-md shadow-xl rounded-xl">
        <div className="text-center mb-8">
          <Title level={2} className="!mb-2 text-primary">Axiom</Title>
          <Text type="secondary">注册新账号</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input size="large" placeholder="请输入用户名" />
          </Form.Item>

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
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password size="large" placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="password_confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item label="事务所名称" name="firm_name">
            <Input size="large" placeholder="可选" />
          </Form.Item>

          <Form.Item className="mb-4">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              icon={<UserAddOutlined />}
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>

          <div className="text-center">
            <Text type="secondary">
              已有账号？ <Link onClick={() => navigate('/login')}>去登录</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default RegisterPage
