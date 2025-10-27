/**
 * ARC - Adaptive Research Companion
 * Entry Point
 */

require('dotenv').config();
const { initDatabase } = require('./storage/database');
const { isOllamaAvailable, showOllamaSetupGuide } = require('./llm/llm-client');
const { startScheduler } = require('./scheduler/jobs');
const cli = require('./ui/cli');

async function main() {
  console.log('🌟 ARC - Adaptive Research Companion');
  console.log('あなたの明日を守り、問いを守り、つながりを守る\n');

  try {
    // データベース初期化
    await initDatabase();
    
    // LLM利用可能性チェック
    const ollamaAvailable = await isOllamaAvailable();
    const openaiAvailable = !!process.env.OPENAI_API_KEY;
    
    if (!ollamaAvailable && !openaiAvailable) {
      console.log('⚠️  LLMが設定されていません\n');
      showOllamaSetupGuide();
      console.log('LLMなしでも基本機能は動作しますが、介入メッセージは固定文になります。\n');
    } else if (ollamaAvailable) {
      console.log('✅ Ollama (ローカルLLM) が利用可能です\n');
    } else if (openaiAvailable) {
      console.log('✅ OpenAI API が利用可能です\n');
    }
    
    // スケジューラー起動（バックグラウンドジョブ）
    startScheduler();
    console.log('');
    
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
