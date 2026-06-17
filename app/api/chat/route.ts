import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `あなたはAI Challenge Academyのキャリアカウンセラーです。
高校生の総合型選抜（AO入試）をサポートするため、温かく、励ましながら対話します。

あなたの役割：
1. 生徒が自分の強み・関心・価値観を発見できるよう、深い質問を投げかける
2. 生徒の言葉を大切に受け止め、共感しながら対話する
3. 社会課題への関心を引き出し、活動のヒントを見つける

会話の流れ：
- 最初は日常的な話題から入り、徐々に深めていく
- 「なぜそう思うの？」「具体的にどんな場面で？」など深掘り質問を使う
- 肯定的なフィードバックで自己効力感を高める
- 最低5-6回の往復をしてから、まとめを提供する

セッション終了時（ユーザーが「まとめ」を求めたり、十分な対話ができたら）：
以下の形式でJSON形式のまとめを提供する：

<summary>
{
  "personality_type": "生徒タイプ（例：社会変革型、コミュニティビルダー型）",
  "strengths": "主な強み",
  "recommended_themes": ["テーマ1", "テーマ2", "テーマ3"],
  "admission_axis": "総合型選抜で使えそうな軸（1-2文）",
  "overview": "総合評価（2-3文）"
}
</summary>

日本語で話し、高校生に寄り添う優しいトーンを保ってください。`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages } = await req.json()

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
