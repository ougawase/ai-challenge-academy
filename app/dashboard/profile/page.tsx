'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, ArrowRight, TrendingUp, FileText } from 'lucide-react'

const gradeOptions = ['中学1年', '中学2年', '中学3年', '高校1年', '高校2年', '高校3年', '浪人']
const interestOptions = ['地方創生', '教育', '環境', '医療・福祉', 'テクノロジー', '国際支援', '起業', '農業', '観光', 'アート', 'スポーツ', 'その他']

interface Analysis {
  readiness_score: number
  readiness_label: string
  strengths: string[]
  strengths_comment: string
  current_issues: string[]
  current_issues_comment: string
  path_achievement: { title: string; reason: string; first_step: string }
  path_essay: { title: string; reason: string; first_step: string }
  recommended_path: 'achievement' | 'essay'
  message: string
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [form, setForm] = useState({
    name: '',
    grade: '',
    school_name: '',
    location: '',
    interests: [] as string[],
    strengths: '',
    weaknesses: '',
    future_goal: '',
    target_universities: '',
    achievements: '',
    qualifications: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setForm({
          name: data.name || '',
          grade: data.grade || '',
          school_name: data.school_name || '',
          location: data.location || '',
          interests: data.interests || [],
          strengths: data.strengths || '',
          weaknesses: data.weaknesses || '',
          future_goal: data.future_goal || '',
          target_universities: (data.target_universities || []).join(', '),
          achievements: data.achievements || '',
          qualifications: data.qualifications || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleInterest = (interest: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const profileData = {
      id: user.id,
      name: form.name,
      grade: form.grade,
      school_name: form.school_name,
      location: form.location,
      interests: form.interests,
      strengths: form.strengths,
      weaknesses: form.weaknesses,
      future_goal: form.future_goal,
      target_universities: form.target_universities.split(',').map(s => s.trim()).filter(Boolean),
      achievements: form.achievements,
      qualifications: form.qualifications,
      updated_at: new Date().toISOString(),
    }

    await supabase.from('profiles').upsert(profileData)
    setSaving(false)

    // AI分析を開始
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/profile-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
    } catch (e) {
      console.error(e)
    }
    setAnalyzing(false)
  }

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
        <p className="text-gray-500 mt-1">情報を充実させるほど、AIのアドバイスが的確になります</p>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>名前</Label>
              <Input placeholder="山田 太郎" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>学年</Label>
              <Select value={form.grade} onValueChange={v => setForm({ ...form, grade: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="学年を選択" /></SelectTrigger>
                <SelectContent>{gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>学校名</Label>
              <Input placeholder="〇〇高等学校" value={form.school_name} onChange={e => setForm({ ...form, school_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>お住まいの地域</Label>
              <Input placeholder="沖縄県宮古島市" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 興味・関心 */}
      <Card>
        <CardHeader>
          <CardTitle>興味・関心</CardTitle>
          <CardDescription>興味があるテーマを選んでください（複数選択可）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map(interest => (
              <button key={interest} onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.interests.includes(interest)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                }`}>
                {interest}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 自己分析の素材 */}
      <Card>
        <CardHeader><CardTitle>自己分析の素材</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>強み・得意なこと</Label>
            <Textarea placeholder="人をまとめることが得意、地道に続けることができる..." value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>弱み・苦手なこと</Label>
            <Textarea placeholder="大勢の前で話すのが苦手、計画的に進めることが難しい..." value={form.weaknesses} onChange={e => setForm({ ...form, weaknesses: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>将来の夢・なりたい姿</Label>
            <Textarea placeholder="地元に貢献できる起業家になりたい..." value={form.future_goal} onChange={e => setForm({ ...form, future_goal: e.target.value })} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* 大学・実績 */}
      <Card>
        <CardHeader><CardTitle>大学・実績</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>志望大学（カンマ区切り）</Label>
            <Input placeholder="早稲田大学, 慶應義塾大学" value={form.target_universities} onChange={e => setForm({ ...form, target_universities: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>これまでの主な活動・実績</Label>
            <Textarea placeholder="生徒会長、地域ボランティア、部活動でキャプテン..." value={form.achievements} onChange={e => setForm({ ...form, achievements: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>資格・検定など</Label>
            <Textarea placeholder="英検2級、TOEIC 700点、漢検2級..." value={form.qualifications} onChange={e => setForm({ ...form, qualifications: e.target.value })} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || analyzing} size="lg" className="min-w-40">
          {saving ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />保存中...</>
          : analyzing ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />AIが分析中...</>
          : 'プロフィールを保存してAI分析'}
        </Button>
      </div>

      {/* AI分析結果 */}
      {analysis && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">AI分析が完了しました</span>
          </div>

          {/* メッセージ */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-5">
              <p className="text-blue-900 leading-relaxed">{analysis.message}</p>
            </CardContent>
          </Card>

          {/* 準備度スコア */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">総合型選抜への準備度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold text-blue-600">{analysis.readiness_score}</span>
                <span className="text-gray-400 mb-1">/ 100</span>
                <span className="text-gray-600 mb-1 text-sm">{analysis.readiness_label}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-2 bg-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${analysis.readiness_score}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* 強みと課題 */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-green-200">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-green-700">✓ あなたの強み</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">•</span>{s}
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t">{analysis.strengths_comment}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-700">△ 今後の課題</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {analysis.current_issues.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-0.5">•</span>{s}
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t">{analysis.current_issues_comment}</p>
              </CardContent>
            </Card>
          </div>

          {/* 2択の提案 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">次のステップを選んでください</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* 実績を積む */}
              <button onClick={() => router.push('/dashboard/guidance')}
                className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                  analysis.recommended_path === 'achievement'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}>
                {analysis.recommended_path === 'achievement' && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mb-2 inline-block">おすすめ</span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">{analysis.path_achievement.title}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{analysis.path_achievement.reason}</p>
                <p className="text-xs text-blue-600 font-medium">▶ {analysis.path_achievement.first_step}</p>
                <div className="flex items-center gap-1 mt-3 text-blue-600 text-sm font-medium">
                  自己分析を始める <ArrowRight className="h-4 w-4" />
                </div>
              </button>

              {/* 志望理由書を書く */}
              <button onClick={() => router.push('/dashboard/essays')}
                className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                  analysis.recommended_path === 'essay'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}>
                {analysis.recommended_path === 'essay' && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mb-2 inline-block">おすすめ</span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">{analysis.path_essay.title}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{analysis.path_essay.reason}</p>
                <p className="text-xs text-purple-600 font-medium">▶ {analysis.path_essay.first_step}</p>
                <div className="flex items-center gap-1 mt-3 text-purple-600 text-sm font-medium">
                  志望理由書を書く <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
