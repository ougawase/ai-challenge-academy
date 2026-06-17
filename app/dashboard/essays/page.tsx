'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { UNIVERSITIES } from '@/lib/university-data'
import ReactMarkdown from 'react-markdown'

const UNIV_GROUPS = Object.keys(UNIVERSITIES)

function CharCount({ count, limit }: { count: number; limit?: number }) {
  if (!limit) return <span className="text-xs text-gray-400">{count}字</span>
  const pct = Math.min((count / limit) * 100, 100)
  const over = count > limit
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${over ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
        {count}字 / {limit}字
      </span>
      <div className="flex-1 h-1 bg-gray-200 rounded overflow-hidden">
        <div className={`h-1 rounded transition-all ${over ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ResultBox({ result }: { result: string }) {
  return (
    <div className="mt-6 border rounded-xl bg-slate-50 p-6 prose prose-sm max-w-none">
      <ReactMarkdown>{result}</ReactMarkdown>
    </div>
  )
}

function UniversitySelector({
  group, onGroupChange, facultyKey, onFacultyChange,
}: {
  group: string; onGroupChange: (v: string) => void
  facultyKey: string; onFacultyChange: (v: string) => void
}) {
  const faculties = group ? Object.entries(UNIVERSITIES[group] || {}) : []
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">大学グループ</label>
        <Select value={group} onValueChange={(v: string | null) => { if (v) { onGroupChange(v); onFacultyChange('') } }}>
          <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
          <SelectContent>
            {UNIV_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">学部・入試</label>
        <Select value={facultyKey} onValueChange={(v: string | null) => { if (v) onFacultyChange(v) }} disabled={!group}>
          <SelectTrigger><SelectValue placeholder="大学を先に選択" /></SelectTrigger>
          <SelectContent>
            {faculties.map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ── Tab 1: 志望理由書レビュー ──
function ReviewTab() {
  const [group, setGroup] = useState('')
  const [facultyKey, setFacultyKey] = useState('')
  const [essay, setEssay] = useState('')
  const [sectionEssays, setSectionEssays] = useState<string[]>([])
  const [activities, setActivities] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  const udata = group && facultyKey ? UNIVERSITIES[group]?.[facultyKey] : null

  const handleSubmit = async () => {
    if (!udata) return
    setLoading(true)
    setResult('')
    const res = await fetch('/api/essays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'review', universityGroup: group, facultyKey, essay, sectionEssays, activities }),
    })
    const data = await res.json()
    setResult(data.result || data.error || 'エラーが発生しました')
    setLoading(false)
  }

  const canSubmit = udata && (udata.sections ? sectionEssays.some(s => s?.trim()) : essay.trim())

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">大学・学部を選択</CardTitle></CardHeader>
        <CardContent>
          <UniversitySelector group={group} onGroupChange={setGroup} facultyKey={facultyKey} onFacultyChange={setFacultyKey} />
          {udata && (
            <div className="mt-3">
              <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                {showInfo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                この入試の形式・求める人材を確認する
              </button>
              {showInfo && (
                <div className="mt-2 bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                  <p><span className="font-medium">入試名称：</span>{udata.exam_name}</p>
                  <div>
                    <p className="font-medium mb-1">志望理由書で答えるべき問い：</p>
                    {udata.key_questions.map((q, i) => <p key={i} className="text-gray-600 ml-2">• {q}</p>)}
                  </div>
                  <div>
                    <p className="font-medium mb-1">アドミッションポリシー：</p>
                    <p className="text-gray-600 whitespace-pre-line">{udata.admission_policy.trim()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {udata && (
        <>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">志望理由書を入力</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {udata.sections ? (
                udata.sections.map((sec, i) => (
                  <div key={i}>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      {sec.label} <span className="text-gray-400 font-normal">（{sec.word_limit}字以内）</span>
                    </label>
                    <Textarea
                      value={sectionEssays[i] || ''}
                      onChange={(e) => {
                        const next = [...sectionEssays]
                        next[i] = e.target.value
                        setSectionEssays(next)
                      }}
                      rows={6}
                      placeholder={`${sec.label}の内容を貼り付けてください...`}
                    />
                    <CharCount count={(sectionEssays[i] || '').length} limit={sec.word_limit} />
                  </div>
                ))
              ) : (
                <div>
                  <Textarea value={essay} onChange={e => setEssay(e.target.value)} rows={10} placeholder="ここに志望理由書の全文を貼り付けてください..." />
                  <CharCount count={essay.length} limit={udata.word_limit} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">活動実績・自己PR <Badge variant="secondary" className="ml-2 text-xs">任意</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 mb-2">入力すると「志望理由書で活動実績を活かせているか」のアドバイスが追加されます</p>
              <Textarea value={activities} onChange={e => setActivities(e.target.value)} rows={4}
                placeholder={'例：\n・全国高校生模擬国連 ベストデリゲート賞\n・TOEIC 870点\n・地域NPO インターン 2年間'} />
            </CardContent>
          </Card>

          <Button onClick={handleSubmit} disabled={loading || !canSubmit} className="w-full" size="lg">
            {loading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />AIが精読・分析中です（20〜35秒）...</> : 'レビューする →'}
          </Button>
        </>
      )}

      {result && <ResultBox result={result} />}
    </div>
  )
}

// ── Tab 2: 小論文添削 ──
function EssayCorrectionTab() {
  const [form, setForm] = useState({ essayUniv: '', essayFaculty: '', essayExam: '', essayLimit: 800, essayTheme: '', essayBody: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    setResult('')
    const res = await fetch('/api/essays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'essay_correction', ...form }),
    })
    const data = await res.json()
    setResult(data.result || data.error || 'エラーが発生しました')
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">試験情報を入力</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">大学名</label>
              <Input value={form.essayUniv} onChange={e => set('essayUniv', e.target.value)} placeholder="例：早稲田大学" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">学部名</label>
              <Input value={form.essayFaculty} onChange={e => set('essayFaculty', e.target.value)} placeholder="例：政治経済学部" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">入試名称</label>
              <Input value={form.essayExam} onChange={e => set('essayExam', e.target.value)} placeholder="例：総合型選抜・AO入試" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">字数制限</label>
              <Input type="number" value={form.essayLimit} onChange={e => set('essayLimit', Number(e.target.value))} min={100} max={5000} step={100} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">出題テーマ・問い</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={form.essayTheme} onChange={e => set('essayTheme', e.target.value)} rows={3}
            placeholder='例：「グローバル化が進む現代社会において、日本の地方自治が抱える課題とその解決策について述べよ。」' />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">小論文本文を入力</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={form.essayBody} onChange={e => set('essayBody', e.target.value)} rows={10}
            placeholder="ここに小論文の全文を貼り付けてください..." />
          <CharCount count={form.essayBody.length} limit={form.essayLimit} />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={loading || !form.essayTheme || !form.essayBody} className="w-full" size="lg">
        {loading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />AIが小論文を精読・添削中です（20〜35秒）...</> : '添削する →'}
      </Button>

      {result && <ResultBox result={result} />}
    </div>
  )
}

// ── Tab 3: 面接対策 ──
function InterviewTab() {
  const [group, setGroup] = useState('')
  const [facultyKey, setFacultyKey] = useState('')
  const [essay, setEssay] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [result1, setResult1] = useState('')
  const [result2, setResult2] = useState('')

  const udata = group && facultyKey ? UNIVERSITIES[group]?.[facultyKey] : null

  const handleGenQuestions = async () => {
    if (!udata || !essay.trim()) return
    setLoading1(true)
    setResult1('')
    const res = await fetch('/api/essays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'interview_questions', universityGroup: group, facultyKey, essay }),
    })
    const data = await res.json()
    setResult1(data.result || data.error)
    setLoading1(false)
  }

  const handleEvalAnswer = async () => {
    if (!essay.trim() || !question.trim() || !answer.trim()) return
    setLoading2(true)
    setResult2('')
    const res = await fetch('/api/essays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'interview_eval', universityGroup: group, facultyKey, essay, question, answer }),
    })
    const data = await res.json()
    setResult2(data.result || data.error)
    setLoading2(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">大学・学部を選択</CardTitle></CardHeader>
        <CardContent>
          <UniversitySelector group={group} onGroupChange={setGroup} facultyKey={facultyKey} onFacultyChange={setFacultyKey} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">志望理由書を入力</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-2">レビュー済みの志望理由書を貼り付けてください。内容をもとに面接質問を生成します。</p>
          <Textarea value={essay} onChange={e => setEssay(e.target.value)} rows={8}
            placeholder="ここに志望理由書の全文を貼り付けてください..." />
          {essay && <span className="text-xs text-gray-400">{essay.length}字</span>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Step 1 — 想定質問を生成</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">志望理由書の内容・弱点をもとに、面接で実際に聞かれる質問8問と面接官の意図を生成します。</p>
          <Button onClick={handleGenQuestions} disabled={loading1 || !udata || !essay.trim()} className="w-full">
            {loading1 ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />面接官視点で質問を生成中（15〜25秒）...</> : '面接想定質問を生成 →'}
          </Button>
          {result1 && <ResultBox result={result1} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Step 2 — 回答を入力して添削を受ける</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">上で生成された質問から1問選び、あなたの回答を入力してください。</p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">面接質問（上からコピー）</label>
            <Textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2}
              placeholder="例：なぜこの大学・学部を選んだのですか？" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">あなたの回答</label>
            <Textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={5}
              placeholder="実際に面接で話す内容を入力してください。話し言葉でも構いません。" />
            {answer && <span className="text-xs text-gray-400">{answer.length}字</span>}
          </div>
          <Button onClick={handleEvalAnswer} disabled={loading2 || !essay.trim() || !question.trim() || !answer.trim()} className="w-full">
            {loading2 ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />回答を評価中（15〜25秒）...</> : '回答を評価 →'}
          </Button>
          {result2 && <ResultBox result={result2} />}
        </CardContent>
      </Card>
    </div>
  )
}

export default function EssaysPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">志望理由書・面接対策</h1>
        <p className="text-gray-500 mt-1">大学・学部別アドミッションポリシーに基づく精密フィードバック</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {['早慶MARCH', '関関同立', '88学部収録', '小論文添削', '面接練習'].map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="review">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="review">志望理由書レビュー</TabsTrigger>
          <TabsTrigger value="essay">小論文添削</TabsTrigger>
          <TabsTrigger value="interview">面接対策</TabsTrigger>
        </TabsList>
        <TabsContent value="review" className="mt-4"><ReviewTab /></TabsContent>
        <TabsContent value="essay" className="mt-4"><EssayCorrectionTab /></TabsContent>
        <TabsContent value="interview" className="mt-4"><InterviewTab /></TabsContent>
      </Tabs>
    </div>
  )
}
