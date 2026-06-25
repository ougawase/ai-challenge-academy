import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Map, CheckCircle, Zap, Brain, FileText, BookOpen } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ナビゲーション */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">AI Challenge Academy</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-600">ログイン</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm">無料で始める</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="max-w-4xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-blue-100">
          <Zap className="h-3 w-3" />
          AI × 総合型選抜（AO入試）
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
          対面塾と同じ伴走を、<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AIが24時間届ける。</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          出願日から逆算したカリキュラム。毎朝のミッション提示。活動・志望理由書・面接の一貫性管理まで、合格に必要なすべてをAIが担います。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-base px-8 bg-blue-600 hover:bg-blue-700 shadow-md">
              無料で始める
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-base px-8 border-gray-200">
              ログイン
            </Button>
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">登録無料・クレジットカード不要</p>
      </section>

      {/* 競合比較 */}
      <section className="bg-gray-50 border-y border-gray-100 py-14">
        <div className="max-w-3xl mx-auto px-5">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
            なぜ AI Challenge Academy か
          </p>
          <div className="grid grid-cols-3 text-center text-sm">
            <div className="space-y-1 text-gray-400">
              <p className="font-semibold text-gray-500">大手塾</p>
              <p className="text-xs">月額 ¥5〜10万</p>
              <p className="text-xs">週1〜2回の面談</p>
              <p className="text-xs">担当者の当たり外れ</p>
              <p className="text-xs">通塾が必要</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-2xl -mx-3 opacity-5" />
              <div className="relative bg-white rounded-2xl py-4 px-3 shadow-md border border-blue-100 -mt-4">
                <div className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-3">おすすめ</div>
                <p className="font-bold text-blue-700 text-base">AI Challenge Academy</p>
                <p className="text-xs text-green-600 font-semibold mt-1">完全無料</p>
                <p className="text-xs text-gray-600 mt-1">24時間 / 365日</p>
                <p className="text-xs text-gray-600">AI塾長が毎朝指示</p>
                <p className="text-xs text-gray-600">どこでも使える</p>
              </div>
            </div>
            <div className="space-y-1 text-gray-400">
              <p className="font-semibold text-gray-500">ChatGPT等</p>
              <p className="text-xs">記録が残らない</p>
              <p className="text-xs">計画を立てない</p>
              <p className="text-xs">一貫性を見ない</p>
              <p className="text-xs">AO専門知識なし</p>
            </div>
          </div>
        </div>
      </section>

      {/* 機能一覧 */}
      <section className="max-w-4xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">合格に必要な全機能</h2>
          <p className="text-gray-500 text-sm">洋々・ルークスが人力でやることを、AIが自動化します</p>
        </div>
        <div className="space-y-4">
          {[
            {
              icon: Map,
              color: 'text-slate-600',
              bg: 'bg-slate-50',
              title: '逆算ロードマップ',
              desc: '出願日を入れるだけで「今週やること」が自動生成。4フェーズ・16項目のカリキュラムが可視化されます。',
              badge: '対面塾の最大の強み',
            },
            {
              icon: Brain,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              title: '毎朝のAIミッション',
              desc: '毎日ダッシュボードを開くと「今日の3ミッション（緊急/重要/任意）」を自動提示。塾長から毎朝LINEが届く感覚。',
              badge: '毎日の伴走',
            },
            {
              icon: BookOpen,
              color: 'text-green-600',
              bg: 'bg-green-50',
              title: '活動ログ → AO評価フィードバック',
              desc: '「なぜやったか（動機）」「葛藤（過程）」「学び」を記録するたびに、志望理由書に使えるポイントをAIが抽出。',
              badge: '落ちるパターンを防ぐ',
            },
            {
              icon: FileText,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              title: '志望理由書 × 固有性チェック',
              desc: '88大学のアドミッションポリシーに照らして採点。「他の大学でも書ける内容ではないか？」を必ずチェック。',
              badge: '88大学対応',
            },
            {
              icon: CheckCircle,
              color: 'text-indigo-600',
              bg: 'bg-indigo-50',
              title: '一貫性チェック',
              desc: '活動ログ・プロジェクト・志望理由書の3点を横断分析。「面接で詰まる質問」を事前に特定します。',
              badge: 'AIにしかできない機能',
            },
          ].map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
                <div className={`${f.bg} p-3 rounded-xl flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{f.title}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{f.badge}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* フロー */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 py-20 text-white">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-2xl font-bold mb-12">登録から合格まで、AIが伴走します</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { step: '1', label: 'プロフィール入力\n出願日を登録', note: '5分' },
              { step: '2', label: 'AIが活動を提案\nロードマップ生成', note: '即時' },
              { step: '3', label: '活動しながら\nログを記録', note: '毎日' },
              { step: '4', label: '志望理由書添削\n面接対策', note: '出願前' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-blue-200 text-sm mb-3">
                  {s.step}
                </div>
                <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">{s.label}</p>
                <p className="text-xs text-blue-300 font-semibold mt-1.5">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-5">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">今日から、伴走型AO対策を始める</h2>
        <p className="text-gray-500 text-sm mb-8">登録無料。いつでも使えます。</p>
        <Link href="/register">
          <Button size="lg" className="text-base px-10 bg-blue-600 hover:bg-blue-700 shadow-md">
            無料で始める →
          </Button>
        </Link>
      </section>

      <footer className="border-t border-gray-100 bg-gray-50 py-8 text-center text-xs text-gray-400">
        <p>© 2026 AI Challenge Academy</p>
      </footer>
    </div>
  )
}
