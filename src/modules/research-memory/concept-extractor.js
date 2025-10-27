/**
 * Research Memory Module - Concept Extractor
 * 概念抽出エンジン（LLM使用）
 */

const { generateMessage } = require('../../llm/llm-client');
const { addFragmentTag } = require('../../storage/research-models');

/**
 * 断片から概念を抽出
 */
async function extractConcepts(fragment) {
  const systemPrompt = `あなたは研究者の思考を分析するAIです。

以下のテキストから、重要な概念・キーワード・問いを抽出してください。

特に注目すべき点:
- 繰り返し出る単語・フレーズ
- 疑問形の文章（問いの種）
- 感情が強く表れている部分
- 否定や違和感を示す表現

出力形式（JSON）:
{
  "concepts": ["概念1", "概念2"],
  "questions": ["問い1", "問い2"],
  "key_phrases": ["重要フレーズ1", "重要フレーズ2"]
}

必ずJSON形式で出力してください。`;

  const userPrompt = `テキスト: ${fragment.content}

${fragment.emotion_tag ? `感情: ${fragment.emotion_tag}` : ''}
${fragment.context ? `コンテキスト: ${fragment.context}` : ''}

上記のテキストから概念を抽出してください。`;

  try {
    const response = await generateMessage(systemPrompt, userPrompt);
    
    // JSONパース（LLMの出力が不安定なことがあるので try-catch）
    let extracted;
    try {
      extracted = JSON.parse(response);
    } catch (parseError) {
      // JSONパース失敗時は正規表現で抽出を試みる
      extracted = extractConceptsFromText(response);
    }
    
    // 抽出結果をタグとして保存
    if (extracted.concepts) {
      for (const concept of extracted.concepts) {
        addFragmentTag(fragment.id, 'concept', concept);
      }
    }
    
    if (extracted.questions) {
      for (const question of extracted.questions) {
        addFragmentTag(fragment.id, 'question', question);
      }
    }
    
    if (extracted.key_phrases) {
      for (const phrase of extracted.key_phrases) {
        addFragmentTag(fragment.id, 'key_phrase', phrase);
      }
    }
    
    // 分析済みフラグ
    addFragmentTag(fragment.id, 'analyzed', 'true');
    
    return extracted;
  } catch (error) {
    console.error('概念抽出エラー:', error.message);
    
    // フォールバック: シンプルな形態素解析風処理
    return extractConceptsSimple(fragment.content);
  }
}

/**
 * フォールバック: テキストから簡易抽出
 */
function extractConceptsFromText(text) {
  const concepts = [];
  const questions = [];
  
  // 疑問符を含む文を問いとして抽出
  const sentences = text.split(/[。．\n]/);
  for (const sentence of sentences) {
    if (sentence.includes('？') || sentence.includes('?')) {
      questions.push(sentence.trim());
    }
  }
  
  // カギカッコや引用符で囲まれた部分を概念として抽出
  const quoted = text.match(/[「『]([^」』]+)[」』]/g);
  if (quoted) {
    concepts.push(...quoted.map(q => q.replace(/[「『」』]/g, '')));
  }
  
  return { concepts, questions, key_phrases: [] };
}

/**
 * フォールバック: シンプルな概念抽出
 */
function extractConceptsSimple(content) {
  // 名詞っぽいものを抽出（カタカナ・漢字の連続）
  const nouns = content.match(/[ァ-ヶー]{2,}|[一-龠々]{2,}/g) || [];
  
  // 重複除去と頻度カウント
  const conceptCount = {};
  nouns.forEach(noun => {
    conceptCount[noun] = (conceptCount[noun] || 0) + 1;
  });
  
  // 頻度順にソート
  const concepts = Object.entries(conceptCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  // 疑問符を含む文を問いとして抽出
  const questions = [];
  const sentences = content.split(/[。．\n]/);
  for (const sentence of sentences) {
    if ((sentence.includes('？') || sentence.includes('?')) && sentence.length < 100) {
      questions.push(sentence.trim());
    }
  }
  
  return {
    concepts,
    questions,
    key_phrases: []
  };
}

/**
 * 複数の断片から共通概念を抽出
 */
function findCommonConcepts(fragments) {
  const conceptCount = {};
  
  for (const fragment of fragments) {
    const concepts = extractConceptsSimple(fragment.content).concepts;
    concepts.forEach(concept => {
      conceptCount[concept] = (conceptCount[concept] || 0) + 1;
    });
  }
  
  // 複数回出現したものだけを返す
  return Object.entries(conceptCount)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([concept, count]) => ({ concept, count }));
}

module.exports = {
  extractConcepts,
  extractConceptsSimple,
  findCommonConcepts
};
