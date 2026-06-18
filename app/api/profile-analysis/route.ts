import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await req.json()

  const prompt = `あなたは総合型選抜（AO入試）の専門コンサルタントです。
以下の高校生のプロフィールを分析し、現状レポートと次のアクション提案を行ってください。

=== プロフィール ===
名前：${profile.name || '未入力'}
学年：${profile.grade || '未入力'}
学校：${profile.school_name || '未入力'}
地域：${profile.location || '未入力'}
興味・関心：${(profile.interests || []).join('、') || '未入力'}
志望学部系統：${(profile.target_faculties || []).join('、') || '未入力'}
学部へのこだわり・理由：${profile.faculty_direction || '未入力'}
強み：${profile.strengths || '未入力'}
弱み：${profile.weaknesses || '未入力'}
将来の夢：${profile.future_goal || '未入力'}
志望大学：${(profile.target_universities || []).join('、') || '未入力'}
これまでの活動・実績：${profile.achievements || 'なし'}
資格・検定：${profile.qualifications || 'なし'}

---
以下のJSON形式で出力してください。日本語で、高校生に語りかけるような温かいトーンで書いてください。

{
  "readiness_score": 0〜100の数値（総合型選抜への準備度）,
  "readiness_label": "準備度のラベル（例：「まだ始まったばかり」「基礎はできている」「出願準備に入れる」）",
  "strengths": ["強み1", "強み2", "強み3"],
  "strengths_comment": "強みについての励ましコメント（2〜3文）",
  "current_issues": ["課題1", "課題2"],
  "current_issues_comment": "課題についての建設的なコメント（2〜3文）",
  "path_achievement": {
    "title": "実績・活動を積み上げる",
    "reason": "このパスを勧める理由（この生徒の状況に合わせて具体的に。2〜3文）",
    "first_step": "最初の一歩（具体的な行動。1文）"
  },
  "path_essay": {
    "title": "志望理由書を書き始める",
    "reason": "このパスを勧める理由（この生徒の状況に合わせて具体的に。2〜3文）",
    "first_step": "最初の一歩（具体的な行動。1文）"
  },
  "recommended_path": "achievement" または "essay"（どちらをより強く勧めるか）,
  "message": "この生徒への個人的なメッセージ（名前を呼んで、2〜3文。具体的で温かく）"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as { type: string; text: string }).text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const analysis = JSON.parse(jsonMatch[0])

    return NextResponse.json({ analysis })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '分析中にエラーが発生しました' }, { status: 500 })
  }
}
