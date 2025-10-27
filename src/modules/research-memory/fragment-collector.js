/**
 * Research Memory Module - Fragment Collector
 * 断片的な思考の入力・保存
 */

const { saveResearchFragment } = require('../../storage/research-models');

/**
 * 研究断片を記録
 */
async function collectFragment(data) {
  try {
    const fragmentId = saveResearchFragment(data);
    console.log('✅ 思考の断片を記録しました');
    return fragmentId;
  } catch (error) {
    console.error('❌ 断片の記録に失敗しました:', error.message);
    throw error;
  }
}

/**
 * 断片データの検証
 */
function validateFragment(data) {
  const errors = [];

  if (!data.content || data.content.trim().length === 0) {
    errors.push('内容を入力してください');
  }

  if (data.content && data.content.length > 5000) {
    errors.push('内容は5000文字以内にしてください');
  }

  const validEmotions = ['anger', 'discomfort', 'surprise', 'joy', 'neutral', null];
  if (data.emotion_tag && !validEmotions.includes(data.emotion_tag)) {
    errors.push('無効な感情タグです');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 感情タグの日本語変換
 */
function emotionToJapanese(emotion) {
  const map = {
    'anger': '怒り',
    'discomfort': '違和感',
    'surprise': '驚き',
    'joy': '喜び',
    'neutral': '中立'
  };
  return map[emotion] || '未分類';
}

/**
 * 感情タグの英語変換
 */
function emotionToEnglish(japanese) {
  const map = {
    '怒り': 'anger',
    '違和感': 'discomfort',
    '驚き': 'surprise',
    '喜び': 'joy',
    '中立': 'neutral'
  };
  return map[japanese] || null;
}

/**
 * 断片記録の非アクティブチェック（3日以上記録なし）
 */
async function checkFragmentInactivity() {
  const { getAllFragments } = require('../../storage/research-models');
  const fragments = getAllFragments(1);
  
  if (fragments.length === 0) {
    return { inactive: true, days: Infinity, message: 'まだ断片が記録されていません' };
  }
  
  const lastFragment = fragments[0];
  const lastDate = new Date(lastFragment.created_at);
  const now = new Date();
  const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  
  if (daysSince >= 3) {
    return {
      inactive: true,
      days: daysSince,
      message: `最後の記録から${daysSince}日経過しています。最近、考え事はありますか？`
    };
  }
  
  return { inactive: false, days: daysSince };
}

module.exports = {
  collectFragment,
  validateFragment,
  emotionToJapanese,
  emotionToEnglish,
  checkFragmentInactivity
};
