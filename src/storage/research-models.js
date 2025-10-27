/**
 * Research Memory Models
 * リサーチメモリ用のデータアクセス層
 */

const { getDatabase } = require('./database');

/**
 * 研究断片の保存
 */
function saveResearchFragment(data) {
  const db = getDatabase();
  const { content, emotion_tag, context, source_type } = data;
  
  const insert = db.prepare(`
    INSERT INTO research_fragments (content, emotion_tag, context, source_type, importance_score)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const importance = calculateInitialImportance(content, emotion_tag);
  const result = insert.run(content, emotion_tag, context, source_type || 'manual', importance);
  
  return result.lastInsertRowid;
}

/**
 * 初期重要度スコアの計算
 */
function calculateInitialImportance(content, emotion_tag) {
  let score = 0.5; // ベーススコア
  
  // 長さボーナス（詳しく書いたものは重要）
  if (content.length > 100) score += 0.1;
  if (content.length > 300) score += 0.1;
  
  // 感情ボーナス（怒り・違和感は問いの源）
  if (emotion_tag === 'anger' || emotion_tag === 'discomfort') score += 0.2;
  if (emotion_tag === 'surprise') score += 0.1;
  
  // 疑問符があれば重要
  if (content.includes('？') || content.includes('?')) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * 全断片の取得
 */
function getAllFragments(limit = 100) {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT * FROM research_fragments
    WHERE user_id = 1
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

/**
 * 断片の検索（キーワード）
 */
function searchFragments(keyword) {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT * FROM research_fragments
    WHERE user_id = 1 AND content LIKE ?
    ORDER BY importance_score DESC, created_at DESC
  `).all(`%${keyword}%`);
}

/**
 * 感情別の断片取得
 */
function getFragmentsByEmotion(emotion_tag) {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT * FROM research_fragments
    WHERE user_id = 1 AND emotion_tag = ?
    ORDER BY created_at DESC
  `).all(emotion_tag);
}

/**
 * 核テーマの保存
 */
function saveCoreTheme(data) {
  const db = getDatabase();
  const { theme_name, theme_description, fragment_ids, importance_score } = data;
  
  const insert = db.prepare(`
    INSERT INTO core_themes (theme_name, theme_description, fragment_ids, importance_score)
    VALUES (?, ?, ?, ?)
  `);
  
  const fragmentIdsJson = JSON.stringify(fragment_ids);
  const result = insert.run(theme_name, theme_description, fragmentIdsJson, importance_score || 0.5);
  
  return result.lastInsertRowid;
}

/**
 * 核テーマの更新
 */
function updateCoreTheme(themeId, data) {
  const db = getDatabase();
  const { theme_name, theme_description, fragment_ids, frequency, importance_score } = data;
  
  const fragmentIdsJson = fragment_ids ? JSON.stringify(fragment_ids) : null;
  
  const update = db.prepare(`
    UPDATE core_themes
    SET theme_name = COALESCE(?, theme_name),
        theme_description = COALESCE(?, theme_description),
        fragment_ids = COALESCE(?, fragment_ids),
        frequency = COALESCE(?, frequency),
        importance_score = COALESCE(?, importance_score),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  return update.run(
    theme_name,
    theme_description,
    fragmentIdsJson,
    frequency,
    importance_score,
    themeId
  );
}

/**
 * アクティブな核テーマの取得
 */
function getActiveCoreThemes() {
  const db = getDatabase();
  
  const themes = db.prepare(`
    SELECT * FROM core_themes
    WHERE user_id = 1 AND is_active = 1
    ORDER BY importance_score DESC, last_updated DESC
  `).all();
  
  // fragment_idsをパース
  return themes.map(theme => ({
    ...theme,
    fragment_ids: theme.fragment_ids ? JSON.parse(theme.fragment_ids) : []
  }));
}

/**
 * 最も重要なテーマを1つ取得
 */
function getTopCoreTheme() {
  const db = getDatabase();
  
  const theme = db.prepare(`
    SELECT * FROM core_themes
    WHERE user_id = 1 AND is_active = 1
    ORDER BY importance_score DESC, frequency DESC
    LIMIT 1
  `).get();
  
  if (!theme) return null;
  
  return {
    ...theme,
    fragment_ids: theme.fragment_ids ? JSON.parse(theme.fragment_ids) : []
  };
}

/**
 * 問いの再提示履歴を更新
 */
function updateThemeLastShown(themeId) {
  const db = getDatabase();
  
  return db.prepare(`
    UPDATE core_themes
    SET last_shown = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(themeId);
}

/**
 * スナップショットの保存
 */
function saveSnapshot(data) {
  const db = getDatabase();
  const { theme_id, snapshot_type, generated_text, fragment_refs } = data;
  
  const fragmentRefsJson = JSON.stringify(fragment_refs);
  
  const insert = db.prepare(`
    INSERT INTO theme_snapshots (theme_id, snapshot_type, generated_text, fragment_refs)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = insert.run(theme_id, snapshot_type, generated_text, fragmentRefsJson);
  return result.lastInsertRowid;
}

/**
 * スナップショットの取得
 */
function getSnapshots(themeId = null, type = null) {
  const db = getDatabase();
  
  let query = `SELECT * FROM theme_snapshots WHERE user_id = 1`;
  const params = [];
  
  if (themeId) {
    query += ` AND theme_id = ?`;
    params.push(themeId);
  }
  
  if (type) {
    query += ` AND snapshot_type = ?`;
    params.push(type);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const snapshots = db.prepare(query).all(...params);
  
  return snapshots.map(snap => ({
    ...snap,
    fragment_refs: snap.fragment_refs ? JSON.parse(snap.fragment_refs) : []
  }));
}

/**
 * 断片にタグを追加
 */
function addFragmentTag(fragmentId, tagName, tagValue) {
  const db = getDatabase();
  
  const insert = db.prepare(`
    INSERT INTO fragment_tags (fragment_id, tag_name, tag_value)
    VALUES (?, ?, ?)
  `);
  
  return insert.run(fragmentId, tagName, tagValue);
}

/**
 * 断片のタグ取得
 */
function getFragmentTags(fragmentId) {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT * FROM fragment_tags
    WHERE fragment_id = ?
  `).all(fragmentId);
}

/**
 * 最近の断片を取得（未分析のもの優先）
 */
function getRecentUnanalyzedFragments(limit = 10) {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT f.* FROM research_fragments f
    LEFT JOIN fragment_tags t ON f.id = t.fragment_id AND t.tag_name = 'analyzed'
    WHERE f.user_id = 1 AND t.id IS NULL
    ORDER BY f.created_at DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  saveResearchFragment,
  getAllFragments,
  searchFragments,
  getFragmentsByEmotion,
  saveCoreTheme,
  updateCoreTheme,
  getActiveCoreThemes,
  getTopCoreTheme,
  updateThemeLastShown,
  saveSnapshot,
  getSnapshots,
  addFragmentTag,
  getFragmentTags,
  getRecentUnanalyzedFragments
};
