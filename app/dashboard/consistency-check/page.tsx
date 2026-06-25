'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'

interface Inconsistency {
  type: string
  detail: string
  fix: string
}

interface ConsistencyResult {
  overall_score: number
  overall_label: string
  strong_thread: string
  inconsistencies: Inconsistency[]
  missing_elements: string[]
  interview_risk: string
  recommendation: string
}

export default function ConsistencyCheckPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConsistencyResult | null>(null)
  const [error, setError] = useState('')

  const runCheck = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/consistency-check', { method: 'POST' })
      const data = await res.json()
      if (data.result) setResult(data.result)
      else setError(data.error || 'エラーが発生しました')
    } catch {
      setError('チェック中にエラーが発生しました')
    }
    setLoading(false)
  }

  const scoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const scoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">一貫性チェック</h1>
        <p className="text-gray-500 mt-1">活動ログ・プロジェクト・志望理由書が同じストーリーで繋がっているか確認します</p>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-blue-900 leading-relaxed">
            総合型選抜では「活動 → 志望理由書 → 面接」が一本のストーリーで繋がっていることが合格の条件です。
            このチェックでは、あなたの記録を横断分析し、矛盾や不足を見つけます。
          </p>
        </CardContent>
      </Card>

      {!result && !loading && (
        <Button onClick={runCheck} size="lg" className="w-full">
          一貫性チェックを実行する
        </Button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          <p className="text-gray-500">活動ログ・志望理由書・プロジェクトを横断分析中...</p>
          <p className="text-xs text-gray-400">15〜20秒かかります</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" onClick={runCheck} className="mt-4">再実行</Button>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* スコア */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">一貫性スコア</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-bold ${scoreColor(result.overall_score)}`}>{result.overall_score}</span>
                <span className="text-gray-500 mb-1">/ 100</span>
                <span className="text-sm text-gray-600 mb-1">{result.overall_label}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${scoreBarColor(result.overall_score)}`} style={{ width: `${result.overall_score}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* ストーリーの軸 */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> あなたのストーリーの軸
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-green-900 leading-relaxed">{result.strong_thread}</p>
            </CardContent>
          </Card>

          {/* 不一致・矛盾 */}
          {result.inconsistencies && result.inconsistencies.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" /> 矛盾・乖離が見つかった箇所
              </h3>
              {result.inconsistencies.map((item, i) => (
                <Card key={i} className="border-yellow-200">
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-xs font-semibold text-yellow-700 bg-yellow-50 inline-block px-2 py-0.5 rounded">{item.type}</p>
                    <p className="text-sm text-gray-700">{item.detail}</p>
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs font-medium text-blue-700">改善方法</p>
                      <p className="text-xs text-blue-900 mt-0.5">{item.fix}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 不足要素 */}
          {result.missing_elements && result.missing_elements.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> 不足している要素
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {result.missing_elements.map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>{item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 面接リスク */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-800">⚠️ このまま面接に臨むと詰まる質問</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-orange-900 leading-relaxed">{result.interview_risk}</p>
            </CardContent>
          </Card>

          {/* 推奨アクション */}
          <Card className="border-blue-300 bg-blue-600">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-blue-100 mb-1">今すぐやるべきこと</p>
              <p className="text-sm text-white font-medium leading-relaxed">{result.recommendation}</p>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={runCheck} className="w-full flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> 再チェックする
          </Button>
        </div>
      )}
    </div>
  )
}
