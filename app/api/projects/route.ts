import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { issue, location, availableTime, collaborators, skills, targetUniversity } = await req.json()

  const prompt = `以下の条件に基づいて、高校生が取り組む社会課題プロジェクト提案書を作成してください。

社会課題: ${issue}
活動地域: ${location}
使える時間: ${availableTime}
一緒に活動できる人: ${collaborators}
得意なこと・スキル: ${skills}
志望大学: ${targetUniversity}

以下のJSON形式で詳細な提案を作成してください：
{
  "title": "プロジェクト名（キャッチーで覚えやすい）",
  "issue": "解決する課題の定義（2-3文）",
  "hypothesis": "仮説（このプロジェクトで何が解決できると考えるか）",
  "target": "対象者・受益者",
  "description": "活動内容の説明（3-5文）",
  "roadmap": [
    {"week": "1ヶ月目", "tasks": ["タスク1", "タスク2", "タスク3"]},
    {"week": "2ヶ月目", "tasks": ["タスク1", "タスク2", "タスク3"]},
    {"week": "3ヶ月目", "tasks": ["タスク1", "タスク2", "タスク3"]}
  ],
  "week1_tasks": ["最初の7日間タスク1", "タスク2", "タスク3", "タスク4", "タスク5"],
  "dm_template": "最初にコンタクトする相手へのDM文案（メール・SNS両用）",
  "survey_template": "ヒアリングで使えるアンケート案（5-7問）",
  "success_metrics": "成果の測定方法（具体的な数字や指標）"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const data = JSON.parse(jsonMatch[0])

    const { data: project, error } = await supabase.from('projects').insert({
      user_id: user.id,
      ...data,
      status: 'active',
    }).select().single()

    if (error) throw error

    return new Response(JSON.stringify(project), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed', raw: text }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
