'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, ChevronDown, ChevronUp } from 'lucide-react'

interface Log {
  id: string
  date: string
  content: string
  learning: string
  next_action: string
  ai_feedback: {
    meaning: string
    admission_points: string
    next_suggestions: string
    deep_questions: string
  } | null
}

export default function ActivityLogsPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    content: '',
    people_met: '',
    learning: '',
    problem: '',
    next_action: '',
  })

  useEffect(() => { loadLogs() }, [])

  const loadLogs = async () => {
    setLoading(true)
    const { data } = await supabase.from('activity_logs').select('*').order('date', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.content) return
    setSubmitting(true)
    const res = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ date: new Date().toISOString().split('T')[0], content: '', people_met: '', learning: '', problem: '', next_action: '' })
      setShowForm(false)
      await loadLogs()
    }
    setSubmitting(false)
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-4 w-4" />読み込み中...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">活動ログ</h1>
          <p className="text-gray-500 mt-1">日々の活動を記録してAIからフィードバックをもらいましょう</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          記録する
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-200">
          <CardHeader><CardTitle className="text-base">活動を記録する</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">活動日</label>
              <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">今日やったこと *</label>
              <Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} placeholder="どんな活動をしましたか？" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">出会った人・話した人</label>
              <Input value={form.people_met} onChange={(e) => setForm(f => ({ ...f, people_met: e.target.value }))} placeholder="例：地域の農家の方、同年代のボランティア3人" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">学んだこと・気づき</label>
              <Textarea value={form.learning} onChange={(e) => setForm(f => ({ ...f, learning: e.target.value }))} placeholder="活動を通じて何を学びましたか？" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">困ったこと・課題</label>
              <Textarea value={form.problem} onChange={(e) => setForm(f => ({ ...f, problem: e.target.value }))} placeholder="うまくいかなかったことはありましたか？" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">次にやること</label>
              <Input value={form.next_action} onChange={(e) => setForm(f => ({ ...f, next_action: e.target.value }))} placeholder="次のアクションは？" />
            </div>
            <Button onClick={handleSubmit} disabled={submitting || !form.content} className="w-full">
              {submitting ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />AIがフィードバックを生成中...</> : '記録してAIフィードバックを受け取る'}
            </Button>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-gray-500">
            <p>活動ログがまだありません。</p>
            <p className="text-sm mt-1">「記録する」ボタンから最初のログを作成しましょう。</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400">{log.date}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5 line-clamp-2">{log.content}</p>
                </div>
                <button onClick={() => setExpandedId(expandedId === log.id ? null : log.id)} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
                  {expandedId === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </CardHeader>
            {expandedId === log.id && log.ai_feedback && (
              <CardContent className="pt-0 space-y-3 border-t mt-2">
                <div className="bg-blue-50 rounded-lg p-3 space-y-2 text-sm">
                  <p className="font-semibold text-blue-800">AIフィードバック</p>
                  <div>
                    <p className="font-medium text-gray-700">✨ 活動の意義</p>
                    <p className="text-gray-600">{log.ai_feedback.meaning}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">🎯 総合型選抜で使えるポイント</p>
                    <p className="text-gray-600 whitespace-pre-line">{log.ai_feedback.admission_points}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">📋 次の行動提案</p>
                    <p className="text-gray-600 whitespace-pre-line">{log.ai_feedback.next_suggestions}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">🤔 深掘り質問</p>
                    <p className="text-gray-600 whitespace-pre-line">{log.ai_feedback.deep_questions}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
