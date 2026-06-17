import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const logData = await req.json()

  const prompt = `以下の高校生の活動ログに対してフィードバックを提供してください。

活動日: ${logData.date}
今日やったこと: ${logData.content}
出会った人: ${logData.people_met || 'なし'}
学んだこと: ${logData.learning || '未記入'}
困ったこと・課題: ${logData.problem || 'なし'}
次にやること: ${logData.next_action || '未定'}

以下のJSON形式で励ましのフィードバックを提供してください：
{
  "meaning": "この活動の意義・価値（2-3文、高校生を励ます内容）",
  "admission_points": "総合型選抜で使えるポイント（2-3点、具体的に）",
  "next_suggestions": "次の行動提案（2-3点、具体的に）",
  "deep_questions": "深掘り質問（2-3問、振り返りを促す）"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const feedback = JSON.parse(jsonMatch[0])

    const { data: log, error } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      project_id: logData.project_id || null,
      date: logData.date,
      content: logData.content,
      people_met: logData.people_met,
      learning: logData.learning,
      problem: logData.problem,
      next_action: logData.next_action,
      ai_feedback: feedback,
    }).select().single()

    if (error) throw error

    return new Response(JSON.stringify({ log, feedback }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed', raw: text }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
