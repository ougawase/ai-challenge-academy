import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { university, faculty, content } = await req.json()

  const prompt = `以下の高校生の志望理由書を添削してください。

志望大学: ${university}
志望学部: ${faculty}
志望理由書本文:
${content}

以下のJSON形式で詳細なフィードバックを提供してください：
{
  "overall": "総合評価（評点5段階と理由）",
  "university_connection": "大学・学部との接続（どれだけその大学でなければならないかの評価）",
  "activity_connection": "活動との接続（自分の経験との結びつきの評価）",
  "originality": "独自性・オリジナリティの評価",
  "logic": "論理性・説得力の評価",
  "improvements": "具体的な改善点（3-5点）",
  "rewrite_example": "最も改善が必要な1段落の書き直し例",
  "interview_questions": "面接で突っ込まれそうな質問と対策（3問）"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const feedback = JSON.parse(jsonMatch[0])

    const { data: essay, error } = await supabase.from('essays').insert({
      user_id: user.id,
      university,
      faculty,
      content,
      ai_feedback: feedback,
    }).select().single()

    if (error) throw error

    return new Response(JSON.stringify({ essay, feedback }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed', raw: text }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
