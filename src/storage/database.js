/**
 * Database Module
 * SQLiteデータベースの初期化と接続管理
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || './data/arc.db';
let db = null;

/**
 * データベース初期化
 */
function initDatabase() {
  // データディレクトリ作成
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // データベース接続
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // パフォーマンス向上

  // テーブル作成
  createTables();

  console.log('✅ データベース初期化完了');
  return db;
}

/**
 * テーブル作成
 */
function createTables() {
  // life_logs テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS life_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      log_date DATE NOT NULL,
      log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sleep_hours REAL,
      meal_count INTEGER,
      stress_score INTEGER CHECK(stress_score BETWEEN 0 AND 10),
      free_text TEXT,
      crisis_flag BOOLEAN DEFAULT 0,
      intervention_given BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // user_thresholds テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_thresholds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      param_name TEXT NOT NULL,
      threshold_value REAL NOT NULL,
      is_default BOOLEAN DEFAULT 1,
      learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // interventions テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      log_id INTEGER,
      crisis_level INTEGER,
      message TEXT NOT NULL,
      action_taken TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (log_id) REFERENCES life_logs(id)
    );
  `);

  // Phase 2: Research Memory テーブル
  createResearchMemoryTables();

  // デフォルト閾値の設定
  initDefaultThresholds();
}

/**
 * Phase 2: Research Memory テーブルの作成
 */
function createResearchMemoryTables() {
  // research_fragments テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_fragments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      content TEXT NOT NULL,
      emotion_tag TEXT,
      context TEXT,
      source_type TEXT DEFAULT 'manual',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_shown TIMESTAMP,
      importance_score REAL DEFAULT 0.5
    );
  `);

  // core_themes テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS core_themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      theme_name TEXT NOT NULL,
      theme_description TEXT,
      fragment_ids TEXT,
      frequency INTEGER DEFAULT 1,
      importance_score REAL DEFAULT 0.5,
      first_appeared TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_shown TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    );
  `);

  // theme_snapshots テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS theme_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      theme_id INTEGER,
      snapshot_type TEXT,
      generated_text TEXT NOT NULL,
      fragment_refs TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (theme_id) REFERENCES core_themes(id)
    );
  `);

  // fragment_tags テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS fragment_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fragment_id INTEGER,
      tag_name TEXT NOT NULL,
      tag_value TEXT,
      FOREIGN KEY (fragment_id) REFERENCES research_fragments(id)
    );
  `);
}

/**
 * デフォルト閾値の初期化
 */
function initDefaultThresholds() {
  const defaults = [
    { param_name: 'stress_score', threshold_value: 8 },
    { param_name: 'meal_count', threshold_value: 0 },
    { param_name: 'sleep_hours', threshold_value: 3 }
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO user_thresholds (user_id, param_name, threshold_value, is_default)
    VALUES (1, ?, ?, 1)
  `);

  for (const threshold of defaults) {
    const exists = db.prepare(`
      SELECT id FROM user_thresholds 
      WHERE user_id = 1 AND param_name = ?
    `).get(threshold.param_name);

    if (!exists) {
      insert.run(threshold.param_name, threshold.threshold_value);
    }
  }
}

/**
 * データベース接続取得
 */
function getDatabase() {
  if (!db) {
    throw new Error('データベースが初期化されていません');
  }
  return db;
}

/**
 * データベースクローズ
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
