'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

const gradeOptions = ['中学1年', '中学2年', '中学3年', '高校1年', '高校2年', '高校3年', '浪人']
const interestOptions = ['地方創生', '教育', '環境', '医療・福祉', 'テクノロジー', '国際支援', '起業', '農業', '観光', 'アート', 'スポーツ', 'その他']

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
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
      target_universities: form.target_universities.split(',').map((s) => s.trim()).filter(Boolean),
      achievements: form.achievements,
      qualifications: form.qualifications,
      updated_at: new Date().toISOString(),
    }

    await supabase.from('profiles').upsert(profileData)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
        <p className="text-gray-500 mt-1">あなたの情報を充実させることで、AIのアドバイスがより的確になります</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>名前</Label>
              <Input placeholder="山田 太郎" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>学年</Label>
              <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v ?? '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="学年を選択" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>学校名</Label>
              <Input placeholder="〇〇高等学校" value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>お住まいの地域</Label>
              <Input placeholder="沖縄県宮古島市" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>興味・関心</CardTitle>
          <CardDescription>興味があるテーマを選んでください（複数選択可）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.interests.includes(interest)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>自己分析の素材</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>強み・得意なこと</Label>
            <Textarea placeholder="人をまとめることが得意、地道に続けることができる..." value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>弱み・苦手なこと</Label>
            <Textarea placeholder="大勢の前で話すのが苦手、計画的に進めることが難しい..." value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>将来の夢・なりたい姿</Label>
            <Textarea placeholder="地元に貢献できる起業家になりたい..." value={form.future_goal} onChange={(e) => setForm({ ...form, future_goal: e.target.value })} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>大学・実績</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>志望大学（カンマ区切り）</Label>
            <Input placeholder="東京大学, 早稲田大学, 慶應義塾大学" value={form.target_universities} onChange={(e) => setForm({ ...form, target_universities: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>これまでの主な活動・実績</Label>
            <Textarea placeholder="生徒会長、地域ボランティア、部活動でキャプテン..." value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>資格・検定など</Label>
            <Textarea placeholder="英検2級、TOEIC 700点、漢検2級..." value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? '保存中...' : saved ? '✓ 保存しました' : 'プロフィールを保存'}
        </Button>
      </div>
    </div>
  )
}
