'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Issue { id: string; title: string; is_selected: boolean }

export default function NewProjectPage() {
  const supabase = createClient()
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIssue, setSelectedIssue] = useState('')
  const [form, setForm] = useState({
    issue: '',
    location: '',
    availableTime: '',
    collaborators: '',
    skills: '',
    targetUniversity: '',
  })
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    loadIssues()
  }, [])

  const loadIssues = async () => {
    const { data } = await supabase.from('social_issues').select('id, title, is_selected').order('created_at', { ascending: false })
    setIssues(data || [])
    const selected = (data || []).find((i: Issue) => i.is_selected)
    if (selected) {
      setSelectedIssue(selected.id)
      setForm(f => ({ ...f, issue: selected.title }))
    }
  }

  const handleIssueSelect = (issue: Issue) => {
    setSelectedIssue(issue.id)
    setForm(f => ({ ...f, issue: issue.title }))
  }

  const generate = async () => {
    if (!form.issue) return
    setGenerating(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setResult(data)
    }
    setGenerating(false)
  }

  if (result) {
    const project = result as Record<string, unknown>
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プロジェクト提案書が完成しました！</h1>
          <p className="text-gray-500 mt-1">AIが生成したプロジェクト計画をご確認ください</p>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader><CardTitle className="text-blue-900">{project.title as string}</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700 mb-1">解決する課題</p>
              <p className="text-gray-700">{project.issue as string}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">仮説</p>
              <p className="text-gray-700">{project.hypothesis as string}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">対象者</p>
              <p className="text-gray-700">{project.target as string}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">活動内容</p>
              <p className="text-gray-700">{project.description as string}</p>
            </div>
            {Array.isArray(project.week1_tasks) && (
              <div>
                <p className="font-semibold text-gray-700 mb-2">最初の7日間タスク</p>
                <ul className="space-y-1">
                  {(project.week1_tasks as string[]).map((t, i) => (
                    <li key={i} className="flex gap-2 text-gray-700"><span className="text-blue-500 font-bold">{i+1}.</span>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {typeof project.dm_template === 'string' && project.dm_template && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">最初のDM文案</p>
                <div className="bg-white rounded-lg p-3 border text-gray-600 whitespace-pre-line">{project.dm_template as string}</div>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-700 mb-1">成果の測定方法</p>
              <p className="text-gray-700">{project.success_metrics as string}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={() => router.push('/dashboard/projects')} className="flex-1">
            プロジェクト一覧へ
          </Button>
          <Button variant="outline" onClick={() => setResult(null)}>
            別の条件で作り直す
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新規プロジェクト作成</h1>
        <p className="text-gray-500 mt-1">AIがあなたの条件に合わせたプロジェクト計画を作成します</p>
      </div>

      {issues.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">取り組む社会課題を選択</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {issues.map((issue) => (
              <button key={issue.id} onClick={() => handleIssueSelect(issue)}>
                <Badge
                  variant={selectedIssue === issue.id ? 'default' : 'outline'}
                  className="cursor-pointer hover:opacity-80 text-xs py-1 px-2"
                >
                  {issue.title}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">社会課題 *</label>
            <Textarea
              value={form.issue}
              onChange={(e) => setForm(f => ({ ...f, issue: e.target.value }))}
              placeholder="例：地方の高校生の進路情報格差問題"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">活動地域</label>
            <Input
              value={form.location}
              onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="例：宮古島市、沖縄県"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">使える時間（週あたり）</label>
            <Input
              value={form.availableTime}
              onChange={(e) => setForm(f => ({ ...f, availableTime: e.target.value }))}
              placeholder="例：週10時間、土日のみ"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">一緒に活動できる人</label>
            <Input
              value={form.collaborators}
              onChange={(e) => setForm(f => ({ ...f, collaborators: e.target.value }))}
              placeholder="例：同じ高校の友人2人、SNSで集めた仲間"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">得意なこと・スキル</label>
            <Input
              value={form.skills}
              onChange={(e) => setForm(f => ({ ...f, skills: e.target.value }))}
              placeholder="例：デザイン、プログラミング、文章を書くこと"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">志望大学</label>
            <Input
              value={form.targetUniversity}
              onChange={(e) => setForm(f => ({ ...f, targetUniversity: e.target.value }))}
              placeholder="例：早稲田大学 政治経済学部"
            />
          </div>

          <Button onClick={generate} disabled={generating || !form.issue} className="w-full">
            {generating
              ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />プロジェクト計画を生成中（30秒ほどかかります）...</>
              : <><Sparkles className="h-4 w-4 mr-2" />プロジェクト計画をAIに作成してもらう</>
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
