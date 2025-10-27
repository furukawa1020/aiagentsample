/**
 * Life Support Module - Summary
 * 1日サマリーの生成
 */

const { getTodayLifeLog, getRecentLifeLogs } = require('../../storage/models');

/**
 * 今日のサマリーを生成
 */
function generateDailySummary() {
  const todayLog = getTodayLifeLog();
  
  if (!todayLog) {
    return '今日の記録はまだありません。';
  }

  const parts = [];
  
  parts.push('🌟 今日の振り返り');
  parts.push('');
  
  // 記録した事実
  if (todayLog.sleep_hours !== null) {
    parts.push(`😴 睡眠: ${todayLog.sleep_hours}時間`);
  }
  
  if (todayLog.meal_count !== null) {
    parts.push(`🍽️  食事: ${todayLog.meal_count}回`);
  }
  
  if (todayLog.stress_score !== null) {
    const emoji = todayLog.stress_score >= 8 ? '😰' : todayLog.stress_score >= 5 ? '😓' : '😌';
    parts.push(`${emoji} しんどさ: ${todayLog.stress_score}/10`);
  }
  
  parts.push('');
  
  // ポジティブなまとめ
  parts.push('✅ 判定: 合格');
  parts.push('');
  parts.push(generatePositiveMessage(todayLog));
  
  return parts.join('\n');
}

/**
 * ポジティブなメッセージ生成
 */
function generatePositiveMessage(log) {
  const messages = [];
  
  if (log.sleep_hours && log.sleep_hours >= 6) {
    messages.push('十分な睡眠が取れました。');
  } else if (log.sleep_hours && log.sleep_hours >= 3) {
    messages.push('眠れる時間を確保できました。');
  } else if (log.sleep_hours !== null) {
    messages.push('少しでも休めたことは大きな一歩です。');
  }
  
  if (log.meal_count && log.meal_count >= 2) {
    messages.push('食事を取ることができました。');
  } else if (log.meal_count && log.meal_count >= 1) {
    messages.push('何か口にできたこと、それだけでも十分です。');
  }
  
  if (log.stress_score !== null) {
    if (log.stress_score < 5) {
      messages.push('比較的穏やかな1日でした。');
    } else if (log.stress_score < 8) {
      messages.push('大変な中、よく耐えました。');
    } else {
      messages.push('限界の中、ここまで来たこと自体がすごいことです。');
    }
  }
  
  if (messages.length === 0) {
    return '記録を残してくれて、ありがとう。それだけでも十分な行動です。';
  }
  
  return messages.join(' ') + '\n\n今日はこれで生き延びた。それが何よりも大事です。';
}

/**
 * 週次トレンドの表示
 */
function generateWeeklySummary() {
  const recentLogs = getRecentLifeLogs(7);
  
  if (recentLogs.length === 0) {
    return '過去7日間の記録がありません。';
  }
  
  const parts = [];
  parts.push('📊 過去7日間の記録');
  parts.push('');
  
  // 統計計算
  const stats = calculateStats(recentLogs);
  
  parts.push(`記録日数: ${recentLogs.length}日`);
  
  if (stats.avgSleep) {
    parts.push(`平均睡眠: ${stats.avgSleep.toFixed(1)}時間`);
  }
  
  if (stats.avgMeals) {
    parts.push(`平均食事: ${stats.avgMeals.toFixed(1)}回`);
  }
  
  if (stats.avgStress) {
    parts.push(`平均しんどさ: ${stats.avgStress.toFixed(1)}/10`);
  }
  
  parts.push('');
  parts.push(`危機介入: ${stats.crisisCount}回`);
  
  if (stats.crisisCount > 0) {
    parts.push('');
    parts.push('大変な日々が続いていますが、それでもあなたはここにいる。');
    parts.push('それ自体が、計り知れない強さです。');
  } else {
    parts.push('');
    parts.push('比較的安定した週でした。このペースを無理なく続けられますように。');
  }
  
  return parts.join('\n');
}

/**
 * 統計計算
 */
function calculateStats(logs) {
  const stats = {
    avgSleep: 0,
    avgMeals: 0,
    avgStress: 0,
    crisisCount: 0
  };
  
  let sleepCount = 0;
  let mealsCount = 0;
  let stressCount = 0;
  
  for (const log of logs) {
    if (log.sleep_hours !== null) {
      stats.avgSleep += log.sleep_hours;
      sleepCount++;
    }
    
    if (log.meal_count !== null) {
      stats.avgMeals += log.meal_count;
      mealsCount++;
    }
    
    if (log.stress_score !== null) {
      stats.avgStress += log.stress_score;
      stressCount++;
    }
    
    if (log.crisis_flag) {
      stats.crisisCount++;
    }
  }
  
  if (sleepCount > 0) stats.avgSleep /= sleepCount;
  if (mealsCount > 0) stats.avgMeals /= mealsCount;
  if (stressCount > 0) stats.avgStress /= stressCount;
  
  return stats;
}

module.exports = {
  generateDailySummary,
  generateWeeklySummary
};
