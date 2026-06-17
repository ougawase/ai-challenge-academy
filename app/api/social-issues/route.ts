import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { profile, selfAnalysis } = await req.json()

  const prompt = `以下の生徒情報に基づいて、総合型選抜に向けた社会課題を5つ提案してください。

生徒情報：
- 名前: ${profile.name || '不明'}
- 学年: ${profile.grade || '不明'}
- 地域: ${profile.location || '不明'}
- 興味・関心: ${(profile.interests || []).join(', ') || '不明'}
- 強み: ${profile.strengths || '不明'}
- 将来の夢: ${profile.future_goal || '不明'}
- 志望大学: ${(profile.target_universities || []).join(', ') || '不明'}

自己分析結果：
- 生徒タイプ: ${selfAnalysis?.personality_type || '未実施'}
- 推奨テーマ: ${(selfAnalysis?.recommended_themes || []).join(', ') || '未実施'}
- 総合型選抜の軸: ${selfAnalysis?.admission_axis || '未実施'}

以下のJSON形式で回答してください：
{
  "issues": [
    {
      "title": "課題タイトル（例：地方の教育格差）",
      "description": "課題の概要（2-3文）",
      "reason": "なぜこの生徒に向いているか（2-3文）",
      "difficulty": "難易度（easy/medium/hard）",
      "university_connection": "志望大学との接続（1-2文）",
      "action_ideas": "3ヶ月でできる具体的な行動案（箇条書き3-4点）"
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const data = JSON.parse(jsonMatch[0])

    // Save to database
    if (data.issues) {
      for (const issue of data.issues) {
        await supabase.from('social_issues').insert({
          user_id: user.id,
          title: issue.title,
          description: issue.description,
          reason: issue.reason,
          difficulty: issue.difficulty,
          university_connection: issue.university_connection,
          action_ideas: issue.action_ideas,
          is_selected: false,
        })
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to parse response', raw: text }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
