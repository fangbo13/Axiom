import { Outlet, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Layout } from 'antd'
import { RootState, AppDispatch } from '@/store'
import { setActiveProject, fetchProjects } from '@/features/projects/projectSlice'
import ProjectSidebar from '@/components/ProjectSidebar'
import ProjectHeader from '@/components/ProjectHeader'

const { Content } = Layout

const ProjectLayout = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { projects, activeProject } = useSelector((state: RootState) => state.projects)

  useEffect(() => {
    if (projects.length === 0) {
      dispatch(fetchProjects())
    }
  }, [dispatch, projects.length])

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === Number(projectId))
      if (project && (!activeProject || activeProject.id !== project.id)) {
        dispatch(setActiveProject(project))
      }
    }
  }, [projectId, projects, activeProject, dispatch])

  return (
    <Layout className="min-h-screen">
      <ProjectSidebar />
      <Layout>
        <ProjectHeader />
        <Content className="m-4 p-0">
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6 min-h-[calc(100vh-140px)]">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default ProjectLayout
