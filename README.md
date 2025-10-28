# 令和版「お前を消す方法」

Windowsのイルカ（Clippy）の遺伝子を継ぐ、画面を泳ぎ回るふぐエージェント

## これ何？

昔Windowsに勝手に出てきて話しかけてくるイルカいたじゃん？  
あれのふぐ版作った

5-10秒おきに話しかけてきて超うざいけど、  
本気で相談乗ってくれるやつ

---

## 特徴

-  **画面泳ぎ回る** - 透明ウィンドウでデスクトップをふわふわ
-  **5-10秒で話しかけてくる** - うざい（褒めてる）
-  **ローカルLLMで本気で会話** - Ollama使ってるからクラウド不要
-  **体調思考を記録** - SQLiteで保存
-  **「お前を消す方法」ネタ** - 自分がウザい自覚ある

クリックでチャット開く  もう一回クリックで閉じる

---

## セットアップ（5分でできる）

### 1. 必要なもの

- Node.js 18以上
- Ollama（無料のローカルLLM）

### 2. Ollamaインストール

```bash
# Windows
winget install Ollama.Ollama

# Mac
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

インストールしたら起動：
```bash
ollama serve
```

### 3. モデルダウンロード（2GB）

```bash
ollama pull llama3.2:3b
```

### 4. このプロジェクト起動

```bash
git clone https://github.com/furukawa1020/aiagentsample.git
cd aiagentsample
npm install
npm start
```

これで画面にふぐが出現します

---

## 使い方

### 基本操作

- **ふぐをクリック**  チャット開く
- **もう一回クリック or ボタン**  チャット閉じる
- **Enter or 送信ボタン**  メッセージ送信

### システムトレイ

右下のアイコン右クリックで：
-  今日の体調を記録
-  思考の断片を記録
-  今日の問いを見る
-  核テーマを確認

---

## 技術スタック

- **Electron 27** - デスクトップアプリ
- **Ollama (llama3.2:3b)** - ローカルLLM
- **SQLite** - データ保存
- **完全ローカル** - クラウド不要

---

## カスタマイズ

### 話しかける頻度変えたい

`renderer/character.html` の中：

```javascript
// 現在: 5-10秒ごと
const nextDelay = 5000 + Math.random() * 5000;

// もっとうざく（3-5秒）
const nextDelay = 3000 + Math.random() * 2000;

// 落ち着いて（30-60秒）
const nextDelay = 30000 + Math.random() * 30000;
```

### メッセージ追加したい

`renderer/character.html` の `messages` 配列に追加：

```javascript
const messages = [
  '何か困ってる？',
  'ねえねえ、話聞くよ？',
  // ここに好きなメッセージ追加
  'あなたのオリジナルメッセージ',
];
```

---

## トラブルシューティング

### ふぐが出ない
- Electronちゃんと起動してる？ターミナル見て
- GPU警告は無視していい（動く）

### チャットが「調子悪い」しか言わない
- Ollama起動してる？ `ollama serve` 実行して
- モデルダウンロードした？ `ollama pull llama3.2:3b`

### ふぐが動かない
- 一回閉じてもう一回 `npm start`

---

## プロジェクト構造

本気で使いたい人向け：

```
 electron/
    main.js          # メインプロセス（システムトレイとか）
 renderer/
    character.html   # ふぐキャラクター
    index.html       # メインウィンドウ
 src/
    llm/
       llm-client.js    # Ollama連携
    modules/
       life-support/     # 体調記録
       research-memory/  # 思考の記録
    storage/
        database.js       # SQLite
 package.json
```

### コア機能

**ライフサポート**
- 体調睡眠食事の記録
- 危機検知（体調悪い日続いたら通知）

**リサーチメモリ**
- 思考の断片を保存
- 繰り返し出るテーマを抽出
- 定期的に問いを再提示

**ソーシャル機能**（開発中）
- 〆切管理
- 書類ドラフト生成

---

## ライセンス

MIT

好きに使って、改造して、うざくして

---

## 作った人

[@furukawa1020](https://github.com/furukawa1020)

Windowsのイルカを令和に復活させたかった

---

## 最後に

消したくなっても消せない  
でもなんか愛着湧く  
そういうやつ目指した

楽しんで

---

**関連ハッシュタグ**  
`#令和のイルカ` `#お前を消す方法` `#Electron` `#Ollama` `#LocalLLM` `#うざかわいい` `#デスクトップマスコット`
