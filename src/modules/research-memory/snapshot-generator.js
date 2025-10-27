/**
 * Research Memory Module - Snapshot Generator
 * スナップショット生成（論文・申請用ドラフト）
 */

const { generateMessage } = require('../../llm/llm-client');
const { 
  getActiveCoreThemes, 
  getAllFragments, 
  saveSnapshot 
} = require('../../storage/research-models');

/**
 * 論文背景セクションのドラフト生成
 */
async function generatePaperBackground(themeId = null) {
  const theme = themeId 
    ? getActiveCoreThemes().find(t => t.id === themeId)
    : getActiveCoreThemes()[0];
  
  if (!theme) {
    throw new Error('テーマが見つかりません');
  }
  
  // 関連断片を取得
  const allFragments = getAllFragments();
  const relatedFragments = allFragments.filter(f => 
    theme.fragment_ids.includes(f.id)
  );
  
  const systemPrompt = `あなたは学術論文の執筆を支援するAIです。

以下の断片的なメモから、論文の「背景と目的」セクションを生成してください。

要件:
- 学術的な文体
- 400〜600字程度
- 社会的意義を含める
- 研究の必要性を明確にする
- 日本語で出力`;

  const fragmentTexts = relatedFragments
    .map(f => `- ${f.content}`)
    .join('\n');

  const userPrompt = `研究テーマ: ${theme.theme_name}

テーマ説明: ${theme.theme_description}

関連するメモ:
${fragmentTexts}

上記から論文の「背景と目的」を生成してください。`;

  try {
    const generated = await generateMessage(systemPrompt, userPrompt);
    
    // スナップショットとして保存
    const snapshotId = saveSnapshot({
      theme_id: theme.id,
      snapshot_type: 'paper_background',
      generated_text: generated,
      fragment_refs: theme.fragment_ids
    });
    
    return {
      text: generated,
      snapshot_id: snapshotId,
      theme_name: theme.theme_name
    };
  } catch (error) {
    console.error('論文背景生成エラー:', error.message);
    throw error;
  }
}

/**
 * 研究計画書のドラフト生成
 */
async function generateGrantProposal(themeId = null) {
  const theme = themeId 
    ? getActiveCoreThemes().find(t => t.id === themeId)
    : getActiveCoreThemes()[0];
  
  if (!theme) {
    throw new Error('テーマが見つかりません');
  }
  
  const allFragments = getAllFragments();
  const relatedFragments = allFragments.filter(f => 
    theme.fragment_ids.includes(f.id)
  );
  
  const systemPrompt = `あなたは研究助成金申請書の作成を支援するAIです。

以下の断片的なメモから、助成金申請用の研究計画書を生成してください。

要件:
- 研究の目的（何を明らかにするか）
- 研究の意義（なぜ重要か）
- 研究計画（どのように進めるか）
- 800〜1000字程度
- 審査員に伝わる明確な文章
- 日本語で出力`;

  const fragmentTexts = relatedFragments
    .map(f => `- ${f.content}`)
    .join('\n');

  const userPrompt = `研究テーマ: ${theme.theme_name}

テーマ説明: ${theme.theme_description}

関連するメモ:
${fragmentTexts}

上記から研究計画書を生成してください。`;

  try {
    const generated = await generateMessage(systemPrompt, userPrompt);
    
    const snapshotId = saveSnapshot({
      theme_id: theme.id,
      snapshot_type: 'grant_proposal',
      generated_text: generated,
      fragment_refs: theme.fragment_ids
    });
    
    return {
      text: generated,
      snapshot_id: snapshotId,
      theme_name: theme.theme_name
    };
  } catch (error) {
    console.error('研究計画書生成エラー:', error.message);
    throw error;
  }
}

/**
 * テーマサマリーの生成
 */
async function generateThemeSummary(themeId = null) {
  const theme = themeId 
    ? getActiveCoreThemes().find(t => t.id === themeId)
    : getActiveCoreThemes()[0];
  
  if (!theme) {
    throw new Error('テーマが見つかりません');
  }
  
  const allFragments = getAllFragments();
  const relatedFragments = allFragments.filter(f => 
    theme.fragment_ids.includes(f.id)
  );
  
  const systemPrompt = `あなたは研究者の思考を整理するAIです。

以下の断片的なメモを、わかりやすく整理して要約してください。

要件:
- 300字程度
- 何がこの人の核心的な問いか
- これまでどんな思考を積み重ねてきたか
- これからどこに向かおうとしているか`;

  const fragmentTexts = relatedFragments
    .map(f => `- ${f.content}`)
    .join('\n');

  const userPrompt = `テーマ: ${theme.theme_name}

メモ:
${fragmentTexts}

上記を整理して要約してください。`;

  try {
    const generated = await generateMessage(systemPrompt, userPrompt);
    
    const snapshotId = saveSnapshot({
      theme_id: theme.id,
      snapshot_type: 'summary',
      generated_text: generated,
      fragment_refs: theme.fragment_ids
    });
    
    return {
      text: generated,
      snapshot_id: snapshotId,
      theme_name: theme.theme_name
    };
  } catch (error) {
    console.error('サマリー生成エラー:', error.message);
    throw error;
  }
}

/**
 * エクスポート機能（Markdown形式）
 */
function exportAsMarkdown(snapshot) {
  const markdown = `# ${snapshot.theme_name}

## 生成日時
${new Date(snapshot.created_at).toLocaleString('ja-JP')}

## タイプ
${getSnapshotTypeName(snapshot.snapshot_type)}

---

${snapshot.generated_text}

---

*このドラフトはARCによって自動生成されました*
`;
  
  return markdown;
}

/**
 * スナップショットタイプの日本語名
 */
function getSnapshotTypeName(type) {
  const names = {
    'summary': '要約',
    'paper_background': '論文背景',
    'grant_proposal': '研究計画書'
  };
  return names[type] || type;
}

module.exports = {
  generatePaperBackground,
  generateGrantProposal,
  generateThemeSummary,
  exportAsMarkdown,
  getSnapshotTypeName
};
