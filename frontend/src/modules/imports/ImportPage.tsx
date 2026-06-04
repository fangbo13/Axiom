import { useState, useCallback, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Steps, Typography, Card, message } from 'antd'
import { RootState, AppDispatch } from '@/store'
import type { ImportBatch } from '@/types'
import {
  uploadImportFile,
  confirmColumnMapping,
  validateImport,
  commitImport,
  clearImportSession,
  fetchBatchDetail,
  pollAsyncJob,
  fetchMappingTemplates,
  fetchDashboardBatches,
} from '@/features/imports/importsSlice'
import UploadStep from './components/UploadStep'
import PreviewMappingStep from './components/PreviewMappingStep'
import ValidationStep from './components/ValidationStep'
import ErrorWorkbench from './components/ErrorWorkbench'
import CommitStep from './components/CommitStep'
import ImportSuccess from './components/ImportSuccess'
import ImportDashboardHome from './components/ImportDashboardHome'

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
  const [searchParams] = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()

  // View mode: dashboard or wizard
  const [viewMode, setViewMode] = useState<'dashboard' | 'wizard'>('dashboard')

  // Wizard step
  const [currentStep, setCurrentStep] = useState<StepIndex>(0)
  const [showWorkbench, setShowWorkbench] = useState(false)

  // Upload config (lifted from UploadStep to persist when going back)
  const [uploadConfig, setUploadConfig] = useState({
    fileList: [] as any[],
    importType: 'tb' as 'tb' | 'je',
    overwriteMode: 'replace' as 'append' | 'replace',
    period: '',
    headerRowHint: undefined as number | undefined,
  })

  const {
    previewData,
    validationResult,
    uploading,
    validating,
    committing,
    errorRows,
    asyncJob,
    mappingTemplates,
  } = useSelector((state: RootState) => state.imports)

  // Handle remapBatchId from query param
  useEffect(() => {
    const remapBatchId = searchParams.get('remapBatchId')
    if (remapBatchId && projectId) {
      dispatch(fetchBatchDetail({ projectId: Number(projectId), batchId: Number(remapBatchId) }))
        .unwrap()
        .then(() => {
          dispatch(clearImportSession())
          setViewMode('wizard')
          setCurrentStep(0)
        })
        .catch(() => {
          message.error('加载批次失败')
        })
    }
  }, [searchParams, projectId, dispatch])

  // Fetch mapping templates and dashboard data when project is available
  useEffect(() => {
    if (projectId) {
      dispatch(fetchMappingTemplates(Number(projectId)))
      dispatch(fetchDashboardBatches({ projectId: Number(projectId), params: {} }))
    }
  }, [projectId, dispatch])

  // Poll async job
  useEffect(() => {
    if (asyncJob && asyncJob.status === 'processing' && projectId) {
      const interval = setInterval(() => {
        dispatch(pollAsyncJob({ projectId: Number(projectId), jobId: asyncJob.jobId }))
      }, 2000)
      return () => clearInterval(interval)
    }
    if (asyncJob && asyncJob.status === 'completed') {
      message.success('异步导入完成')
      setCurrentStep(4)
    }
    if (asyncJob && asyncJob.status === 'failed') {
      message.error('异步导入失败')
    }
  }, [asyncJob, projectId, dispatch])

  const handleNewImport = useCallback(() => {
    dispatch(clearImportSession())
    setUploadConfig({
      fileList: [],
      importType: 'tb',
      overwriteMode: 'replace',
      period: '',
      headerRowHint: undefined,
    })
    setCurrentStep(0)
    setShowWorkbench(false)
    setViewMode('wizard')
  }, [dispatch])

  const handleOverwriteImport = useCallback((batch: ImportBatch) => {
    dispatch(clearImportSession())
    setUploadConfig({
      fileList: [],
      importType: batch.import_type,
      overwriteMode: 'replace',
      period: batch.period,
      headerRowHint: undefined,
    })
    setCurrentStep(0)
    setShowWorkbench(false)
    setViewMode('wizard')
  }, [dispatch])

  const handleGoToDashboard = useCallback(() => {
    dispatch(clearImportSession())
    setUploadConfig({
      fileList: [],
      importType: 'tb',
      overwriteMode: 'replace',
      period: '',
      headerRowHint: undefined,
    })
    setCurrentStep(0)
    setShowWorkbench(false)
    setViewMode('dashboard')
    if (projectId) {
      dispatch(fetchDashboardBatches({ projectId: Number(projectId), params: {} }))
    }
  }, [dispatch, projectId])

  const handleUpload = useCallback(() => {
    if (!projectId || uploadConfig.fileList.length === 0) return
    const file = uploadConfig.fileList[0].originFileObj as File || uploadConfig.fileList[0] as File
    const headerRowHint0Based = uploadConfig.headerRowHint != null ? uploadConfig.headerRowHint - 1 : undefined
    dispatch(uploadImportFile({
      projectId: Number(projectId),
      file,
      importType: uploadConfig.importType,
      overwriteMode: uploadConfig.overwriteMode,
      period: uploadConfig.period.trim(),
      headerRowHint: headerRowHint0Based,
    }))
      .unwrap()
      .then(() => {
        setCurrentStep(1)
      })
      .catch((err) => {
        message.error(err)
      })
  }, [dispatch, projectId, uploadConfig])

  const handleBackToUpload = useCallback(() => {
    setCurrentStep(0)
  }, [])

  const handleConfirmMapping = useCallback(
    (mapping: Record<string, string>, saveTemplate?: boolean, templateName?: string) => {
      if (!projectId || !previewData) return
      dispatch(confirmColumnMapping({ projectId: Number(projectId), batchId: previewData.batch_id, columnMapping: mapping, saveTemplate, templateName }))
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
        .then((res: any) => {
          if (res.status === 'processing') {
            message.info('大数据量导入已提交异步处理')
          } else {
            setCurrentStep(4)
            message.success('导入成功')
          }
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
    setUploadConfig({
      fileList: [],
      importType: 'tb',
      overwriteMode: 'replace',
      period: '',
      headerRowHint: undefined,
    })
  }, [dispatch])

  const stepItems = STEPS.map((s) => ({ key: s.title, title: s.title }))

  return (
    <div>
      <div className="mb-6">
        <Title level={4} className="!mb-1">导入账簿</Title>
        <Text type="secondary">支持科目余额表（TB）和序时账（JE）的导入、预览、校验与版本管理</Text>
      </div>

      {viewMode === 'dashboard' ? (
        <ImportDashboardHome
          onNewImport={handleNewImport}
          onOverwriteImport={handleOverwriteImport}
        />
      ) : (
        <>
          <Card className="rounded-xl shadow-card mb-6">
            <Steps current={currentStep > 3 ? 3 : currentStep} items={stepItems} className="mb-2" />
          </Card>

          {currentStep === 0 && (
            <UploadStep
              uploading={uploading}
              importType={uploadConfig.importType}
              overwriteMode={uploadConfig.overwriteMode}
              period={uploadConfig.period}
              headerRowHint={uploadConfig.headerRowHint}
              fileList={uploadConfig.fileList}
              existingBatches={previewData?.existing_batches}
              onImportTypeChange={(v) => setUploadConfig((prev) => ({ ...prev, importType: v }))}
              onOverwriteModeChange={(v) => setUploadConfig((prev) => ({ ...prev, overwriteMode: v }))}
              onPeriodChange={(v) => setUploadConfig((prev) => ({ ...prev, period: v }))}
              onHeaderRowHintChange={(v) => setUploadConfig((prev) => ({ ...prev, headerRowHint: v }))}
              onFileListChange={(v) => setUploadConfig((prev) => ({ ...prev, fileList: v }))}
              onUpload={handleUpload}
            />
          )}

          {currentStep === 1 && previewData && (
            <PreviewMappingStep
              previewData={previewData}
              mappingTemplates={mappingTemplates}
              onConfirmMapping={handleConfirmMapping}
              onBackToUpload={handleBackToUpload}
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
                projectId={Number(projectId)}
              />
            )
          )}

          {currentStep === 3 && previewData && validationResult && (
            <CommitStep
              previewData={previewData}
              validationResult={validationResult}
              committing={committing}
              asyncJob={asyncJob}
              onCommit={handleCommit}
            />
          )}

          {currentStep === 4 && (
            <ImportSuccess onReset={handleReset} onGoToDashboard={handleGoToDashboard} />
          )}
        </>
      )}
    </div>
  )
}

export default ImportPage
