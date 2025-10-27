/**
 * Research Memory Module - Theme Identifier
 * 核テーマの自動識別
 */

const { generateMessage } = require('../../llm/llm-client');
const { 
  getAllFragments, 
  getActiveCoreThemes, 
  saveCoreTheme, 
  updateCoreTheme 
} = require('../../storage/research-models');
const { findCommonConcepts } = require('./concept-extractor');

/**
 * 核テーマの識別・更新
 */
async function identifyCoreThemes() {
  const fragments = getAllFragments(50); // 最近50件
  
  if (fragments.length < 3) {
    console.log('断片が少なすぎるため、テーマ識別をスキップします');
    return [];
  }
  
  try {
    // LLMで核テーマを識別
    const identified = await identifyThemesWithLLM(fragments);
    
    // 既存テーマと照合・更新
    const existingThemes = getActiveCoreThemes();
    const newThemes = [];
    
    for (const theme of identified) {
      const existing = findSimilarTheme(theme, existingThemes);
      
      if (existing) {
        // 既存テーマを更新
        updateCoreTheme(existing.id, {
          theme_description: theme.description,
          fragment_ids: theme.fragment_ids,
          frequency: existing.frequency + 1,
          importance_score: calculateThemeImportance(theme, fragments)
        });
      } else {
        // 新規テーマとして保存
        const themeId = saveCoreTheme({
          theme_name: theme.name,
          theme_description: theme.description,
          fragment_ids: theme.fragment_ids,
          importance_score: calculateThemeImportance(theme, fragments)
        });
        newThemes.push({ id: themeId, ...theme });
      }
    }
    
    return newThemes;
  } catch (error) {
    console.error('テーマ識別エラー:', error.message);
    
    // フォールバック: 共通概念ベースの簡易テーマ識別
    return identifyThemesSimple(fragments);
  }
}

/**
 * LLMで核テーマを識別
 */
async function identifyThemesWithLLM(fragments) {
  const systemPrompt = `あなたは研究者の思考パターンを分析するAIです。

以下は研究者が記録した断片的なメモです。
これらから「この人の核心的な問い」を1〜3個特定してください。

重要:
- テーマ名は20文字以内
- 説明は100文字以内
- 繰り返し出現する概念に注目
- 感情（特に怒り・違和感）は問いの源
- 複数の断片に共通する問題意識を見つける

出力形式（JSON）:
{
  "themes": [
    {
      "name": "テーマ名",
      "description": "このテーマについての説明",
      "related_fragment_ids": [1, 3, 5],
      "reason": "なぜこれが核心と判断したか"
    }
  ]
}`;

  // 断片を整形
  const fragmentTexts = fragments.map((f, idx) => 
    `[${idx + 1}] ${f.content}${f.emotion_tag ? ` (感情: ${f.emotion_tag})` : ''}`
  ).join('\n\n');

  const userPrompt = `断片（最近の${fragments.length}件）:\n\n${fragmentTexts}\n\n上記から核テーマを特定してください。`;

  const response = await generateMessage(systemPrompt, userPrompt);
  
  try {
    const parsed = JSON.parse(response);
    
    return parsed.themes.map(theme => ({
      name: theme.name,
      description: theme.description,
      fragment_ids: theme.related_fragment_ids || [],
      reason: theme.reason
    }));
  } catch (parseError) {
    // JSONパース失敗時はシンプルな方法にフォールバック
    return identifyThemesSimple(fragments);
  }
}

/**
 * シンプルな共通概念ベースのテーマ識別
 */
function identifyThemesSimple(fragments) {
  const commonConcepts = findCommonConcepts(fragments);
  
  if (commonConcepts.length === 0) {
    return [];
  }
  
  // 最も頻出する概念をテーマとする
  const topConcepts = commonConcepts.slice(0, 3);
  
  return topConcepts.map((item, idx) => {
    const relatedFragments = fragments
      .filter(f => f.content.includes(item.concept))
      .map(f => f.id);
    
    return {
      name: item.concept,
      description: `「${item.concept}」に関する一連の思考（${item.count}回出現）`,
      fragment_ids: relatedFragments,
      reason: `${item.count}回繰り返し出現している概念`
    };
  });
}

/**
 * 類似テーマを検索
 */
function findSimilarTheme(newTheme, existingThemes) {
  for (const existing of existingThemes) {
    // 名前の類似度チェック（簡易版）
    if (calculateSimilarity(newTheme.name, existing.theme_name) > 0.7) {
      return existing;
    }
  }
  return null;
}

/**
 * 文字列の類似度計算（簡易版）
 */
function calculateSimilarity(str1, str2) {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * テーマの重要度計算
 */
function calculateThemeImportance(theme, allFragments) {
  let score = 0.5; // ベーススコア
  
  // 関連断片数
  const relatedCount = theme.fragment_ids.length;
  score += Math.min(relatedCount * 0.05, 0.3);
  
  // 感情タグ（怒り・違和感）がある断片を含むか
  const relatedFragments = allFragments.filter(f => 
    theme.fragment_ids.includes(f.id)
  );
  
  const hasStrongEmotion = relatedFragments.some(f => 
    f.emotion_tag === 'anger' || f.emotion_tag === 'discomfort'
  );
  
  if (hasStrongEmotion) score += 0.2;
  
  return Math.min(score, 1.0);
}

/**
 * テーマの進化追跡
 */
function trackThemeEvolution(themeId) {
  // TODO: 時系列でテーマがどう変化したかを追跡
  // Phase 3以降で実装予定
}

module.exports = {
  identifyCoreThemes,
  identifyThemesWithLLM,
  identifyThemesSimple,
  calculateThemeImportance
};
