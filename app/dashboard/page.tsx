import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FolderOpen, BookOpen, FileText, GitMerge, Lightbulb, User, Brain } from 'lucide-react'
import { DailyMission } from '@/components/dashboard/daily-mission'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, projectsRes, logsRes, essaysRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('projects').select('id').eq('user_id', user!.id).eq('status', 'active'),
    supabase.from('activity_logs').select('date').eq('user_id', user!.id).order('date', { ascending: false }),
    supabase.from('essays').select('id').eq('user_id', user!.id),
  ])

  const profile = profileRes.data
  const projects = projectsRes.data || []
  const logs = logsRes.data || []
  const essays = essaysRes.data || []

  // ポートフォリオ完成度
  const sections = [
    !!profile?.name,
    !!profile?.strengths,
    !!profile?.future_goal,
    !!(profile?.target_faculties?.length),
    !!(profile?.application_deadline),
    projects.length > 0,
    logs.length > 0,
    essays.length > 0,
  ]
  const completion = Math.round((sections.filter(Boolean).length / sections.length) * 100)

  // 連続記録日数
  const sortedDates = [...new Set(logs.map((l: { date: string }) => l.date))].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      if (sortedDates[i] === expected) streak++
      else break
    }
  }

  const isNewUser = !profile?.name

  return (
    <div className="space-y-5 max-w-2xl">
      {/* 新規ユーザー案内 */}
      {isNewUser && (
        <Link href="/dashboard/profile">
          <Card className="border-blue-300 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">まずはプロフィールを入力しましょう</p>
                <p className="text-sm text-blue-700">入力すると、AIが今日やることを毎朝提案してくれます</p>
              </div>
              <span className="text-blue-500 font-bold text-lg">→</span>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* AI塾長 + 今日のミッション（クライアントコンポーネント） */}
      <DailyMission />

      {/* ポートフォリオ完成度 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">出願ポートフォリオ完成度</span>
            <span className="text-xl font-bold text-blue-600">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2.5" />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {[
              { done: !!profile?.name, label: '基本情報' },
              { done: !!(profile?.target_faculties?.length), label: '志望学部' },
              { done: !!(profile?.application_deadline), label: '出願日' },
              { done: !!profile?.strengths, label: '強み・軸' },
              { done: projects.length > 0, label: 'プロジェクト' },
              { done: logs.length > 0, label: '活動ログ' },
              { done: essays.length > 0, label: '志望理由書' },
              { done: !!profile?.future_goal, label: '将来の夢' },
            ].map(({ done, label }) => (
              <span key={label} className={`text-xs px-2 py-0.5 rounded-full ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {done ? '✓' : '○'} {label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 統計 */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'プロジェクト', value: projects.length, icon: FolderOpen, color: 'text-blue-500' },
          { label: '活動ログ', value: logs.length, icon: BookOpen, color: 'text-green-500' },
          { label: '志望理由書', value: essays.length, icon: FileText, color: 'text-purple-500' },
          { label: '連続日数', value: streak, icon: Brain, color: 'text-orange-500', suffix: '日' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="text-center">
              <CardContent className="pt-3 pb-3 px-2">
                <Icon className={`h-4 w-4 ${s.color} mx-auto mb-1`} />
                <p className="text-xl font-bold text-gray-800">{s.value}<span className="text-xs font-normal text-gray-400">{s.suffix || ''}</span></p>
                <p className="text-xs text-gray-400 leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* クイックアクション */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-0.5">すべての機能</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { href: '/dashboard/profile', icon: User, label: 'プロフィール', desc: '情報・出願日を入力', color: 'text-gray-500' },
            { href: '/dashboard/guidance', icon: Lightbulb, label: '活動提案', desc: 'AIが活動をデザイン', color: 'text-yellow-500' },
            { href: '/dashboard/activity-logs', icon: BookOpen, label: '活動ログ', desc: '今日の学びを記録', color: 'text-green-500' },
            { href: '/dashboard/projects', icon: FolderOpen, label: 'プロジェクト', desc: '活動計画を管理', color: 'text-blue-500' },
            { href: '/dashboard/essays', icon: FileText, label: '志望理由書', desc: 'AI添削・面接対策', color: 'text-purple-500' },
            { href: '/dashboard/consistency-check', icon: GitMerge, label: '一貫性チェック', desc: 'ストーリーを点検', color: 'text-indigo-500' },
          ].map((a) => {
            const Icon = a.icon
            return (
              <Link key={a.href} href={a.href}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-3 pb-3 px-3">
                    <Icon className={`h-4 w-4 ${a.color} mb-1.5`} />
                    <p className="text-sm font-medium text-gray-800 leading-tight">{a.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
