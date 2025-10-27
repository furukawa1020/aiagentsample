# ARC - Ollama統合セットアップガイド

## 🎯 完全無料・APIキー不要でAIを動かす

---

## ✨ Ollamaとは？

- **完全無料**のローカルLLM実行環境
- **APIキー不要**（インターネット不要で動作）
- **GPUなし**でも高速動作（CPUのみでOK）
- **プライバシー保護**（データは外部送信されない）

---

## 📦 Ollamaのインストール

### Windows

1. **ダウンロード**:
   https://ollama.com/download/windows

2. **インストール**:
   ダウンロードした `.exe` を実行してインストール

3. **確認**:
   ```powershell
   ollama --version
   ```

---

## 🚀 推奨モデルのダウンロード

### Llama 3.2 3B（推奨）

**特徴**:
- サイズ: 約2GB
- 必要RAM: 4-8GB
- 品質: 非常に高い
- 速度: CPUでも快適

**ダウンロード**:
```powershell
ollama pull llama3.2:3b
```

**初回起動**（動作確認）:
```powershell
ollama run llama3.2:3b
```

プロンプトが表示されたら成功です！
`/bye` で終了できます。

---

## 🔧 他のモデルオプション

### より軽量: Llama 3.2 1B
```powershell
ollama pull llama3.2:1b
```
- サイズ: 約1GB
- 必要RAM: 2-4GB
- より高速だが、品質は3Bより少し落ちる

### より高品質: Llama 3.1 8B
```powershell
ollama pull llama3.1:8b
```
- サイズ: 約4.7GB
- 必要RAM: 8-16GB
- 最高品質だが、CPUでは遅い可能性

### Microsoft Phi-3 Mini
```powershell
ollama pull phi3:mini
```
- サイズ: 約2.3GB
- 必要RAM: 4GB
- Microsoft製の軽量高品質モデル

---

## ⚙️ ARCでの設定

### 1. `.env` ファイルを編集

```
# デフォルト設定（そのままでOK）
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# 他のモデルを使う場合は変更
# OLLAMA_MODEL=llama3.2:1b
# OLLAMA_MODEL=phi3:mini
```

### 2. ARCを起動

```powershell
node src/index.js
```

以下のように表示されれば成功：
```
✅ Ollama (ローカルLLM) が利用可能です
```

---

## 🔄 フォールバック機能

ARCは賢く動作します：

1. **Ollamaが動いている** → Ollama使用（無料・高速）
2. **Ollamaが止まっている** → OpenAI APIにフォールバック（設定されている場合）
3. **どちらもない** → 固定メッセージ（基本機能は動作）

---

## 🛠️ トラブルシューティング

### "Ollama connection failed"

**原因**: Ollamaサービスが起動していない

**解決策**:
```powershell
# Ollamaを起動
ollama serve
```

または、Windowsの場合は自動起動されているはず。タスクマネージャーで確認。

### "model not found"

**原因**: モデルがダウンロードされていない

**解決策**:
```powershell
ollama pull llama3.2:3b
```

### メモリ不足エラー

**原因**: RAMが足りない

**解決策**:
- より軽量なモデルに変更: `llama3.2:1b`
- 他のアプリを閉じる

---

## 📊 パフォーマンス比較

| CPU | RAM | モデル | 応答速度 |
|-----|-----|--------|---------|
| Core i5 (4コア) | 8GB | llama3.2:3b | 5-10秒 |
| Core i7 (8コア) | 16GB | llama3.2:3b | 3-5秒 |
| Core i5 (4コア) | 8GB | llama3.2:1b | 2-5秒 |

※GPUがあればさらに高速（ただし不要）

---

## 💰 コスト比較

| オプション | 初期費用 | 月額費用 | プライバシー |
|-----------|---------|---------|-------------|
| **Ollama** | 無料 | 無料 | ⭐⭐⭐⭐⭐ 完全ローカル |
| OpenAI API | 無料 | $0.002/1K tokens | ⭐⭐⭐ 外部送信あり |

**ARCで1日10回使用した場合**:
- Ollama: **$0**
- OpenAI: 約$0.30/月

→ **Ollamaなら完全無料で使い放題！**

---

## 🎉 まとめ

1. Ollamaをインストール（3分）
2. `ollama pull llama3.2:3b`（5分）
3. ARCを起動（即座）

**これだけで、完全無料・APIキー不要・プライバシー保護されたAIエージェントが完成！**

---

**何か問題があれば気軽に相談してください！**
