# ARC Phase 2: リサーチメモリモジュール実装計画

**目標**: ユーザーの「核心の問い」を守り、研究マインドを維持する

---

## 🎯 Phase 2 の成果物

1. 断片的思考の入力・保存システム
2. コンセプト抽出エンジン（繰り返し出るテーマの特定）
3. 核テーマの自動識別
4. 定期的な問いの再提示
5. スナップショット生成（論文・申請用ドラフト）

---

## 📋 実装タスク

### 1. データベース拡張
- [x] Phase 1テーブル完成
- [ ] `research_fragments` テーブル
- [ ] `core_themes` テーブル
- [ ] `theme_snapshots` テーブル
- [ ] `fragment_tags` テーブル（感情・コンテキスト）

### 2. 断片入力機能
- [ ] テキスト入力UI
- [ ] 感情タグ付け（怒り/違和感/驚き/喜び）
- [ ] コンテキスト記録（誰に/どこで/いつ）
- [ ] 保存処理

### 3. コンセプト抽出エンジン
- [ ] テキストから重要概念の抽出（LLM使用）
- [ ] 繰り返し出現する単語/フレーズの検出
- [ ] 類似度計算（ベクトル検索）
- [ ] テーマクラスタリング

### 4. 核テーマ識別
- [ ] 断片の関連性分析
- [ ] 頻度・重要度スコアリング
- [ ] 「あなたの核」の特定ロジック
- [ ] テーマの進化追跡

### 5. 問いの再提示
- [ ] 毎朝の問い選択アルゴリズム
- [ ] 「まだ大事？」確認機能
- [ ] 再提示履歴の記録
- [ ] ユーザーフィードバック反映

### 6. スナップショット生成
- [ ] 断片→構造化文章への変換
- [ ] 論文形式（背景/目的/意義）
- [ ] 申請書形式（研究計画）
- [ ] エクスポート機能（Markdown/PDF）

---

## 🗄️ データベーススキーマ（Phase 2）

### `research_fragments` テーブル
```sql
CREATE TABLE research_fragments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    content TEXT NOT NULL,
    emotion_tag TEXT, -- 'anger', 'discomfort', 'surprise', 'joy', 'neutral'
    context TEXT, -- 状況・場所・相手など
    source_type TEXT, -- 'manual', 'voice', 'import'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_shown TIMESTAMP,
    importance_score REAL DEFAULT 0.5
);
```

### `core_themes` テーブル
```sql
CREATE TABLE core_themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    theme_name TEXT NOT NULL,
    theme_description TEXT,
    fragment_ids TEXT, -- JSON array of fragment IDs
    frequency INTEGER DEFAULT 1,
    importance_score REAL DEFAULT 0.5,
    first_appeared TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_shown TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);
```

### `theme_snapshots` テーブル
```sql
CREATE TABLE theme_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    theme_id INTEGER,
    snapshot_type TEXT, -- 'summary', 'paper_draft', 'grant_proposal'
    generated_text TEXT NOT NULL,
    fragment_refs TEXT, -- JSON array of fragment IDs used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES core_themes(id)
);
```

### `fragment_tags` テーブル
```sql
CREATE TABLE fragment_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fragment_id INTEGER,
    tag_name TEXT NOT NULL,
    tag_value TEXT,
    FOREIGN KEY (fragment_id) REFERENCES research_fragments(id)
);
```

---

## 🧩 コンポーネント構成

```
/src/modules/research-memory/
├── fragment-collector.js     # 断片入力・保存
├── concept-extractor.js      # 概念抽出（LLM使用）
├── theme-identifier.js       # 核テーマ特定
├── re-presentation.js        # 問いの再提示
└── snapshot-generator.js     # スナップショット生成

/src/llm/
└── llm-client.js             # (既存) 新しいプロンプト追加
```

---

## 🤖 LLMプロンプト設計

### 1. 概念抽出プロンプト
```
あなたは研究者の思考を分析するAIです。

以下のテキストから、重要な概念・キーワード・問いを抽出してください。
特に注目すべき点:
- 繰り返し出る単語・フレーズ
- 疑問形の文章（問いの種）
- 感情が強く表れている部分
- 否定や違和感を示す表現

出力形式（JSON）:
{
  "concepts": ["概念1", "概念2", ...],
  "questions": ["問い1", "問い2", ...],
  "emotions": ["怒り", "違和感", ...],
  "key_phrases": ["重要フレーズ1", ...]
}
```

### 2. 核テーマ識別プロンプト
```
以下は研究者が過去に記録した断片的なメモです。
これらから「この人の核心的な問い」を1つ特定してください。

断片:
1. {fragment1}
2. {fragment2}
...

出力:
- テーマ名: (20文字以内)
- 説明: (100文字以内)
- なぜこれが核心か: (理由)
```

### 3. スナップショット生成プロンプト
```
以下の断片的なメモから、論文の「背景と目的」セクションを生成してください。

メモ:
{fragments}

要件:
- 学術的な文体
- 400字程度
- 社会的意義を含める
```

---

## 🔄 定期実行タスク（追加）

| タスク | 頻度 | 目的 |
|--------|------|------|
| 朝の問い提示 | 毎朝9:00 | 研究マインド再起動 |
| テーマ更新 | 毎晩23:00 | 新しい断片を分析してテーマ更新 |
| 週次レビュー | 毎週日曜 | 「この週の核」を提示 |

---

## ✅ Phase 2 完成基準

- [ ] ユーザーが思考の断片を簡単に記録できる
- [ ] 「あなたの核」が自動的に特定される
- [ ] 毎朝、問いが1つ返ってくる
- [ ] 「これ、まだ大事？」と確認できる
- [ ] 論文・申請用の文章ドラフトが生成できる
- [ ] ユーザーが「問いが消えなかった」と感じる

---

## 🚀 実装順序

1. **データベース拡張** (30分)
2. **断片入力UI** (1時間)
3. **コンセプト抽出** (2時間)
4. **核テーマ識別** (2時間)
5. **問いの再提示** (1時間)
6. **スナップショット生成** (2時間)
7. **統合テスト** (1時間)

**合計見積もり**: 約10時間（2-3日）

---

**次: データベーススキーマの実装から開始します！**
