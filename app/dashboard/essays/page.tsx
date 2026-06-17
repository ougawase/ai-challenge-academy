'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, ChevronDown, ChevronUp, FileText } from 'lucide-react'

interface Essay {
  id: string
  university: string
  faculty: string
  content: string
  created_at: string
  ai_feedback: {
    overall: string
    university_connection: string
    activity_connection: string
    originality: string
    logic: string
    improvements: string
    rewrite_example: string
    interview_questions: string
  } | null
}

export default function EssaysPage() {
  const supabase = createClient()
  const [essays, setEssays] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ university: '', faculty: '', content: '' })

  useEffect(() => { loadEssays() }, [])

  const loadEssays = async () => {
    setLoading(true)
    const { data } = await supabase.from('essays').select('*').order('created_at', { ascending: false })
    setEssays(data || [])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.content || !form.university) return
    setSubmitting(true)
    const res = await fetch('/api/essays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const { essay } = await res.json()
      setEssays(prev => [essay, ...prev])
      setExpandedId(essay.id)
      setForm({ university: '', faculty: '', content: '' })
      setShowForm(false)
    }
    setSubmitting(false)
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-4 w-4" />読み込み中...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">志望理由書</h1>
          <p className="text-gray-500 mt-1">AIが志望理由書を8つの観点で詳しく添削します</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          添削してもらう
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-200">
          <CardHeader><CardTitle className="text-base">志望理由書を入力</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">志望大学 *</label>
                <Input value={form.university} onChange={(e) => setForm(f => ({ ...f, university: e.target.value }))} placeholder="例：早稲田大学" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">志望学部</label>
                <Input value={form.faculty} onChange={(e) => setForm(f => ({ ...f, faculty: e.target.value }))} placeholder="例：政治経済学部" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">志望理由書本文 *</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="志望理由書の本文を貼り付けてください..."
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{form.content.length}文字</p>
            </div>
            <Button onClick={handleSubmit} disabled={submitting || !form.content || !form.university} className="w-full">
              {submitting ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />AIが添削中（30秒ほどかかります）...</> : 'AIに添削してもらう'}
            </Button>
          </CardContent>
        </Card>
      )}

      {essays.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">まだ志望理由書がありません。</p>
            <p className="text-sm text-gray-400">「添削してもらう」ボタンから志望理由書を入力してAIの添削を受け取りましょう。</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {essays.map((essay) => (
          <Card key={essay.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{essay.university} {essay.faculty}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(essay.created_at).toLocaleDateString('ja-JP')}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{essay.content.slice(0, 100)}...</p>
                </div>
                <button onClick={() => setExpandedId(expandedId === essay.id ? null : essay.id)} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
                  {expandedId === essay.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </CardHeader>
            {expandedId === essay.id && essay.ai_feedback && (
              <CardContent className="pt-0 border-t mt-2 space-y-4 text-sm">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <p className="font-bold text-amber-900">AI添削結果</p>
                  {[
                    { key: 'overall', label: '総合評価' },
                    { key: 'university_connection', label: '大学・学部との接続' },
                    { key: 'activity_connection', label: '活動との接続' },
                    { key: 'originality', label: '独自性・オリジナリティ' },
                    { key: 'logic', label: '論理性・説得力' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <p className="font-semibold text-gray-700">{label}</p>
                      <p className="text-gray-600">{essay.ai_feedback![key as keyof typeof essay.ai_feedback]}</p>
                    </div>
                  ))}
                  <div>
                    <p className="font-semibold text-gray-700">具体的な改善点</p>
                    <p className="text-gray-600 whitespace-pre-line">{essay.ai_feedback.improvements}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">書き直し例</p>
                    <div className="bg-white rounded border p-3 text-gray-700 whitespace-pre-line">{essay.ai_feedback.rewrite_example}</div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">面接で突っ込まれそうな質問</p>
                    <p className="text-gray-600 whitespace-pre-line">{essay.ai_feedback.interview_questions}</p>
                  </div>
                </div>
                <details>
                  <summary className="text-xs text-gray-400 cursor-pointer">志望理由書本文を見る</summary>
                  <p className="text-gray-600 whitespace-pre-line mt-2 text-xs">{essay.content}</p>
                </details>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
