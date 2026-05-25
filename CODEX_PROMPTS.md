# Desktop Muse Idle Codex依頼集

このファイルは、Codexへ段階的に依頼するためのプロンプト集です。  
一度に全部投げず、上から順番に1つずつ実行してください。

---

## Prompt 01: プロジェクト初期化

```text
React + TypeScript + Vite のプロジェクトを前提に、Desktop Muse Idle の初期構成を整えてください。

要件:
- src/components, src/game, src/store, src/data, src/systems, src/types, src/assets, src/styles を作成
- App.tsxに基本レイアウトを作成
- ResourceBar, UpgradePanel, GameCanvas, MusePanel, DialoguePanel の仮コンポーネントを作成
- 1920x1080想定の1画面レイアウトにする
- README.mdに起動方法と構成説明を追記

禁止:
- ゲームロジックはまだ実装しない
- 外部APIは使わない

完了条件:
- npm run devで起動できる
- 画面に各パネルが表示される
```

---

## Prompt 02: Zustandでゲーム状態を作成

```text
Zustandを使って、Desktop Muse Idleのゲーム状態管理を作成してください。

対象ファイル:
- src/store/useGameStore.ts
- src/types/game.ts
- src/components/ResourceBar.tsx

要件:
- memory
- memoryPerSecond
- totalBounces
- totalCornerHits
- upgrades
を管理する
- addMemory(amount)
- incrementBounce()
- incrementCornerHit()
- purchaseUpgrade(upgradeId)
のアクションを作る
- ResourceBarにMemory、Memory/sec、Corner Hit回数を表示する

完了条件:
- ResourceBarに状態が表示される
- TypeScriptエラーがない
```

---

## Prompt 03: PixiJSゲームエリア

```text
PixiJSで中央のゲームエリアを実装してください。

対象ファイル:
- src/components/GameCanvas.tsx

要件:
- ReactコンポーネントとしてPixiJS Applicationを初期化
- 中央エリアにCanvasを表示
- 仮の円形アイコンまたは矩形アイコンを1つ表示
- 毎フレーム描画が更新される
- コンポーネントUnmount時にPixiJSを正しく破棄する

禁止:
- まだ壁反射や報酬処理は入れない

完了条件:
- Canvasにアイコンが表示される
- コンソールエラーがない
```

---

## Prompt 04: バウンド物理

```text
PixiJS上のアイコンが斜めに移動し、ゲームエリア端で反射する処理を追加してください。

対象ファイル:
- src/game/bouncePhysics.ts
- src/components/GameCanvas.tsx

要件:
- 位置 x, y と速度 vx, vy を持つ
- delta timeを使って座標更新する
- 左右端でvxを反転
- 上下端でvyを反転
- 端を突き抜けないように補正
- 壁反射時にbounced=trueを返す

完了条件:
- アイコンが斜めに動く
- 壁で自然に反射する
```

---

## Prompt 05: 壁ヒット報酬

```text
壁ヒット時にMemoryが増える処理を追加してください。

対象ファイル:
- src/components/GameCanvas.tsx
- src/store/useGameStore.ts
- src/data/balance.ts

要件:
- baseMemoryPerBounce = 1 を balance.ts に定義
- 壁反射時に addMemory(baseMemoryPerBounce) を呼ぶ
- totalBouncesを加算
- ResourceBarにtotalBouncesも表示

完了条件:
- 壁に当たるたびMemoryが増える
- Bounce回数が増える
```

---

## Prompt 06: Corner Hit判定

```text
四隅付近で反射した場合にCorner Hitとする処理を追加してください。

対象ファイル:
- src/game/cornerHit.ts
- src/data/balance.ts
- src/components/GameCanvas.tsx
- src/store/useGameStore.ts

要件:
- cornerThreshold = 32
- baseCornerReward = 100
- 四隅からthreshold以内で反射した場合Corner Hit
- Corner Hit時にMemoryを大きく加算
- totalCornerHitsを加算
- 画面上に "CORNER HIT!" の簡単な表示を出す

完了条件:
- 四隅でCorner Hitになる
- Corner Hit時だけ大きい報酬が入る
```

---

## Prompt 07: アップグレード3種

```text
MVP用のアップグレード3種を実装してください。

対象ファイル:
- src/data/upgrades.ts
- src/components/UpgradePanel.tsx
- src/store/useGameStore.ts
- src/game/rewardCalculator.ts

要件:
- Bounce Boost: 壁ヒット報酬アップ
- Speed Tune: アイコン速度アップ
- Corner Sensor: Corner Hit報酬アップ
- 各アップグレードにLv、baseCost、costRate、effectValueを持たせる
- Memoryが足りない場合は購入ボタンをdisabledにする
- 購入時にMemoryを消費してLvを上げる
- 効果をゲームに反映する

完了条件:
- 3種類の強化を購入できる
- 購入後に効果が体感できる
```

---

## Prompt 08: セーブ/ロード

```text
LocalStorageを使ってセーブ/ロード機能を実装してください。

対象ファイル:
- src/systems/saveSystem.ts
- src/store/useGameStore.ts
- src/types/game.ts

要件:
- SaveData型を定義
- 10秒ごとに自動保存
- 起動時に保存データを読み込み
- セーブデータがない場合は初期データを使用
- セーブデータ破損時は安全に初期化
- saveVersionを持たせる

完了条件:
- ページを再読み込みしてもMemoryとアップグレードLvが残る
```

---

## Prompt 09: Corner Hit演出強化

```text
Corner Hit時の演出を強化してください。

対象ファイル:
- src/components/GameCanvas.tsx
- src/systems/audioSystem.ts
- src/styles/globals.css

要件:
- Corner Hit時に大きなテキストを表示
- パーティクル風の小さな星やハートを表示
- 数字ポップアップを表示
- 短い画面フラッシュを入れる
- SE再生の下準備をする

完了条件:
- Corner Hitが見た目で気持ちいい
- 演出が重すぎない
```

---

## Prompt 10: Electron化

```text
現在のVite + ReactアプリをElectronでWindowsアプリ化できるようにしてください。

対象ファイル:
- package.json
- electron/
- 必要な設定ファイル

要件:
- npm run electron:dev でElectron上で起動
- npm run electron:build でWindows向けビルド作成
- アプリ名は Desktop Muse Idle
- Web版の挙動を壊さない

禁止:
- Steamworks連携はまだ入れない

完了条件:
- Electronアプリとして起動できる
- Windowsビルドが作成できる
```
