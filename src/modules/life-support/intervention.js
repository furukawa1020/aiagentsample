/**
 * Life Support Module - Intervention
 * 介入メッセージの生成
 */

const { generateInterventionMessage } = require('../../llm/llm-client');
const { saveIntervention } = require('../../storage/models');

/**
 * 介入メッセージの生成と保存
 */
async function generateIntervention(lifeLog, crisisDetection) {
  try {
    // LLMでメッセージ生成
    const message = await generateInterventionMessage(lifeLog, crisisDetection);
    
    // 介入記録を保存
    saveIntervention({
      log_id: lifeLog.id,
      crisis_level: crisisDetection.crisisLevel,
      message: message,
      action_taken: 'shown'
    });

    return message;
  } catch (error) {
    console.error('❌ 介入メッセージの生成に失敗:', error.message);
    
    // フォールバック: 固定メッセージ
    return generateFallbackMessage(crisisDetection.crisisLevel);
  }
}

/**
 * フォールバックメッセージ（LLM使用不可時）
 */
function generateFallbackMessage(crisisLevel) {
  const messages = {
    1: `今日はここまでやったから、十分です。\n次は、水を一口飲むことだけを考えてみてください。\nそれで今日はクリア扱いにします。`,
    
    2: `いま、とても限界に近い状態だと感じています。\n今日はこれ以上進まなくていい。\n\n次の一歩は「深呼吸を1回する」だけです。\nそれができたら、それで今日は合格です。`,
    
    3: `いま、かなり危険な状態にいるように見えます。\n\nまず聞かせてください：今すぐ物理的に助けが必要ですか？\n\nもしそうなら、以下に連絡してください：\n- こころの健康相談統一ダイヤル: 0570-064-556\n- いのちの電話: 0570-783-556\n\nそうでない場合も、今日はもう休んでいい。\nあなたはよくここまで耐えてくれました。`
  };

  return messages[crisisLevel] || messages[1];
}

/**
 * 介入メッセージの表示
 */
function displayIntervention(message) {
  console.log('\n' + '='.repeat(60));
  console.log('💙 ARCからのメッセージ');
  console.log('='.repeat(60));
  console.log('\n' + message + '\n');
  console.log('='.repeat(60) + '\n');
}

module.exports = {
  generateIntervention,
  displayIntervention
};
