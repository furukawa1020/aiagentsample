# ARC Phase 1: ライフサポートモジュール実装計画

**目標**: ユーザーの生存を守る最小機能の実装

---

## 🎯 Phase 1 の成果物

1. 体調ログ入力システム
2. 危機検知エンジン
3. 介入メッセージ生成
4. 1日サマリー機能

---

## 📋 実装タスク

### 1. プロジェクト基盤構築
- [x] プロジェクト構造の作成
- [ ] 依存関係のインストール
- [ ] 開発環境のセットアップ

### 2. データベース設計・実装
- [ ] SQLiteセットアップ
- [ ] テーブル定義
  - `life_logs` (体調ログ)
  - `user_thresholds` (危機判定閾値)
  - `interventions` (介入履歴)
- [ ] データアクセス層の実装

### 3. 体調ログ機能
- [ ] 入力UI（CLI版 → 後でGUI化）
  - 睡眠時間
  - 食事回数
  - しんどさスコア (0-10)
  - フリーテキスト（オプション）
- [ ] データ保存処理

### 4. 危機検知エンジン
- [ ] 閾値定義
  - デフォルト値の設定
  - ユーザー固有値の学習ロジック
- [ ] 危機判定ロジック
  - しんどさスコア ≥ 8
  - 食事回数 = 0
  - 睡眠時間 < 3時間
  - キーワード検出（「無理」「死にたい」等）
- [ ] 緊急度レベルの算出

### 5. 介入メッセージ生成
- [ ] LLM統合（OpenAI API）
- [ ] プロンプト設計
  - 温かい／責めない文体
  - 最小行動の提示
  - 許可メッセージの生成
- [ ] フォールバック対応（APIエラー時）

### 6. 1日サマリー
- [ ] 日次データの集計
- [ ] サマリー生成
  - 「今日はこれだけやったから生き延びた。合格。」
  - ポジティブな振り返り
- [ ] 表示UI

### 7. 定期実行システム
- [ ] スケジューラーセットアップ (node-cron)
- [ ] 夜の体調確認リマインド (22:00)
- [ ] 朝のサマリー提示 (9:00)

---

## 🗄️ データベーススキーマ（Phase 1）

### `life_logs` テーブル
```sql
CREATE TABLE life_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    log_date DATE NOT NULL,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sleep_hours REAL,
    meal_count INTEGER,
    stress_score INTEGER CHECK(stress_score BETWEEN 0 AND 10),
    free_text TEXT,
    crisis_flag BOOLEAN DEFAULT 0,
    intervention_given BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `user_thresholds` テーブル
```sql
CREATE TABLE user_thresholds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    param_name TEXT NOT NULL, -- 'stress_score', 'meal_count', 'sleep_hours'
    threshold_value REAL NOT NULL,
    is_default BOOLEAN DEFAULT 1,
    learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `interventions` テーブル
```sql
CREATE TABLE interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    log_id INTEGER,
    crisis_level INTEGER, -- 1=low, 2=medium, 3=high
    message TEXT NOT NULL,
    action_taken TEXT, -- 'shown', 'acknowledged', 'dismissed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (log_id) REFERENCES life_logs(id)
);
```

---

## 🧩 コンポーネント構成

```
/src
├── index.js                    # エントリーポイント
├── /modules
│   └── /life-support
│       ├── logger.js           # 体調ログ入力
│       ├── crisis-detector.js  # 危機検知
│       ├── intervention.js     # 介入メッセージ生成
│       └── summary.js          # 1日サマリー
├── /storage
│   ├── database.js             # DB接続・初期化
│   └── models.js               # データモデル
├── /llm
│   └── openai-client.js        # OpenAI API統合
├── /scheduler
│   └── jobs.js                 # 定期実行タスク
└── /ui
    └── cli.js                  # CLI インターフェース（初期版)
```

---

## 🔧 技術選択（Phase 1）

### 言語・ランタイム
- **Node.js 18+** （シンプル・クロスプラットフォーム）

### データベース
- **better-sqlite3** （同期API・高速）
- 将来的にSQLCipher対応検討

### LLM
- **OpenAI API** (GPT-4 or GPT-3.5-turbo)
- 環境変数で APIキー管理

### スケジューリング
- **node-cron** （定期実行）

### CLI（初期UI）
- **inquirer** （インタラクティブプロンプト）
- **chalk** （カラー出力）

---

## 📦 必要な依存関係

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.0",
    "openai": "^4.20.0",
    "node-cron": "^3.0.3",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "dotenv": "^16.3.1"
  }
}
```

---

## 🔐 環境変数（`.env`）

```
OPENAI_API_KEY=your_api_key_here
DATABASE_PATH=./data/arc.db
LOG_LEVEL=info
```

---

## 📝 プロンプト設計（介入メッセージ）

### システムプロンプト
```
あなたはARCというAIエージェントです。
ユーザーが限界に達したとき、温かく・責めず・最小の行動を提示することが役割です。

重要な原則:
- 決してユーザーを叱らない
- 「もう少し頑張れ」は禁止
- 今日はこれで十分だと許可を与える
- 次の一歩は極限まで小さくする（例: 水を一口飲む）
- 尊厳を守る言葉遣い

ユーザーの状態:
- しんどさスコア: {stress_score}/10
- 睡眠時間: {sleep_hours}時間
- 食事回数: {meal_count}回
- メモ: {free_text}

上記を踏まえて、今このユーザーに必要な短いメッセージを生成してください。
```

---

## ✅ Phase 1 完成基準

- [ ] ユーザーが体調を記録できる
- [ ] 危機状態（しんどさ≥8等）で自動的に介入メッセージが表示される
- [ ] メッセージが温かく・責めない内容である
- [ ] 1日の終わりにポジティブなサマリーが見られる
- [ ] 定期リマインドが動作する

---

## 🚀 次のステップ（Phase 2へ）

Phase 1完成後:
- リサーチメモリモジュールの設計開始
- CLI → GUI への移行検討
- データベース暗号化の実装

---

**Phase 1は「明日も生きる」ための最小インフラです。**
