# ARC - セットアップガイド

## 📋 必要な環境

- **Node.js**: 18.0.0 以上
- **npm**: Node.jsに同梱

## 🤖 LLMオプション（どちらか選択）

### Option 1: **Ollama（推奨）** ⭐
- **完全無料**
- **APIキー不要**
- **GPUなし**でも高速動作
- 詳細: [docs/OLLAMA_SETUP.md](docs/OLLAMA_SETUP.md)

### Option 2: **OpenAI API**
- 有料（従量課金）
- クラウドベース
- APIキーが必要

---

## 🚀 セットアップ手順

### 1. 依存関係のインストール

プロジェクトのルートディレクトリで以下を実行:

```powershell
npm install better-sqlite3 openai node-cron inquirer chalk dotenv
```

### 2. LLMのセットアップ

#### Option A: Ollama（推奨・無料）

1. **Ollamaをインストール**:
   https://ollama.com/download からダウンロード

2. **モデルをダウンロード**:
   ```powershell
   ollama pull llama3.2:3b
   ```

3. **環境変数設定**:
   ```powershell
   Copy-Item .env.example .env
   ```
   
   デフォルト設定のままでOK（編集不要）

#### Option B: OpenAI API（有料）

1. **APIキー取得**:
   https://platform.openai.com/ でキーを生成

2. **環境変数設定**:
   ```powershell
   Copy-Item .env.example .env
   ```
   
   `.env` を開いて以下を編集:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 3. 動作確認

```powershell
node src/index.js
```

正常に起動すると、以下のように表示されます:

```
🌟 ARC - Adaptive Research Companion
あなたの明日を守り、問いを守り、つながりを守る

✅ データベース初期化完了
? 何をしますか？
```

---

## 📂 データの保存場所

- データベース: `./data/arc.db`
- すべてのログ、介入記録、設定がここに保存されます
- バックアップ推奨（定期的に `data/` フォルダをコピー）

---

## 🔧 トラブルシューティング

### "OPENAI_API_KEY が設定されていません"

- `.env` ファイルが存在するか確認
- `.env` 内の `OPENAI_API_KEY` が正しく設定されているか確認

### "better-sqlite3 のインストールエラー"

Windowsの場合、ビルドツールが必要:

```powershell
npm install --global windows-build-tools
```

その後、再度インストール:

```powershell
npm install better-sqlite3
```

### データベースエラー

`data/` フォルダを削除して再起動すると、データベースが再作成されます:

```powershell
Remove-Item -Recurse -Force data
node src/index.js
```

---

## 📖 使い方

### 1. 体調を記録する

メニューから「今日の体調を記録する」を選択し、以下を入力:

- 睡眠時間（時間）
- 食事回数（回）
- しんどさスコア（0〜10）
- 自由メモ（オプション）

### 2. 危機検知

しんどさスコアが8以上、食事0回などの場合、自動的に介入メッセージが表示されます。

### 3. 振り返り

- **今日の振り返り**: その日の記録のサマリー
- **週の振り返り**: 過去7日間の統計と傾向

---

## 🔐 セキュリティ

- データは **ローカルのみ** に保存されます
- OpenAI APIへの通信は暗号化（HTTPS）
- APIキーは `.env` ファイルで管理（Gitにコミットしないこと）

---

## 🛠️ 次のステップ（Phase 2以降）

- リサーチメモリモジュールの実装
- GUI版の開発（Electron/React）
- モバイルアプリ対応
- データベース暗号化（SQLCipher）

---

**何か問題があれば、issue を作成するか、直接相談してください。**
