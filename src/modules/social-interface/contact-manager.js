/**
 * Contact Manager
 * 連絡先・緊急連絡先の管理
 */

const {
  saveContact,
  getAllContacts,
  updateContact,
  saveEmergencyContact,
  getActiveEmergencyContacts
} = require('../../storage/social-models');

/**
 * 連絡先を追加
 */
function addContact(name, details = {}) {
  const contact = {
    name,
    role: details.role || '',
    email: details.email || '',
    phone: details.phone || '',
    organization: details.organization || '',
    notes: details.notes || '',
    last_contact: details.last_contact || null
  };

  return saveContact(contact);
}

/**
 * 連絡先一覧を取得
 */
function listContacts() {
  return getAllContacts();
}

/**
 * 最終連絡日を更新
 */
function recordContactInteraction(contactId) {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  updateContact(contactId, { last_contact: now });
}

/**
 * 緊急連絡先を追加
 */
function addEmergencyContact(name, phone, details = {}) {
  const contact = {
    name,
    phone,
    relationship: details.relationship || '',
    notes: details.notes || '',
    is_active: 1
  };

  return saveEmergencyContact(contact);
}

/**
 * 緊急連絡先一覧を表示
 */
function showEmergencyContacts() {
  const contacts = getActiveEmergencyContacts();

  if (contacts.length === 0) {
    return {
      hasContacts: false,
      message: '⚠️ 緊急連絡先が登録されていません。\n\n万が一のために、信頼できる人の連絡先を登録することをお勧めします。'
    };
  }

  let message = '🆘 緊急連絡先\n\n';
  message += '※ 本当に辛いとき・危ないと感じたときは、ためらわず連絡してください。\n\n';

  contacts.forEach((contact, index) => {
    message += `${index + 1}. ${contact.name}`;
    if (contact.relationship) {
      message += ` (${contact.relationship})`;
    }
    message += `\n   📞 ${contact.phone}\n`;
    if (contact.notes) {
      message += `   📝 ${contact.notes}\n`;
    }
    message += '\n';
  });

  return {
    hasContacts: true,
    contacts,
    message
  };
}

/**
 * 公的支援窓口の情報を表示
 */
function showPublicSupportResources() {
  return `
🆘 公的支援窓口

【24時間対応】
- よりそいホットライン: 0120-279-338
  一般社団法人 社会的包摂サポートセンター
  24時間・無料・匿名OK

- いのちの電話: 0570-783-556
  全国いのちの電話連盟
  24時間対応（ナビダイヤル）

【学生向け】
- 大学の学生相談室（所属大学の窓口を確認）
- 大学保健管理センター

【生活困窮】
- 生活困窮者自立支援制度（市区町村の福祉窓口）
- 社会福祉協議会の生活福祉資金貸付

---
※ ARCは医療診断や緊急対応はできません。
※ 命に関わる状況では、必ず専門機関に連絡してください。
`;
}

module.exports = {
  addContact,
  listContacts,
  recordContactInteraction,
  addEmergencyContact,
  showEmergencyContacts,
  showPublicSupportResources
};
