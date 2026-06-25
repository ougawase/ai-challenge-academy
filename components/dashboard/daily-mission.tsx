'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, ArrowRight, Flame, AlertCircle, Star, Clock } from 'lucide-react'

interface Mission {
  priority: 'urgent' | 'important' | 'optional'
  title: string
  description: string
  time_estimate: string
  href: string
}

interface DailyMissionData {
  greeting: string
  sensei_note: string
  missions: Mission[]
  phase: { name: string; label: string; color: string }
  daysLeft: number | null
  streak: number
}

const priorityConfig = {
  urgent: { label: '緊急', icon: AlertCircle, bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', iconColor: 'text-red-500' },
  important: { label: '重要', icon: Star, bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', iconColor: 'text-blue-500' },
  optional: { label: '任意', icon: Clock, bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-600', iconColor: 'text-gray-400' },
}

const phaseColors: Record<string, string> = {
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  orange: 'bg-orange-500',
  red: 'bg-red-600',
  gray: 'bg-gray-400',
}

export function DailyMission() {
  const router = useRouter()
  const [data, setData] = useState<DailyMissionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/daily-mission', { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (d.missions) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-600 to-blue-700">
      <CardContent className="pt-6 pb-6 flex items-center gap-3 text-white">
        <Loader2 className="animate-spin h-5 w-5 flex-shrink-0" />
        <span className="text-sm">AIが今日のミッションを考えています...</span>
      </CardContent>
    </Card>
  )

  if (!data) return null

  const phaseBarColor = phaseColors[data.phase.color] || phaseColors.gray
  const totalDays = 365
  const daysSpent = data.daysLeft !== null ? Math.max(0, totalDays - data.daysLeft) : null
  const progressPct = data.daysLeft !== null ? Math.round((daysSpent! / totalDays) * 100) : null

  return (
    <div className="space-y-3">
      {/* 塾長カード */}
      <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-blue-100 text-xs font-medium mb-1">AI塾長より</p>
              <p className="font-semibold text-base leading-snug">{data.greeting}</p>
              <p className="text-blue-100 text-sm mt-2 leading-relaxed">{data.sensei_note}</p>
            </div>
            {data.streak > 1 && (
              <div className="flex-shrink-0 flex flex-col items-center bg-white/10 rounded-xl px-3 py-2">
                <Flame className="h-5 w-5 text-orange-300" />
                <span className="text-lg font-bold leading-none mt-0.5">{data.streak}</span>
                <span className="text-xs text-blue-200">連続</span>
              </div>
            )}
          </div>

          {/* フェーズ + カウントダウン */}
          {data.daysLeft !== null && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-blue-200">
                <span className="font-medium text-white">{data.phase.label}</span>
                <span className="font-bold text-white text-sm">{data.daysLeft}日後に出願</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${phaseBarColor} opacity-90`}
                  style={{ width: `${Math.min(100, progressPct ?? 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-blue-300">
                <span>開始</span>
                <span>出願日</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 今日の3ミッション */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-0.5">今日のミッション</p>
        <div className="space-y-2">
          {data.missions.map((m, i) => {
            const cfg = priorityConfig[m.priority] || priorityConfig.optional
            const Icon = cfg.icon
            return (
              <button
                key={i}
                onClick={() => router.push(m.href)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all hover:shadow-md active:scale-[0.99] ${cfg.bg}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                      <span className="font-semibold text-sm text-gray-800">{m.title}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{m.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{m.time_estimate}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
