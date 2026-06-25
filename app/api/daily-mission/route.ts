import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getPhase(daysLeft: number | null): { name: string; label: string; color: string } {
  if (daysLeft === null) return { name: 'unknown', label: '出願日未設定', color: 'gray' }
  if (daysLeft > 120) return { name: 'build', label: '活動構築期', color: 'blue' }
  if (daysLeft > 60) return { name: 'deepen', label: '深掘り期', color: 'purple' }
  if (daysLeft > 30) return { name: 'essay', label: '書類作成期', color: 'orange' }
  return { name: 'final', label: '最終仕上げ期', color: 'red' }
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: logs }, { data: projects }, { data: essays }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('activity_logs').select('date, content').order('date', { ascending: false }).limit(5),
    supabase.from('projects').select('title, status').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('essays').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
  ])

  const today = new Date()
  const deadline = profile?.application_deadline ? new Date(profile.application_deadline) : null
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
  const phase = getPhase(daysLeft)

  const lastLogDate = logs?.[0]?.date
  const daysSinceLog = lastLogDate
    ? Math.floor((today.getTime() - new Date(lastLogDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  const recentLogs = (logs || []).map((l: { date: string; content: string }) => `[${l.date}] ${l.content}`).join('\n') || 'なし'
  const activeProjects = (projects || []).map((p: { title: string }) => p.title).join('、') || 'なし'

  const prompt = `あなたはAO入試専門の個別指導塾の塾長です。
担当している生徒に対して、今日（${today.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}）に取り組むべきミッションを3つ提示してください。

=== 生徒の状況 ===
名前：${profile?.name || '未入力'}
学年：${profile?.grade || '未入力'}
志望学部：${(profile?.target_faculties || []).join('、') || '未入力'}
志望大学：${(profile?.target_universities || []).join('、') || '未入力'}
出願まで：${daysLeft !== null ? `${daysLeft}日` : '未設定'}
現在フェーズ：${phase.label}
活動中プロジェクト：${activeProjects}
直近の活動ログ：${recentLogs}
最後のログから：${daysSinceLog === 999 ? 'ログなし' : `${daysSinceLog}日経過`}
志望理由書の提出：${essays && essays.length > 0 ? 'あり' : 'まだ'}

=== フェーズ別の優先事項 ===
- 活動構築期（120日以上）：新しい活動を始める、ログを習慣化する
- 深掘り期（60〜120日）：既存の活動を深める、大学研究を始める
- 書類作成期（30〜60日）：志望理由書の執筆、一貫性チェック
- 最終仕上げ期（30日以内）：書類のブラッシュアップ、面接練習

以下のJSON形式で、この生徒への今日のミッションを出力してください：

{
  "greeting": "生徒への朝の一言（名前を呼んで、今日の気持ちを上げる一文）",
  "sensei_note": "塾長からの今日の一言（状況に合わせた具体的なアドバイス。1〜2文）",
  "missions": [
    {
      "priority": "urgent（緊急）, important（重要）, optional（任意）のいずれか",
      "title": "ミッションのタイトル（10字以内）",
      "description": "具体的に何をするか（1文）",
      "time_estimate": "所要時間の目安（例：15分、1時間）",
      "href": "対応するページのパス（例：/dashboard/activity-logs, /dashboard/essays, /dashboard/guidance, /dashboard/projects, /dashboard/consistency-check）"
    }
  ]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as { type: string; text: string }).text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      ...result,
      phase,
      daysLeft,
      streak: daysSinceLog <= 1 ? (logs?.length || 0) : 0,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'ミッション生成中にエラーが発生しました' }, { status: 500 })
  }
}
