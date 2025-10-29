/**
 * LLM Client (Local + Cloud Hybrid)
 * ローカルLLM（Ollama）優先、フォールバックでOpenAI API
 */

const OpenAI = require('openai');
const axios = require('axios');

// Ollama設定（IPv4を明示的に使用）
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

// OpenAI設定（オプショナル）
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Ollamaが利用可能かチェック
 */
async function isOllamaAvailable() {
  try {
    console.log('🔍 Ollama接続チェック中:', OLLAMA_BASE_URL);
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 3000
    });
    console.log('✅ Ollama応答:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('❌ Ollama接続失敗:', error.message);
    return false;
  }
}

/**
 * Ollamaでメッセージ生成
 */
async function generateWithOllama(systemPrompt, userPrompt) {
  const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
    model: OLLAMA_MODEL,
    prompt: `${systemPrompt}\n\n${userPrompt}\n\n必ず日本語で、自然な会話として返答してください。`,
    stream: false,
    options: {
      temperature: 0.8, // 0.7 → 0.8 (少し創造的に)
      num_predict: 300,
      top_p: 0.9,
      top_k: 40
    }
  }, {
    timeout: 30000 // 30秒タイムアウト
  });

  if (response.status !== 200) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = response.data;
  return data.response.trim();
}

/**
 * OpenAIでメッセージ生成
 */
async function generateWithOpenAI(systemPrompt, userPrompt) {
  if (!openaiClient) {
    throw new Error('OpenAI API key is not configured');
  }

  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 300
  });

  return completion.choices[0].message.content.trim();
}

/**
 * LLM選択とメッセージ生成（自動フォールバック）
 */
async function generateMessage(systemPrompt, userPrompt) {
  // 1. Ollamaを試す（ローカル優先）
  if (await isOllamaAvailable()) {
    try {
      console.log('🤖 Ollama (ローカルLLM) を使用');
      return await generateWithOllama(systemPrompt, userPrompt);
    } catch (error) {
      console.warn('⚠️  Ollama生成失敗、OpenAIにフォールバック:', error.message);
    }
  }

  // 2. OpenAIにフォールバック
  if (openaiClient) {
    try {
      console.log('☁️  OpenAI API を使用');
      return await generateWithOpenAI(systemPrompt, userPrompt);
    } catch (error) {
      console.error('❌ OpenAI生成失敗:', error.message);
      // フォールバック応答
      return getFallbackResponse(userPrompt);
    }
  }

  // 3. どちらも使えない場合はフォールバック応答
  console.warn('⚠️  LLMが利用できません。フォールバック応答を使用します。');
  console.warn('💡 Ollamaをインストールするか、OPENAI_API_KEYを設定してください。');
  return getFallbackResponse(userPrompt);
}

/**
 * フォールバック応答生成（LLMなしでも自然な応答）
 */
function getFallbackResponse(userPrompt) {
  const responses = [
    '今日はどんな1日だった？話してくれると嬉しいな。',
    'ゆっくり休んでね。明日はまた新しい日だよ。',
    'あなたのペースでいいんだよ。焦らなくて大丈夫。',
    '小さなことでも、できたことがあったら教えて？',
    '疲れてるよね。無理しないでね。',
    'そばにいるよ。困ったことがあったら話してね。',
    '今日も1日お疲れさま。よく頑張ったね。',
    '何か食べた？水分取った？小さなことから気にかけよう。',
    '今の気持ちを教えてくれる？無理に話さなくてもいいけど。',
    '深呼吸してみよう。ゆっくり、ゆっくり。'
  ];
  
  // ユーザーのプロンプトに応じた応答
  const prompt = userPrompt.toLowerCase();
  
  if (prompt.includes('しんどい') || prompt.includes('疲れ') || prompt.includes('辛い')) {
    return '辛いよね。無理しないで。少し休んでもいいんだよ。';
  }
  
  if (prompt.includes('睡眠') || prompt.includes('寝') || prompt.includes('眠')) {
    return '睡眠は大事だよ。できるだけゆっくり休んでね。';
  }
  
  if (prompt.includes('食事') || prompt.includes('食べ') || prompt.includes('ご飯')) {
    return '食べられるものから食べてね。無理しなくていいからね。';
  }
  
  if (prompt.includes('研究') || prompt.includes('論文') || prompt.includes('勉強')) {
    return 'あなたの考えていること、とても大事だと思うよ。少しずつ形にしていこう。';
  }
  
  // ランダム応答
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * 介入メッセージの生成
 */
async function generateInterventionMessage(lifeLog, crisisDetection) {
  const systemPrompt = `あなたはARCというAIエージェントです。
ユーザーが限界に達したとき、温かく・責めず・最小の行動を提示することが役割です。

重要な原則:
- 決してユーザーを叱らない
- 「もう少し頑張れ」は禁止
- 今日はこれで十分だと許可を与える
- 次の一歩は極限まで小さくする（例: 水を一口飲む、深呼吸を1回する）
- 尊厳を守る言葉遣い
- 短く、シンプルに（200文字以内）

危機レベル: ${crisisDetection.crisisLevel}
- 1: 軽度の注意
- 2: 中度の警戒  
- 3: 高度な警戒（緊急連絡先の提示も検討）`;

  const userPrompt = `ユーザーの状態:
- しんどさスコア: ${lifeLog.stress_score ?? '未記録'}/10
- 睡眠時間: ${lifeLog.sleep_hours ?? '未記録'}時間
- 食事回数: ${lifeLog.meal_count ?? '未記録'}回
${lifeLog.free_text ? `- メモ: ${lifeLog.free_text}` : ''}

検出された危機の理由:
${crisisDetection.reasons.map(r => `- ${r.message}`).join('\n')}

上記を踏まえて、今このユーザーに必要な短いメッセージを日本語で生成してください。`;

  return await generateMessage(systemPrompt, userPrompt);
}

/**
 * 1日サマリーの生成（LLM使用）
 */
async function generateDailySummaryWithLLM(lifeLog) {
  const systemPrompt = `あなたはARCというAIエージェントです。
ユーザーの1日を振り返り、ポジティブで温かいサマリーを生成してください。

重要な原則:
- 責めない、評価しない
- 小さな行動も大きく肯定する
- 「生き延びた」ことを祝福する
- 150文字以内で簡潔に`;

  const userPrompt = `今日のユーザーの記録:
- しんどさスコア: ${lifeLog.stress_score ?? '未記録'}/10
- 睡眠時間: ${lifeLog.sleep_hours ?? '未記録'}時間
- 食事回数: ${lifeLog.meal_count ?? '未記録'}回
${lifeLog.free_text ? `- メモ: ${lifeLog.free_text}` : ''}

この記録に対して、温かく肯定的な1日のサマリーメッセージを日本語で生成してください。`;

  return await generateMessage(systemPrompt, userPrompt);
}

/**
 * チャット応答生成
 */
async function generateChatResponse(userMessage) {
  const systemPrompt = `あなたは「ふぐ」という優しいAIです。
ユーザーの話を聞いて、温かく答えてください。
短く、自然な日本語で。絵文字も使ってOK。`;

  return await generateMessage(systemPrompt, userMessage);
}

/**
 * Ollamaのセットアップガイド表示
 */
function showOllamaSetupGuide() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 ローカルLLM（Ollama）のセットアップ');
  console.log('='.repeat(60));
  console.log('\n1. Ollamaをダウンロード:');
  console.log('   https://ollama.com/download\n');か
  console.log('2. インストール後、以下を実行:');
  console.log('   ollama pull llama3.2:3b\n');
  console.log('3. ARCを再起動\n');
  console.log('または、OpenAI APIキーを .env に設定してください。');
  console.log('='.repeat(60) + '\n');
}

module.exports = {
  generateMessage,
  generateInterventionMessage,
  generateDailySummaryWithLLM,
  generateChatResponse,
  isOllamaAvailable,
  showOllamaSetupGuide
};
