import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Button, List, Tag, Typography, Spin, Alert, Descriptions } from 'antd'
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { a300Api } from '@/api/a300Api'
import { A300CheckResult } from '@/types'

const { Title, Text } = Typography

const A300ChecksPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [checks, setChecks] = useState<A300CheckResult[]>([])
  const [allPassed, setAllPassed] = useState(false)
  const [loading, setLoading] = useState(false)

  const runChecks = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const response = await a300Api.runAllChecks(Number(projectId))
      setChecks(response.data.checks)
      setAllPassed(response.data.all_passed)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runChecks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4}>A300 勾稽校验</Title>
          <Text type="secondary">自动验证财务报表与试算平衡表的一致性</Text>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={runChecks}
        >
          重新校验
        </Button>
      </div>

      {allPassed && checks.length > 0 && (
        <Alert
          message="所有校验通过"
          description="当前项目的勾稽关系全部正确。"
          type="success"
          showIcon
          className="mb-4"
        />
      )}

      {!allPassed && checks.length > 0 && (
        <Alert
          message="存在校验失败"
          description="请查看下方明细，修复数据不一致问题。"
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {loading && checks.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spin size="large" tip="正在运行校验..." />
        </div>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, lg: 1 }}
          dataSource={checks}
          renderItem={(check) => (
            <List.Item>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    {check.passed ? (
                      <CheckCircleOutlined className="text-green-500 text-lg" />
                    ) : (
                      <CloseCircleOutlined className="text-red-500 text-lg" />
                    )}
                    <span>{check.rule_name}</span>
                    <Tag color={check.passed ? 'success' : 'error'}>
                      {check.passed ? '通过' : '失败'}
                    </Tag>
                  </div>
                }
              >
                <Text className="block mb-3">{check.message}</Text>
                {check.details && Object.keys(check.details).length > 0 && (
                  <Descriptions bordered size="small" column={2}>
                    {Object.entries(check.details).map(([key, value]) => (
                      <Descriptions.Item label={key} key={key}>
                        {typeof value === 'number' ? value.toFixed(2) : String(value)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                )}
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  )
}

export default A300ChecksPage
