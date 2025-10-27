# Phase 3 Implementation Plan - Social Interface Module

**作成日**: 2025年10月28日  
**ステータス**: ✅ 完了

---

## 目的

**社会的・制度的接続の維持** - ユーザーが行政・大学・支援制度・研究の場とつながり続けることを担保する。

### コア原則
1. **1個ずつ順番に** - 同時に10個の締め切りを見せない
2. **外への接続の最終確認は本人に** - 尊厳を守る
3. **研究メモリから引用** - Phase 2のデータを活用
4. **自己否定を挿入しない** - 「すみません」を自動生成しない

---

## データベーススキーマ

### 1. `deadlines` テーブル
```sql
CREATE TABLE deadlines (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  category TEXT (scholarship/grant/submission/meeting/report/other),
  priority_score REAL DEFAULT 0,
  status TEXT (pending/in_progress/completed/cancelled),
  created_at TEXT,
  completed_at TEXT
);
```

### 2. `documents` テーブル
```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY,
  deadline_id INTEGER,
  title TEXT NOT NULL,
  doc_type TEXT (application/email/report/proposal/other),
  content TEXT NOT NULL,
  status TEXT (draft/review/submitted),
  created_at TEXT,
  submitted_at TEXT,
  FOREIGN KEY (deadline_id) REFERENCES deadlines(id)
);
```

### 3. `contacts` テーブル
```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  organization TEXT,
  notes TEXT,
  last_contact TEXT,
  created_at TEXT
);
```

### 4. `emergency_contacts` テーブル
```sql
CREATE TABLE emergency_contacts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT
);
```

---

## モジュール構成

### 1. Deadline Manager (`deadline-manager.js`)

#### 機能
- **優先度自動計算**: 期日・カテゴリ・ステータスから算出
- **今日の最優先タスク1つだけ取得**: `getTodayFocusTask()`
- **締め切り追加・完了・進行中管理**

#### 優先度計算ロジック
```javascript
スコア = 期日点 + カテゴリ点 + ステータス点

期日点:
  期限切れ: 1000
  3日以内: 500 - 日数*50
  7日以内: 350 - 日数*20
  14日以内: 200 - 日数*5
  それ以上: 100 - 日数

カテゴリ点:
  scholarship: 100
  grant: 90
  submission: 80
  report: 60
  meeting: 50
  other: 40

ステータス点:
  in_progress: +50
  pending: 0
```

### 2. Document Generator (`document-generator.js`)

#### 機能
- **申請書ドラフト自動生成**: 研究メモリの核テーマから引用
- **メール骨子生成**: 「状況」+「お願い」+「次のステップ」
- **フォールバック**: LLM失敗時もテンプレート生成

#### 申請書生成プロンプト
```
【研究者の核テーマ】から
【申請対象】に合わせて

## 研究目的
## 研究の重要性
## 期待される成果

を生成。謙虚だが自信のある語調、自己否定なし。
```

#### メール生成プロンプト
```
【宛先】【目的】【状況】から

件名:
本文: 簡潔（200文字以内）
      尊厳を保つ
      具体的なお願い1つ
      次のステップ明示
```

### 3. Contact Manager (`contact-manager.js`)

#### 機能
- **連絡先管理**: 教員・支援窓口などの記録
- **緊急連絡先管理**: 信頼できる人の連絡先
- **公的支援窓口情報**: よりそいホットライン、いのちの電話など

---

## CLI統合

### メニュー追加
```
=== 社会接続 ===
🎯 今日やるべきこと       ← 最優先タスク1個だけ
📅 締め切りを追加する
📋 締め切り一覧
✍️ 申請書を作る          ← Phase 2のテーマから生成
✉️ メール骨子を作る
👥 連絡先管理
🆘 緊急連絡先            ← 危機時の導線
```

---

## 要件充足チェック

### ✅ 実装済み機能

#### 優先順位付け
- [x] 「いま現実的にやらないと詰むのはこれ一個だけ」を提示
- [x] 他は一時的に黙らせる（圧を減らす）
- [x] 期日・カテゴリ・ステータスで自動計算

#### 書類ドラフトの自動生成
- [x] 研究メモリ（Phase 2）からパーツを引用
- [x] "申請で通る文体"に整形
- [x] LLM失敗時のフォールバック

#### メール骨子の生成
- [x] 「状況」「お願い」「次のステップ」の構造
- [x] 短い事務文
- [x] コピペして調整できる形式

#### 提出済み/未提出のトラッキング
- [x] `status` フィールドで管理
- [x] 極限シンプルな状態表示

#### 非機能要件
- [x] 外部への送信そのものは自動化しない（最終確認は本人）
- [x] 同時に10個の締め切りを見せない（1個ずつ）
- [x] 自己否定的な表現を自動挿入しない
- [x] 緊急連絡先・公的支援窓口への導線

---

## 今後の拡張可能性

### 高優先度
1. **カレンダー連携** - Google Calendar APIで締め切り自動取得
2. **メール監視** - 重要メール検知→返信ドラフト生成
3. **PDF生成** - 申請書をPDFでエクスポート

### 中優先度
4. **制度情報検索** - 奨学金・助成金情報の自動収集
5. **提出リマインド** - 締め切り3日前に通知
6. **外部連携API** - 大学ポータル・奨学金サイトとの統合

---

## Phase 3 完了判定

### ✅ チェックリスト

**機能実装**:
- [x] 4テーブル作成（deadlines, documents, contacts, emergency_contacts）
- [x] データアクセス層（social-models.js）
- [x] 3モジュール実装（deadline-manager, document-generator, contact-manager）
- [x] CLI統合（7個の新メニュー項目）

**要件充足**:
- [x] 優先順位自動計算
- [x] 今日の最優先タスク1個のみ表示
- [x] 申請書ドラフト生成（Phase 2連携）
- [x] メール骨子生成
- [x] 提出トラッキング
- [x] 緊急連絡先機能
- [x] 尊厳を守る設計（自動送信なし、自己否定なし）

**定性評価**:
- [x] 本来なら詰んでたはずの提出・申請が実行できる仕組み
- [x] "完全孤立"を防ぐ導線
- [x] 圧を上げずに外部接続を維持

---

## まとめ

Phase 3（Social Interface）は **要件定義書の通り完全実装完了** しました。

これで ARC の3つのコアモジュールすべてが動作可能な状態になりました:

1. ✅ **Phase 1: Life Support** - 生存維持
2. ✅ **Phase 2: Research Memory** - 問いを守る
3. ✅ **Phase 3: Social Interface** - 社会接続

ARCは「脆い状況にいる個人が、明日も生きて、問いを失わず、社会との接点を維持する」というミッションを技術的に実現できる状態です。
