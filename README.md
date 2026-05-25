# Desktop Muse Idle

React + TypeScript + Vite + PixiJS + Zustand で作る、壁を跳ねるミューズを眺めて Memory を集める最小プロトタイプです。

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで Vite が表示するローカル URL を開いてください。リリース向けの確認は次で行えます。

```bash
npm run build
```

## 実装した機能

- PixiJS のゲームエリア内で美少女アイコンが斜めに自動移動し、壁で反射します。
- 通常の壁ヒットで Memory を獲得し、角付近の反射は `Corner Hit` として高報酬と演出を発生させます。
- Zustand ストアで Memory、直近10秒平均の Memory/sec、Corner Hit 回数、アップグレードレベルを管理します。
- `Bounce Boost`、`Speed Tune`、`Corner Sensor` の3種類のアップグレードを購入できます。
- LocalStorage に10秒ごと、および画面終了時に自動保存し、次回起動時に復元します。
- 報酬、速度、価格成長率、角判定範囲などのバランス値を `src/data/balance.ts` に集約しました。

## 確認ポイント

1. アイコンが中央から移動し、ゲームエリアの上下左右で正しく反射することを確認します。
2. 反射時に `Memory` と `Memory/sec` が増えることを確認します。
3. 角の光点付近で反射すると `CORNER HIT!` 演出が表示され、`Corner Hits` が増えることを確認します。
4. 十分な Memory を貯めて各アップグレードを購入し、報酬量または速度が変化することを確認します。
5. 10秒以上遊んでリロードし、Memory、Corner Hit 回数、アップグレードレベルが復元されることを確認します。

## 主なファイル

- `src/data/balance.ts`: 数値バランスと報酬・価格計算
- `src/store/useGameStore.ts`: ゲーム状態、アップグレード購入、自動保存用の読み書き
- `src/components/GameCanvas.tsx`: PixiJS の描画、移動、当たり判定、Corner Hit 演出
- `src/components/UpgradePanel.tsx`: 左側のアップグレード UI
- `src/components/StatusBar.tsx`: 上部のゲーム指標 UI
