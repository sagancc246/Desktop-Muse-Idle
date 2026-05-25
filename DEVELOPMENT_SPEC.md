# Desktop Muse Idle 開発仕様書

## 1. プロジェクト概要

### タイトル

Desktop Muse Idle

### ジャンル

美少女デスクトップIdle / Incremental

### コンセプト

画面内を跳ねる美少女アイコンを育て、壁ヒット・角ヒットでMemoryを稼ぎ、キャラ・背景・会話・Rebootを解放していく小型Idleゲーム。

### 販売方針

- Steam定価: 580円
- ローンチ割引: 10〜15%
- 初動実売: 493〜522円
- 目標販売本数: 300〜400本
- 目標リクープ: 現金支出5万〜10万円
- 初回リリース: 売り切りのみ
- 広告: なし
- ゲーム内課金: なし
- DLC: 売れた後にSupporter Packを検討

## 2. ターゲット

### メインターゲット

- Idle / Incrementalゲームが好きなユーザー
- 美少女キャラ・かわいいUIが好きなユーザー
- 作業中に横で眺められるゲームが好きなユーザー
- 低価格のSteam小型ゲームを買うユーザー

### サブターゲット

- BOOTH / DLsiteで同人ゲームを買う国内ユーザー
- デスクトップマスコット系が好きなユーザー
- 実績解除・数字が増えるゲームが好きなユーザー

## 3. プラットフォーム

### 初回

- Windows
- Steam
- BOOTHのDRMフリー版は後日検討
- DLsite版は後日検討

### 後回し

- Mac
- Linux
- iOS
- Android
- Web公開版

## 4. 技術仕様

### 採用技術

- React
- TypeScript
- Vite
- PixiJS
- Zustand
- Electron
- LocalStorage

### 技術ごとの役割

| 技術 | 役割 |
|---|---|
| React | UI全体 |
| TypeScript | 型安全性、バグ抑制 |
| Vite | 開発サーバー、本番ビルド |
| PixiJS | 中央のバウンド演出、パーティクル、ポップアップ |
| Zustand | Memory、アップグレード、キャラ状態、進行状態の管理 |
| Electron | Windowsアプリ化、Steam配布 |
| LocalStorage | セーブデータ保存 |

## 5. ゲーム画面構成

### 1920x1080基準

```text
┌───────────────────────────────────────────────┐
│ ResourceBar                                   │
├──────────────┬───────────────────┬────────────┤
│ UpgradePanel │ GameCanvas         │ MusePanel  │
│              │                   │            │
├──────────────┴───────────────────┴────────────┤
│ DialoguePanel / Reboot / Notifications         │
└───────────────────────────────────────────────┘
```

### UI要素

| 位置 | 内容 |
|---|---|
| 上部 | Memory、Memory/sec、Corner Gem、Corner Hit回数 |
| 左 | アップグレード一覧 |
| 中央 | PixiJSゲームエリア、美少女アイコンが跳ねる |
| 右 | キャラ一覧、好感度、解放状況 |
| 下 | 会話、通知、Rebootボタン |

## 6. コアゲーム仕様

### 6.1 バウンド移動

キャラアイコンはゲームエリア内を自動で斜め移動する。

#### パラメータ

| 名前 | 内容 |
|---|---|
| x | 現在X座標 |
| y | 現在Y座標 |
| vx | X方向速度 |
| vy | Y方向速度 |
| width | アイコン幅 |
| height | アイコン高さ |
| speedMultiplier | 速度倍率 |

#### 処理

- 毎フレーム `x += vx * delta`
- 毎フレーム `y += vy * delta`
- 左右端に接触したら `vx *= -1`
- 上下端に接触したら `vy *= -1`
- 反射時に `onBounce` を発火
- 四隅付近で反射した場合は `onCornerHit` を発火

### 6.2 壁ヒット

壁に当たるたびにMemoryを獲得する。

初期値:

```ts
baseMemoryPerBounce = 1
```

計算例:

```ts
memoryGain = baseMemoryPerBounce
  * bounceBoostMultiplier
  * rebootMultiplier
  * characterBonus
```

### 6.3 Corner Hit

四隅から一定距離以内で反射した場合、Corner Hitとする。

初期値:

```ts
cornerThreshold = 32
baseCornerReward = 100
```

判定例:

```ts
isNearCorner =
  (x <= threshold && y <= threshold) ||
  (x >= areaWidth - iconWidth - threshold && y <= threshold) ||
  (x <= threshold && y >= areaHeight - iconHeight - threshold) ||
  (x >= areaWidth - iconWidth - threshold && y >= areaHeight - iconHeight - threshold)
```

Corner Hit時:

- Memory大幅加算
- Corner Hit回数加算
- Corner Gem獲得はv0.2以降
- パーティクル表示
- 数字ポップアップ表示
- SE再生
- 画面の軽いフラッシュ

### 6.4 クリック介入

MVPでは後回し可。

導入する場合:

- アイコンをクリックすると5秒間速度アップ
- クリック報酬は小さめ
- 放置ゲーム性を壊さないようにする

## 7. リソース仕様

### MVP

| リソース | 用途 |
|---|---|
| Memory | 基本通貨 |

### Steam最低ライン

| リソース | 用途 |
|---|---|
| Memory | 基本通貨、通常アップグレード購入 |
| Corner Gem | 角ヒット報酬、高級強化 |
| Affection | キャラ好感度、会話解放 |
| Fragment | Reboot後の恒久強化 |

## 8. アップグレード仕様

### MVPアップグレード

| ID | 名前 | 効果 |
|---|---|---|
| bounce_boost | Bounce Boost | 壁ヒット報酬アップ |
| speed_tune | Speed Tune | アイコン速度アップ |
| corner_sensor | Corner Sensor | Corner Hit報酬アップ |

### データ構造例

```ts
export type Upgrade = {
  id: string
  name: string
  description: string
  level: number
  baseCost: number
  costRate: number
  maxLevel?: number
  effectType: 'bounce_reward' | 'speed' | 'corner_reward'
  effectValue: number
}
```

### コスト計算

```ts
cost = Math.floor(baseCost * Math.pow(costRate, level))
```

### 効果計算

```ts
effectMultiplier = Math.pow(effectValue, level)
```

## 9. キャラ仕様

### MVP

キャラ1人。

仮名:

- Lumi

### Steam最低ライン

キャラ3人。

| キャラ | 役割 |
|---|---|
| Lumi | 初期キャラ。速度型 |
| Astra | 角ヒット倍率型 |
| Noir | レア報酬型 |

### キャラデータ例

```ts
export type Muse = {
  id: string
  name: string
  role: string
  unlocked: boolean
  affection: number
  affectionLevel: number
  iconAsset: string
  portraitAsset: string
  bonusType: 'speed' | 'corner_reward' | 'offline_reward' | 'rare_reward'
  bonusValue: number
}
```

## 10. 会話仕様

### 方針

- 長文シナリオは入れない
- 1会話2〜4行
- 好感度、Corner Hit、Reboot、キャラ解放で会話が出る
- Steam最低ラインでは30本程度

### 会話データ例

```ts
export type Dialogue = {
  id: string
  speakerId: string
  textJa: string
  textEn: string
  condition: {
    type: 'affection' | 'corner_hit' | 'reboot' | 'character_unlock'
    value: number
  }
  unlocked: boolean
}
```

## 11. 背景仕様

### MVP

- 背景1枚
- 仮画像でも可

### Steam最低ライン

背景3枚。

| 背景 | 解放条件 |
|---|---|
| Default Desktop | 初期 |
| Cozy Room | Memory一定到達 |
| Neon Muse Room | Reboot 1回 |

## 12. オフライン報酬

### 導入タイミング

v0.3以降。

### 仕様

- 最終保存時刻を保存
- 起動時に現在時刻との差分を計算
- 最大報酬時間を設ける
- 初期上限は8時間
- Memory/secをもとに報酬計算
- 復帰時にポップアップ表示

### 計算例

```ts
elapsedSeconds = Math.min(now - lastSavedAt, offlineCapSeconds)
offlineReward = memoryPerSecond * elapsedSeconds * offlineRewardRate
```

## 13. Reboot仕様

### 導入タイミング

v0.4以降。

### 概要

一定以上のMemoryに到達したらReboot可能。  
Memoryと通常アップグレードをリセットし、Fragmentを獲得する。

### リセット対象

- Memory
- 通常アップグレードLv
- 一部進行状態

### 継続対象

- キャラ解放
- 背景解放
- 会話解放
- Fragment
- Reboot回数
- 実績

## 14. セーブ仕様

### 保存先

- MVP: LocalStorage
- 後半: 必要に応じてIndexedDB検討
- Steam版: LocalStorage相当をElectron内で使用
- Steamクラウドは初回リリースでは後回し

### 自動セーブ

- 10秒ごと
- 重要操作時にも保存
  - アップグレード購入
  - キャラ解放
  - Reboot
  - 設定変更

### 保存データ例

```ts
export type SaveData = {
  version: number
  memory: number
  cornerGems: number
  fragments: number
  totalBounces: number
  totalCornerHits: number
  upgrades: Record<string, number>
  muses: Record<string, {
    unlocked: boolean
    affection: number
    affectionLevel: number
  }>
  unlockedDialogues: string[]
  unlockedBackgrounds: string[]
  currentBackgroundId: string
  rebootCount: number
  settings: {
    bgmVolume: number
    seVolume: number
    language: 'ja' | 'en'
    effectsQuality: 'low' | 'medium' | 'high'
  }
  lastSavedAt: number
}
```

## 15. 実績仕様

### ゲーム内実績

Steam実績対応前に、ゲーム内実績システムを作る。

### MVP後の実績例

| 実績 | 条件 |
|---|---|
| First Bounce | 初めて壁に当たる |
| First Corner | 初めてCorner Hitする |
| Memory Starter | Memory 1,000到達 |
| Corner Lover | Corner Hit 10回 |
| Reboot.exe | 初めてRebootする |
| Meet Lumi | Lumiを解放 |
| Cozy Desktop | 背景を初めて変更 |

## 16. 設定仕様

Steam最低ラインで必要。

- BGM音量
- SE音量
- 言語切替
- エフェクト品質
- セーブ初期化
- フルスクリーン切替はElectron導入後に検討

## 17. ローカライズ

### 対応言語

- 日本語
- 英語

### 方針

- UI文言はコード直書きしない
- `localization.ts` またはJSONに集約
- 会話文も `dialogues.ts` に日英両方を持つ

## 18. 素材方針

### 生成AIで作るもの

- キャラクターデザイン
- SDアイコン
- 会話用バストアップ
- 背景イラスト
- ストア用イメージラフ

### 販売アセットで買うもの

- UIフレーム
- ボタン素材
- アイコン素材
- BGM
- SE
- パーティクル素材
- フォント

### 注意

- 生成AI素材を使う場合は、各ストアで利用表記を確認
- 既存作品に似すぎたキャラクターは避ける
- 成人向け要素は初回リリースでは入れない

## 19. 品質基準

### MVP品質基準

- 60fps付近で滑らかに動く
- 壁反射が破綻しない
- Corner Hitが正しく判定される
- Memoryが正しく増える
- アップグレード効果が反映される
- セーブ/ロードが動く

### Steam最低ライン品質基準

- UIが大きく崩れない
- 1920x1080でスクショ映えする
- 角ヒット演出が気持ちいい
- BGM/SEが入っている
- セーブデータ破損時に初期化できる
- 日本語/英語で最低限遊べる
- Windowsビルドで起動できる

## 20. 開発マイルストーン

### Phase 0: セットアップ

- Vite + React + TypeScript
- PixiJS導入
- Zustand導入
- 基本レイアウト作成

### Phase 1: MVP

- バウンド移動
- 壁反射
- Memory獲得
- Corner Hit
- アップグレード3種
- セーブ/ロード

### Phase 2: 見た目強化

- 仮美少女アイコン
- Corner Hit演出
- SE/BGM
- UI調整
- 背景1〜3枚

### Phase 3: Idle化

- キャラ3人
- 好感度
- 会話
- オフライン報酬
- Reboot

### Phase 4: Steam最低ライン

- 実績
- 設定
- 日本語/英語
- Electron化
- Windowsビルド
- ストア素材作成

## 21. Codex実装時の注意

- 一度に複数フェーズを実装しない
- 既存の保存データ構造を壊す変更は必ず明記
- 表示文言は将来ローカライズしやすくする
- 数値は `src/data/balance.ts` に集約する
- コンポーネントが肥大化したら分割する
- ゲームロジックはReactコンポーネント内に直接書きすぎない
- PixiJS側とReact側の責務を分ける

## 22. リリース判断

### Steam Coming Soon前に必要

- メインスクショに使える画面
- 角ヒット演出
- キャラ3人の見た目
- ストア説明文
- カプセル画像
- 30〜45秒の短い動画素材

### 発売前に必要

- Windowsビルド
- セーブ/ロード安定
- 価格設定
- 日本語/英語テキスト
- 最低限の実績
- バグ修正
- 起動確認
