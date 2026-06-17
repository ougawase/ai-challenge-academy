import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-blue-700">AI Challenge Academy</span>
            <span className="text-sm text-gray-500 ml-2 hidden sm:inline">AIチャレンジアカデミー</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline">ログイン</Button>
            </Link>
            <Link href="/register">
              <Button>無料で始める</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">AI × 総合型選抜</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          合格のためではなく、<br />
          <span className="text-blue-600">人生のための</span>総合型選抜
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          AIが一緒に考える、あなただけの活動計画。
          自己分析から社会課題の発見、プロジェクト立案、活動記録まで——
          総合型選抜の本質に向き合うプラットフォームです。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-base px-8">無料で始める</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-base px-8">ログインして続ける</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">できること</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '🧠',
              title: 'AI自己分析チャット',
              desc: 'AIカウンセラーとの対話で、自分の強み・関心・志望軸を言語化します',
            },
            {
              icon: '🌍',
              title: '社会課題ダイアグノシス',
              desc: 'あなたのプロフィールに基づき、取り組むべき社会課題をAIが提案します',
            },
            {
              icon: '📋',
              title: 'プロジェクト提案',
              desc: '3ヶ月ロードマップ、最初の7日間タスク、連絡先候補まで自動生成',
            },
            {
              icon: '📝',
              title: '活動ログ × AIフィードバック',
              desc: '活動記録を保存すると、AIが意味づけと次の行動を提案します',
            },
            {
              icon: '✍️',
              title: '志望理由書フィードバック',
              desc: '大学・学部に合わせたAIによる詳細な添削と改善提案',
            },
            {
              icon: '📊',
              title: 'ダッシュボード',
              desc: '活動進捗・タスク・ポートフォリオ完成度を一目で把握',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">今すぐ自己分析を始めよう</h2>
          <p className="text-blue-100 mb-8">AIと一緒に、あなたの「軸」を見つけましょう。</p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-base px-8">
              無料で登録する
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
        <p>© 2024 AI Challenge Academy. 総合型選抜の新しいかたち。</p>
      </footer>
    </div>
  )
}
