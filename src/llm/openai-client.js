/**
 * OpenAI Client
 * OpenAI APIとの統合
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 介入メッセージの生成
 */
async function generateInterventionMessage(lifeLog, crisisDetection) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY が設定されていません');
  }

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

上記を踏まえて、今このユーザーに必要な短いメッセージを生成してください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API エラー:', error.message);
    throw error;
  }
}

/**
 * 1日サマリーの生成（LLM使用）
 */
async function generateDailySummaryWithLLM(lifeLog) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY が設定されていません');
  }

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

この記録に対して、温かく肯定的な1日のサマリーメッセージを生成してください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 200
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API エラー:', error.message);
    throw error;
  }
}

module.exports = {
  generateInterventionMessage,
  generateDailySummaryWithLLM
};
