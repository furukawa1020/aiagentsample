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

// Research Memory
const { collectFragment, validateFragment, emotionToEnglish } = require('../modules/research-memory/fragment-collector');
const { extractConcepts } = require('../modules/research-memory/concept-extractor');
const { identifyCoreThemes } = require('../modules/research-memory/theme-identifier');
const { morningQuestionReminder, weeklyReview } = require('../modules/research-memory/re-presentation');
const { 
  generatePaperBackground, 
  generateGrantProposal, 
  generateThemeSummary 
} = require('../modules/research-memory/snapshot-generator');
const { getAllFragments, getActiveCoreThemes } = require('../storage/research-models');

// Social Interface
const { getTodayFocusTask, addDeadline, completeDeadline, startDeadline, getDeadlineStats } = require('../modules/social-interface/deadline-manager');
const { generateApplicationDraft, generateEmailDraft } = require('../modules/social-interface/document-generator');
const { addContact, listContacts, addEmergencyContact, showEmergencyContacts, showPublicSupportResources } = require('../modules/social-interface/contact-manager');
const { getPendingDeadlines, getDocumentsByDeadline } = require('../storage/social-models');

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
        new inquirer.Separator('=== 生活 ==='),
        { name: '📝 今日の体調を記録する', value: 'log' },
        { name: '📊 今日の振り返りを見る', value: 'daily_summary' },
        { name: '📈 週の振り返りを見る', value: 'weekly_summary' },
        new inquirer.Separator('=== 研究 ==='),
        { name: '💭 思考の断片を記録する', value: 'add_fragment' },
        { name: '🔍 今日の問いを見る', value: 'show_question' },
        { name: '🌟 核テーマを確認する', value: 'show_themes' },
        { name: '📄 ドラフトを生成する', value: 'generate_draft' },
        { name: '🔄 テーマを更新する', value: 'update_themes' },
        new inquirer.Separator('=== 社会接続 ==='),
        { name: '🎯 今日やるべきこと', value: 'today_task' },
        { name: '📅 締め切りを追加する', value: 'add_deadline' },
        { name: '📋 締め切り一覧', value: 'list_deadlines' },
        { name: '✍️ 申請書を作る', value: 'generate_application' },
        { name: '✉️ メール骨子を作る', value: 'generate_email' },
        { name: '👥 連絡先管理', value: 'manage_contacts' },
        { name: '🆘 緊急連絡先', value: 'emergency' },
        new inquirer.Separator('==='),
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
      case 'add_fragment':
        await addResearchFragment();
        break;
      case 'show_question':
        await showTodaysQuestion();
        break;
      case 'show_themes':
        await showCoreThemes();
        break;
      case 'generate_draft':
        await generateDraftMenu();
        break;
      case 'update_themes':
        await updateThemes();
        break;
      case 'today_task':
        await showTodayTask();
        break;
      case 'add_deadline':
        await addDeadlineUI();
        break;
      case 'list_deadlines':
        await listDeadlinesUI();
        break;
      case 'generate_application':
        await generateApplicationUI();
        break;
      case 'generate_email':
        await generateEmailUI();
        break;
      case 'manage_contacts':
        await manageContactsUI();
        break;
      case 'emergency':
        await showEmergencyUI();
        break;
      case 'exit':
        console.log(chalk.cyan('\n👋 またお会いしましょう。あなたの問いはここに残っています。\n'));
        running = false;
        break;
    }
  }
}

/**
 * 研究断片の追加
 */
async function addResearchFragment() {
  console.log(chalk.cyan('\n💭 思考の断片を記録します\n'));

  const questions = [
    {
      type: 'editor',
      name: 'content',
      message: '思考・アイデア・違和感など、何でも自由に:',
      default: '',
      waitUserInput: false
    },
    {
      type: 'list',
      name: 'emotion',
      message: 'この思考に伴う感情は？',
      choices: [
        { name: '怒り（これはおかしい）', value: 'anger' },
        { name: '違和感（何か引っかかる）', value: 'discomfort' },
        { name: '驚き（予想外だった）', value: 'surprise' },
        { name: '喜び（面白い発見）', value: 'joy' },
        { name: 'なし・中立', value: 'neutral' }
      ]
    },
    {
      type: 'input',
      name: 'context',
      message: 'コンテキスト（誰に/どこで/いつ など、オプション）:',
      default: ''
    }
  ];

  const answers = await inquirer.prompt(questions);

  if (!answers.content || answers.content.trim().length === 0) {
    console.log(chalk.yellow('\n内容が空のため、キャンセルしました。\n'));
    return;
  }

  const data = {
    content: answers.content.trim(),
    emotion_tag: emotionToEnglish(answers.emotion) || answers.emotion,
    context: answers.context || null
  };

  const validation = validateFragment(data);
  if (!validation.isValid) {
    console.log(chalk.red('\n❌ 入力エラー:'));
    validation.errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
    return;
  }

  const fragmentId = await collectFragment(data);
  console.log(chalk.green('\n✅ 思考の断片を記録しました\n'));

  // 概念抽出を試みる
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'この断片から概念を抽出しますか？（LLM使用）',
      default: true
    }
  ]);

  if (confirm) {
    try {
      console.log(chalk.cyan('概念を抽出中...'));
      await extractConcepts({ id: fragmentId, ...data });
      console.log(chalk.green('✅ 概念抽出完了\n'));
    } catch (error) {
      console.log(chalk.yellow('概念抽出中にエラーが発生しましたが、断片は保存されています。\n'));
    }
  }
}

/**
 * 今日の問いを表示
 */
async function showTodaysQuestion() {
  console.log(chalk.cyan('\n🌟 今日の問い\n'));

  const reminder = morningQuestionReminder();

  if (!reminder.hasQuestion) {
    console.log(chalk.yellow(reminder.message));
  } else {
    console.log(chalk.cyan('='.repeat(60)));
    console.log(reminder.message);
    console.log(chalk.cyan('='.repeat(60)));
  }

  console.log('');

  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Enterキーでメニューに戻ります...'
    }
  ]);
}

/**
 * 核テーマ一覧の表示
 */
async function showCoreThemes() {
  console.log(chalk.cyan('\n🌟 あなたの核テーマ\n'));

  const themes = getActiveCoreThemes();

  if (themes.length === 0) {
    console.log(chalk.yellow('まだテーマが特定されていません。'));
    console.log('思考の断片を記録し、「テーマを更新する」を実行してください。\n');
  } else {
    themes.forEach((theme, idx) => {
      console.log(chalk.bold(`${idx + 1}. ${theme.theme_name}`));
      console.log(`   ${theme.theme_description}`);
      console.log(chalk.gray(`   関連断片: ${theme.fragment_ids.length}件 | 重要度: ${(theme.importance_score * 100).toFixed(0)}%`));
      console.log('');
    });
  }

  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Enterキーでメニューに戻ります...'
    }
  ]);
}

/**
 * ドラフト生成メニュー
 */
async function generateDraftMenu() {
  const themes = getActiveCoreThemes();

  if (themes.length === 0) {
    console.log(chalk.yellow('\nまだテーマが特定されていません。\n'));
    return;
  }

  const { draftType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'draftType',
      message: '何を生成しますか？',
      choices: [
        { name: '📄 論文背景（背景と目的）', value: 'paper' },
        { name: '📝 研究計画書（助成金申請用）', value: 'grant' },
        { name: '📋 テーマ要約', value: 'summary' }
      ]
    }
  ]);

  console.log(chalk.cyan('\n生成中...（10〜30秒かかる場合があります）\n'));

  try {
    let result;
    if (draftType === 'paper') {
      result = await generatePaperBackground();
    } else if (draftType === 'grant') {
      result = await generateGrantProposal();
    } else {
      result = await generateThemeSummary();
    }

    console.log(chalk.cyan('='.repeat(60)));
    console.log(chalk.bold(`\n${result.theme_name}\n`));
    console.log(result.text);
    console.log('\n' + chalk.cyan('='.repeat(60)));
    console.log(chalk.gray(`\nスナップショットID: ${result.snapshot_id}`));
    console.log(chalk.gray('このドラフトは保存されました。\n'));
  } catch (error) {
    console.log(chalk.red(`\n❌ 生成エラー: ${error.message}\n`));
  }

  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Enterキーでメニューに戻ります...'
    }
  ]);
}

/**
 * テーマ更新
 */
async function updateThemes() {
  console.log(chalk.cyan('\n🔄 核テーマを更新します\n'));

  const fragments = getAllFragments();

  if (fragments.length < 3) {
    console.log(chalk.yellow('断片が少なすぎます（最低3件必要）。\n'));
    return;
  }

  console.log(chalk.cyan('分析中...（30秒〜1分かかる場合があります）\n'));

  try {
    const newThemes = await identifyCoreThemes();

    if (newThemes.length > 0) {
      console.log(chalk.green(`✅ ${newThemes.length}個の新しいテーマを特定しました:\n`));
      newThemes.forEach(theme => {
        console.log(chalk.bold(`- ${theme.name}`));
        console.log(`  ${theme.description}\n`);
      });
    } else {
      console.log(chalk.green('✅ 既存テーマを更新しました\n'));
    }
  } catch (error) {
    console.log(chalk.red(`\n❌ テーマ識別エラー: ${error.message}\n`));
  }

  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Enterキーでメニューに戻ります...'
    }
  ]);
}

module.exports = {
  start
};
