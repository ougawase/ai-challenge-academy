import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, FolderOpen } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プロジェクト</h1>
          <p className="text-gray-500 mt-1">社会課題に取り組むプロジェクトを管理します</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規プロジェクト
          </Button>
        </Link>
      </div>

      {(!projects || projects.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">まだプロジェクトがありません。</p>
            <Link href="/dashboard/projects/new">
              <Button>最初のプロジェクトを作成する</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {(projects || []).map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">対象: {project.target}</p>
                </div>
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                  {project.status === 'active' ? '進行中' : project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">{project.description}</p>
              {project.week1_tasks && Array.isArray(project.week1_tasks) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">今週のタスク</p>
                  <ul className="space-y-1">
                    {project.week1_tasks.slice(0, 3).map((task: string, i: number) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-2">
                        <span className="text-gray-400">•</span>{task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {project.success_metrics && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">成果指標</p>
                  <p className="text-xs text-gray-600">{project.success_metrics}</p>
                </div>
              )}
              <div className="pt-2">
                <Link href={`/dashboard/activity-logs?project_id=${project.id}`}>
                  <Button variant="outline" size="sm">活動ログを記録する</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
