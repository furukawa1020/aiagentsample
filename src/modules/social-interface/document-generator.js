/**
 * Document Generator
 * 申請書・メールのドラフト自動生成
 */

const { generateMessage } = require('../../llm/llm-client');
const { getActiveCoreThemes } = require('../../storage/research-models');
const { saveDocument, getDocumentsByDeadline } = require('../../storage/social-models');

/**
 * 申請書ドラフトを生成
 * 
 * 要件: 「ユーザーの研究メモリ（B）からパーツを引用し、"申請で通る文体"に整形」
 */
async function generateApplicationDraft(deadline, options = {}) {
  // 研究メモリから核テーマを取得
  const themes = getActiveCoreThemes(5);

  const themesSummary = themes.map(t => 
    `- ${t.theme_name}: ${t.description}`
  ).join('\n');

  const prompt = `
あなたは研究者の申請書作成を支援するアシスタントです。

以下の研究テーマから、${deadline.category === 'scholarship' ? '奨学金' : deadline.category === 'grant' ? '助成金' : '研究'}申請書の初稿を作成してください。

【申請対象】
${deadline.title}

【研究者の核テーマ】
${themesSummary || '（まだテーマが記録されていません）'}

【要求セクション】
${options.sections || '研究目的、研究の重要性、期待される成果'}

【文体要件】
- 謙虚だが自信のある語調
- 学術的・客観的な表現
- 「〜と考えられる」「〜が期待される」などの婉曲表現
- 自己否定的な表現（「すみません」「未熟ですが」）は使わない

400-600文字で、以下のフォーマットで出力してください:

## 研究目的
（ここに記述）

## 研究の重要性
（ここに記述）

## 期待される成果
（ここに記述）
`;

  try {
    const content = await generateMessage(prompt, { maxTokens: 800 });

    // ドキュメントを保存
    const doc = saveDocument({
      deadline_id: deadline.id,
      title: `${deadline.title} - 申請書ドラフト`,
      doc_type: 'application',
      content,
      status: 'draft'
    });

    return {
      success: true,
      content,
      documentId: doc.id
    };

  } catch (error) {
    // LLM失敗時のフォールバック
    const fallbackContent = generateApplicationFallback(themes, deadline);

    const doc = saveDocument({
      deadline_id: deadline.id,
      title: `${deadline.title} - 申請書ドラフト（テンプレート）`,
      doc_type: 'application',
      content: fallbackContent,
      status: 'draft'
    });

    return {
      success: true,
      content: fallbackContent,
      documentId: doc.id,
      note: 'LLM未使用（テンプレート生成）'
    };
  }
}

/**
 * メール骨子を生成
 * 
 * 要件: 「"状況"+"お願い"+"次のステップ"だけの短い事務文」
 */
async function generateEmailDraft(recipient, purpose, context = '') {
  const prompt = `
以下の条件で、教員・支援窓口への連絡メールの骨子を作成してください。

【宛先】
${recipient.name || '関係者'}様

【目的】
${purpose}

【状況・背景】
${context || '（特記事項なし）'}

【要件】
- 簡潔（200文字以内）
- 尊厳を保つ（「申し訳ございません」を連発しない）
- 具体的な「お願い」を1つだけ明記
- 次のステップ（いつまでに何をするか）を明示

以下のフォーマットで出力:

件名: （ここに記述）

本文:
（ここに記述）
`;

  try {
    const content = await generateMessage(prompt, { maxTokens: 400 });

    const doc = saveDocument({
      deadline_id: null,
      title: `${recipient.name || '連絡先'}へのメール`,
      doc_type: 'email',
      content,
      status: 'draft'
    });

    return {
      success: true,
      content,
      documentId: doc.id
    };

  } catch (error) {
    // フォールバック
    const fallbackContent = `件名: ${purpose}について

${recipient.name || '関係者'}様

お世話になっております。

${context}

つきましては、${purpose}についてご相談させていただきたく、ご連絡いたしました。

お忙しいところ恐縮ですが、ご検討のほどよろしくお願いいたします。
`;

    const doc = saveDocument({
      deadline_id: null,
      title: `${recipient.name || '連絡先'}へのメール（テンプレート）`,
      doc_type: 'email',
      content: fallbackContent,
      status: 'draft'
    });

    return {
      success: true,
      content: fallbackContent,
      documentId: doc.id,
      note: 'LLM未使用（テンプレート生成）'
    };
  }
}

/**
 * 申請書フォールバック（LLM不使用時）
 */
function generateApplicationFallback(themes, deadline) {
  const themesList = themes.length > 0
    ? themes.map(t => `・${t.theme_name}`).join('\n')
    : '・（研究テーマを記録してください）';

  return `## 研究目的

本研究は、以下のテーマに関する探究を目的としています:

${themesList}

これらの問いは、現代社会における重要な課題と深く関連しており、学術的・社会的な意義を持つと考えられます。

## 研究の重要性

本研究は、従来の枠組みでは十分に扱われてこなかった領域に光を当てるものです。この研究を通じて、新たな視点や理解の可能性が開かれることが期待されます。

## 期待される成果

本研究により、以下の成果が期待されます:
1. 対象領域の理論的整理と新たな概念枠組みの提示
2. 実証的なデータに基づく知見の蓄積
3. 研究成果の学会発表および論文化

---
※ このドラフトは自動生成されたテンプレートです。必ず内容を確認・修正してください。
`;
}

module.exports = {
  generateApplicationDraft,
  generateEmailDraft
};
