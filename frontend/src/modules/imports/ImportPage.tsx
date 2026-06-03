import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Steps, Typography, Card, message } from 'antd'
import { RootState, AppDispatch } from '@/store'
import {
  uploadImportFile,
  confirmColumnMapping,
  validateImport,
  commitImport,
  clearImportSession,
} from '@/features/imports/importsSlice'
import UploadStep from './components/UploadStep'
import PreviewMappingStep from './components/PreviewMappingStep'
import ValidationStep from './components/ValidationStep'
import ErrorWorkbench from './components/ErrorWorkbench'
import CommitStep from './components/CommitStep'
import ImportSuccess from './components/ImportSuccess'


const { Title, Text } = Typography

const STEPS = [
  { title: '上传文件' },
  { title: '预览映射' },
  { title: '数据校验' },
  { title: '提交导入' },
]

type StepIndex = 0 | 1 | 2 | 3 | 4

const ImportPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const [currentStep, setCurrentStep] = useState<StepIndex>(0)
  const [showWorkbench, setShowWorkbench] = useState(false)

  const {
    previewData,
    validationResult,
    uploading,
    validating,
    committing,
    errorRows,
  } = useSelector((state: RootState) => state.imports)

  const handleUpload = useCallback(
    (file: File, importType: 'tb' | 'je', overwriteMode: 'append' | 'replace', period: string) => {
      if (!projectId) return
      dispatch(uploadImportFile({ projectId: Number(projectId), file, importType, overwriteMode, period }))
        .unwrap()
        .then(() => {
          setCurrentStep(1)
        })
        .catch((err) => {
          message.error(err)
        })
    },
    [dispatch, projectId]
  )

  const handleConfirmMapping = useCallback(
    (mapping: Record<string, string>) => {
      if (!projectId || !previewData) return
      dispatch(confirmColumnMapping({ projectId: Number(projectId), batchId: previewData.batch_id, columnMapping: mapping }))
        .unwrap()
        .then(() => {
          return dispatch(validateImport({ projectId: Number(projectId), batchId: previewData.batch_id })).unwrap()
        })
        .then(() => {
          setCurrentStep(2)
          setShowWorkbench(false)
        })
        .catch((err) => {
          message.error(err)
        })
    },
    [dispatch, projectId, previewData]
  )

  const handleRevalidate = useCallback(() => {
    if (!projectId || !previewData) return
    dispatch(validateImport({ projectId: Number(projectId), batchId: previewData.batch_id }))
      .unwrap()
      .then(() => {
        message.success('重新校验完成')
      })
      .catch((err) => {
        message.error(err)
      })
  }, [dispatch, projectId, previewData])

  const handleFixError = useCallback(
    (_rowId: number, _resolvedData: Record<string, any>) => {
      if (!projectId || !previewData) return
      // For MVP, just mark resolved locally and revalidate
      handleRevalidate()
    },
    [handleRevalidate, projectId, previewData]
  )

  const handleProceedToCommit = useCallback(() => {
    setShowWorkbench(false)
    setCurrentStep(3)
  }, [])

  const handleCommit = useCallback(
    (_mode: 'append' | 'replace') => {
      if (!projectId || !previewData) return
      dispatch(commitImport({ projectId: Number(projectId), batchId: previewData.batch_id, setActive: true }))
        .unwrap()
        .then(() => {
          setCurrentStep(4)
          message.success('导入成功')
        })
        .catch((err) => {
          message.error(err)
        })
    },
    [dispatch, projectId, previewData]
  )

  const handleReset = useCallback(() => {
    dispatch(clearImportSession())
    setCurrentStep(0)
    setShowWorkbench(false)
  }, [dispatch])

  const stepItems = STEPS.map((s) => ({ key: s.title, title: s.title }))

  return (
    <div>
      <div className="mb-6">
        <Title level={4} className="!mb-1">导入账簿</Title>
        <Text type="secondary">支持科目余额表（TB）和序时账（JE）的导入、预览、校验与版本管理</Text>
      </div>

      <Card className="rounded-xl shadow-card mb-6">
        <Steps current={currentStep > 3 ? 3 : currentStep} items={stepItems} className="mb-2" />
      </Card>

      {currentStep === 0 && (
        <UploadStep uploading={uploading} onUpload={handleUpload} />
      )}

      {currentStep === 1 && previewData && (
        <PreviewMappingStep
          previewData={previewData}
          onConfirmMapping={handleConfirmMapping}
          loading={validating}
        />
      )}

      {currentStep === 2 && validationResult && (
        showWorkbench ? (
          <ErrorWorkbench
            errorRows={errorRows}
            onFix={handleFixError}
            onRevalidate={handleRevalidate}
          />
        ) : (
          <ValidationStep
            validationResult={validationResult}
            onProceed={handleProceedToCommit}
            onFixErrors={() => setShowWorkbench(true)}
          />
        )
      )}

      {currentStep === 3 && previewData && validationResult && (
        <CommitStep
          previewData={previewData}
          validationResult={validationResult}
          committing={committing}
          onCommit={handleCommit}
        />
      )}

      {currentStep === 4 && <ImportSuccess onReset={handleReset} />}
    </div>
  )
}

export default ImportPage
