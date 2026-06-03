import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Tag,
  Alert,
  Spin,
} from 'antd'
import {
  UserOutlined,
  ProjectOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { RootState } from '@/store'
import axiosInstance from '@/api/axiosInstance'
import { User } from '@/types'

const { Title } = Typography

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/')
      return
    }

    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          axiosInstance.get('/admin/stats/'),
          axiosInstance.get('/admin/users/'),
        ])
        setStats(statsRes.data)
        setUsers(usersRes.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, navigate])

  if (!user?.is_admin) {
    return (
      <Alert
        message="权限不足"
        description="您没有权限访问管理后台。"
        type="error"
        showIcon
      />
    )
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '事务所', dataIndex: 'firm_name', key: 'firm_name' },
    {
      title: '管理员',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (v: boolean) => (v ? <Tag color="red">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '注册时间',
      dataIndex: 'date_joined',
      key: 'date_joined',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ]

  return (
    <div>
      <Title level={4}>管理后台</Title>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]} className="mb-6">
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={stats?.total_users || 0}
                  prefix={<UserOutlined className="text-blue-500" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="管理员数"
                  value={stats?.total_admins || 0}
                  prefix={<TeamOutlined className="text-red-500" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="活跃项目"
                  value="-"
                  prefix={<ProjectOutlined className="text-green-500" />}
                />
              </Card>
            </Col>
          </Row>

          <Card title="用户列表">
            <Table
              dataSource={users}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
