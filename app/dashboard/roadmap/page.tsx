import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle2, Circle, MapPin, ArrowRight } from 'lucide-react'

interface Milestone {
  id: string
  title: string
  href?: string
  done: boolean
  critical?: boolean
}

interface Phase {
  id: string
  label: string
  sublabel: string
  color: string
  bg: string
  border: string
  activeBg: string
  daysRange: string
  milestones: Milestone[]
  isCurrent: boolean
  isDone: boolean
}

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: projects }, { data: logs }, { data: essays }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('projects').select('id, title').eq('user_id', user!.id),
    supabase.from('activity_logs').select('date').eq('user_id', user!.id),
    supabase.from('essays').select('id').eq('user_id', user!.id),
  ])

  const today = new Date()
  const deadline = profile?.application_deadline ? new Date(profile.application_deadline) : null
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null

  // フェーズ判定
  const currentPhaseId =
    daysLeft === null ? 'build'
    : daysLeft > 120 ? 'build'
    : daysLeft > 60 ? 'deepen'
    : daysLeft > 30 ? 'essay'
    : 'final'

  // 完了チェック
  const hasProfile = !!(profile?.name && profile?.strengths && profile?.future_goal)
  const hasAxis = !!(profile?.faculty_direction || (profile?.target_faculties?.length > 0))
  const hasUniversity = !!(profile?.target_universities?.length > 0)
  const hasDeadline = !!profile?.application_deadline
  const hasProject = (projects?.length ?? 0) > 0
  const hasLog = (logs?.length ?? 0) > 0
  const hasEnoughLogs = (logs?.length ?? 0) >= 5
  const hasEssay = (essays?.length ?? 0) > 0
  const hasMultipleEssays = (essays?.length ?? 0) >= 2

  const phases: Phase[] = [
    {
      id: 'build',
      label: 'フェーズ 1',
      sublabel: '活動構築期',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      activeBg: 'bg-blue-600',
      daysRange: '出願6ヶ月以上前',
      isCurrent: currentPhaseId === 'build',
      isDone: currentPhaseId !== 'build',
      milestones: [
        { id: 'profile', title: 'プロフィールを完成させる', href: '/dashboard/profile', done: hasProfile, critical: true },
        { id: 'axis', title: '志望学部・軸を言語化する', href: '/dashboard/profile', done: hasAxis, critical: true },
        { id: 'deadline', title: '出願日を登録する', href: '/dashboard/profile', done: hasDeadline },
        { id: 'project', title: '取り組む活動を1つ選ぶ', href: '/dashboard/guidance', done: hasProject, critical: true },
        { id: 'log-start', title: '活動ログを書き始める', href: '/dashboard/activity-logs', done: hasLog },
        { id: 'log-habit', title: 'ログを5件以上積み上げる', href: '/dashboard/activity-logs', done: hasEnoughLogs },
      ],
    },
    {
      id: 'deepen',
      label: 'フェーズ 2',
      sublabel: '深掘り期',
      color: 'text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      activeBg: 'bg-purple-600',
      daysRange: '出願3〜6ヶ月前',
      isCurrent: currentPhaseId === 'deepen',
      isDone: ['essay', 'final'].includes(currentPhaseId),
      milestones: [
        { id: 'univ', title: '志望大学を絞り込む', href: '/dashboard/profile', done: hasUniversity },
        { id: 'ap', title: '各大学のAPを熟読する', done: hasUniversity },
        { id: 'activity-deepen', title: '活動と学部の接続を深める', href: '/dashboard/activity-logs', done: hasEnoughLogs },
        { id: 'consistency1', title: '一貫性チェックを実施する', href: '/dashboard/consistency-check', done: false },
        { id: 'guidance2', title: '活動提案で次の活動を考える', href: '/dashboard/guidance', done: (projects?.length ?? 0) >= 2 },
      ],
    },
    {
      id: 'essay',
      label: 'フェーズ 3',
      sublabel: '書類作成期',
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      activeBg: 'bg-orange-500',
      daysRange: '出願1〜3ヶ月前',
      isCurrent: currentPhaseId === 'essay',
      isDone: currentPhaseId === 'final',
      milestones: [
        { id: 'essay-draft', title: '志望理由書の初稿を書く', href: '/dashboard/essays', done: hasEssay, critical: true },
        { id: 'essay-review1', title: 'AIに第1回添削を受ける', href: '/dashboard/essays', done: hasEssay },
        { id: 'essay-review2', title: '第2回添削で完成度を上げる', href: '/dashboard/essays', done: hasMultipleEssays },
        { id: 'interview-prep', title: '面接想定質問を生成する', href: '/dashboard/essays', done: false },
        { id: 'interview-practice', title: '面接回答を5問練習する', href: '/dashboard/essays', done: false },
        { id: 'consistency2', title: '最終一貫性チェックを実施', href: '/dashboard/consistency-check', done: false, critical: true },
      ],
    },
    {
      id: 'final',
      label: 'フェーズ 4',
      sublabel: '最終仕上げ期',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      activeBg: 'bg-red-600',
      daysRange: '出願1ヶ月前〜当日',
      isCurrent: currentPhaseId === 'final',
      isDone: false,
      milestones: [
        { id: 'final-essay', title: '書類を最終確認する', href: '/dashboard/essays', done: false },
        { id: 'final-interview', title: '模擬面接を複数回行う', href: '/dashboard/essays', done: false },
        { id: 'final-consistency', title: '全書類の一貫性を最終確認', href: '/dashboard/consistency-check', done: false },
        { id: 'submit', title: '出願書類を提出する', done: false, critical: true },
      ],
    },
  ]

  const allMilestones = phases.flatMap(p => p.milestones)
  const completedCount = allMilestones.filter(m => m.done).length
  const totalCount = allMilestones.length
  const overallPct = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="max-w-xl space-y-6 pb-12">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">合格ロードマップ</h1>
        <p className="text-gray-500 mt-1 text-sm">出願日から逆算した、あなただけのカリキュラムです</p>
      </div>

      {/* 進捗サマリ */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-400 text-xs font-medium">全体の達成率</p>
            <p className="text-3xl font-bold mt-0.5">{overallPct}%</p>
          </div>
          <div className="text-right">
            {daysLeft !== null ? (
              <>
                <p className="text-slate-400 text-xs font-medium">出願まで</p>
                <p className="text-2xl font-bold text-white mt-0.5">{daysLeft}<span className="text-sm font-normal text-slate-300 ml-1">日</span></p>
              </>
            ) : (
              <Link href="/dashboard/profile" className="text-xs text-blue-300 underline">出願日を登録する →</Link>
            )}
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
        </div>
        <p className="text-slate-400 text-xs mt-2">{completedCount} / {totalCount} 項目完了</p>
      </div>

      {/* フェーズタイムライン */}
      <div className="space-y-4">
        {phases.map((phase, phaseIdx) => (
          <div key={phase.id} className="relative">
            {/* フェーズ接続線 */}
            {phaseIdx < phases.length - 1 && (
              <div className="absolute left-[1.125rem] top-full h-4 w-0.5 bg-gray-200 z-0" />
            )}

            <div className={`rounded-2xl border-2 overflow-hidden transition-all ${
              phase.isCurrent
                ? `${phase.border} shadow-md`
                : phase.isDone
                ? 'border-gray-100 bg-gray-50/50'
                : 'border-gray-100'
            }`}>
              {/* フェーズヘッダー */}
              <div className={`px-4 py-3 flex items-center gap-3 ${phase.isCurrent ? phase.bg : phase.isDone ? 'bg-gray-50' : 'bg-white'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  phase.isDone ? 'bg-gray-300 text-gray-600' : phase.isCurrent ? `${phase.activeBg} text-white` : 'bg-gray-100 text-gray-400'
                }`}>
                  {phase.isDone ? '✓' : phaseIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-400">{phase.label}</span>
                    <span className={`font-bold text-sm ${phase.isDone ? 'text-gray-400' : phase.isCurrent ? phase.color : 'text-gray-500'}`}>
                      {phase.sublabel}
                    </span>
                    {phase.isCurrent && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold text-white ${phase.activeBg} flex items-center gap-1`}>
                        <MapPin className="h-2.5 w-2.5" /> 今ここ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{phase.daysRange}</p>
                </div>
                <span className="text-xs font-semibold text-gray-400 flex-shrink-0">
                  {phase.milestones.filter(m => m.done).length}/{phase.milestones.length}
                </span>
              </div>

              {/* マイルストーン一覧 */}
              <div className={`divide-y ${phase.isDone ? 'divide-gray-100' : 'divide-gray-100'}`}>
                {phase.milestones.map((m) => {
                  const content = (
                    <div className={`flex items-center gap-3 px-4 py-3 group ${
                      m.href && !m.done ? 'hover:bg-gray-50 cursor-pointer' : ''
                    }`}>
                      {m.done ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className={`h-5 w-5 flex-shrink-0 ${
                          phase.isCurrent ? 'text-gray-300' : 'text-gray-200'
                        }`} />
                      )}
                      <span className={`text-sm flex-1 ${
                        m.done ? 'text-gray-400 line-through' : phase.isCurrent ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {m.title}
                        {m.critical && !m.done && (
                          <span className="ml-2 text-xs text-orange-500 font-medium">必須</span>
                        )}
                      </span>
                      {m.href && !m.done && phase.isCurrent && (
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                      )}
                    </div>
                  )

                  return m.href && !m.done ? (
                    <Link key={m.id} href={m.href}>{content}</Link>
                  ) : (
                    <div key={m.id}>{content}</div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        {/* ゴール */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-base">🎓</span>
          </div>
          <div>
            <p className="font-bold text-gray-800">出願・合格</p>
            {deadline && (
              <p className="text-xs text-gray-400">{deadline.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            )}
          </div>
        </div>
      </div>

      {!profile?.application_deadline && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          <strong>出願日を登録すると、各フェーズに「残り日数」が表示されます。</strong><br />
          <Link href="/dashboard/profile" className="underline mt-1 inline-block">プロフィールで設定する →</Link>
        </div>
      )}
    </div>
  )
}
