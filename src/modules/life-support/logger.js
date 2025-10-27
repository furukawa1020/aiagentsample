/**
 * Life Support Module - Logger
 * 体調ログの入力処理
 */

const { saveLifeLog } = require('../../storage/models');

/**
 * 体調ログを記録
 */
async function logLifeData(data) {
  try {
    const logId = saveLifeLog(data);
    console.log('✅ 体調ログを記録しました');
    return logId;
  } catch (error) {
    console.error('❌ ログの記録に失敗しました:', error.message);
    throw error;
  }
}

/**
 * 体調データの検証
 */
function validateLifeData(data) {
  const errors = [];

  if (data.sleep_hours !== undefined) {
    if (data.sleep_hours < 0 || data.sleep_hours > 24) {
      errors.push('睡眠時間は0〜24時間の範囲で入力してください');
    }
  }

  if (data.meal_count !== undefined) {
    if (data.meal_count < 0 || data.meal_count > 10) {
      errors.push('食事回数は0〜10の範囲で入力してください');
    }
  }

  if (data.stress_score !== undefined) {
    if (data.stress_score < 0 || data.stress_score > 10) {
      errors.push('しんどさスコアは0〜10の範囲で入力してください');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  logLifeData,
  validateLifeData
};
