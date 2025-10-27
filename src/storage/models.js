/**
 * Data Models
 * データベース操作のためのモデル層
 */

const { getDatabase } = require('./database');

/**
 * 体調ログの保存
 */
function saveLifeLog(data) {
  const db = getDatabase();
  const { sleep_hours, meal_count, stress_score, free_text } = data;
  
  const today = new Date().toISOString().split('T')[0];
  
  const insert = db.prepare(`
    INSERT INTO life_logs (log_date, sleep_hours, meal_count, stress_score, free_text)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = insert.run(today, sleep_hours, meal_count, stress_score, free_text);
  return result.lastInsertRowid;
}

/**
 * 今日の体調ログを取得
 */
function getTodayLifeLog() {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];
  
  return db.prepare(`
    SELECT * FROM life_logs 
    WHERE log_date = ? 
    ORDER BY log_time DESC 
    LIMIT 1
  `).get(today);
}

/**
 * 指定日数分の体調ログを取得
 */
function getRecentLifeLogs(days = 7) {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT * FROM life_logs 
    WHERE log_date >= date('now', '-' || ? || ' days')
    ORDER BY log_date DESC, log_time DESC
  `).all(days);
}

/**
 * 危機フラグを更新
 */
function updateCrisisFlag(logId, crisisFlag) {
  const db = getDatabase();
  
  return db.prepare(`
    UPDATE life_logs 
    SET crisis_flag = ? 
    WHERE id = ?
  `).run(crisisFlag, logId);
}

/**
 * 介入記録の保存
 */
function saveIntervention(data) {
  const db = getDatabase();
  const { log_id, crisis_level, message, action_taken } = data;
  
  const insert = db.prepare(`
    INSERT INTO interventions (log_id, crisis_level, message, action_taken)
    VALUES (?, ?, ?, ?)
  `);
  
  return insert.run(log_id, crisis_level, message, action_taken);
}

/**
 * ユーザー閾値の取得
 */
function getUserThresholds() {
  const db = getDatabase();
  
  const thresholds = db.prepare(`
    SELECT param_name, threshold_value 
    FROM user_thresholds 
    WHERE user_id = 1
  `).all();
  
  // オブジェクト形式に変換
  return thresholds.reduce((acc, t) => {
    acc[t.param_name] = t.threshold_value;
    return acc;
  }, {});
}

/**
 * 月次サマリーデータの取得
 */
function getMonthlySummary() {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT 
      log_date,
      AVG(stress_score) as avg_stress,
      AVG(sleep_hours) as avg_sleep,
      AVG(meal_count) as avg_meals,
      SUM(crisis_flag) as crisis_count,
      SUM(intervention_given) as intervention_count
    FROM life_logs
    WHERE log_date >= date('now', '-30 days')
    GROUP BY log_date
    ORDER BY log_date DESC
  `).all();
}

module.exports = {
  saveLifeLog,
  getTodayLifeLog,
  getRecentLifeLogs,
  updateCrisisFlag,
  saveIntervention,
  getUserThresholds,
  getMonthlySummary
};
