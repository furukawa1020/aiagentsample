# ARC Mobile - Android版セットアップガイド

## 🚀 React Native プロジェクト作成

### 1. React Native環境構築

```bash
# Node.js 18+ がインストール済みであることを確認
node -v

# React Native CLI インストール
npm install -g react-native-cli

# Androidプロジェクト作成
npx react-native init ARCMobile --template react-native-template-typescript
cd ARCMobile
```

### 2. 必要なパッケージをインストール

```bash
# ナビゲーション
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# データベース（SQLite）
npm install react-native-sqlite-storage
npm install --save-dev @types/react-native-sqlite-storage

# Firebase（同期用）
npm install @react-native-firebase/app @react-native-firebase/database @react-native-firebase/auth

# 通知
npm install @react-native-firebase/messaging
npm install react-native-push-notification

# バックグラウンド実行
npm install react-native-background-task
npm install react-native-background-fetch

# 音声入力
npm install @react-native-voice/voice

# UI
npm install react-native-vector-icons
npm install react-native-paper
```

---

## 📁 プロジェクト構造

```
ARCMobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # ホーム画面
│   │   ├── LifeLogScreen.tsx       # 体調記録
│   │   ├── FragmentScreen.tsx      # 思考断片
│   │   ├── ThemeScreen.tsx         # 核テーマ
│   │   ├── TaskScreen.tsx          # 締め切り管理
│   │   └── SettingsScreen.tsx      # 設定
│   ├── services/
│   │   ├── Database.ts             # SQLiteラッパー
│   │   ├── SyncService.ts          # Firebase同期
│   │   ├── NotificationService.ts  # 通知管理
│   │   └── BackgroundService.ts    # バックグラウンド実行
│   ├── components/
│   │   ├── CharacterWidget.tsx     # キャラクター表示
│   │   ├── QuestionCard.tsx        # 問いカード
│   │   └── TaskCard.tsx            # タスクカード
│   └── navigation/
│       └── AppNavigator.tsx        # ナビゲーション
├── android/                        # Androidネイティブコード
└── ios/                            # iOS用（将来対応）
```

---

## 🔥 Firebase設定

### 1. Firebaseプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」→ 「ARC-Sync」など
3. Androidアプリを追加
   - パッケージ名: `com.arcmobile`
   - `google-services.json` をダウンロード
4. `google-services.json` を `android/app/` に配置

### 2. Realtime Database有効化

1. Firebase Console → Build → Realtime Database
2. 「データベースを作成」
3. ルールを設定:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

---

## 📱 主要画面の実装

### HomeScreen.tsx（ホーム画面）

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getTodayTopPriorityTask } from '../services/Database';

export default function HomeScreen({ navigation }) {
  const [todayTask, setTodayTask] = useState(null);

  useEffect(() => {
    loadTodayTask();
  }, []);

  const loadTodayTask = async () => {
    const task = await getTodayTopPriorityTask();
    setTodayTask(task);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 ARC</Text>
      <Text style={styles.subtitle}>今日も一緒に</Text>

      {todayTask && (
        <View style={styles.taskCard}>
          <Text style={styles.taskTitle}>🎯 今日やること</Text>
          <Text style={styles.taskContent}>{todayTask.title}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('LifeLog')}
      >
        <Text style={styles.buttonText}>📝 体調を記録</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Fragment')}
      >
        <Text style={styles.buttonText}>💭 思考を記録</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  taskCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskContent: {
    fontSize: 18,
    color: '#333',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

---

## 🔔 通知設定

### NotificationService.ts

```typescript
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';

class NotificationService {
  configure() {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // チャンネル作成（Android 8.0+）
    PushNotification.createChannel(
      {
        channelId: 'arc-reminders',
        channelName: 'ARCリマインダー',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }

  // 朝の問いリマインダー
  scheduleMorningQuestion() {
    PushNotification.localNotificationSchedule({
      channelId: 'arc-reminders',
      title: '🔍 今日の問い',
      message: 'タップして確認',
      date: new Date(Date.now() + 60 * 1000), // テスト用: 1分後
      repeatType: 'day',
      repeatTime: 1,
    });
  }

  // 即座に通知
  showNotification(title: string, message: string) {
    PushNotification.localNotification({
      channelId: 'arc-reminders',
      title,
      message,
    });
  }
}

export default new NotificationService();
```

---

## 🔄 データ同期

### SyncService.ts

```typescript
import database from '@react-native-firebase/database';
import { getDatabase } from './Database';

class SyncService {
  userId: string | null = null;

  setUserId(uid: string) {
    this.userId = uid;
  }

  // ローカルDBからFirebaseへPUSH
  async pushToCloud() {
    if (!this.userId) return;

    const db = await getDatabase();
    
    // 体調記録を同期
    const lifeLogs = await db.executeSql('SELECT * FROM life_logs');
    const logsRef = database().ref(`users/${this.userId}/life_logs`);
    await logsRef.set(lifeLogs.rows.raw());

    // 思考断片を同期
    const fragments = await db.executeSql('SELECT * FROM research_fragments');
    const fragmentsRef = database().ref(`users/${this.userId}/fragments`);
    await fragmentsRef.set(fragments.rows.raw());

    console.log('✅ データをクラウドに同期しました');
  }

  // Firebaseからローカルへ PULL
  async pullFromCloud() {
    if (!this.userId) return;

    const db = await getDatabase();

    // 体調記録を取得
    const logsSnapshot = await database()
      .ref(`users/${this.userId}/life_logs`)
      .once('value');
    
    const logs = logsSnapshot.val();
    if (logs) {
      // ローカルDBにマージ（重複排除）
      for (const log of logs) {
        await db.executeSql(
          'INSERT OR IGNORE INTO life_logs VALUES (?, ?, ?, ?, ?)',
          [log.id, log.date, log.energy_level, log.mental_state, log.notes]
        );
      }
    }

    console.log('✅ クラウドからデータを同期しました');
  }

  // リアルタイム監視
  listenToChanges() {
    if (!this.userId) return;

    database()
      .ref(`users/${this.userId}`)
      .on('value', (snapshot) => {
        console.log('🔄 リモートデータが更新されました');
        this.pullFromCloud();
      });
  }
}

export default new SyncService();
```

---

## 🎯 ウィジェット対応（Android）

`android/app/src/main/java/.../ARCWidget.java`:

```java
public class ARCWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // 今日の問いを取得してウィジェットに表示
        // TODO: SQLiteから取得
        String question = "今日の問い: センシング技術は単なる測定か？";

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
            views.setTextViewText(R.id.widget_text, question);
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
```

---

## ✅ 完成後の体験

### Androidホーム画面
```
┌────────────────────┐
│  🤖 ARC           │
│                    │
│ 今日の問い:        │
│ 「センシング技術は │
│  単なる測定か？」  │
│                    │
│ [考える] [後で]    │
└────────────────────┘
```

### 通知
```
🔔 ARC - 朝の問い
「センシング技術は単なる測定か？」
タップして答える
```

---

## 🚀 ビルド＆実行

```bash
# Android実機で実行
npx react-native run-android

# APKビルド
cd android
./gradlew assembleRelease

# APKは android/app/build/outputs/apk/release/ に生成
```

---

**ARCが、PCでもスマホでも、いつもあなたの隣に。** 🌟
