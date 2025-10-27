/**
 * Research Memory Module - Re-presentation
 * 問いの再提示エンジン
 */

const { 
  getTopCoreTheme, 
  getActiveCoreThemes, 
  updateThemeLastShown,
  getAllFragments
} = require('../../storage/research-models');

/**
 * 今日の問いを選択
 */
function selectTodaysQuestion() {
  const themes = getActiveCoreThemes();
  
  if (themes.length === 0) {
    return null;
  }
  
  // 最も重要で、最近表示していないテーマを選択
  const sorted = themes.sort((a, b) => {
    // last_shownがnullの場合は優先度高
    if (!a.last_shown && b.last_shown) return -1;
    if (a.last_shown && !b.last_shown) return 1;
    
    // 重要度と最終表示時刻のバランス
    const scoreA = a.importance_score - (a.last_shown ? daysSince(a.last_shown) * 0.1 : 0);
    const scoreB = b.importance_score - (b.last_shown ? daysSince(b.last_shown) * 0.1 : 0);
    
    return scoreB - scoreA;
  });
  
  const selected = sorted[0];
  
  // 表示履歴を更新
  updateThemeLastShown(selected.id);
  
  return selected;
}

/**
 * 問いの再提示メッセージを生成
 */
function generateQuestionMessage(theme) {
  if (!theme) {
    return null;
  }
  
  const messages = [
    `🌟 今日の問い\n\n「${theme.theme_name}」\n\n${theme.theme_description}\n\nこれ、まだあなたにとって大事ですか？`,
    `💭 あなたの核\n\n「${theme.theme_name}」\n\n${theme.theme_description}\n\nこの問い、まだ燃えてますか？`,
    `🔥 忘れないで\n\n「${theme.theme_name}」\n\n${theme.theme_description}\n\nこれ、明文化しておきたい？`
  ];
  
  // ランダムに選択
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * 問いのリマインド（毎朝実行）
 */
function morningQuestionReminder() {
  const theme = selectTodaysQuestion();
  
  if (!theme) {
    return {
      hasQuestion: false,
      message: '今日の問いはまだありません。\n思考の断片を記録し始めてみませんか？'
    };
  }
  
  return {
    hasQuestion: true,
    theme: theme,
    message: generateQuestionMessage(theme)
  };
}

/**
 * 週次レビュー
 */
function weeklyReview() {
  const themes = getActiveCoreThemes();
  const recentFragments = getAllFragments(50);
  
  if (themes.length === 0) {
    return {
      summary: 'この週はまだテーマが特定されていません。',
      fragments_count: recentFragments.length
    };
  }
  
  // 最も重要なテーマトップ3
  const topThemes = themes
    .sort((a, b) => b.importance_score - a.importance_score)
    .slice(0, 3);
  
  const parts = [];
  parts.push('📊 この週の核心テーマ\n');
  
  topThemes.forEach((theme, idx) => {
    parts.push(`${idx + 1}. ${theme.theme_name}`);
    parts.push(`   ${theme.theme_description}`);
    parts.push(`   (関連断片: ${theme.fragment_ids.length}件)\n`);
  });
  
  parts.push(`\n合計 ${recentFragments.length} 個の思考の断片を記録しました。`);
  parts.push('よくここまで考え続けてくれました。');
  
  return {
    summary: parts.join('\n'),
    top_themes: topThemes,
    fragments_count: recentFragments.length
  };
}

/**
 * ユーザーフィードバックの記録
 */
function recordUserFeedback(themeId, feedback) {
  // feedback: 'still_important', 'not_anymore', 'want_to_write'
  
  if (feedback === 'not_anymore') {
    // テーマを非アクティブ化
    const db = require('../../storage/database').getDatabase();
    db.prepare(`
      UPDATE core_themes
      SET is_active = 0
      WHERE id = ?
    `).run(themeId);
    
    return { message: 'このテーマをアーカイブしました。' };
  }
  
  if (feedback === 'want_to_write') {
    return { message: 'スナップショット生成機能は準備中です。' };
  }
  
  return { message: 'フィードバックを記録しました。' };
}

/**
 * 日数計算ヘルパー
 */
function daysSince(timestamp) {
  const then = new Date(timestamp);
  const now = new Date();
  const diff = now - then;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

module.exports = {
  selectTodaysQuestion,
  generateQuestionMessage,
  morningQuestionReminder,
  weeklyReview,
  recordUserFeedback
};
