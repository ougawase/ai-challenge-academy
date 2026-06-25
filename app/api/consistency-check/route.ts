import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: logs }, { data: projects }, { data: essays }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('activity_logs').select('*').order('date', { ascending: false }).limit(10),
    supabase.from('projects').select('*').eq('user_id', user.id).limit(5),
    supabase.from('essays').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
  ])

  const logsSummary = (logs || []).map((l: { date: string; content: string; learning?: string }) =>
    `[${l.date}] ${l.content}${l.learning ? `（学び：${l.learning}）` : ''}`
  ).join('\n') || 'なし'

  const projectsSummary = (projects || []).map((p: { title: string; description?: string }) =>
    `・${p.title}${p.description ? `：${p.description}` : ''}`
  ).join('\n') || 'なし'

  const essaysSummary = (essays || []).map((e: { university?: string; faculty?: string; content?: string }) =>
    `[${e.university || ''}${e.faculty || ''}] ${(e.content || '').slice(0, 200)}...`
  ).join('\n') || 'なし'

  const prompt = `あなたは総合型選抜（AO入試）の専門コンサルタントです。
以下の高校生の「活動ログ」「プロジェクト」「志望理由書」「プロフィール」を横断的に分析し、一貫性チェックを行ってください。

=== プロフィール（志望） ===
名前：${profile?.name || '未入力'}
志望学部系統：${(profile?.target_faculties || []).join('、') || '未入力'}
学部へのこだわり：${profile?.faculty_direction || '未入力'}
志望大学：${(profile?.target_universities || []).join('、') || '未入力'}
将来の夢：${profile?.future_goal || '未入力'}

=== 活動ログ（直近10件） ===
${logsSummary}

=== プロジェクト ===
${projectsSummary}

=== 志望理由書（抜粋） ===
${essaysSummary}

---
【分析の視点】
総合型選抜では「活動→志望理由書→面接」が同じストーリーで語れなければなりません。
審査官は書類一式を見て「この人の軸は何か？」「活動と志望動機が本当に繋がっているか？」を判断します。

以下のJSON形式で一貫性チェックを行ってください：

{
  "overall_score": 0〜100の数値（一貫性スコア）,
  "overall_label": "「ストーリーが一貫している」「やや散漫」「ばらばら」のいずれか",
  "strong_thread": "この生徒のストーリーで一貫しているテーマ・軸（あれば2〜3文。なければ「まだ軸が見えていません」）",
  "inconsistencies": [
    {
      "type": "不一致の種類（例：活動と学部の乖離、志望理由書に活動が反映されていない、など）",
      "detail": "具体的にどこが矛盾・乖離しているか（2〜3文）",
      "fix": "どう修正すればよいか（具体的な行動1文）"
    }
  ],
  "missing_elements": ["志望理由書に書けていない活動", "活動ログに記録されていない実績", "など不足している要素のリスト"],
  "interview_risk": "このままの状態で面接に臨むとどんな質問で詰まる可能性があるか（2〜3文）",
  "recommendation": "今すぐやるべき最優先アクション（1〜2文、具体的に）"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as { type: string; text: string }).text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({ result })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '一貫性チェック中にエラーが発生しました' }, { status: 500 })
  }
}
