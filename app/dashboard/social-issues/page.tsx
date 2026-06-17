'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

interface Issue {
  id?: string
  title: string
  description: string
  reason: string
  difficulty: string
  university_connection: string
  action_ideas: string
  is_selected?: boolean
}

const difficultyLabel: Record<string, { label: string; color: string }> = {
  easy: { label: '取り組みやすい', color: 'bg-green-100 text-green-700' },
  medium: { label: '普通', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: '挑戦的', color: 'bg-red-100 text-red-700' },
}

export default function SocialIssuesPage() {
  const supabase = createClient()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    loadIssues()
  }, [])

  const loadIssues = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('social_issues')
      .select('*')
      .order('created_at', { ascending: false })
    setIssues(data || [])
    const selected = (data || []).find((i: Issue) => i.is_selected)
    if (selected) setSelectedId(selected.id)
    setLoading(false)
  }

  const generateIssues = async () => {
    setGenerating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profile }, { data: selfAnalysis }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('self_analysis_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
    ])

    const res = await fetch('/api/social-issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: profile || {}, selfAnalysis: selfAnalysis || null }),
    })

    if (res.ok) {
      await loadIssues()
    }
    setGenerating(false)
  }

  const selectIssue = async (issue: Issue) => {
    if (!issue.id) return
    setSelecting(issue.id)

    // Deselect all first
    await supabase.from('social_issues').update({ is_selected: false }).neq('id', '')
    // Select this one
    await supabase.from('social_issues').update({ is_selected: true }).eq('id', issue.id)

    setSelectedId(issue.id)
    setSelecting(null)
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-4 w-4" />読み込み中...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">社会課題診断</h1>
          <p className="text-gray-500 mt-1">あなたに合った社会課題をAIが提案します。1つを選んでプロジェクト化しましょう。</p>
        </div>
        <Button onClick={generateIssues} disabled={generating}>
          {generating ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />生成中...</> : <><Sparkles className="h-4 w-4 mr-2" />AIに提案してもらう</>}
        </Button>
      </div>

      {issues.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">まだ社会課題の提案がありません。</p>
            <p className="text-sm text-gray-400 mb-6">先にプロフィールとAI自己分析を完了させると、より精度の高い提案が得られます。</p>
            <Button onClick={generateIssues} disabled={generating}>
              {generating ? '生成中...' : 'AIに課題を提案してもらう'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {issues.map((issue) => (
          <Card key={issue.id} className={`transition-all ${issue.id === selectedId ? 'border-blue-500 ring-1 ring-blue-500' : 'hover:shadow-md'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {issue.id === selectedId && <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />}
                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                  </div>
                  {issue.difficulty && (
                    <Badge className={`text-xs ${difficultyLabel[issue.difficulty]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {difficultyLabel[issue.difficulty]?.label || issue.difficulty}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={issue.id === selectedId ? 'default' : 'outline'}
                  onClick={() => selectIssue(issue)}
                  disabled={selecting === issue.id}
                  className="flex-shrink-0"
                >
                  {selecting === issue.id ? <Loader2 className="animate-spin h-3 w-3" /> : issue.id === selectedId ? '選択中' : 'これにする'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-gray-700">{issue.description}</p>
              <div>
                <p className="font-semibold text-gray-600 mb-1">なぜあなたに向いているか</p>
                <p className="text-gray-600">{issue.reason}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600 mb-1">志望大学との接続</p>
                <p className="text-gray-600">{issue.university_connection}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600 mb-1">3ヶ月でできる行動案</p>
                <p className="text-gray-600 whitespace-pre-line">{issue.action_ideas}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-semibold mb-1">次のステップ</p>
          <p className="text-blue-700 text-sm">課題を選択しました！次は「プロジェクト」メニューから、この課題に基づいたプロジェクトを作成しましょう。</p>
        </div>
      )}
    </div>
  )
}
