/**
 * Life Support Module - Crisis Detector
 * 危機検知エンジン
 */

const { getUserThresholds, updateCrisisFlag } = require('../../storage/models');

/**
 * 危機状態の検出
 */
function detectCrisis(lifeLog) {
  const thresholds = getUserThresholds();
  const crisisReasons = [];
  let crisisLevel = 0; // 0=normal, 1=low, 2=medium, 3=high

  // しんどさスコアチェック
  if (lifeLog.stress_score !== null && lifeLog.stress_score >= thresholds.stress_score) {
    crisisReasons.push({
      type: 'stress_score',
      value: lifeLog.stress_score,
      threshold: thresholds.stress_score,
      message: 'しんどさスコアが高い状態です'
    });
    crisisLevel = Math.max(crisisLevel, lifeLog.stress_score >= 9 ? 3 : 2);
  }

  // 食事回数チェック
  if (lifeLog.meal_count !== null && lifeLog.meal_count <= thresholds.meal_count) {
    crisisReasons.push({
      type: 'meal_count',
      value: lifeLog.meal_count,
      threshold: thresholds.meal_count,
      message: '食事が取れていない状態です'
    });
    crisisLevel = Math.max(crisisLevel, 2);
  }

  // 睡眠時間チェック
  if (lifeLog.sleep_hours !== null && lifeLog.sleep_hours <= thresholds.sleep_hours) {
    crisisReasons.push({
      type: 'sleep_hours',
      value: lifeLog.sleep_hours,
      threshold: thresholds.sleep_hours,
      message: '睡眠が十分に取れていない状態です'
    });
    crisisLevel = Math.max(crisisLevel, 2);
  }

  // キーワード検出（フリーテキスト）
  if (lifeLog.free_text) {
    const dangerKeywords = ['無理', '死', 'つらい', '限界', '消えたい', '終わりたい'];
    const text = lifeLog.free_text.toLowerCase();
    
    for (const keyword of dangerKeywords) {
      if (text.includes(keyword)) {
        crisisReasons.push({
          type: 'keyword_detected',
          keyword: keyword,
          message: `危機キーワード「${keyword}」が検出されました`
        });
        crisisLevel = Math.max(crisisLevel, 3);
        break;
      }
    }
  }

  const isCrisis = crisisReasons.length > 0;

  // 危機フラグを更新
  if (isCrisis && lifeLog.id) {
    updateCrisisFlag(lifeLog.id, 1);
  }

  return {
    isCrisis,
    crisisLevel,
    reasons: crisisReasons
  };
}

/**
 * 危機レベルの判定
 */
function getCrisisLevelDescription(level) {
  const descriptions = {
    0: '通常',
    1: '軽度の注意',
    2: '中度の警戒',
    3: '高度な警戒'
  };
  return descriptions[level] || '不明';
}

module.exports = {
  detectCrisis,
  getCrisisLevelDescription
};
