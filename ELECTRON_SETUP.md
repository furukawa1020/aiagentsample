# ARC Desktop (Electron版) セットアップガイド

## 🚀 クイックスタート

### 1. Electron依存関係をインストール

```powershell
# package-electron.json を package.json にコピー
Copy-Item package-electron.json package.json -Force

# インストール
npm install
```

### 2. 起動

```powershell
npm start
```

これで：
- ✅ システムトレイに常駐
- ✅ 画面右下にキャラクター表示（イルカ風）
- ✅ バックグラウンドでスケジューラー動作
- ✅ デスクトップ通知

---

## 📋 機能

### システムトレイメニュー
- 🤖 ARCと話す
- 📝 今日の体調を記録
- 💭 思考の断片を記録
- 🎯 今日やるべきこと
- 🔍 今日の問いを見る
- 🌟 核テーマを確認
- キャラクター表示（ON/OFF）
- ⚙️ 設定
- 👋 終了

### キャラクター機能
- 画面右下に常駐
- アニメーション（呼吸・まばたき）
- クリックで会話ウィンドウ
- 通知時にキラキラエフェクト

---

## 🎨 カスタマイズ

### キャラクターの見た目を変える

`renderer/character.html` を編集：
- 色: `.body` の `background`
- サイズ: `.arc-character` の `width/height`
- アニメーション: `@keyframes`

### アイコン画像を追加

必要な画像：
- `assets/icon.png` (256x256) - アプリアイコン
- `assets/icon.ico` (複数サイズ) - Windows用
- `assets/tray-icon.png` (16x16 or 32x32) - トレイアイコン

---

## 📦 配布用ビルド

```powershell
npm run build:win
```

`dist/` フォルダに実行ファイルが生成されます。

---

## 🔄 次のステップ: Android対応

Android版の実装計画は `PHASE4_PLAN.md` を参照してください。

---

## 💡 トラブルシューティング

### better-sqlite3のビルドエラー

```powershell
npm install --build-from-source better-sqlite3
```

### Electronが起動しない

```powershell
# node_modules削除して再インストール
Remove-Item -Recurse -Force node_modules
npm install
```

---

**ARCが常にあなたの隣に。** 🌟
