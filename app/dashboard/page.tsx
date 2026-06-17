import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, Globe, FolderOpen, BookOpen, FileText, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, projectsRes, logsRes, essaysRes, analysisRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('projects').select('*').eq('user_id', user!.id).eq('status', 'active'),
    supabase.from('activity_logs').select('*').eq('user_id', user!.id),
    supabase.from('essays').select('*').eq('user_id', user!.id),
    supabase.from('self_analysis_results').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(1).single(),
  ])

  const profile = profileRes.data
  const projects = projectsRes.data || []
  const logs = logsRes.data || []
  const essays = essaysRes.data || []
  const analysis = analysisRes.data

  // Calculate portfolio completion
  const sections = [
    !!profile?.name,
    !!profile?.strengths,
    !!profile?.future_goal,
    !!analysis,
    projects.length > 0,
    logs.length > 0,
    essays.length > 0,
  ]
  const completion = Math.round((sections.filter(Boolean).length / sections.length) * 100)

  const today = new Date().toISOString().split('T')[0]
  const todayTasks: string[] = []
  projects.forEach((p) => {
    if (p.week1_tasks && Array.isArray(p.week1_tasks)) {
      todayTasks.push(...(p.week1_tasks as string[]).slice(0, 2))
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          こんにちは、{profile?.name || 'さん'} 👋
        </h1>
        <p className="text-gray-500 mt-1">今日も一歩ずつ前進しましょう</p>
      </div>

      {/* Portfolio Progress */}
      <Card className="border-blue-100 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-blue-800">ポートフォリオ完成度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={completion} className="flex-1 h-3" />
            <span className="text-2xl font-bold text-blue-700">{completion}%</span>
          </div>
          {completion < 100 && (
            <p className="text-sm text-blue-600 mt-2">
              {!profile?.name && 'プロフィールを入力して '}
              {!analysis && '自己分析を完了して '}
              {projects.length === 0 && 'プロジェクトを作成して '}
              完成度を上げましょう
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '活動中プロジェクト', value: projects.length, icon: FolderOpen, color: 'text-blue-600' },
          { label: '活動ログ', value: logs.length, icon: BookOpen, color: 'text-green-600' },
          { label: '志望理由書', value: essays.length, icon: FileText, color: 'text-purple-600' },
          { label: '活動日数', value: new Set(logs.map((l) => l.date)).size, icon: Brain, color: 'text-orange-600' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <Icon className={`h-5 w-5 ${s.color} mb-1`} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* AI Next Suggestion */}
      {analysis && (
        <Card className="border-green-100 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-green-800">🤖 AIからの提案</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              あなたの軸：<strong>{analysis.admission_axis}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              今日は活動ログを記録して、AIにフィードバックをもらいましょう。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">クイックアクション</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { href: '/dashboard/self-analysis', icon: Brain, label: 'AI自己分析を始める', desc: 'AIカウンセラーと対話', color: 'blue' },
            { href: '/dashboard/social-issues', icon: Globe, label: '社会課題を診断する', desc: '取り組む課題を見つける', color: 'green' },
            { href: '/dashboard/projects/new', icon: FolderOpen, label: 'プロジェクトを作る', desc: '活動計画を立てる', color: 'purple' },
            { href: '/dashboard/activity-logs', icon: BookOpen, label: '活動を記録する', desc: '今日の学びを残す', color: 'orange' },
            { href: '/dashboard/essays', icon: FileText, label: '志望理由書を書く', desc: 'AIに添削してもらう', color: 'pink' },
            { href: '/dashboard/profile', icon: Brain, label: 'プロフィール更新', desc: '自分の情報を充実させる', color: 'gray' },
          ].map((a) => {
            const Icon = a.icon
            return (
              <Link key={a.href} href={a.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <Icon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800">{a.label}</p>
                      <p className="text-xs text-gray-500">{a.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">今日のタスク</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {todayTasks.map((task, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-0.5">▸</span>
                  <span className="text-gray-700">{task}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
