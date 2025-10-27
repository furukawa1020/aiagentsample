/**
 * ARC - Adaptive Research Companion
 * Entry Point
 */

require('dotenv').config();
const { initDatabase } = require('./storage/database');
const cli = require('./ui/cli');

async function main() {
  console.log('🌟 ARC - Adaptive Research Companion');
  console.log('あなたの明日を守り、問いを守り、つながりを守る\n');

  try {
    // データベース初期化
    await initDatabase();
    
    // CLIインターフェース起動
    await cli.start();
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 またお会いしましょう。あなたの問いはここに残っています。');
  process.exit(0);
});

main();
