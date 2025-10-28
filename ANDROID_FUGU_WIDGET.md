# Android版 ふぐウィジェット - ホーム画面を歩き回る実装

## 🐡 実装方法

Androidでホーム画面を歩き回るキャラクターを実装するには、**ライブウィジェット**または**オーバーレイサービス**を使用します。

---

## 方法1: オーバーレイサービス（推奨）

### 特徴
- ✅ ホーム画面の上にキャラクターを表示
- ✅ 自由に移動・アニメーション可能
- ✅ タップで会話ウィンドウ表示
- ⚠️ 権限が必要（SYSTEM_ALERT_WINDOW）

### 実装手順

#### 1. AndroidManifest.xml に権限追加

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
  
  <application>
    <!-- サービス登録 -->
    <service
      android:name=".FuguOverlayService"
      android:enabled="true"
      android:exported="false" />
  </application>
</manifest>
```

#### 2. FuguOverlayService.java 作成

```java
package com.arcmobile;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Handler;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import java.util.Random;

public class FuguOverlayService extends Service {
    private WindowManager windowManager;
    private View fuguView;
    private ImageView fuguImage;
    private WindowManager.LayoutParams params;
    private Handler handler = new Handler();
    private Random random = new Random();
    
    // 画面サイズ
    private int screenWidth;
    private int screenHeight;
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        
        // 画面サイズ取得
        screenWidth = getResources().getDisplayMetrics().widthPixels;
        screenHeight = getResources().getDisplayMetrics().heightPixels;
        
        // レイアウト読み込み
        fuguView = LayoutInflater.from(this).inflate(R.layout.fugu_overlay, null);
        fuguImage = fuguView.findViewById(R.id.fugu_image);
        
        // ウィンドウパラメータ設定
        params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );
        
        params.gravity = Gravity.TOP | Gravity.LEFT;
        params.x = screenWidth / 2;
        params.y = screenHeight / 2;
        
        // ビューを追加
        windowManager.addView(fuguView, params);
        
        // タップイベント
        fuguView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                if (event.getAction() == MotionEvent.ACTION_DOWN) {
                    onFuguClicked();
                    return true;
                }
                return false;
            }
        });
        
        // 自動移動開始
        startWalking();
    }
    
    // ふぐを歩かせる
    private void startWalking() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                moveToRandomPosition();
                
                // 3-8秒後に次の移動
                int delay = 3000 + random.nextInt(5000);
                handler.postDelayed(this, delay);
            }
        }, 2000);
    }
    
    // ランダム位置に移動
    private void moveToRandomPosition() {
        int targetX = random.nextInt(screenWidth - 200);
        int targetY = random.nextInt(screenHeight - 300);
        
        // アニメーション
        fuguView.animate()
            .x(targetX)
            .y(targetY)
            .setDuration(2000)
            .start();
        
        // 向きを変える
        if (targetX < params.x) {
            fuguImage.setScaleX(-1); // 左向き
        } else {
            fuguImage.setScaleX(1); // 右向き
        }
        
        params.x = targetX;
        params.y = targetY;
    }
    
    // タップ時の処理
    private void onFuguClicked() {
        // ARCアプリを開く
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
        
        // 膨らむアニメーション
        fuguImage.animate()
            .scaleX(1.3f)
            .scaleY(1.3f)
            .setDuration(150)
            .withEndAction(() -> {
                fuguImage.animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .setDuration(150)
                    .start();
            })
            .start();
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (fuguView != null) {
            windowManager.removeView(fuguView);
        }
        handler.removeCallbacksAndMessages(null);
    }
}
```

#### 3. res/layout/fugu_overlay.xml 作成

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="100dp"
    android:layout_height="100dp">
    
    <ImageView
        android:id="@+id/fugu_image"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:src="@drawable/fugu_character"
        android:scaleType="fitCenter" />
</FrameLayout>
```

#### 4. MainActivity.java でサービス開始

```java
public class MainActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // オーバーレイ権限確認
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                // 権限リクエスト
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName())
                );
                startActivityForResult(intent, 1234);
            } else {
                startFuguService();
            }
        } else {
            startFuguService();
        }
    }
    
    private void startFuguService() {
        Intent serviceIntent = new Intent(this, FuguOverlayService.class);
        startService(serviceIntent);
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 1234) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (Settings.canDrawOverlays(this)) {
                    startFuguService();
                }
            }
        }
    }
}
```

#### 5. ふぐ画像を準備

`res/drawable/fugu_character.xml`（ベクター画像）:

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="100dp"
    android:height="100dp"
    android:viewportWidth="100"
    android:viewportHeight="100">
    
    <!-- 体 -->
    <path
        android:pathData="M50,30 Q70,30 75,50 Q70,70 50,70 Q30,70 25,50 Q30,30 50,30 Z"
        android:fillColor="#FFA07A"/>
    
    <!-- 斑点 -->
    <circle android:cx="40" android:cy="45" android:r="4" android:fillColor="#FFFFFF" android:fillAlpha="0.3"/>
    <circle android:cx="55" android:cy="50" android:r="3" android:fillColor="#FFFFFF" android:fillAlpha="0.3"/>
    <circle android:cx="48" android:cy="55" android:r="3.5" android:fillColor="#FFFFFF" android:fillAlpha="0.3"/>
    
    <!-- 左目 -->
    <circle android:cx="42" android:cy="45" android:r="5" android:fillColor="#FFFFFF"/>
    <circle android:cx="42" android:cy="45" android:r="3" android:fillColor="#333333"/>
    
    <!-- 右目 -->
    <circle android:cx="58" android:cy="45" android:r="5" android:fillColor="#FFFFFF"/>
    <circle android:cx="58" android:cy="45" android:r="3" android:fillColor="#333333"/>
    
    <!-- 口 -->
    <circle android:cx="50" android:cy="55" android:r="4" android:fillColor="#FFFFFF" android:fillAlpha="0.5" 
        android:strokeColor="#333333" android:strokeWidth="1"/>
    
    <!-- ヒレ（左） -->
    <path
        android:pathData="M25,50 Q20,45 22,52 Q20,55 25,50 Z"
        android:fillColor="#FF8C69" android:fillAlpha="0.7"/>
    
    <!-- ヒレ（右） -->
    <path
        android:pathData="M75,50 Q80,45 78,52 Q80,55 75,50 Z"
        android:fillColor="#FF8C69" android:fillAlpha="0.7"/>
    
    <!-- 尾びれ -->
    <path
        android:pathData="M50,72 L45,85 L55,85 Z"
        android:fillColor="#FF8C69"/>
</vector>
```

---

## 方法2: React Native実装（クロスプラットフォーム）

### React Native用コンポーネント

```typescript
// src/components/FuguWalker.tsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Image, 
  Animated, 
  Dimensions, 
  TouchableOpacity,
  StyleSheet 
} from 'react-native';

const FuguWalker = ({ onPress }) => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  const position = useRef(new Animated.ValueXY({ 
    x: screenWidth / 2, 
    y: screenHeight / 2 
  })).current;
  
  const [facingRight, setFacingRight] = useState(true);
  
  useEffect(() => {
    startWalking();
  }, []);
  
  const startWalking = () => {
    const walk = () => {
      const targetX = Math.random() * (screenWidth - 100);
      const targetY = Math.random() * (screenHeight - 200);
      
      // 向き判定
      setFacingRight(targetX > position.x._value);
      
      // アニメーション移動
      Animated.timing(position, {
        toValue: { x: targetX, y: targetY },
        duration: 2000,
        useNativeDriver: true,
      }).start();
      
      // 次の移動（3-8秒後）
      const delay = 3000 + Math.random() * 5000;
      setTimeout(walk, delay);
    };
    
    setTimeout(walk, 2000);
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { scaleX: facingRight ? 1 : -1 }
          ]
        }
      ]}
    >
      <TouchableOpacity onPress={onPress}>
        <Image 
          source={require('../assets/fugu.png')} 
          style={styles.fugu}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  fugu: {
    width: 100,
    height: 100,
  }
});

export default FuguWalker;
```

---

## 🎯 完成後の動作

### Windows
- ふぐが透明な全画面ウィンドウ内を自由に泳ぎ回る
- 3-8秒ごとにランダムな位置へ移動
- 移動方向に応じて向きが変わる
- クリックで会話ウィンドウ表示
- ふぐ以外の部分は透明でクリックが下に貫通

### Android
- ホーム画面の上にふぐがオーバーレイ表示
- 他のアプリを使用中も表示され続ける
- タップでARCアプリが起動
- バックグラウンドで常に動作

---

## 🚀 起動方法

### Windows
```powershell
npm start
```
- システムトレイ → 「キャラクター表示」ON

### Android
```bash
npx react-native run-android
```
- 初回起動時にオーバーレイ権限を許可

---

**ふぐがホーム画面を自由に泳ぎ回ります！** 🐡
