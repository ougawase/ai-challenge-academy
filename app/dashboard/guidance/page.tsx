'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface Activity {
  title: string
  category: string
  description: string
  why_you: string
  university_connection: string
  difficulty: 'easy' | 'medium' | 'hard'
  duration: string
  week1_actions: string[]
  outcome: string
}

interface Guidance {
  intro: string
  activities: Activity[]
}

const difficultyLabel = { easy: '取り組みやすい', medium: '標準', hard: 'チャレンジング' }
const difficultyColor = { easy: 'bg-green-100 text-green-700', medium: 'bg-blue-100 text-blue-700', hard: 'bg-orange-100 text-orange-700' }

export default function GuidancePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [guidance, setGuidance] = useState<Guidance | null>(null)
  const [error, setError] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profile) {
        router.push('/dashboard/profile')
        return
      }

      try {
        const res = await fetch('/api/guidance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        })
        const data = await res.json()
        if (data.guidance) setGuidance(data.guidance)
        else setError(data.error || 'エラーが発生しました')
      } catch {
        setError('提案の取得に失敗しました')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleStartProject = (activity: Activity) => {
    const params = new URLSearchParams({
      title: activity.title,
      category: activity.category,
      description: activity.description,
    })
    router.push(`/dashboard/projects/new?${params.toString()}`)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      <p className="text-gray-500">あなたのプロフィールをもとに活動を提案しています...</p>
      <p className="text-xs text-gray-400">少々お待ちください（15〜20秒）</p>
    </div>
  )

  if (error) return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-4">{error}</p>
      <Button variant="outline" onClick={() => router.push('/dashboard/profile')}>プロフィールに戻る</Button>
    </div>
  )

  if (!guidance) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">あなたへの活動提案</h1>
        <p className="text-gray-500 mt-1">プロフィールをもとにAIが選んだ、今すぐ始められる活動です</p>
      </div>

      {/* イントロメッセージ */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-5">
          <p className="text-blue-900 leading-relaxed">{guidance.intro}</p>
        </CardContent>
      </Card>

      {/* 活動一覧 */}
      <div className="space-y-4">
        {guidance.activities.map((activity, i) => (
          <Card key={i} className={`transition-all ${expandedIndex === i ? 'shadow-md border-blue-200' : ''}`}>
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="secondary" className="text-xs">{activity.category}</Badge>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[activity.difficulty]}`}>
                      {difficultyLabel[activity.difficulty]}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{activity.duration}
                    </span>
                  </div>
                  <CardTitle className="text-base">{activity.title}</CardTitle>
                  {expandedIndex !== i && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{activity.description}</p>
                  )}
                </div>
                {expandedIndex === i ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />}
              </div>
            </CardHeader>

            {expandedIndex === i && (
              <CardContent className="pt-0 space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">{activity.description}</p>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-1">なぜあなたに向いているか</p>
                  <p className="text-sm text-amber-900">{activity.why_you}</p>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-purple-800 mb-1">志望大学とのつながり</p>
                  <p className="text-sm text-purple-900">{activity.university_connection}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">今週やること</p>
                  <div className="space-y-2">
                    {activity.week1_actions.map((action, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold mt-0.5">{j + 1}</span>
                        <p className="text-sm text-gray-700">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-800 mb-1">3ヶ月後に得られる成果</p>
                  <p className="text-sm text-green-900">{activity.outcome}</p>
                </div>

                <Button onClick={() => handleStartProject(activity)} className="w-full">
                  この活動でプロジェクトを作る <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="pt-2 flex gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard/profile')} className="flex-1">
          プロフィールを修正して再提案
        </Button>
        <Button variant="outline" onClick={() => router.push('/dashboard/self-analysis')} className="flex-1">
          AIと自己分析チャットをする
        </Button>
      </div>
    </div>
  )
}
