import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { UNIVERSITIES } from '@/lib/university-data'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { mode } = body
  let prompt = ''

  if (mode === 'review') {
    const { universityGroup, facultyKey, essay, sectionEssays, activities } = body
    const udata = UNIVERSITIES[universityGroup]?.[facultyKey]
    if (!udata) return NextResponse.json({ error: '大学データが見つかりません' }, { status: 400 })

    const checklistText = udata.specific_checklist.map((c: string) => `- ${c}`).join('\n')
    const questionsText = udata.key_questions.join('\n')
    const activitiesNote = activities ? `\n=== 活動実績（書類との連動チェック用） ===\n${activities}\n` : ''
    const activitiesLinkSection = activities
      ? `\n## ⑧ 活動実績と書類の連動チェック\n活動実績：${activities}\n- 書類で活かせている実績：\n- 掘り下げ不足・未反映の実績：\n- 追記を推奨する箇所と文章例：\n`
      : ''

    const rewriteInstruction = `## ⑦ 書き直し案（優先度順・2箇所）

**【修正箇所①】**
元の文章：「〜〜〜」
問題点：
**▶ 改善案A（論理・根拠を強化）：**
**▶ 改善案B（具体性・エピソードを強化）：**

**【修正箇所②】**
元の文章：「〜〜〜」
問題点：
**▶ 改善案A：**
**▶ 改善案B：**
${activitiesLinkSection}`

    if (udata.sections) {
      const filledSections = udata.sections
        .map((sec: { label: string; word_limit: number }, i: number) => ({ sec, text: (sectionEssays?.[i] || '') as string }))
        .filter(({ text }: { text: string }) => text.trim())

      const essayBlock = filledSections
        .map(({ sec, text }: { sec: { label: string; word_limit: number }; text: string }) =>
          `\n### ${sec.label}（${text.length}字 / ${sec.word_limit}字以内）\n${text}\n`)
        .join('')

      const isMultiDoc = udata.multi_doc || false
      const onlyOne = filledSections.length === 1
      const consistencySection = onlyOne ? '' :
        `\n## ③ ${isMultiDoc ? '書類間の一貫性・統合評価' : '各分野の一貫性・統合評価'}  ★/5\n書類間で伝わる人物像の一貫性。ストーリーが補完し合っているか、矛盾がないか。引用を交えてコメント。\n`

      prompt = `あなたは${universityGroup}大学 ${udata.label} の入試を熟知した専門家です。
以下の提出書類を、この入試の基準に照らして厳密かつ具体的に評価してください。

【重要な前提】英検・TOEIC・TOEFL等の語学スコア、各種資格・検定・受賞歴は別書類で証明するものです。書類本文に記載がないことを問題点として指摘しないでください。

=== 入試情報 ===
入試名称：${udata.exam_name}
各書類で答えるべき問い：
${questionsText}
アドミッションポリシー：${udata.admission_policy.trim()}

=== 提出書類 ===
${essayBlock}

=== チェックリスト ===
${checklistText}
${activitiesNote}
---
抽象的コメント禁止。必ず具体的な文章を引用して指摘してください。

## ① 形式チェック
字数・必須項目の網羅状況（○/×）

## ② 各分野の評価
${filledSections.map(({ sec }: { sec: { label: string } }) => `### ${sec.label}  ★/5\n引用：「〜〜〜」 / 強み： / 改善点：`).join('\n')}
${consistencySection}
## ${onlyOne ? '③' : '④'} アドミッションポリシー適合度

### 評価軸1：[主要評価軸]  ★/5
引用：「〜〜〜」 / コメント：

### 評価軸2：[主要評価軸]  ★/5
引用：「〜〜〜」 / コメント：

### 志望動機の固有性  ★/5
引用：「〜〜〜」 / コメント：（なぜここでなければならないか）

## ${onlyOne ? '③-2' : '④-2'} ❗固有性チェック（AO最重要）
以下の観点で、この書類が「この大学・学部でなければならない理由」を満たしているか厳しく評価してください。

**Q1. 他の大学でも書けてしまう内容ではないか？**
→ 判定（はい/いいえ）と根拠：

**Q2. この大学・学部固有のカリキュラム・研究・教員・施設への言及があるか？**
→ 判定（あり/なし）と具体的な言及箇所または欠落箇所：

**Q3. 「活動経験→この大学・学部での学び→将来」のストーリーが一本で繋がっているか？**
→ 判定（繋がっている/途切れている/接続が弱い）と理由：

**総合判定：** 「固有性あり」「固有性不足」「固有性なし（要全面改訂）」のいずれかで判定し、最も改善すべき点を1文で。

## ${onlyOne ? '④' : '⑤'} 面接で突っ込まれる質問（3つ）
**Q1：** / なぜこの質問が来るか：
**Q2：** / なぜこの質問が来るか：
**Q3：** / なぜこの質問が来るか：

## ${onlyOne ? '⑤' : '⑥'} 総合評価
**総合スコア：★/5**
**最優先で修正すべき点：** 具体的にどの文章をどう書き直すか
**このまま残すべき強み：** 引用して示すこと

${rewriteInstruction}`
    } else {
      const essayText = (essay || '') as string
      prompt = `あなたは${universityGroup}大学 ${udata.label} の入試を熟知した専門家です。
以下の志望理由書を、この入試の基準に照らして厳密かつ具体的に評価してください。

【重要な前提】英検・TOEIC・TOEFL等の語学スコア、各種資格・検定・受賞歴・活動実績は別の提出書類で証明するものです。志望理由書にこれらの記載がないことを問題点として指摘しないでください。

=== 入試情報 ===
入試名称：${udata.exam_name}
字数制限：${udata.word_limit}字以内
志望理由書で答えるべき問い：
${questionsText}

=== アドミッションポリシー ===
${udata.admission_policy}

=== 提出された志望理由書（${essayText.length}字） ===
${essayText}

=== この大学・学部固有のチェックリスト ===
${checklistText}
${activitiesNote}
---
以下の形式で評価してください。抽象的なコメントは禁止。必ず具体的な文章を引用して指摘してください。

## ① 形式チェック
- 字数：${essayText.length}字（制限：${udata.word_limit}字）→ OK / 超過
- 必須項目の網羅状況：${questionsText}

## ② アドミッションポリシー適合度

### 評価軸1：[主要評価軸]  ★/5
引用：「〜〜〜」 / コメント：

### 評価軸2：[主要評価軸]  ★/5
引用：「〜〜〜」 / コメント：

### 評価軸3：志望動機の固有性  ★/5
引用：「〜〜〜」 / コメント：（なぜここでなければならないか）

## ②-2 ❗固有性チェック（AO最重要）
以下の観点で、この志望理由書が「この大学・学部でなければならない理由」を満たしているか厳しく評価してください。

**Q1. 他の大学でも書けてしまう内容ではないか？**
→ 判定（はい/いいえ）と根拠：

**Q2. この大学・学部固有のカリキュラム・研究・教員・施設への言及があるか？**
→ 判定（あり/なし）と具体的な言及箇所または欠落箇所：

**Q3. 「活動経験→この大学・学部での学び→将来」のストーリーが一本で繋がっているか？**
→ 判定（繋がっている/途切れている/接続が弱い）と理由：

**総合判定：** 「固有性あり」「固有性不足」「固有性なし（要全面改訂）」のいずれかで判定し、最も改善すべき点を1文で。

## ③ 面接で突っ込まれる質問（3つ）
**Q1：** / なぜこの質問が来るか：
**Q2：** / なぜこの質問が来るか：
**Q3：** / なぜこの質問が来るか：

## ④ 総合評価
**総合スコア：★/5**
**最優先で修正すべき点：** 具体的にどの文章を、どう書き直すべきかまで示すこと
**このまま残すべき強み：** 引用して示すこと

${rewriteInstruction}`
    }

    await supabase.from('essays').insert({
      user_id: user.id,
      university: universityGroup,
      faculty: udata.label,
      content: essay || JSON.stringify(sectionEssays),
      ai_feedback: { mode, pending: true },
    })

  } else if (mode === 'essay_correction') {
    const { essayUniv, essayFaculty, essayExam, essayLimit, essayTheme, essayBody } = body
    const univInfo = essayUniv ? `${essayUniv} ${essayFaculty}` : '（大学未入力）'

    prompt = `あなたは大学入試の小論文添削の専門家です。
以下の小論文を、AO・推薦入試の審査基準に照らして厳密かつ具体的に添削してください。

=== 試験情報 ===
大学・学部：${univInfo}
入試名称：${essayExam || '未入力'}
字数制限：${essayLimit}字以内

=== 出題テーマ・問い ===
${essayTheme}

=== 提出された小論文（${(essayBody as string).length}字） ===
${essayBody}

---
以下の形式で、具体的かつ辛口に評価してください。必ず「具体的な文章・表現」を引用して指摘してください。

## ① 形式チェック
- 字数：${(essayBody as string).length}字（制限：${essayLimit}字）→ OK / 超過
- 出題への正面突破：○ / △ / ×
- 序論・本論・結論の構成：○ / △ / ×

## ② 課題把握力  ★/5
引用：「〜〜〜」
コメント：

## ③ 論理構成・論証力  ★/5
引用：「〜〜〜」
コメント：

## ④ 知識・視点の独自性  ★/5
引用：「〜〜〜」
コメント：

## ⑤ 表現・文体  ★/5
引用：「〜〜〜」（改善すべき表現）
コメント：

## ⑥ 総合評価
**総合スコア：★/5**
**最も致命的な弱点（1点）：**
**最も評価できる点（1点）：** 引用して示すこと

## ⑦ 書き直し案（最優先修正箇所）
**【元の文章】**（引用）
**▶ パターンA：論理・根拠を強化した版**
**▶ パターンB：具体的データ・事例を補強した版**

## ⑧ 全体コメント・合否ライン診断
「合格圏」「ボーダー」「要改善」のいずれかで判定し、その根拠を述べてください。`

  } else if (mode === 'interview_questions') {
    const { universityGroup, facultyKey, essay } = body
    const udata = UNIVERSITIES[universityGroup]?.[facultyKey]
    if (!udata) return NextResponse.json({ error: '大学データが見つかりません' }, { status: 400 })

    prompt = `あなたは${universityGroup}大学 ${udata.label} のAO・総合型選抜の面接官です。
以下の志望理由書を精読し、実際の面接で想定される質問を8問生成してください。

=== アドミッションポリシー ===
${udata.admission_policy}

=== 志望理由書 ===
${essay}

---
以下の5カテゴリに分けて、計8問を生成してください。

## 【カテゴリ1】志望動機の深掘り（2問）
志望理由書の核心にある動機を掘り下げる質問。

## 【カテゴリ2】学問への適性・知識確認（2問）
この学部で学ぶ準備ができているかを確認する質問。

## 【カテゴリ3】志望理由書への突っ込み・弱点確認（2問）
志望理由書の中で「抽象的」「根拠が薄い」「矛盾している」箇所への鋭い質問。

## 【カテゴリ4】将来ビジョンの具体性（1問）
入学後・卒業後のビジョンの具体性と実現可能性を問う。

## 【カテゴリ5】人物・価値観の確認（1問）
人間性・協調性・倫理観・社会への関心を問う。

---
各質問は以下の形式で出力：
**Q○：[質問文]**
- 面接官の意図：（なぜこの質問をするか・何を見ているか）
- 良い回答の方向性：（どう答えれば好印象か・キーワード）
- NGパターン：（これを言うと評価が下がる典型的な失敗）

---
最後に：
## 面接全体でのアドバイス
この志望理由書を持って臨む場合、特に注意すべき点を2〜3行でまとめてください。`

  } else if (mode === 'interview_eval') {
    const { universityGroup, facultyKey, essay, question, answer } = body
    const udata = UNIVERSITIES[universityGroup]?.[facultyKey]
    const univLabel = udata ? `${universityGroup}大学 ${udata.label}` : (universityGroup as string)

    prompt = `あなたは${univLabel}のAO入試の面接評価者です。
以下の志望理由書・質問・回答を読み、面接官の視点から厳密に評価してください。

=== 志望理由書 ===
${essay}

=== 面接質問 ===
${question}

=== 受験生の回答 ===
${answer}

---
## ① 総合評価  ★/5
一言コメント：

## ② 評価軸別スコア
**論理性・構造**  ★/5
（回答に筋道が通っているか。結論→根拠→具体例の流れがあるか）

**志望理由書との一貫性**  ★/5
引用：「志望理由書のこの部分：〜〜〜」との矛盾・整合性

**具体性・深さ**  ★/5
（抽象論に終わっていないか。エピソード・数字・固有名詞があるか）

**質問への的確さ**  ★/5
（面接官が聞きたかったことに答えられているか）

## ③ 面接官がこの回答を聞いて思うこと

## ④ 深掘り追加質問
**追加Q1：**
**追加Q2：**

## ⑤ 改善案
**問題点：**
**改善後の回答例：**（話し言葉で、200字程度）`

  } else {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })
    const result = (message.content[0] as { type: string; text: string }).text
    return NextResponse.json({ result })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI処理中にエラーが発生しました' }, { status: 500 })
  }
}
