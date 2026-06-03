import axiosInstance from './axiosInstance'
import { A300CheckResult } from '@/types'

export const a300Api = {
  runAllChecks: (projectId: number) =>
    axiosInstance.get<{ project_id: number; all_passed: boolean; checks: A300CheckResult[] }>(
      `/projects/${projectId}/a300/checks/`
    ),

  runCheck: (projectId: number, rule: string) =>
    axiosInstance.get<A300CheckResult>(`/projects/${projectId}/a300/checks/${rule}/`),
}
