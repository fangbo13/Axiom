import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Empty,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Spin,
  Badge,
} from 'antd'
import { PlusOutlined, FolderOpenOutlined, CalendarOutlined } from '@ant-design/icons'
import { RootState, AppDispatch } from '@/store'
import { fetchProjects, createProject, setActiveProject } from '@/features/projects/projectSlice'

const { Title, Text } = Typography

const ProjectListPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { projects, loading } = useSelector((state: RootState) => state.projects)
  const { user } = useSelector((state: RootState) => state.auth)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  const handleCreate = async (values: any) => {
    try {
      const payload = {
        ...values,
        fiscal_year_end: values.fiscal_year_end.format('YYYY-MM-DD'),
      }
      const resultAction = await dispatch(createProject(payload))
      if (createProject.fulfilled.match(resultAction)) {
        message.success('项目创建成功')
        setIsModalOpen(false)
        form.resetFields()
      }
    } catch {
      message.error('创建失败')
    }
  }

  const handleEnterProject = (project: any) => {
    dispatch(setActiveProject(project))
    navigate(`/projects/${project.id}/overview`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'processing'
      case 'locked':
        return 'warning'
      case 'archived':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      active: '进行中',
      locked: '已锁定',
      archived: '已归档',
    }
    return map[status] || status
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Title level={3} className="!mb-1">我的项目</Title>
          <Text type="secondary">欢迎回来，{user?.email}</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          新建项目
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : projects.length === 0 ? (
        <Empty description="暂无项目，点击右上角创建" className="py-20">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            新建项目
          </Button>
        </Empty>
      ) : (
        <Row gutter={[24, 24]}>
          {projects.map((project) => (
            <Col xs={24} sm={12} lg={8} key={project.id}>
              <Card
                hoverable
                className="h-full rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300"
                onClick={() => handleEnterProject(project)}
              >
                <div className="flex items-start justify-between mb-4">
                  <FolderOpenOutlined className="text-3xl text-primary" />
                  <Badge status={getStatusColor(project.status)} text={getStatusText(project.status)} />
                </div>
                <Title level={5} className="!mb-2 truncate">{project.name}</Title>
                <Text type="secondary" className="block mb-3">{project.client_name}</Text>
                <div className="flex items-center text-gray-500 text-sm">
                  <CalendarOutlined className="mr-1" />
                  <span>会计年度: {project.fiscal_year_end}</span>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  成员数: {project.member_count}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="新建项目"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-4">
          <Form.Item
            label="项目名称"
            name="name"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="例如：2024年度审计" />
          </Form.Item>
          <Form.Item
            label="客户名称"
            name="client_name"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="客户公司全称" />
          </Form.Item>
          <Form.Item
            label="会计年度结束日"
            name="fiscal_year_end"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker className="w-full" placeholder="选择日期" />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end">
            <Button onClick={() => setIsModalOpen(false)} className="mr-2">
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectListPage
