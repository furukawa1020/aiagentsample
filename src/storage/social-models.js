/**
 * Social Interface Data Models
 * Phase 3: 締め切り・書類・連絡先のデータアクセス層
 */

const db = require('./database').getDatabase();

// ==================== Deadlines ====================

/**
 * 締め切りを保存
 */
function saveDeadline(deadline) {
  const stmt = db.prepare(`
    INSERT INTO deadlines (title, description, due_date, category, priority_score, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    deadline.title,
    deadline.description || '',
    deadline.due_date,
    deadline.category || 'other',
    deadline.priority_score || 0,
    deadline.status || 'pending'
  );

  return { id: info.lastInsertRowid };
}

/**
 * 全ての未完了締め切りを取得（優先度順）
 */
function getPendingDeadlines() {
  const stmt = db.prepare(`
    SELECT * FROM deadlines
    WHERE status IN ('pending', 'in_progress')
    ORDER BY priority_score DESC, due_date ASC
  `);

  return stmt.all();
}

/**
 * 今日の最優先タスク1つだけ取得
 */
function getTodayTopPriorityTask() {
  const stmt = db.prepare(`
    SELECT * FROM deadlines
    WHERE status IN ('pending', 'in_progress')
    ORDER BY priority_score DESC, due_date ASC
    LIMIT 1
  `);

  return stmt.get();
}

/**
 * 締め切りの優先度を更新
 */
function updateDeadlinePriority(deadlineId, priorityScore) {
  const stmt = db.prepare(`
    UPDATE deadlines
    SET priority_score = ?
    WHERE id = ?
  `);

  stmt.run(priorityScore, deadlineId);
}

/**
 * 締め切りのステータスを更新
 */
function updateDeadlineStatus(deadlineId, status) {
  const stmt = db.prepare(`
    UPDATE deadlines
    SET status = ?, completed_at = CASE WHEN ? = 'completed' THEN datetime('now', 'localtime') ELSE completed_at END
    WHERE id = ?
  `);

  stmt.run(status, status, deadlineId);
}

/**
 * 締め切りを削除
 */
function deleteDeadline(deadlineId) {
  const stmt = db.prepare('DELETE FROM deadlines WHERE id = ?');
  stmt.run(deadlineId);
}

// ==================== Documents ====================

/**
 * ドキュメントを保存
 */
function saveDocument(document) {
  const stmt = db.prepare(`
    INSERT INTO documents (deadline_id, title, doc_type, content, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    document.deadline_id || null,
    document.title,
    document.doc_type,
    document.content,
    document.status || 'draft'
  );

  return { id: info.lastInsertRowid };
}

/**
 * 締め切りに紐づくドキュメント一覧を取得
 */
function getDocumentsByDeadline(deadlineId) {
  const stmt = db.prepare(`
    SELECT * FROM documents
    WHERE deadline_id = ?
    ORDER BY created_at DESC
  `);

  return stmt.all(deadlineId);
}

/**
 * ドキュメントのステータスを更新
 */
function updateDocumentStatus(documentId, status) {
  const stmt = db.prepare(`
    UPDATE documents
    SET status = ?, submitted_at = CASE WHEN ? = 'submitted' THEN datetime('now', 'localtime') ELSE submitted_at END
    WHERE id = ?
  `);

  stmt.run(status, status, documentId);
}

/**
 * ドキュメントの内容を更新
 */
function updateDocumentContent(documentId, content) {
  const stmt = db.prepare(`
    UPDATE documents
    SET content = ?
    WHERE id = ?
  `);

  stmt.run(content, documentId);
}

// ==================== Contacts ====================

/**
 * 連絡先を保存
 */
function saveContact(contact) {
  const stmt = db.prepare(`
    INSERT INTO contacts (name, role, email, phone, organization, notes, last_contact)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    contact.name,
    contact.role || '',
    contact.email || '',
    contact.phone || '',
    contact.organization || '',
    contact.notes || '',
    contact.last_contact || null
  );

  return { id: info.lastInsertRowid };
}

/**
 * 全連絡先を取得
 */
function getAllContacts() {
  const stmt = db.prepare('SELECT * FROM contacts ORDER BY name ASC');
  return stmt.all();
}

/**
 * 連絡先を更新
 */
function updateContact(contactId, updates) {
  const fields = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    fields.push(`${key} = ?`);
    values.push(updates[key]);
  });

  values.push(contactId);

  const stmt = db.prepare(`
    UPDATE contacts
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

// ==================== Emergency Contacts ====================

/**
 * 緊急連絡先を保存
 */
function saveEmergencyContact(contact) {
  const stmt = db.prepare(`
    INSERT INTO emergency_contacts (name, phone, relationship, notes, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    contact.name,
    contact.phone,
    contact.relationship || '',
    contact.notes || '',
    contact.is_active !== undefined ? contact.is_active : 1
  );

  return { id: info.lastInsertRowid };
}

/**
 * アクティブな緊急連絡先を取得
 */
function getActiveEmergencyContacts() {
  const stmt = db.prepare(`
    SELECT * FROM emergency_contacts
    WHERE is_active = 1
    ORDER BY created_at ASC
  `);

  return stmt.all();
}

module.exports = {
  // Deadlines
  saveDeadline,
  getPendingDeadlines,
  getTodayTopPriorityTask,
  updateDeadlinePriority,
  updateDeadlineStatus,
  deleteDeadline,

  // Documents
  saveDocument,
  getDocumentsByDeadline,
  updateDocumentStatus,
  updateDocumentContent,

  // Contacts
  saveContact,
  getAllContacts,
  updateContact,

  // Emergency
  saveEmergencyContact,
  getActiveEmergencyContacts
};
