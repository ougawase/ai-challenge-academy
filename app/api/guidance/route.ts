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
以下の高校生のプロフィールをもとに、この生徒が今すぐ取り組める「活動・実績作り」を具体的に提案してください。

=== プロフィール ===
名前：${profile.name || '未入力'}
学年：${profile.grade || '未入力'}
学校：${profile.school_name || '未入力'}
地域：${profile.location || '未入力'}
興味・関心：${(profile.interests || []).join('、') || '未入力'}
志望学部系統：${(profile.target_faculties || []).join('、') || '未入力'}
学部へのこだわり・理由：${profile.faculty_direction || '未入力'}
強み：${profile.strengths || '未入力'}
将来の夢：${profile.future_goal || '未入力'}
志望大学：${(profile.target_universities || []).join('、') || '未入力'}
これまでの活動・実績：${profile.achievements || 'なし'}
資格・検定：${profile.qualifications || 'なし'}

---
【重要な前提】
- 高校生が実際に1〜3ヶ月で取り組める規模の活動を提案すること
- 地域・興味・強みを必ず活かした具体的な活動にすること
- 「地域課題調査」「アンケート実施」「SNS発信」「勉強会開催」「地元企業へのインタビュー」など実行可能なものにすること
- 【最重要】志望学部系統と活動内容を必ず接続すること。例えば「法学・政治学」志望なら制度・政策・ルール形成の視点を、「経済学・経営学」志望なら事業化・コスト・市場の視点を活動に組み込む
- 活動を通じて「なぜその学部で学びたいか」の動機が自然に生まれるよう設計すること
- 志望理由書で「活動経験→学部での学び→将来」のストーリーが書けるような活動にすること
- 「何となく良さそう」ではなく「この生徒だからこそ・この学部だからこそ」の理由を書くこと

以下のJSON形式で、活動提案を3〜4個出力してください：

{
  "intro": "この生徒への導入メッセージ（名前を呼んで、なぜ今活動が大事かを1〜2文で）",
  "activities": [
    {
      "title": "活動名（短く具体的に）",
      "category": "カテゴリ（例：地域調査、SNS発信、イベント企画、インタビュー、勉強会など）",
      "description": "活動の概要（2〜3文。具体的に何をするか）",
      "why_you": "なぜこの生徒に向いているか（プロフィールの具体的な要素を引用して2文）",
      "university_connection": "志望大学・学部とのつながり（1〜2文）",
      "difficulty": "easy または medium または hard",
      "duration": "期間の目安（例：2週間、1ヶ月、3ヶ月）",
      "week1_actions": [
        "今週やること①（具体的なアクション）",
        "今週やること②",
        "今週やること③"
      ],
      "outcome": "3ヶ月後に得られる成果・実績（志望理由書に書けるレベルで）"
    }
  ]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as { type: string; text: string }).text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const guidance = JSON.parse(jsonMatch[0])

    return NextResponse.json({ guidance })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '提案の生成中にエラーが発生しました' }, { status: 500 })
  }
}
