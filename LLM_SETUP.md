# 🤖 ARCのAI設定ガイド

## 現在の状態

❌ **Ollamaが起動していません**  
❌ **OpenAI APIキーが設定されていません**  
→ だから「そうなんだね、もっと聞かせて」という固定応答になっています

---

## 🔧 解決方法（3つの選択肢）

### 選択肢1: Ollama使用（完全無料、推奨）

#### メリット
- ✅ 完全無料
- ✅ プライバシー保護（データが外部に送信されない）
- ✅ オフラインでも動作

#### セットアップ手順

1. **Ollamaをインストール**
   ```powershell
   # Ollamaをダウンロード
   # https://ollama.ai/download
   # Windows版をダウンロードしてインストール
   ```

2. **モデルをダウンロード**
   ```powershell
   ollama pull llama3.2:3b
   ```

3. **Ollamaを起動**（自動起動されるはず）
   ```powershell
   # 確認
   curl http://localhost:11434/api/tags
   ```

4. **ARCを再起動**
   - もうOK！会話できるようになります

---

### 選択肢2: OpenAI API使用（有料、高精度）

#### メリット
- ✅ 非常に高精度
- ✅ インストール不要
- ❌ 有料（従量課金）
- ❌ プライバシー: データがOpenAIに送信される

#### セットアップ手順

1. **OpenAI APIキーを取得**
   - https://platform.openai.com/api-keys
   - アカウント作成してAPIキー発行

2. **.envファイルを作成**
   ```powershell
   # プロジェクトルートで実行
   Copy-Item .env.example .env
   ```

3. **.envファイルを編集**
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxx
   ```

4. **ARCを再起動**

---

### 選択肢3: ハイブリッド（推奨、最強）

Ollamaをメインに使い、Ollamaが使えない時だけOpenAIにフォールバック

1. Ollamaをインストール（選択肢1）
2. OpenAI APIキーも設定（選択肢2）
3. ARCが自動で切り替えます

---

## 🎯 今すぐ試すなら

### 一番簡単: Ollamaをインストール

```powershell
# 1. Ollamaをインストール（1分）
# https://ollama.ai/download からダウンロード

# 2. モデルをダウンロード（3-5分）
ollama pull llama3.2:3b

# 3. 確認
ollama list

# 4. ARCを再起動
npm start
```

これで**完全無料で賢いARCが使えます！** 🐡✨

---

## 🔍 現在の状態確認

```powershell
# Ollamaが起動しているか
curl http://localhost:11434/api/tags

# .envファイルがあるか
Get-Content .env
```

---

## 💡 トラブルシューティング

### Ollamaをインストールしたのに動かない

```powershell
# Ollamaサービスを再起動
ollama serve
```

### OpenAI APIキーを設定したのに動かない

- .envファイルがプロジェクトルートにあるか確認
- ARCを完全に再起動

---

**どちらの方法を試しますか？** 🤔

- Ollama（無料） → 一番おすすめ！
- OpenAI API（有料） → すぐ試したい場合
- 両方（最強） → 完璧を求めるなら
