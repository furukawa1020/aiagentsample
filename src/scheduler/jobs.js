/**
 * Scheduler - Background Jobs
 * 定期実行タスク（エージェント化の心臓部）
 */

const cron = require('node-cron');
const { morningQuestionReminder } = require('../modules/research-memory/re-presentation');
const { identifyCoreThemes } = require('../modules/research-memory/theme-identifier');
const { getTodayLifeLog } = require('../storage/models');
const notifier = require('node-notifier');
const path = require('path');

/**
 * すべてのスケジュールジョブを開始
 */
function startScheduler() {
  console.log('⏰ スケジューラーを起動しました');

  // 朝の問いリマインド (毎朝9:00)
  scheduleMorningQuestion();

  // 夜の体調確認 (毎晩22:00)
  scheduleEveningCheckIn();

  // テーマ更新 (毎晩23:00)
  scheduleThemeUpdate();

  // 定期ヘルスチェック (1時間ごと)
  scheduleHealthCheck();

  console.log('✅ 以下のスケジュールが設定されました:');
  console.log('  - 朝の問いリマインド: 毎朝9:00');
  console.log('  - 夜の体調確認: 毎晩22:00');
  console.log('  - テーマ自動更新: 毎晩23:00');
  console.log('  - ヘルスチェック: 1時間ごと');
}

/**
 * 朝の問いリマインド
 */
function scheduleMorningQuestion() {
  // 毎朝9:00に実行 (cron: 分 時 日 月 曜日)
  cron.schedule('0 9 * * *', async () => {
    console.log('[スケジューラー] 朝の問いリマインド実行');

    try {
      const reminder = morningQuestionReminder();

      if (reminder.hasQuestion) {
        // デスクトップ通知
        notifier.notify({
          title: '🌟 ARC - 今日の問い',
          message: `${reminder.theme.theme_name}\n\nクリックして詳細を見る`,
          icon: path.join(__dirname, '../../assets/icon.png'),
          sound: true,
          wait: true
        });

        console.log('✅ 朝の問いを通知しました');
      }
    } catch (error) {
      console.error('❌ 朝の問いリマインドエラー:', error.message);
    }
  });
}

/**
 * 夜の体調確認
 */
function scheduleEveningCheckIn() {
  // 毎晩22:00に実行
  cron.schedule('0 22 * * *', async () => {
    console.log('[スケジューラー] 夜の体調確認実行');

    try {
      const todayLog = getTodayLifeLog();

      if (!todayLog) {
        // 今日まだ記録していない
        notifier.notify({
          title: '💙 ARC - 体調確認',
          message: '今日の体調を記録しませんか？\n\nクリックしてARCを開く',
          icon: path.join(__dirname, '../../assets/icon.png'),
          sound: true,
          wait: true
        });

        console.log('✅ 体調確認リマインドを通知しました');
      } else {
        console.log('今日は既に体調記録済み');
      }
    } catch (error) {
      console.error('❌ 体調確認リマインドエラー:', error.message);
    }
  });
}

/**
 * テーマ自動更新
 */
function scheduleThemeUpdate() {
  // 毎晩23:00に実行
  cron.schedule('0 23 * * *', async () => {
    console.log('[スケジューラー] テーマ自動更新実行');

    try {
      await identifyCoreThemes();
      console.log('✅ テーマを自動更新しました');
    } catch (error) {
      console.error('❌ テーマ自動更新エラー:', error.message);
    }
  });
}

/**
 * 定期ヘルスチェック（1時間ごと）
 */
function scheduleHealthCheck() {
  // 1時間ごとに実行
  cron.schedule('0 * * * *', async () => {
    console.log('[スケジューラー] ヘルスチェック実行');

    try {
      // 最終記録からの経過時間をチェック
      const { checkFragmentInactivity } = require('../modules/research-memory/fragment-collector');
      await checkFragmentInactivity();

    } catch (error) {
      console.error('❌ ヘルスチェックエラー:', error.message);
    }
  });
}

/**
 * 手動テスト用: 即座に朝の問いを実行
 */
async function testMorningQuestion() {
  console.log('[テスト] 朝の問いを実行');
  const reminder = morningQuestionReminder();

  if (reminder.hasQuestion) {
    console.log('\n' + '='.repeat(60));
    console.log(reminder.message);
    console.log('='.repeat(60) + '\n');
  } else {
    console.log(reminder.message);
  }
}

module.exports = {
  startScheduler,
  testMorningQuestion
};
