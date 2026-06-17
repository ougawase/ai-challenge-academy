'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const STARTER_MESSAGES: Message[] = [
  {
    role: 'assistant',
    content: 'こんにちは！AI Challenge Academyのカウンセラーです😊\n\nこのセッションでは、あなたの強みや関心を一緒に探していきます。まず、最近あなたが「これは面白いな」「もっと知りたいな」と感じた社会のできごとや出来事はありますか？どんな些細なことでも構いません。',
  },
]

export default function SelfAnalysisPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(STARTER_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let text = ''

      setMessages([...newMessages, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value)
        setMessages([...newMessages, { role: 'assistant', content: text }])
      }

      // Check for summary JSON
      const summaryMatch = text.match(/<summary>([\s\S]*?)<\/summary>/)
      if (summaryMatch) {
        try {
          const parsed = JSON.parse(summaryMatch[1])
          setSummary(parsed)
        } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const saveSummary = async () => {
    if (!summary) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('self_analysis_results').insert({
      user_id: user.id,
      personality_type: (summary as Record<string, string>).personality_type,
      strengths: (summary as Record<string, string>).strengths,
      recommended_themes: (summary as Record<string, string[]>).recommended_themes,
      admission_axis: (summary as Record<string, string>).admission_axis,
      summary: (summary as Record<string, string>).overview,
      chat_history: messages,
    })

    setSaving(false)
    setSaved(true)
  }

  const requestSummary = () => {
    setInput('これまでの対話を踏まえて、私の自己分析のまとめをしてください。')
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI自己分析チャット</h1>
        <p className="text-gray-500 mt-1">AIカウンセラーとの対話を通じて、自分の軸を見つけましょう</p>
      </div>

      {/* Chat */}
      <Card className="flex flex-col" style={{ height: '60vh' }}>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {msg.role === 'assistant' ? <Bot className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-gray-600" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'bg-gray-50 text-gray-800' : 'bg-blue-600 text-white'}`}>
                {msg.content.replace(/<summary>[\s\S]*?<\/summary>/g, '')}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-gray-50 text-gray-400 text-sm">
                考え中...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
        <div className="border-t p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力（Enterで送信）"
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Actions */}
      {messages.length >= 5 && !summary && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={requestSummary}>
            🎯 自己分析をまとめてもらう
          </Button>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">🎉 自己分析結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">生徒タイプ</p>
              <Badge className="bg-green-100 text-green-800">{(summary as Record<string, string>).personality_type}</Badge>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">強み</p>
              <p className="text-sm text-gray-700">{(summary as Record<string, string>).strengths}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">関心テーマ</p>
              <div className="flex flex-wrap gap-2">
                {((summary as Record<string, string[]>).recommended_themes || []).map((t, i) => (
                  <Badge key={i} variant="outline" className="border-green-300">{t}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">総合型選抜で使えそうな軸</p>
              <p className="text-sm text-gray-700 font-medium">{(summary as Record<string, string>).admission_axis}</p>
            </div>
            {!saved && (
              <Button onClick={saveSummary} disabled={saving} className="w-full">
                {saving ? '保存中...' : '結果を保存する'}
              </Button>
            )}
            {saved && (
              <p className="text-sm text-green-600 text-center">✓ 保存しました。次は社会課題診断を試してみましょう！</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
