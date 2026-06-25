import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const logData = await req.json()

  const prompt = `あなたは総合型選抜（AO入試）の専門コーチです。以下の高校生の活動ログに対してフィードバックを提供してください。

活動日: ${logData.date}
今日やったこと: ${logData.content}
【なぜこの活動をしようと思ったか（動機）】: ${logData.motivation || '未記入'}
出会った人: ${logData.people_met || 'なし'}
【活動中に困ったこと・葛藤した場面（過程）】: ${logData.struggle || '未記入'}
学んだこと・気づき: ${logData.learning || '未記入'}
困ったこと・課題: ${logData.problem || 'なし'}
次にやること: ${logData.next_action || '未定'}

---
【評価の観点】
総合型選抜で合格するには「結果・実績」だけでなく「なぜやったか（動機）→どう取り組んだか（過程）→何を得たか（学び）」の3点セットが必須です。
面接官は「この活動を通じてどう成長しましたか？」と必ず聞きます。

以下のJSON形式で具体的なフィードバックを提供してください：
{
  "meaning": "この活動の意義・価値（2-3文、高校生を励ます内容）",
  "story_quality": "動機→過程→学びのストーリーの完成度評価（「動機が明確」「過程の葛藤が見えない」「学びが表面的」など具体的に2-3文）",
  "admission_points": "総合型選抜で使えるポイント（2-3点、具体的に）",
  "next_suggestions": "次の行動提案（2-3点、具体的に）",
  "deep_questions": "面接で聞かれる深掘り質問（2-3問、今のうちに考えておくべき問い）"
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
