/**
 * CLI Interface
 * コマンドラインインターフェース
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { logLifeData, validateLifeData } = require('../modules/life-support/logger');
const { detectCrisis } = require('../modules/life-support/crisis-detector');
const { generateIntervention, displayIntervention } = require('../modules/life-support/intervention');
const { generateDailySummary, generateWeeklySummary } = require('../modules/life-support/summary');
const { getTodayLifeLog } = require('../storage/models');

/**
 * メインメニュー
 */
async function showMainMenu() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '何をしますか？',
      choices: [
        { name: '📝 今日の体調を記録する', value: 'log' },
        { name: '📊 今日の振り返りを見る', value: 'daily_summary' },
        { name: '📈 週の振り返りを見る', value: 'weekly_summary' },
        { name: '💬 自由にメモする', value: 'free_note' },
        { name: '👋 終了する', value: 'exit' }
      ]
    }
  ]);

  return answers.action;
}

/**
 * 体調ログの入力
 */
async function inputLifeLog() {
  console.log(chalk.cyan('\n📝 今日の体調を記録します\n'));

  const questions = [
    {
      type: 'number',
      name: 'sleep_hours',
      message: '睡眠時間（時間）:',
      default: null,
      validate: (value) => {
        if (value === null || value === '') return true;
        if (value < 0 || value > 24) return '0〜24の範囲で入力してください';
        return true;
      }
    },
    {
      type: 'number',
      name: 'meal_count',
      message: '食事回数（回）:',
      default: null,
      validate: (value) => {
        if (value === null || value === '') return true;
        if (value < 0 || value > 10) return '0〜10の範囲で入力してください';
        return true;
      }
    },
    {
      type: 'number',
      name: 'stress_score',
      message: 'しんどさスコア（0=全然しんどくない 〜 10=限界）:',
      default: null,
      validate: (value) => {
        if (value === null || value === '') return true;
        if (value < 0 || value > 10) return '0〜10の範囲で入力してください';
        return true;
      }
    },
    {
      type: 'input',
      name: 'free_text',
      message: '何か残しておきたいこと（オプション）:',
      default: ''
    }
  ];

  const answers = await inquirer.prompt(questions);

  // 空文字列をnullに変換
  Object.keys(answers).forEach(key => {
    if (answers[key] === '' || answers[key] === null) {
      answers[key] = null;
    }
  });

  // バリデーション
  const validation = validateLifeData(answers);
  if (!validation.isValid) {
    console.log(chalk.red('\n❌ 入力エラー:'));
    validation.errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
    return;
  }

  // 保存
  const logId = await logLifeData(answers);

  // 危機検知
  const lifeLog = { id: logId, ...answers };
  const crisisDetection = detectCrisis(lifeLog);

  if (crisisDetection.isCrisis) {
    console.log(chalk.yellow('\n⚠️  危機状態が検出されました\n'));
    
    // 介入メッセージ生成
    try {
      const message = await generateIntervention(lifeLog, crisisDetection);
      displayIntervention(message);
    } catch (error) {
      console.log(chalk.red('メッセージ生成中にエラーが発生しましたが、記録は保存されています。'));
    }
  } else {
    console.log(chalk.green('\n✅ 記録を保存しました\n'));
  }
}

/**
 * 1日サマリーの表示
 */
async function showDailySummary() {
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  const summary = generateDailySummary();
  console.log(summary);
  console.log(chalk.cyan('='.repeat(60) + '\n'));

  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Enterキーでメニューに戻ります...'
    }
  ]);
}

/**
 * 週次サマリーの表示
 */
async function showWeeklySummary() {
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  const summary = generateWeeklySummary();
  console.log(summary);
  console.log(chalk.cyan('='.repeat(60) + '\n'));

  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Enterキーでメニューに戻ります...'
    }
  ]);
}

/**
 * 自由メモの入力
 */
async function inputFreeNote() {
  console.log(chalk.cyan('\n💬 自由にメモを残します\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'free_text',
      message: 'メモ（何でも自由に）:'
    }
  ]);

  if (answers.free_text.trim()) {
    // 既存のログに追記、なければ新規作成
    const todayLog = getTodayLifeLog();
    
    const data = {
      sleep_hours: todayLog?.sleep_hours ?? null,
      meal_count: todayLog?.meal_count ?? null,
      stress_score: todayLog?.stress_score ?? null,
      free_text: answers.free_text
    };

    await logLifeData(data);
    console.log(chalk.green('\n✅ メモを保存しました\n'));
  }
}

/**
 * メインループ
 */
async function start() {
  let running = true;

  while (running) {
    const action = await showMainMenu();

    switch (action) {
      case 'log':
        await inputLifeLog();
        break;
      case 'daily_summary':
        await showDailySummary();
        break;
      case 'weekly_summary':
        await showWeeklySummary();
        break;
      case 'free_note':
        await inputFreeNote();
        break;
      case 'exit':
        console.log(chalk.cyan('\n👋 またお会いしましょう。あなたの問いはここに残っています。\n'));
        running = false;
        break;
    }
  }
}

module.exports = {
  start
};
