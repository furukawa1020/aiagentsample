/**
 * Deadline Manager
 * 締め切り管理と優先度計算
 */

const {
  saveDeadline,
  getPendingDeadlines,
  getTodayTopPriorityTask,
  updateDeadlinePriority,
  updateDeadlineStatus
} = require('../../storage/social-models');

/**
 * 締め切りを追加
 */
function addDeadline(title, dueDate, options = {}) {
  const deadline = {
    title,
    due_date: dueDate,
    description: options.description || '',
    category: options.category || 'other',
    priority_score: 0,
    status: 'pending'
  };

  const result = saveDeadline(deadline);
  
  // 追加後に全締め切りの優先度を再計算
  recalculateAllPriorities();

  return { ...deadline, id: result.id };
}

/**
 * 全締め切りの優先度を再計算
 * 
 * 優先度計算ロジック:
 * 1. 期日までの日数（近いほど高い）
 * 2. カテゴリの重要度（scholarship > grant > submission > report > meeting > other）
 * 3. ステータス（in_progress > pending）
 */
function recalculateAllPriorities() {
  const deadlines = getPendingDeadlines();
  const now = new Date();

  // カテゴリ重みづけ
  const categoryWeights = {
    scholarship: 100,
    grant: 90,
    submission: 80,
    report: 60,
    meeting: 50,
    other: 40
  };

  deadlines.forEach(deadline => {
    const dueDate = new Date(deadline.due_date);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    // 基本スコア: 期日が近いほど高い
    let score = 0;
    if (daysUntilDue <= 0) {
      score = 1000; // 期限切れ = 最高優先度
    } else if (daysUntilDue <= 3) {
      score = 500 - daysUntilDue * 50;
    } else if (daysUntilDue <= 7) {
      score = 350 - daysUntilDue * 20;
    } else if (daysUntilDue <= 14) {
      score = 200 - daysUntilDue * 5;
    } else {
      score = 100 - Math.min(daysUntilDue, 30);
    }

    // カテゴリボーナス
    score += categoryWeights[deadline.category] || 40;

    // ステータスボーナス
    if (deadline.status === 'in_progress') {
      score += 50; // 着手済みのものを優先
    }

    updateDeadlinePriority(deadline.id, score);
  });
}

/**
 * 今日やるべき最優先タスク1つだけ取得
 * 
 * 要件: 「1個ずつ順番に吐き出すUI」
 */
function getTodayFocusTask() {
  const task = getTodayTopPriorityTask();

  if (!task) {
    return {
      hasTask: false,
      message: '今日やるべき外部タスクはありません。お疲れ様です。'
    };
  }

  const dueDate = new Date(task.due_date);
  const now = new Date();
  const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

  let urgencyMessage = '';
  if (daysUntil <= 0) {
    urgencyMessage = '⚠️ 期限を過ぎています';
  } else if (daysUntil <= 1) {
    urgencyMessage = '🔥 明日が締め切りです';
  } else if (daysUntil <= 3) {
    urgencyMessage = `⏰ あと${daysUntil}日です`;
  } else {
    urgencyMessage = `📅 ${daysUntil}日後`;
  }

  return {
    hasTask: true,
    task,
    urgencyMessage,
    daysUntil,
    message: `今日やるのは、これ1つだけ:\n\n【${task.title}】\n${urgencyMessage}\n\n他のタスクは今は見なくていい。これだけに集中してOK。`
  };
}

/**
 * 締め切りを完了にする
 */
function completeDeadline(deadlineId) {
  updateDeadlineStatus(deadlineId, 'completed');
  recalculateAllPriorities(); // 完了後に優先度を再計算
}

/**
 * 締め切りを着手中にする
 */
function startDeadline(deadlineId) {
  updateDeadlineStatus(deadlineId, 'in_progress');
  recalculateAllPriorities();
}

/**
 * 統計情報を取得
 */
function getDeadlineStats() {
  const deadlines = getPendingDeadlines();
  const now = new Date();

  const overdue = deadlines.filter(d => new Date(d.due_date) < now).length;
  const thisWeek = deadlines.filter(d => {
    const diff = (new Date(d.due_date) - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  return {
    total: deadlines.length,
    overdue,
    thisWeek,
    inProgress: deadlines.filter(d => d.status === 'in_progress').length
  };
}

module.exports = {
  addDeadline,
  recalculateAllPriorities,
  getTodayFocusTask,
  completeDeadline,
  startDeadline,
  getDeadlineStats
};
