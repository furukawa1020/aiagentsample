/**
 * Electron Main Process
 * システムトレイ常駐・バックグラウンド実行
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const { initDatabase } = require('../src/storage/database');
const { startScheduler } = require('../src/scheduler/jobs');

let tray = null;
let mainWindow = null;
let characterWindow = null;

// シングルインスタンス化
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 2重起動時は既存ウィンドウを表示
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    console.log('🌟 ARC Desktop 起動中...');

    // データベース初期化
    await initDatabase();

    // スケジューラー起動
    startScheduler();

    // システムトレイ作成
    createTray();

    // キャラクターウィンドウ作成（イルカ風）
    createCharacterWindow();

    console.log('✅ ARC Desktop 起動完了');
  });
}

/**
 * システムトレイアイコン作成
 */
function createTray() {
  // トレイアイコン（16x16 or 32x32推奨）
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip('ARC - あなたの隣にいます');

  // 右クリックメニュー
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🤖 ARCと話す',
      click: () => showMainWindow()
    },
    { type: 'separator' },
    {
      label: '📝 今日の体調を記録',
      click: () => showMainWindow('life-log')
    },
    {
      label: '💭 思考の断片を記録',
      click: () => showMainWindow('fragment')
    },
    {
      label: '🎯 今日やるべきこと',
      click: () => showMainWindow('today-task')
    },
    { type: 'separator' },
    {
      label: '🔍 今日の問いを見る',
      click: () => showMainWindow('question')
    },
    {
      label: '🌟 核テーマを確認',
      click: () => showMainWindow('themes')
    },
    { type: 'separator' },
    {
      label: 'キャラクター表示',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => toggleCharacter(menuItem.checked)
    },
    { type: 'separator' },
    {
      label: '⚙️ 設定',
      click: () => showMainWindow('settings')
    },
    {
      label: '👋 終了',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // クリックでメインウィンドウ表示
  tray.on('click', () => {
    showMainWindow();
  });
}

/**
 * キャラクターウィンドウ作成（ふぐ - 画面を歩き回る）
 */
function createCharacterWindow() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  characterWindow = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  characterWindow.loadFile(path.join(__dirname, '../renderer/character.html'));

  // 全画面表示（透明背景でふぐだけ表示）
  characterWindow.setPosition(0, 0);
  
  // 初期状態ではマウスイベントを通過させない（クリック可能）
  characterWindow.setIgnoreMouseEvents(false);

  // 閉じるボタンで非表示
  characterWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      characterWindow.hide();
    }
  });
}

// IPCハンドラー: キャラクタークリック
ipcMain.on('character-clicked', () => {
  console.log('ふぐがクリックされました！');
  showMainWindow();
});

// IPCハンドラー: ふぐとのチャット
ipcMain.handle('chat-with-fugu', async (event, message) => {
  console.log('ユーザー:', message);
  
  // LLMで応答生成
  const { generateMessage } = require('../src/llm/llm-client');
  try {
    const systemPrompt = 'あなたは「ふぐ」という名前の可愛らしいキャラクターです。ユーザーに寄り添い、優しく話を聞いてあげてください。短めに、親しみやすく話してください。';
    const response = await generateMessage(systemPrompt, message);
    console.log('ARC:', response);
    return response;
  } catch (error) {
    console.error('チャット応答生成エラー:', error);
    return 'ごめん、ちょっと調子悪いみたい...';
  }
});

// IPCハンドラー: チャットメッセージ
ipcMain.on('chat-message', async (event, message) => {
  console.log('ユーザー:', message);
  
  // LLMで応答生成
  const { generateChatResponse } = require('../src/llm/llm-client');
  try {
    const response = await generateChatResponse(message);
    console.log('ARC:', response);
    
    // レンダラープロセスに送信
    if (characterWindow) {
      characterWindow.webContents.send('chat-response', response);
    }
  } catch (error) {
    console.error('チャット応答生成エラー:', error);
    characterWindow.webContents.send('chat-response', 'ごめん、ちょっと調子悪いみたい...');
  }
});

// IPCハンドラー: マウスが透明部分にいるかどうか
ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  if (characterWindow) {
    characterWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

/**
 * メインウィンドウ表示
 */
function showMainWindow(view = 'home') {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      icon: path.join(__dirname, '../assets/icon.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    mainWindow.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        mainWindow.hide();
      }
    });
  }

  mainWindow.show();
  mainWindow.focus();

  // ビュー切り替え
  mainWindow.webContents.send('navigate', view);
}

/**
 * 今日の問いを通知で表示
 */
function showTodaysQuestion() {
  const { morningQuestionReminder } = require('../src/modules/research-memory/re-presentation');
  const reminder = morningQuestionReminder();

  if (reminder.hasQuestion) {
    const notification = new Notification({
      title: '🔍 今日の問い',
      body: reminder.theme.theme_name,
      icon: path.join(__dirname, '../assets/icon.png')
    });

    notification.on('click', () => {
      showMainWindow('question');
    });

    notification.show();
  } else {
    const notification = new Notification({
      title: 'ARC',
      body: '今日の問いはまだありません。思考の断片を記録してみませんか？',
      icon: path.join(__dirname, '../assets/icon.png')
    });

    notification.show();
  }
}

/**
 * キャラクター表示切替
 */
function toggleCharacter(show) {
  if (show) {
    if (characterWindow) {
      characterWindow.show();
    } else {
      createCharacterWindow();
    }
  } else {
    if (characterWindow) {
      characterWindow.hide();
    }
  }
}

/**
 * IPC通信ハンドラー
 */
ipcMain.on('show-notification', (event, { title, body }) => {
  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, '../assets/icon.png')
  });
  notification.show();
});

// 体調記録
ipcMain.handle('log-health', async (event, data) => {
  const { logLifeData } = require('../src/modules/life-support/logger');
  try {
    logLifeData(data);
    return { success: true, message: '体調を記録しました！' };
  } catch (error) {
    console.error('体調記録エラー:', error);
    return { success: false, message: 'エラーが発生しました' };
  }
});

// 思考の断片を記録
ipcMain.handle('save-fragment', async (event, data) => {
  const { saveFragment } = require('../src/modules/research-memory/fragment-collector');
  try {
    const result = saveFragment(data.content, data.emotion);
    return { success: true, message: '思考の断片を記録しました！', id: result };
  } catch (error) {
    console.error('断片記録エラー:', error);
    return { success: false, message: 'エラーが発生しました' };
  }
});

// 今日の問いを取得
ipcMain.handle('get-todays-question', async () => {
  const { morningQuestionReminder } = require('../src/modules/research-memory/re-presentation');
  try {
    const result = morningQuestionReminder();
    return { success: true, data: result };
  } catch (error) {
    console.error('今日の問い取得エラー:', error);
    return { success: false, message: 'エラーが発生しました' };
  }
});

// 核テーマを取得
ipcMain.handle('get-core-themes', async () => {
  const { getActiveCoreThemes } = require('../src/storage/research-models');
  try {
    const themes = getActiveCoreThemes();
    return { success: true, data: themes };
  } catch (error) {
    console.error('核テーマ取得エラー:', error);
    return { success: false, message: 'エラーが発生しました' };
  }
});

// アプリケーション終了処理
app.on('window-all-closed', () => {
  // macOS以外ではアプリを終了しない（トレイ常駐）
  if (process.platform !== 'darwin' && !app.isQuiting) {
    // 何もしない（バックグラウンド継続）
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    showMainWindow();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
});
