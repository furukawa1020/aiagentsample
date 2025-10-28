/**
 * Scheduler Test Script
 * スケジューラーの動作を今すぐテストする
 */

require('dotenv').config();
const { initDatabase } = require('./src/storage/database');
const { testMorningQuestion } = require('./src/scheduler/jobs');

async function testScheduler() {
  console.log('🧪 スケジューラーテスト開始\n');

  // データベース初期化
  await initDatabase();

  console.log('--- 朝の問いリマインドをテスト ---\n');
  await testMorningQuestion();

  console.log('\n✅ テスト完了\n');
}

testScheduler().catch(error => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
