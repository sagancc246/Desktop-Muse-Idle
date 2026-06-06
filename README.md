# Desktop Muse Idle

## 概要

**Desktop Muse Idle** は、DVD待機画面のように画面内を跳ねるアイコンをモチーフにした、  
**美少女デスクトップIdle / Incrementalゲーム**です。

プレイヤーは画面内を跳ねる美少女アイコンを眺めながら、壁ヒット・角ヒットで `Memory` を獲得し、アップグレード・キャラ解放・背景解放・会話解放・Rebootによる恒久強化を進めます。

## 今作の最重要目的

1. **短期でSteamリリース実績を作る**
2. **現金支出5万〜10万円以内で開発する**
3. **定価580円で300〜400本販売し、開発費リクープを狙う**
4. **非エンジニアがCodexを使って開発を進められる構成にする**

## 技術構成

初期開発はWeb版として進め、完成後にElectronでWindowsアプリ化します。

- React
- TypeScript
- Vite
- PixiJS
- Zustand
- Electron
- LocalStorage

## 開発方針

### 重要ルール

- 最初から完成版を作らない
- まずMVPを完成させる
- 1回のCodex作業では1機能だけ実装する
- UIや数値バランスは後で調整する
- Live2D、フルボイス、オンライン要素、ガチャは初回リリースに入れない
- 追加課金、広告収益、DLCは初回リリースに入れない
- Steam版の前にWeb版として遊べる状態を作る

## ゲームの基本ループ

```text
美少女アイコンが画面内を跳ねる
↓
壁に当たるとMemory獲得
↓
角に当たるとCorner Hitで大ボーナス
↓
Memoryでアップグレード購入
↓
速度・報酬・角ヒット倍率が上がる
↓
キャラ・背景・会話を解放
↓
Rebootで恒久強化
↓
さらに効率よく稼げる
```

## MVPの完成条件

最初のMVPでは以下だけを作ります。

- 画面中央にPixiJSのゲームエリアがある
- 美少女アイコン1体が斜めに移動する
- ゲームエリアの端で反射する
- 壁ヒット時に `Memory` が増える
- 四隅付近で反射すると `Corner Hit` になる
- `Corner Hit` 時は通常より大きな報酬が入る
- `Corner Hit` 時に簡単な演出が出る
- アップグレード3種を購入できる
  - Bounce Boost
  - Speed Tune
  - Corner Sensor
- `Memory`、`Memory/sec`、`Corner Hit回数` が表示される
- LocalStorageで自動セーブされる
- 起動時にセーブデータを読み込む

## Steam最低ライン

MVP後、Steam販売版では以下を目標にします。

- キャラ3人
- 背景3枚
- アップグレード10〜20個
- 好感度
- 短文会話30本程度
- オフライン報酬
- Reboot / プレステージ
- ゲーム内実績
- Steam実績20個前後
- 音量設定
- 日本語 / 英語対応
- Windowsビルド

## 最初に入れないもの

- Live2D
- フルボイス
- 大量キャラ
- 大量衣装
- オンラインランキング
- ガチャ
- デイリーイベント
- Mac/Linux対応
- 複雑なストーリー
- ゲーム内課金
- 広告収益
- 初回DLC

## 推奨フォルダ構成

```text
desktop-muse-idle/
  README.md
  DEVELOPMENT_SPEC.md
  TODO.md
  CODEX_PROMPTS.md
  package.json
  index.html
  src/
    main.tsx
    App.tsx
    components/
      GameCanvas.tsx
      ResourceBar.tsx
      UpgradePanel.tsx
      MusePanel.tsx
      DialoguePanel.tsx
      RebootPanel.tsx
      SettingsModal.tsx
      NotificationToast.tsx
    game/
      gameLoop.ts
      bouncePhysics.ts
      cornerHit.ts
      rewardCalculator.ts
      offlineReward.ts
      rebootCalculator.ts
    store/
      useGameStore.ts
    data/
      balance.ts
      upgrades.ts
      muses.ts
      dialogues.ts
      achievements.ts
      backgrounds.ts
    systems/
      saveSystem.ts
      achievementSystem.ts
      localization.ts
      audioSystem.ts
    types/
      game.ts
    assets/
      characters/
      backgrounds/
      ui/
      audio/
      placeholder/
    styles/
      globals.css
      layout.css
      panels.css
```

## 開発コマンド想定

```bash
npm install
npm run dev
npm run build
npm run preview
npm run electron:dev
npm run electron:build
```

`npm run electron:build` は `release/win-unpacked/` に Windows 向けの展開済みアプリを生成します。

## v1.0マスタデータと報酬追加

- 共通報酬型は `src/data/rewards.ts` の `Reward` に定義します。
- Stage報酬は `src/data/stages.ts` の各Stageにある `rewards` 配列へ追加します。
- 報酬付与は `src/game/rewardApplier.ts` が担当し、StageデータやUIコンポーネントには解放処理を書きません。
- 解放条件は `src/types/game.ts` の `UnlockCondition` を使用します。
- Museは `muses.ts` で `defaultSkinId`、`skillId`、`unlockCondition` を参照し、スキル本体は `skills.ts` に定義します。
- スキンは `skins.ts`、背景は `backgrounds.ts` に定義し、性能値を持たせません。
- Upgradeのコスト・倍率は `balance.ts` に置き、`upgrades.ts` は表示用マスタとして参照します。
- Stage報酬の付与済み状態はReward単位の `claimedRewardIds` へ保存され、同じ報酬は再付与されません。
- Stage報酬には安定した `rewardId` を設定し、claim keyは `${stageId}:${rewardId}` になります。`rewardId`がない場合はStage ID、Reward type、IDまたはamountから生成されます。
- クリア済みStageへ後から報酬を追加した場合、Continue時に未claimの報酬だけが付与されます。
- 旧セーブの `claimedStageRewardIds` は移行時点の既存Reward IDだけへ変換されます。今後Stageへ報酬を追加するとき、`legacyClaimedRewardIdsByStageId` は更新しません。
- `capsule`、`shard`、`conversation` は共通型で予約済みです。未実装アクションの報酬は安全に `unsupported` として処理されます。

Stage報酬追加例:

```ts
rewards: [
  { rewardId: 'cozy_room', type: 'background', id: 'bg_cozy_room' },
  { rewardId: 'lumi_pastel', type: 'skin', id: 'lumi_pastel' },
  { rewardId: 'memory_1000', type: 'memory', amount: 1_000 },
]
```

報酬IDを追加する場合は、対応する `skins.ts`、`backgrounds.ts`、`muses.ts` などのマスタにも同じIDを定義してください。存在しないIDは付与されず、報酬カードでは `Unknown Reward` として表示されます。v1.0ではStage 1〜10、4 Muse、8 Skin、6 Background、4 Skillを定義しています。

## 現在の実装状態

### Prompt 01: プロジェクト初期化

- React + TypeScript + Vite のアプリ基盤
- 1920x1080 を想定した1画面レイアウト
- 上部の `ResourceBar` 仮表示
- 左側の `UpgradePanel` 仮表示
- 中央の `GameCanvas` 仮表示
- 右側の `MusePanel` 仮表示
- 下部の `DialoguePanel` 仮表示
- `src/game`、`src/store`、`src/data`、`src/systems`、`src/types`、`src/assets`、`src/styles` の初期構成

### Prompt 02: Zustandでゲーム状態を作成

- `src/types/game.ts` にゲーム状態とアップグレード進行の型を定義
- `src/store/useGameStore.ts` に Zustand ストアを追加
- `memory`、`memoryPerSecond`、`totalBounces`、`totalCornerHits`、`upgrades` を管理
- `addMemory()`、`incrementBounce()`、`incrementCornerHit()`、`purchaseUpgrade()` の状態更新アクションを追加
- `ResourceBar` に Memory、Memory/sec、Corner Hits のストア値を表示

### Prompt 03: PixiJSゲームエリア

- `GameCanvas` 内で PixiJS Application を初期化
- 中央パネルに Canvas と仮の円形ミューズアイコンを表示
- ticker による控えめな脈動表示でフレーム更新を確認可能
- リサイズ対応とコンポーネント破棄時の PixiJS クリーンアップを実装

### Prompt 04: バウンド物理

- `src/game/bouncePhysics.ts` に位置・速度・delta time に基づく更新処理を追加
- 仮アイコンが中央から斜め方向に自動移動
- Canvas 端で速度方向を反転し、領域外へ突き抜けないよう補正
- 反射時に `bounced: true` を返せる物理処理を用意

### Prompt 05: 壁ヒット報酬

- `src/data/balance.ts` に `baseMemoryPerBounce = 1` を定義
- 壁で反射したときに Zustand の `addMemory()` と `incrementBounce()` を実行
- リソースバーに累計 `Bounces` を追加

### Prompt 06: Corner Hit判定

- `src/game/cornerHit.ts` に移動可能領域の四隅付近を判定する処理を追加
- `src/data/balance.ts` に `cornerThreshold = 32` と `baseCornerReward = 100` を定義
- Corner Hit 時に壁ヒット報酬 `1` に加えて Corner ボーナス `100` を加算
- Corner Hit 回数の加算と Canvas 内の `CORNER HIT!` 表示を追加

### Prompt 07: アップグレード3種

- `src/data/upgrades.ts` に Bounce Boost、Speed Tune、Corner Sensor のコストと効果を定義
- `src/game/rewardCalculator.ts` に壁報酬、Corner 報酬、速度倍率の計算を分離
- 左パネルで各アップグレードのレベル、次の購入コスト、購入ボタンを表示
- Memory が不足している場合は購入不可とし、購入時に Memory を消費してレベルを上げる
- Bounce Boost は壁ヒット報酬、Speed Tune は移動速度、Corner Sensor は Corner ボーナスに反映

### Prompt 08: セーブ/ロード

- `src/systems/saveSystem.ts` に `saveVersion = 1` の LocalStorage 保存形式を追加
- 10秒ごとに Memory、ヒット累計、アップグレード Lv を自動保存
- 起動時に保存データを読み込み、進行状態を復元
- 未保存時または壊れた保存データの場合は安全に初期状態から開始

### Prompt 09: Corner Hit演出強化

- Corner Hit 時のテキストを大きく表示し、星型パーティクルのバーストを追加
- 実際に得た `Memory` 量を示す数字ポップアップを追加
- ゲームエリア内に短いゴールドフラッシュを追加
- `src/systems/audioSystem.ts` にユーザー操作後に再生可能な軽い Corner Hit SE の準備を追加

### Prompt 10: Electron化

- `electron/main.cjs` と `electron/preload.cjs` を追加し、安全な Electron ウィンドウで Web アプリを表示
- 開発時は Vite の URL、本番時はビルド済み `dist/index.html` を読み込む構成を追加
- `npm run electron:dev` と `npm run electron:build` を追加
- アプリ名を `Desktop Muse Idle` として、`release/win-unpacked/` に Windows 向け成果物を生成
- Electron のローカルファイル読込に対応するため、Vite のビルドアセットを相対パス化
- 現段階の Windows ビルドでは署名・実行ファイルのアイコン/リソース書換えを行わず、ローカル起動確認用の展開済みアプリを生成

現在は **Prompt 10** までを実装しています。Web 版のゲーム挙動を維持したまま、Electron ウィンドウでの起動と Windows 向け展開済みアプリの生成に対応しています。Steamworks 連携は実装していません。

### ステージクリア機能

- `src/data/stages.ts` に v1.0向けStage 1からStage 10のCorner Hit目標と報酬を定義
- `currentStageId`、`stageCornerHits`、`clearedStages` を Zustand とセーブデータへ追加
- Corner Hit の累計 `totalCornerHits` は維持しつつ、ステージクリア判定には現在ステージ専用の進捗だけを使用
- 右側の `StagePanel` に現在ステージ名、進捗、必要 Corner Hit 数、クリア済み数を表示
- 目標達成時はクリア記録を追加し、次のステージへ自動的に移行

現在はステージ目標による進行確認に加え、共通 `rewards` に定義した背景の解放、Gallery での閲覧、現在背景の選択にも対応しています。追加のスチルカテゴリや大量の背景コンテンツはまだ実装していません。

### ステージクリア演出

- ステージ目標の Corner Hit 数に到達した瞬間、ゲーム画面中央に `Stage Clear!` オーバーレイを表示します。
- オーバーレイではクリアしたステージ名、解放された背景名、次に解放されたステージ名を確認できます。
- 最終ステージをクリアした場合は、現時点の全ステージクリア案内を表示します。
- 演出状態はセーブデータには保存せず、クリア直後だけの一時表示として扱います。
- 開発ビルドの `Debug Panel` にある `Clear Stage` でも同じ演出を確認できます。

#### ステージクリア演出の確認方法

1. `npm run dev` を実行し、ゲーム画面へ進みます。
2. 開発ビルドでは右側の `Debug Panel` から `Clear Stage` を選択します。
3. `Stage Clear!` オーバーレイが表示され、クリアステージ、解放背景、次ステージが表示されることを確認します。
4. `Continue` を選択するとゲーム画面へ戻り、StagePanel が次ステージ進行に切り替わっていることを確認します。
5. 通常プレイでも Corner Hit 目標到達時に同じ演出が表示されることを確認します。
6. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

### 確認方法

1. `npm install` を実行します。
2. `npm run dev` を実行し、表示されたローカル URL をブラウザで開きます。
3. 上・左・中央・右・下に5つのパネルが表示されることを確認します。
4. 上部の `Memory`、`Memory/sec`、`Bounces`、`Corner Hits` が Zustand の初期値 `0` を表示することを確認します。
5. 中央パネルに PixiJS の Canvas と仮アイコンが表示され、アイコンが斜め方向に移動することを確認します。
6. アイコンがゲームエリアの端で反射し、領域外へ消えないことを確認します。
7. 壁反射のたびに `Memory` と `Bounces` がそれぞれ `1` ずつ増えることを確認します。
8. 四隅付近で反射すると `CORNER HIT!` が表示され、`Memory` に通常報酬 `1` と Corner ボーナス `100` が加算され、`Corner Hits` が増えることを確認します。
9. Corner Hit などで Memory を貯めると、左パネルの購入ボタンが有効になることを確認します。
10. Bounce Boost 購入後は壁ヒット報酬が増え、Speed Tune 購入後は移動が速くなり、Corner Sensor 購入後は Corner ボーナスが増えることを確認します。
11. Memory とアップグレード Lv を変化させて10秒以上待ち、ページを再読み込みしても値が保持されることを確認します。
12. LocalStorage の `desktop-muse-idle-save` に不正な文字列を設定して再読み込みし、クラッシュせず初期状態で開始することを確認します。
13. Corner Hit 時に大きな `CORNER HIT!`、星型バースト、獲得量ポップアップ、短い画面フラッシュが表示されることを確認します。
14. ページ内を一度クリックした後の Corner Hit で短い SE が再生可能になっていることを確認します。
15. `Memory/sec` は `0` のままで、自動収益がまだ動いていないことを確認します。
16. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。
17. `npm run electron:dev` を実行し、`Desktop Muse Idle` の Electron ウィンドウで既存ゲーム画面が表示されることを確認します。
18. `npm run electron:build` を実行し、`release/win-unpacked/Desktop Muse Idle.exe` が生成されることを確認します。
19. 右側の `StagePanel` で `Stage 1` の進捗が Corner Hit ごとに増えることを確認します。
20. Stage 1 の進捗が `100 / 100` に到達するとクリア済み数が増え、現在ステージが `Stage 2` と `0 / 300` に切り替わることを確認します。
21. ページを再読み込みしても現在ステージ、ステージ別進捗、クリア済み数が復元されることを確認します。

### 次の作業

`CODEX_PROMPTS.md` に定義された Prompt 01 から Prompt 10、ステージクリア、背景解放、Gallery での閲覧と選択は完了です。次の新規作業では、追加の報酬やコレクション拡張を行う場合の仕様を検討できます。

## Codexへの作業依頼ルール

```text
目的:
何を作るか

対象ファイル:
主に変更してよいファイル

要件:
- 要件1
- 要件2
- 要件3

禁止:
- 既存機能を壊さない
- 無関係な大規模リファクタをしない

完了条件:
- npm run dev で起動できる
- 画面上で確認できる
- READMEまたはTODOに変更点が追記されている
```

## 最初にCodexへ投げるプロンプト

```text
React + TypeScript + Vite + PixiJS + Zustand を使って、
Desktop Muse Idle の最小プロトタイプを作成してください。

目的:
画面内を跳ねる美少女アイコンを眺めながら、壁ヒットと角ヒットでMemoryを稼ぐIdleゲームのコア体験を作る。

要件:
- Vite + React + TypeScript の構成
- PixiJSで中央のゲームエリアを描画
- Zustandでゲーム状態を管理
- 画面中央に1つのアイコンを表示
- アイコンは斜め方向に自動移動する
- ゲームエリアの端に当たったら反射する
- 壁に当たるたびにMemoryを加算する
- 四隅から一定距離以内で反射した場合はCorner Hitとして扱う
- Corner Hit時は通常より大きなMemoryを加算する
- Corner Hit時に簡単な演出を出す
- 左側にアップグレードパネルを作る
- アップグレードは以下3つ
  1. Bounce Boost: 壁ヒット報酬アップ
  2. Speed Tune: アイコン速度アップ
  3. Corner Sensor: Corner Hit報酬アップ
- 上部にMemory、Memory/sec、Corner Hit回数を表示
- LocalStorageで10秒ごとに自動保存
- 起動時にセーブデータを読み込む

実装ルール:
- 機能ごとにファイルを分ける
- 数値バランスは src/data/balance.ts にまとめる
- ゲーム状態は src/store/useGameStore.ts にまとめる
- PixiJS描画は src/components/GameCanvas.tsx にまとめる
- 変更点と確認方法を README.md に追記する
```

## 参考公式ドキュメント

- Vite: https://vite.dev/guide/
- React: https://react.dev/learn
- PixiJS: https://pixijs.com/
- PixiJS React: https://react.pixijs.io/
- Zustand: https://zustand.docs.pmnd.rs/
- Electron: https://electronjs.org/docs/latest

## 背景解放機能

- `src/data/backgrounds.ts` に Default Room、Cozy Room、Neon Room の背景定義を追加しました。
- ステージクリア報酬として対応する背景を解放し、最初に獲得した背景は自動で現在背景になります。
- `GalleryPanel` では全背景の解放状況を表示し、獲得済み背景だけを選択可能にして `GameCanvas` に反映します。
- 背景解放状態と選択中背景は LocalStorage に保存され、既存のクリア済みステージを含むセーブからも報酬を復元します。
- 背景画像は `public/assets/backgrounds/` に同梱した軽量 SVG で、外部画像生成は利用していません。
- `GalleryPanel` と `BackgroundPreviewModal` を追加し、全背景の解放状況、獲得済み背景の拡大プレビュー、プレビューからの背景設定に対応しました。
- 未獲得背景は `Locked` 表示と、解放に必要なステージ条件だけを表示します。

### 背景解放機能の確認方法

1. `npm run dev` を実行してアプリを開きます。
2. ステージをクリアすると、右側の `Still Gallery` から開いた一覧で報酬背景が解放され、ゲームエリア背景へ反映されることを確認します。
3. 次のステージもクリアして複数の背景を解放し、Gallery のプレビューから設定した背景に Canvas が切り替わることを確認します。
4. 10秒以上待ってページを再読み込みし、解放済み背景と現在背景が維持されることを確認します。
5. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。
6. `Gallery を開く` を選択し、獲得済み背景のサムネイルと未獲得背景の `Locked` 条件が表示されることを確認します。
7. 獲得済み背景を選択して大きなプレビューを開き、`この背景に設定` でゲームエリアの背景が切り替わることを確認します。

## タイトル画面

- `src/store/useAppStore.ts` に `title`、`game`、`settings`、`gallery`、`credits` の画面状態を追加しました。
- 起動時は CSS グラデーション背景のタイトル画面を表示し、`Start`、`Continue`、`Settings`、`Gallery`、`Credits`、`Quit` から遷移できます。
- `Start` は保存データを消去して新規ゲームを開始し、`Continue` は有効なセーブデータがある場合だけ選択可能で、保存状態を読み直してゲームへ戻ります。
- タイトル画面の `Gallery` はゲームに入らず背景コレクションを閲覧でき、`Credits` は簡易クレジット画面を表示します。
- Web 版の `Quit` は終了処理を行わず、`Electron版で有効予定` の案内を表示します。
- タイトル表示中はオートセーブを動かさず、ゲーム開始前に空のセーブデータが作られないようにしています。

### タイトル画面の確認方法

1. セーブデータのない状態でページを開き、`Desktop Muse Idle` と `Hit the corner. Unlock her world.` が表示され、`Continue` が無効であることを確認します。
2. `Start` を選択し、初期状態のゲーム画面へ遷移することを確認します。
3. ゲーム画面で10秒以上待って保存後に再読み込みし、タイトル画面の `Continue` が選択可能になり、進行状態を読み込めることを確認します。
4. `Settings`、`Gallery`、`Credits` を選択し、それぞれの画面が表示されてタイトルへ戻れることを確認します。
5. `Quit` を選択し、Web 版では `Electron版で有効予定` と表示されることを確認します。
6. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## 設定画面

- `src/systems/settingsSystem.ts` にゲーム進行セーブとは独立した設定保存を追加し、`bgmVolume: 70`、`seVolume: 80`、`language: "ja"`、`effectsQuality: "medium"`、`motionIntensity: "medium"`、`autoSaveEnabled: true` を初期値としました。
- `SettingsModal` で `BGM Volume`、`SE Volume`、`Language`、`Effects Quality`、`Motion Intensity`、`Auto Save`、`Reset Save Data` を設定できます。
- BGM は音源をまだ追加していないため音量値の保存までに留め、SE Volume は Corner Hit SE、Effects Quality は Corner Hit の粒子数へ反映します。
- `Auto Save` を OFF にするとゲーム画面の10秒オートセーブを停止し、再度 ON にすると再開します。
- `Reset Save Data` は確認ダイアログの後にゲーム進行だけを初期化し、設定値は保持します。
- タイトル画面から Settings を開いた場合はタイトルへ、ゲーム画面上部の `Settings` から開いた場合はゲームへ戻ります。
- Language は現段階では設定画面内の説明と確認文の切替、および設定値の保持に対応しています。

### 設定画面の確認方法

1. タイトル画面の `Settings` を選択し、各音量スライダー、Language、Effects Quality、Motion Intensity、Auto Save、Reset Save Data、Back が表示されることを確認します。
2. `BGM Volume` と `SE Volume` を変更し、Language を `en`、Effects Quality を `high`、Motion Intensity を `low`、Auto Save を `OFF` に変更します。
3. ページを再読み込みして Settings を再度開き、変更値が復元されることを確認します。
4. Language の変更で設定画面内の案内文が切り替わり、SE Volume と Effects Quality がゲームの Corner Hit 演出へ反映されることを確認します。
5. タイトルから Settings を開いた場合の `Back` はタイトルへ戻り、ゲーム上部の `Settings` から開いた場合の `Back` はゲームへ戻ることを確認します。
6. `Reset Save Data` を選択して確認ダイアログをキャンセルできること、確認後はゲーム進行が初期状態になり、設定値は保持されることを確認します。
7. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## Reboot とスキルツリー

- ゲーム画面下部に `RebootPanel` を追加し、`100,000 Memory` 以上で Reboot して Fragment を獲得できるようにしました。
- Reboot 時は Memory と通常アップグレードをリセットし、Fragment、スキルツリー、ステージ進捗、背景解放、累計値は保持します。
- `SkillTreePanel` では Bounce / Corner / Muse の3系統、合計9個の恒久強化を一覧表示し、Fragment と前提ノード条件を満たしたスキルだけ解放できます。
- Bounce / Corner 報酬倍率、Corner Hit 判定距離、キャラスキルの継続時間とクールダウンをゲーム処理へ反映しました。
- `Stable Motion` は画面酔いを避けるため、見た目の Muse 速度をさらに上げず、内部収益倍率として作用します。
- `Passive Cache` はオフライン復帰時の Memory 報酬を `x1.20` にする恒久強化として反映されます。
- 旧セーブデータは Fragment `0`、未解放ツリー、Reboot 回数 `0` として読み込み、既存の進行を維持します。Reboot とスキル解放は操作直後にも保存します。

### Reboot とスキルツリーの確認方法

1. ゲーム画面下部の `Skill Tree` を選択し、Bounce / Corner / Muse の3カテゴリと各スキルカードが表示されることを確認します。
2. Fragment がない状態では購入ボタンが無効で、`Bounce Memory II` などの前提付きノードが `Locked` と表示されることを確認します。
3. `100,000 Memory` 以上で `Reboot` を選択し、確認後に Memory と通常アップグレードが初期化され、Fragment が増えることを確認します。
4. Fragment を使用して `Bounce Memory I` や `Corner Bonus I` を解放し、残 Fragment とスキル Lv が更新されることを確認します。
5. 前提ノードを解放すると、その先のノードの Unlock が選択可能になることを確認します。
6. Corner 報酬ノード解放後の Corner Hit 報酬、Corner Sensor I 解放後の Near Corner 検知距離と補助演出、Muse ノード解放後のスキル ACTIVE / CD 時間に効果が反映されることを確認します。
7. ページを再読み込みして Continue を選択し、Fragment、Reboot 回数、解放済みノードが保持されることを確認します。
8. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## オフライン報酬

- セーブデータへ `lastSavedAt` を追加し、`Continue` 選択時に前回保存からの経過時間に応じた Memory を付与します。
- 報酬の対象時間は最大8時間で、壁ヒット報酬、`Speed Tune`、出撃中の Muse、恒久収益強化をもとに保存された `Memory/sec` を利用します。
- オフライン報酬は通常プレイ中の自動収益を追加するものではなく、復帰時のみ付与されます。
- `Passive Cache` を解放済みの場合、復帰報酬に `x1.20` を適用し、復帰モーダルにも倍率を表示します。
- 付与後は直ちに保存するため、再読み込みによる同じ待機時間の二重取得を防ぎます。
- 従来形式のセーブはそのまま読み込めます。`lastSavedAt` のない既存セーブでは、一度新形式で保存された後からオフライン報酬が発生します。

### オフライン報酬の確認方法

1. ゲームを開始し、10秒の自動保存を待ってからタイトル画面へ戻るかページを閉じます。
2. しばらく時間を置いて起動し、`Continue` を選択すると `Welcome Back` モーダルと獲得 Memory が表示されることを確認します。
3. `Collect` を選択し、表示された Memory が上部の合計値へ加算済みであることを確認します。
4. 再読み込みしてすぐ `Continue` しても、同じ待機時間分が再度付与されないことを確認します。
5. `Passive Cache` を解放したセーブで同様に復帰し、モーダルに `x1.20` が表示され、獲得量へ倍率が反映されることを確認します。
6. 8時間を超える保存時刻を持つセーブで復帰し、モーダルに上限到達が表示されることを確認します。
7. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## Motion Intensity / Speed Tune内部効率化

- `SettingsModal` に `Motion Intensity` を追加し、`low` / `medium` / `high` をLocalStorageに保存します。旧設定データには `medium` を自動補完します。
- Motion Intensity は見た目速度の上限を切り替えます。`low` は `x1.6`、`medium` は `x2.2`、`high` は `x3.0` までです。
- `Speed Tune` の生倍率が見た目速度上限を超えた場合、超過分は内部収益倍率に変換され、壁ヒット報酬、Corner Hit報酬、オフライン用 `Memory/sec` に反映されます。
- Muse Tap は Motion Intensity に連動します。`low` は速度 `x1.1` / 方向変化 `±8度`、`medium` は `x1.25` / `±15度`、`high` は `x1.4` / `±20度` です。
- Muse Tap中のCorner Hit報酬は `low` / `medium` で `x1.5`、`high` で `x1.75` になります。
- `low` ではCorner Hitの粒子数を減らし、フラッシュを抑えて画面酔いを軽減します。

### Motion Intensity の確認方法

1. `Settings` を開き、`Motion Intensity` を `low` / `medium` / `high` に切り替えられることを確認します。
2. `Speed Tune` を複数Lv購入し、`low` では見た目速度が控えめなまま、上部の `Memory/sec` が内部効率として伸びることを確認します。
3. Motion Intensity を `high` に変更し、同じ `Speed Tune` Lvでも見た目速度上限が高くなることを確認します。
4. Muse Tapを発動し、`low` では方向変化と速度上昇が控えめ、`high` では強めになることを確認します。
5. `low` のCorner Hit演出で粒子とフラッシュが控えめになることを確認します。
6. ページを再読み込みしても Motion Intensity 設定が保持されることを確認します。
7. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## セーブデータのマイグレーション検証

- `scripts/fixtures/saveMigrationFixtures.mjs` に旧MVP形式、ステージ・背景・Muse・スキルツリー追加後の形式、設定保存の検証データを追加しました。
- `npm run verify:save-migrations` は実際の `saveSystem.ts` と `settingsSystem.ts` を実行し、LocalStorageだけを検証用に差し替えて復元結果を判定します。
- 旧MVPセーブでは追加後のフィールドが既定値で補完され、`lastSavedAt` がない間は意図しないオフライン報酬が付与されないことを確認します。
- 拡張途中のセーブでは、有効なステージ進捗、背景、Muse、Fragment、スキルノードを維持し、不明なIDや最大Lv超過を安全に除去・補正します。
- 設定はゲーム進行セーブとは別の LocalStorage キーに保存されるため、正しい設定値の復元と、不完全な設定データの既定値フォールバックを個別に検証します。
- Motion Intensity 追加前の設定データは、既存設定値を維持したまま `motionIntensity: "medium"` を補完します。
- 不正JSONまたは必須値が壊れたゲームセーブは削除され、初期状態で安全に継続できることを検証します。

### セーブデータ検証の確認方法

1. `npm run verify:save-migrations` を実行し、`Save migration verification passed` と表示されることを確認します。
2. `npm run build` を実行し、アプリ本体の TypeScript と Vite ビルドが成功することを確認します。

## Fixed Stage Layout

- The application is rendered inside a fixed `1920 x 1080` `.gameStage` centered in `.appViewport`.
- `src/hooks/useStageScale.ts` calculates `min(windowWidth / 1920, windowHeight / 1080)` and applies one uniform transform to the complete stage.
- The title, settings, gallery, resource bar, gameplay panels, and modals are all stage contents, so they remain aligned while the outer viewport scales.
- `GameCanvas` now initializes PixiJS from its fixed layout region and no longer changes its logical bounds when the browser is resized. Bounce and Corner Hit coordinates therefore remain stage-based.
- Unused surrounding space is filled by the viewport background rather than changing the internal UI layout.

### Fixed Stage Layout Verification

1. Run `npm run dev` and open the application.
2. Check the title and game screens at `1920 x 1080`, `1280 x 720`, `1366 x 768`, `2560 x 1440`, and a portrait window size.
3. Confirm that the entire `16:9` stage remains centered, panels retain their relative placement, and surplus space displays the outer background.
4. Continue the game and confirm that the PixiJS arena, moving muses, bounce bounds, and Corner Hit behavior do not shift when resizing the browser.
5. Open Settings and Gallery from their available entry points and confirm their panels scale with the stage rather than reflowing separately.
6. Run `npm run build` and confirm the TypeScript and Vite build completes.

## Non-Default Skin Unlock Flow

- `Stage` can define skin rewards through the shared `rewards` array.
- Stage 2 now rewards `lumi_pastel` when cleared.
- `unlockSkin()` prevents duplicate unlocks, saves the updated skin ownership, and queues a skin unlock notification.
- Stage rewards use the shared reward applier, while Debug Panel skin unlocks continue to use the store unlock action.
- `SkinUnlockToast` shows `New Skin Unlocked!`, skin name, Muse name, and rarity.
- The development `DebugPanel` can unlock `lumi_pastel`, `astra_cyber`, `noir_gothic`, or all non-default skins.
- `DebugPanel` also displays the current `unlockedSkinIds` for quick save/load checks.
- `StagePanel` displays skin rewards for the current stage when available.

### Non-Default Skin Unlock Verification

1. Run `npm run dev` and open `http://127.0.0.1:5173/`.
2. In development mode, use `Debug Panel` -> `Skins` -> `Unlock Lumi Pastel`.
3. Confirm `New Skin Unlocked!` appears and `unlockedSkinIds` includes `lumi_pastel`.
4. Open Lumi's `Change Skin`, confirm `Lumi Pastel` is `Owned`, then click `Equip`.
5. Confirm Lumi's GameCanvas palette changes to the pastel skin immediately.
6. Use `Debug Panel` -> `Clear Stage` until Stage 2 clears, and confirm Stage 2 can also unlock `lumi_pastel` when it was not already owned.
7. Save/reload/continue and confirm the unlocked skin remains owned.
8. Run `npm run build` and confirm the TypeScript and Vite build completes.

## Safe Clone Spawn

- Lumi's `clone` skill now places its temporary copy at a safe offset instead of creating it directly on top of the source muse.
- `src/game/spawnUtils.ts` searches random positions around the source while keeping the clone inside the arena, away from walls, and at least `80` logical pixels from active muses and clones; icon radii add extra visible separation when needed.
- Spawn tuning values are defined in `src/data/balance.ts`: `cloneSpawnMinDistance = 80`, `cloneSpawnWallPadding = 48`, and `cloneSpawnMaxAttempts = 20`.
- If random search cannot find a suitable position, the game selects a clamped fallback near the center or the candidate with the largest available separation.
- A clone begins with a small randomized direction offset and a short ring/star spawn effect. Its existing size, lifetime, clone flag, and reduced reward behavior remain unchanged.

### Safe Clone Spawn Verification

1. Run `npm run dev`, continue into the game, and wait for Lumi to score a Corner Hit and activate `Mirror Echo`.
2. Confirm that the translucent clone appears apart from Lumi and any other active muse, rather than directly overlapping one of them.
3. Confirm that the clone starts traveling at a slightly different angle and that a brief ring/star effect appears at its spawn position.
4. Observe additional skill activations with multiple active muses and confirm the clone remains inside the arena and away from the wall padding.
5. Confirm that clone bounces still award reduced Memory and that Corner Hit and stage progress continue normally.
6. Run `npm run build` and confirm the TypeScript and Vite build completes.

## Development Debug Panel

- The Debug Panel is available only while `import.meta.env.DEV` is true and starts closed.
- On the normal game screen, open or close it with the small `Debug` button or `Ctrl + Shift + D`.
- Close it with its `Close` button or `Esc`.
- Entering Focus Mode, Wallpaper Stage Mode, Muse Overlay Mode, or another screen closes the panel. The Debug button and panel are not rendered in production builds.

- `src/components/DebugPanel.tsx` is rendered only when `import.meta.env.DEV` is true, so it can be opened in `npm run dev` and stays hidden in production builds.
- The panel provides direct test controls for Memory, Fragment, Corner Hit progress, current stage completion/background unlock, Reboot readiness, Muse skill activation, and Muse Tap activation.
- Debug Corner Hit uses the normal stage-progress/background-unlock path, while adding the current bounce and corner reward to make reward and progression checks fast.
- The store-side debug actions are guarded by `import.meta.env.DEV` so accidental production calls do nothing.

### Development Debug Panel Verification

1. Run `npm run dev`, start or continue into the game screen, and confirm the Debug Panel starts closed.
2. Use the small `Debug` button or `Ctrl + Shift + D` and confirm the right-side overlay opens without changing the normal panel layout.
3. Use `Esc` or `Close` and confirm the panel closes.
4. Reopen it, click `+1K Memory`, `+10K Memory`, and `+1 Fragment`, and confirm ResourceBar/Reboot values update.
5. Click `Trigger Corner` and confirm Memory, Bounce count, Corner Hit count, and Stage progress increase.
6. Click `Clear Stage` and confirm the current stage reaches its goal, the next stage unlocks when available, and the reward background is added.
7. Click each Muse `Skill` and `Tap` button and confirm MusePanel state changes to active/cooldown.
8. Run `npm run build` and confirm the TypeScript and Vite build completes.

## Hidden Tab Rendering Control

- When the browser tab becomes hidden, `GameCanvas` stops the PixiJS ticker and skips frame updates so bounces, Corner Hits, and visual effects are not simulated in a background tab.
- When the tab is hidden or the page is unloaded, the current game state is checkpoint-saved with `lastSavedAt`.
- When the tab becomes visible again, the hidden duration is passed through the existing offline reward calculation once, skill/tap timers are settled, and the game is saved again to prevent duplicate hidden-time rewards.
- The first resumed frame caps its simulation delta to avoid a large physics jump after returning from a hidden tab.

### Hidden Tab Rendering Verification

1. Run `npm run dev`, start or continue into the game, and confirm Muse movement and Memory gain work normally.
2. Switch to another browser tab or minimize the window for at least 10 seconds.
3. Return to the game and confirm the Muse does not jump across the arena or rapidly count multiple bounces/Corner Hits at once.
4. If `Memory/sec` is above zero, confirm the hidden duration is applied as a single offline reward on return.
5. Hide and restore the tab repeatedly and confirm the same hidden interval is not awarded more than once.
6. Run `npm run build` and confirm the TypeScript and Vite build completes.

## Asset Fallbacks

- Missing background images no longer break the game view. `GameCanvas`, Gallery thumbnails, and background previews fall back to an inline SVG placeholder.
- If `currentBackgroundId` is empty or a background file cannot be loaded by PixiJS, the canvas keeps a safe fallback backdrop visible instead of showing a broken/blank image state.
- Unknown Muse `iconAsset` values fall back to Lumi's palette so the character remains visible and playable.
- Missing Muse Tap voice files are remembered after the first failed playback attempt. Subtitles and tap effects still appear, and repeated taps do not keep retrying the same missing file.
- In development builds, each missing asset logs a single warning to help identify what needs to be replaced later.

### Asset Fallback Verification

1. Run `npm run dev` and enter the game screen.
2. Temporarily change one background `imagePath` in `src/data/backgrounds.ts` to a missing file and confirm GameCanvas, Gallery thumbnail, and preview use the fallback image without crashing.
3. Temporarily change a Muse `iconAsset` in `src/data/muses.ts` to an unknown value and confirm the Muse remains visible with the fallback palette.
4. Trigger Muse Tap while the prototype voice files are missing and confirm the subtitle/effect still appears without gameplay interruption.
5. Restore the temporary test edits.
6. Run `npm run build` and confirm the TypeScript and Vite build completes.

## Asset Rules / Ledger

- `docs/ASSET_GUIDE.md` defines the common asset workflow, folder roles, naming rules, recommended formats, and replacement checks.
- `docs/ASSET_LEDGER.md` tracks each asset's ID, category, status, source path, runtime path, license, source/author, usage, and notes.
- `src/assets/` is reserved for source/management assets, while `public/assets/` is the runtime location for files loaded by the Web/Electron app.
- Category folders are prepared under `src/assets/ui/`, `src/assets/icons/`, `src/assets/backgrounds/`, `src/assets/effects/`, `src/assets/audio/`, and `src/assets/store/`.
- Release-blocking assets should not remain `missing` or `needs_final` in the ledger.
- Store image dimensions can change by platform, so final exports should be checked against each official store requirement before submission.

### Asset Rules / Ledger Verification

1. Open `docs/ASSET_GUIDE.md` and confirm it covers folder usage, naming, image/audio specs, license recording, and replacement steps.
2. Open `docs/ASSET_LEDGER.md` and confirm existing backgrounds, planned Muse icons, prototype voices, SE, UI, and store art are listed.
3. Confirm `src/assets/` contains category folders for UI, icons, backgrounds, effects, audio, and store assets.
4. When adding or replacing an asset, update the ledger and run `npm run build`.

## Neon Background Glow

- `bg_neon_room` uses the runtime asset at `public/assets/backgrounds/bg_neon_room.webp`, with the editable/source copy tracked at `src/assets/backgrounds/bg_neon_room.png`.
- The current image is a sci-fi neon room matched to the existing CSS glow overlays.
- `NeonBackground` adds CSS-only `neon-glow-layer`, `neon-sweep-layer`, and `neon-vignette-layer` overlays behind the game UI.
- Glow strength, sweep speed, center protection, and corner darkening are controlled with CSS custom properties in `src/styles/neon-background.css`.
- Focus Mode increases the glow brightness and animation speed while keeping the center readable for Muse visibility and the corners guarded from white-out.
- `prefers-reduced-motion: reduce` disables the pulse and sweep animations.

### Neon Background Glow Verification

1. Run `npm run dev`, unlock/select `Neon Room`, and confirm the neon room appears behind the game stage.
2. Confirm the glow is subtle in normal mode and that Muse, HUD, Corner Hit text, and corner effects remain readable.
3. Press `F` or the `Focus` button and confirm the glow becomes brighter/faster without changing gameplay bounds.
4. Enable reduced motion in the OS/browser and confirm the animated pulse/sweep stops.
5. Run `npm run build` and confirm the TypeScript and Vite build completes.

## Cozy Room Background

- `bg_cozy_room` now uses the runtime asset at `public/assets/backgrounds/bg_cozy_room.webp`, with the editable/source copy tracked at `src/assets/backgrounds/bg_cozy_room.png`.
- The Stage 2 reward background is now a warm room image instead of the SVG placeholder.
- Gallery thumbnails, previews, current background selection, and GameCanvas rendering all use the same WebP runtime path.

### Cozy Room Background Verification

1. Run `npm run dev`, clear Stage 1 or use a save where `bg_cozy_room` is unlocked, then select `Cozy Room` from Gallery.
2. Confirm the warm room appears in GameCanvas and remains readable behind Muse icons and HUD text.
3. Open the Gallery preview and confirm the image, name, and description render without the fallback placeholder.
4. Reload the page and confirm the selected background is restored from the save data.
5. Run `npm run build` and confirm the TypeScript and Vite build completes.

## Pinball Neon Background

- `bg_pinball_neon` uses `public/assets/backgrounds/bg_pinball_neon.webp`, with the source copy tracked at `src/assets/backgrounds/bg_pinball_neon.png`.
- `PinballBackground` is shown only while `bg_pinball_neon` is the selected background.
- The background is split into CSS-only image, neon glow, scanline, floor reflection, HUD dim, and per-corner flash layers.
- Focus Mode increases the glow, pulse speed, scanline frequency, and floor reflection with CSS custom properties.
- Corner Hit events now publish a transient corner position, so only the hit corner flashes briefly.
- `prefers-reduced-motion: reduce` disables continuous motion and keeps corner feedback subdued.

### Pinball Neon Background Verification

1. Run `npm run dev`, clear Stage 7 or use a save where `bg_pinball_neon` is unlocked, then select `Pinball Neon` from Gallery.
2. Confirm normal mode shows subtle neon pulse, scanlines, floor reflection, and a readable center area for Muse/HUD.
3. Press `F` or the `Focus` button and confirm Focus Mode strengthens the glow and scanline motion.
4. Trigger a Corner Hit, or use the development `Debug Panel` `Trigger Corner` button, and confirm only the relevant corner flashes.
5. Enable reduced motion in the OS/browser and confirm continuous background animation stops.
6. Run `npm run build` and confirm the TypeScript and Vite build completes.

## First-Run Tutorial

- 初回ゲーム画面遷移時に、5ステップの短いチュートリアルを表示します。
- 内容は Muse の自動移動、Corner Hit、Upgrade、Stage/Gallery、Muse Tap/Reboot の順で案内します。
- `Next` / `Back` / `Skip` / `Start Playing` のボタン操作に加え、`Enter` で次へ、`Esc` でスキップできます。
- チュートリアル表示時は `Next` / `Start Playing` に初期フォーカスを当て、キーボードだけでも進めやすくしています。
- Settings の `チュートリアルを表示` / `Show Tutorial` から、既読後でもチュートリアルを再表示できます。
- チュートリアル文言は Settings の Language 設定に合わせて日本語 / 英語で切り替わります。
- 完了またはスキップ後は `desktop-muse-idle-tutorial-seen` に既読フラグを保存し、以後は自動表示しません。
- チュートリアル既読フラグはゲーム進行セーブとは別管理なので、既存セーブ構造には影響しません。

### First-Run Tutorial Verification

1. Browser DevToolsなどで LocalStorage の `desktop-muse-idle-tutorial-seen` を削除します。
2. `npm run dev` を実行し、タイトル画面から `Start` または `Continue` でゲーム画面へ入ります。
3. チュートリアルが表示され、5ステップを `Next` / `Back` で移動できることを確認します。
4. `Enter` で次へ進み、`Esc` または `Skip` で閉じられることを確認します。
5. 完了後にページを再読み込みしてもチュートリアルが再表示されないことを確認します。
6. Settings から `Show Tutorial` を選択し、ゲーム画面でチュートリアルが再表示されることを確認します。
7. Settings の Language を `ja` / `en` に切り替え、チュートリアル文言も切り替わることを確認します。
8. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## Keyboard / Accessibility

- タイトル画面、Settings、Gallery、背景プレビュー、Credits、Offline Reward、Stage Clear の主要画面で初期フォーカスを設定しました。
- Settings / Gallery / 背景プレビュー / Credits は `Esc` で閉じる、または前の画面へ戻れます。
- Offline Reward、Stage Clear、背景プレビューは `Enter` で主要アクションを実行できます。
- Focus / Settings / Gallery / 背景プレビューなどの操作ボタンに `aria-label` を追加し、背景プレビューや確認ダイアログには `aria-modal` を付与しました。
- キーボードフォーカスが見えるよう、共通の `:focus-visible` アウトラインを追加しました。
- Settings、Gallery、背景プレビュー、Credits、Offline Reward、Stage Clear、First-Run Tutorial の主要モーダルで `Tab` / `Shift+Tab` のフォーカス循環を追加しました。
- Settings の説明、確認ダイアログ、チュートリアル再表示案内は Language 設定に合わせて日本語 / 英語で表示されます。

### Keyboard / Accessibility Verification

1. タイトル画面を開き、`Start` にフォーカスが当たり、`Tab` で各ボタンへ移動できることを確認します。
2. Settings を開き、`Esc` または `Back` で元の画面へ戻れることを確認します。
3. Gallery を開き、獲得済み背景を `Enter` でプレビューし、`Esc` でプレビュー、もう一度 `Esc` でGalleryを閉じられることを確認します。
4. Offline Reward / Stage Clear 表示時に `Enter` で閉じられることを確認します。
5. 各モーダル内で `Tab` と `Shift+Tab` を押し、フォーカスがモーダル外へ抜けず循環することを確認します。
6. `Tab` 移動中にボタン、スライダー、セレクトのフォーカス枠が見えることを確認します。
7. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## Corner Hit Effects

- `src/effects/` に `effectManager`、`screenFlash`、`cornerGlow`、`ringEffect`、`floatingText` を追加し、Corner Hit演出を独立した演出レイヤーとして管理します。
- Corner Hit時に、ピンク / ラベンダー / ゴールド系の淡い画面フラッシュ、ヒットした角のグロー、Muse周囲のリング、`CORNER HIT!`、`+Memory` 表示を出します。
- `Lucky Corner` 解放済みの場合は、通常Corner Hitより少し強い `LUCKY CORNER!` 演出になります。
- `Motion Intensity: low` では、フラッシュalpha、角グロー、リング、粒子数を抑えます。強い白フラッシュや長い点滅は使っていません。
- `ResourceBar` の `Memory` と `Corner Hits` はCorner Hit時に短くpulseし、HUD側でも反応が分かるようにしました。

### Corner Hit Effects Verification

1. `npm run dev` を実行し、ゲーム画面でCorner Hitを発生させます。
2. 画面が一瞬だけ淡く光り、ヒットした四隅が短くグローすることを確認します。
3. Muse周囲に広がるリング、`CORNER HIT!`、`+Memory` 表示が出ることを確認します。
4. 上部ResourceBarの `Memory` と `Corner Hits` が短く強調されることを確認します。
5. Settingsで `Motion Intensity` を `low` に変更し、フラッシュと粒子が控えめになることを確認します。
6. Skill Treeで `Lucky Corner` を解放した状態では、通常より少し強い `LUCKY CORNER!` 表示になることを確認します。
7. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## Muse Unlocks

- Museデータに `defaultUnlocked` と `unlockCondition` を追加し、初期状態ではLumiだけが解放済みになります。
- AstraはStage 2クリア、NoirはStage 4クリア、VegaはStage 5クリアで解放されます。
- `unlockedMuseIds` と `activeMuseIds` はセーブ/ロード対象です。旧セーブはLumiのみを初期解放し、既に条件を満たしている場合はロード時に解放状態を補完します。
- 解放条件達成時は `MuseUnlockModal` で `NEW MUSE UNLOCKED!`、キャラ名、説明、スキル名を表示します。
- `MusePanel` は解放済みキャラをDeploy/Recallでき、未解放キャラには共通UnlockConditionの条件を表示します。

### Muse Unlock Verification

1. LocalStorageの進行セーブを消すか `Start` で新規開始し、MusePanelでLumiのみDeploy可能、Astra/NoirがLocked表示になることを確認します。
2. 開発ビルドではDebug Panelの `Clear Stage` でStage 2まで進め、Astra解放モーダルが表示されることを確認します。
3. Astra解放後、MusePanelからAstraをDeployでき、GameCanvasに追加表示されることを確認します。
4. Stage 4をクリアし、Noir解放モーダルが表示され、NoirもDeployできることを確認します。
5. ページを再読み込みしてContinueし、`unlockedMuseIds` と `activeMuseIds` が復元されることを確認します。
6. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## Manual Save / Save Status

- `useGameStore` に `saveStatus`、`lastSavedAt`、`lastSaveError`、`lastSaveSource` を追加し、保存状態をUIで確認できるようにしました。
- `saveSystem` に `saveGame`、`loadGame`、`manualSave` を追加し、既存の `saveVersion` 付きLocalStorage保存形式は維持しています。
- ゲーム画面右上の `Save` ボタン、Settings画面の `Manual Save` ボタンから任意タイミングで保存できます。
- 保存中は `Saving...`、成功時は `Saved!`、失敗時は `Save Failed` を画面右上の `SaveStatusToast` に表示します。
- Settings画面では `Last Saved: HH:mm` 形式で最終保存時刻を確認できます。
- 10秒ごとの自動保存は継続し、自動保存成功時は控えめなToast表示になります。
- `unlockedMuseIds`、`activeMuseIds`、`unlockedSkinIds`、`equippedSkinByMuseId` など既存の進行データも同じ保存形式で保持します。
- Wallpaper設定は `desktopMuseIdle.wallpaperSettings` に分離して保存するため、手動セーブや進行データ初期化で上書きされません。

### Manual Save Verification

1. `npm run dev` を実行し、ゲーム画面右上の `Save` を選択します。
2. `Saving...` の後に `Saved!` が表示され、1.5〜2秒程度で消えることを確認します。
3. Settingsを開き、`Manual Save` を選択して同じToastが表示され、`Last Saved` 時刻が更新されることを確認します。
4. Memory、Stage、背景、Muse解放状態、スキン装備状態などを変化させて手動保存し、ページを再読み込みしてContinue後に復元されることを確認します。
5. Wallpaper Settingsを変更してから手動保存し、ページ再読み込み後もWallpaper設定が保持されることを確認します。
6. 10秒以上待ち、自動保存でも控えめな `Saved!` Toastが出ることを確認します。
7. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## Muse Tap

- ゲームエリア内の本体 Muse アイコンをクリックまたはタップすると、対象 Muse が3秒間 Boost 状態になります。Clone はタップ対象になりません。
- Boost 中は移動速度が一時的に上がり、発動時に進行方向を軽く変化させ、Corner Hit ボーナスが `x1.5` になります。
- 連打による稼ぎを避けるため、各 Muse は8秒のクールタイムを持ち、Boost 中やクールタイム中の再タップは無効です。
- `MusePanel` に Muse Tap の `Ready`、`Active`、`Cooldown` と残り時間を表示します。
- タップ時はアイコン周辺に光るリングと小さな星、`BOOST!` とキャラ字幕を短時間表示します。仮ボイス音源がまだ存在しない場合も字幕表示で動作し、エラーで停止しません。
- Motion Intensity 設定に応じて、Muse Tap の速度倍率、方向変化、Corner Hit報酬倍率が変化します。
- 見た目の速度倍率には上限を設け、既存の Speed Tune や一時スキルと組み合わせても過剰な視覚速度にならないようにしました。

### Muse Tap の確認方法

1. ゲーム画面で本体 Muse アイコンをクリックし、周囲にリングと星、`BOOST!` と字幕が表示されることを確認します。
2. 右側の `MusePanel` で対象キャラの Muse Tap が `Active` になり、3秒後に `Cooldown`、約8秒後に `Ready` に戻ることを確認します。
3. `Active` または `Cooldown` 中に同じアイコンを再タップしても、Boost が重ねがけされず残り時間が再開始しないことを確認します。
4. Lumi の分身が表示されている間、半透明の Clone をタップしても Muse Tap が発動しないことを確認します。
5. Boost 中の対象キャラによる Corner Hit で、通常より大きな Corner 報酬が表示されることを確認します。
6. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

## Muse Skins

- Added `src/data/skins.ts` as the skin registry for Lumi, Astra, and Noir.
- Each Muse now has default owned skins plus locked test skins for future stage, capsule, shard, and DLC flows.
- `unlockedSkinIds` and `equippedSkinByMuseId` are saved and restored through LocalStorage.
- Old save data without skin fields is migrated by adding each Muse default skin and default equipment.
- `MusePanel` shows the current equipped skin and opens `SkinSelectorModal`.
- `SkinSelectorModal` lists owned, equipped, and locked skins. Locked skins cannot be equipped, and locked Muses can only preview skin information.
- `GameCanvas` reads the equipped skin icon palette, so changing skins updates the Muse icon immediately.
- Missing thumbnail assets fall back through the existing asset fallback image instead of crashing.

### Muse Skins Verification

1. Run `npm run dev`, start or continue a game, and open the game screen.
2. In `MusePanel`, confirm each Muse card shows a Skin row and a `Change Skin` or `View Skins` button.
3. Open the skin selector and confirm owned default skins show `Owned` / `Equipped`, while test skins show `Locked`.
4. Confirm locked skins cannot be equipped and locked Muses cannot equip skins.
5. Use a save where Astra or Noir is unlocked, equip an owned default skin if needed, save, reload, and confirm the selected skin state remains.
6. Run `npm run build` and confirm the TypeScript and Vite build completes.

## Corner Collision Accuracy

- Corner Hit detection now uses the same-frame wall collision result from `stepBounceBody`.
- A Corner Hit is awarded only when an X wall and a Y wall are both hit in the same update frame.
- Wall-only hits near a corner are treated as Near Corner feedback and do not award Corner Hit rewards or stage progress.
- Collision detection uses fixed Pixi stage coordinates and each Muse radius, so browser scale does not affect hit results.
- Corner IDs now use `top_left`, `top_right`, `bottom_left`, and `bottom_right` internally. CSS-only pinball flashes map those IDs back to their existing class names.
- `nearCornerDistance` and `cornerHitGracePx` are defined in `src/data/balance.ts` for future tuning.

### Corner Collision Accuracy Verification

1. Run `npm run dev` and start or continue a game.
2. Watch normal left/right or top/bottom wall bounces near corners and confirm they do not increment Corner Hits.
3. Confirm those near-corner wall hits show only subtle Near Corner feedback with no `+Corner` reward.
4. Confirm a true simultaneous X/Y corner bounce increments total Corner Hits and stage progress exactly once.
5. Select the pinball background if unlocked, trigger a true Corner Hit, and confirm the correct corner flash appears.
6. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Corner Sensor / Near Corner Redefinition

- `corner_threshold` nodes no longer widen true Corner Hit detection.
- True Corner Hits still require same-frame X-wall and Y-wall contact.
- Corner Sensor now increases only Near Corner detection distance from `nearCornerDistance`.
- Near Corner feedback remains guidance only: it does not increment `totalCornerHits`, does not advance stage goals, and does not award Corner Hit rewards.
- `Corner Sensor I` now describes the new behavior in the Skill Tree UI.
- Future Near Reward nodes can grant small Memory from Near Corners through `near_corner_reward`, while true Corner rewards remain separate.
- `StagePanel` now reminds players that stage progress counts only true Corner Hits.

### Corner Sensor / Near Corner Verification

1. Run `npm run dev`, open the Skill Tree, and confirm `Corner Sensor I` explains Near Corner guidance instead of wider Corner Hit detection.
2. Unlock `Corner Sensor I` in a development save and confirm wall-only hits near corners show Near Corner feedback more often.
3. Confirm those Near Corners do not increase `Corner Hits` or the current stage progress.
4. Confirm true simultaneous X/Y corner bounces still increment Corner Hits and stage progress exactly once.
5. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Clone Collision Rewards

- Clone bodies now use the same wall, Near Corner, and Corner Hit collision path as main Muse bodies.
- Clone wall hits award Memory with `cloneWallRewardMultiplier`.
- Clone Corner Hits award reduced Corner Memory with `cloneCornerRewardMultiplier`.
- Clone Corner Hits now increment `totalCornerHits` and current stage Corner progress exactly once per true corner collision.
- Clone Near Corners show Near feedback but do not advance Corner Hit or stage counts.
- Clone Corner effects use the existing Corner FX path with a reduced particle count.
- Clone bodies still cannot trigger Muse Tap and cannot activate clone skills, so clones do not create more clones.
- Future Jackpot/Fever systems can use `cloneJackpotChanceMultiplier` and `cloneFeverGaugeMultiplier` from `src/data/balance.ts`.

### Clone Collision Rewards Verification

1. Run `npm run dev` and trigger Lumi's clone skill from a Corner Hit or the development Debug Panel.
2. Confirm the clone bounces independently and wall hits increase Memory at a reduced rate.
3. Confirm a true clone X/Y corner bounce shows Corner Hit effects and increments total Corner Hits.
4. Confirm clone Corner Hits advance the current stage progress.
5. Confirm clone Near Corners show only Near feedback and do not advance Corner Hit or stage counts.
6. Confirm tapping the clone does not trigger Muse Tap and the clone does not create another clone.
7. Wait for the clone skill duration to end and confirm the clone disappears without errors.
8. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Vega Muse Bumper

- Vega is a Stage 5 unlockable Muse with the `Muse Bumper` skill.
- Vega's skill state uses the existing Muse skill timer flow, so MusePanel shows Ready, Active, and Cooldown status.
- While `Muse Bumper` is active, only collisions between Vega and non-Vega active Muses or clones are resolved.
- Vega acts as a moving bumper: hit Muses are pushed outward from Vega and their velocity is redirected with a capped boost.
- Vega receives a small recoil and both bodies are clamped inside the fixed stage bounds after collision resolution.
- Vega-to-Muse bumper collisions are not Corner Hits and do not increment `totalCornerHits` or stage progress.
- If the redirected Muse later hits a real corner, normal Corner Hit logic still applies.
- Clone bodies can bounce off Vega, but their bumper reward is reduced.
- Pair cooldowns prevent repeated reward bursts while the same Muse overlaps Vega.
- Vega displays a larger gold bumper ring and `BUMPER ACTIVE` label while the skill is active.

### Vega Muse Bumper Verification

1. Run `npm run dev`, unlock Vega by clearing Stage 5 or using development stage tools, and deploy Vega with at least one other Muse.
2. Trigger Vega's Corner Hit and confirm `Muse Bumper` becomes Active in MusePanel.
3. Confirm only Muses or clones that touch Vega bounce outward; non-Vega Muses should pass through each other.
4. Confirm bumper collisions add a small amount of Memory but do not increase Corner Hits or stage progress.
5. Confirm a Muse redirected by Vega can still later hit a real corner and count as a normal Corner Hit.
6. Confirm clones can bounce off Vega, cannot Muse Tap, and do not create more clones.
7. Keep a Muse overlapping Vega and confirm Memory does not explode every frame because of pair cooldown.
8. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Debug Collision Tools

- The development-only `Debug Panel` now includes a `Collision / Skill Status` section.
- The status view shows active Pixi runtime bodies, clone count, Vega Bumper timer state, and the latest collision/debug event reported by `GameCanvas`.
- `Deploy Vega` unlocks Vega in the current dev save and places her in the active Muse lineup for quick bumper tests.
- `Force Vega Bumper` activates Vega's `Muse Bumper` without waiting for a Corner Hit.
- `Force Vega Hit` arms a direct Vega-to-Muse collision so the next update resolves through the normal bumper collision path.
- `Force Clone Corner` activates a clone skill and positions the clone to hit a true X/Y corner on the next update.
- `Force Near Corner` positions an active Muse for a wall-only Near Corner check, confirming it does not advance Corner Hit or stage progress.

### Debug Collision Tools Verification

1. Run `npm run dev` and open the game screen in development mode.
2. Use `Deploy Vega`, then `Force Vega Bumper`, and confirm Vega shows `BUMPER ACTIVE`.
3. Use `Force Vega Hit` and confirm Memory increases slightly while Corner Hits and stage progress do not increase.
4. Use `Force Clone Corner` and confirm a clone appears, hits a true corner, increments Corner Hits, and updates the Debug Panel latest event.
5. Use `Force Near Corner` and confirm Near Corner feedback appears without Corner Hit or stage progress increases.
6. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Statistics

- Added persistent `GameStats` to track long-term play records separately from the current resource values.
- Stats currently track total wall hits, total Corner Hits, highest reached Stage, Reboot count, total play time, unlocked background count, total Memory earned, Near Corners, Jackpots, and Fever activations.
- Wall hits, Corner Hits, Near Corners, Reboots, unlocked backgrounds, offline rewards, and play time now update the stats store.
- Old save data without `stats` is migrated by filling defaults from existing totals such as `totalBounces`, `totalCornerHits`, `rebootCount`, current Memory, and current Stage.
- `StatsPanel` can be opened from the title screen, Settings, or the game ResourceBar.
- Opening Stats from the game exits Focus Mode first, keeping the fixed 1920x1080 stage layout stable.
- `Esc` or `Close` returns to the previous screen.

### Statistics Verification

1. Run `npm run dev` and open `Stats` from the title screen.
2. Start or continue a game, then open `Stats` from the ResourceBar and confirm all statistic cards render.
3. Let a few wall hits happen and confirm `Total Wall Hits` and `Total Memory Earned` increase.
4. Trigger a true Corner Hit and confirm `Total Corner Hits` increases.
5. Trigger or observe a Near Corner and confirm `Near Corners` increases without stage progress from Near Corner alone.
6. Clear a stage and confirm `Highest Stage Reached` and unlocked background count update.
7. Reboot and confirm `Reboots` increases.
8. Save, reload, continue, and confirm stats persist. Old saves without `stats` should load with default-filled values.
9. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Wallpaper Mode State

- Added shared `wallpaperMode` state to `useAppStore`.
- Supported values are `off`, `stage`, and `muse_overlay`.
- Added `setWallpaperMode`, `exitWallpaperMode`, `toggleWallpaperStageMode`, and `toggleMuseOverlayMode` actions.
- Settings now includes a `Wallpaper Mode` selector for `Off`, `Wallpaper Stage`, and `Muse Overlay`.
- Added `WallpaperModePanel` to the game screen so the current mode is visible and can be changed without opening Settings.
- ResourceBar now has a small `Wallpaper` button that toggles Wallpaper Stage Mode.
- `Esc` returns Wallpaper Mode to `off` while on the game screen.
- Turning Focus Mode on exits Wallpaper Mode to avoid conflicting display states.
- This stage only adds shared state and UI controls; it does not change GameCanvas coordinates, Corner Hit detection, or reward calculation.

### Wallpaper Mode Verification

1. Run `npm run dev` and open the game screen.
2. Open Settings and change `Wallpaper Mode` between `Off`, `Wallpaper Stage`, and `Muse Overlay`.
3. Return to the game screen and confirm `WallpaperModePanel` shows the selected mode.
4. Use the ResourceBar `Wallpaper` button and confirm it toggles Wallpaper Stage Mode.
5. Press `Esc` while Wallpaper Mode is active and confirm the mode returns to `Off`.
6. Enable Focus Mode while Wallpaper Mode is active and confirm Wallpaper Mode is cleared.
7. Confirm Muse movement, Corner Hit detection, rewards, and stage progress are unchanged.
8. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Wallpaper Stage Mode

- `wallpaperMode === "stage"` now enables Wallpaper Stage Mode.
- Wallpaper Stage Mode keeps the existing fixed 1920x1080 stage shell and does not change GameCanvas physics, internal coordinates, Corner Hit detection, or reward multipliers.
- ResourceBar, UpgradePanel, StagePanel, GalleryPanel, MusePanel, DebugPanel, and RebootPanel are hidden while the mode is active.
- GameCanvas is expanded into a large centered viewing area so the selected background, Muse movement, and Corner/Near effects are the focus.
- Added `WallpaperStageHud` with Memory, current Stage, Corner Hit progress, Fever placeholder state, and an Exit button.
- The HUD fades after a few seconds of inactivity and becomes visible again on pointer or keyboard activity.
- `Esc` or `Exit Wallpaper` returns `wallpaperMode` to `off`.
- Pinball and Neon background CSS effects use the stronger focus-style presentation while Wallpaper Stage Mode is active.

### Wallpaper Stage Mode Verification

1. Run `npm run dev` and enter the game screen.
2. Click the ResourceBar `Wallpaper` button or select `Wallpaper Stage` from Settings.
3. Confirm the normal management UI disappears and only the large GameCanvas plus Wallpaper HUD remain.
4. Wait a few seconds and confirm the Wallpaper HUD fades, then move the pointer or press a key and confirm it becomes visible again.
5. Confirm Muse movement, Memory gain, Wall Hits, Corner Hits, Stage progress, and Muse Tap continue while the mode is active.
6. Trigger Corner Hit or Near Corner feedback and confirm the visual effects still appear.
7. Press `Esc` or click `Exit Wallpaper` and confirm the normal UI returns.
8. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Muse Overlay Mode

- `wallpaperMode === "muse_overlay"` now enables a web-only Muse Overlay preview mode.
- The mode hides the selected background image, CSS background effects, ResourceBar, UpgradePanel, StagePanel, GalleryPanel, MusePanel, DebugPanel, RebootPanel, and large blocking reward/unlock UI.
- GameCanvas keeps the same Pixi coordinate system, movement, Corner Hit detection, Muse Tap, rewards, and stage progress while presenting only the Muse bodies and reduced effects.
- The stage uses a dark checker-style placeholder backdrop to suggest future transparent-window behavior without adding Electron-specific code.
- Added `MuseOverlayHud`, which stays hidden by default and briefly appears on pointer or keyboard activity.
- The HUD includes an `Exit` button and a Click Through placeholder label for future Electron work.
- `Esc` also exits Muse Overlay Mode by returning `wallpaperMode` to `off`.

### Muse Overlay Mode Verification

1. Run `npm run dev` and enter the game screen.
2. Open Settings or `WallpaperModePanel`, then select `Muse Overlay`.
3. Confirm the background image and large management UI disappear, leaving only moving Muse bodies on the dark checker placeholder backdrop.
4. Move the pointer or press a key and confirm the small Muse Overlay HUD appears briefly.
5. Confirm Muse movement, Muse Tap, Wall Hits, Corner Hits, Memory gain, and stage progress continue while the mode is active.
6. Trigger a Corner Hit or Near Corner and confirm the effects are still visible but more subdued than normal.
7. Press `Esc` or click `Exit` in the overlay HUD and confirm the normal game UI returns.
8. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Platform Overlay Adapter Stub

- Added `src/platform/platformAdapter.ts` as the shared platform boundary for future desktop behavior.
- Added safe no-op implementations in `localAdapter` and `steamAdapter`.
- `platform.ts` exposes overlay-related adapter calls for Always on Top, Click Through, Transparent Window, entering Overlay Mode, and exiting Overlay Mode.
- `useAppStore` now owns placeholder state for Always on Top, Click Through, and Transparent Window.
- Wallpaper Muse Overlay entry/exit now calls the platform adapter boundary instead of leaving React components to know about future Electron APIs.
- Settings includes web-safe placeholder toggles for `Always on Top`, `Click Through`, and `Transparent Window`.
- `MuseOverlayHud` displays the current Click Through placeholder state.
- No Electron main process, native module, or Steam SDK implementation was added in this step.

### Platform Overlay Adapter Verification

1. Run `npm run dev` and open Settings.
2. Toggle `Always on Top`, `Click Through`, and `Transparent Window`; confirm the UI state changes without browser errors.
3. Select `Muse Overlay` and confirm the overlay preview still opens normally.
4. Move the pointer to reveal `MuseOverlayHud` and confirm the Click Through placeholder reflects the Settings value.
5. Press `Esc` or click `Exit` and confirm normal game UI returns.
6. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Wallpaper Low Power Settings

- Added persistent `wallpaperSettings` for long-running Wallpaper Stage and Muse Overlay sessions.
- Settings now includes a `Wallpaper Settings` group with FPS, Effects, Wallpaper BGM, Wallpaper SE Scale, and Overlay HUD controls.
- Wallpaper modes can run at 30fps or 60fps through Pixi ticker `maxFPS`; normal gameplay keeps its existing unrestricted ticker behavior.
- `Effects: low` reduces Wallpaper-mode particles, screen flash alpha, and effect layer intensity without changing Corner Hit detection or rewards.
- Wallpaper SE Scale lowers Corner Hit and Muse Tap voice volume only while Wallpaper Stage or Muse Overlay is active.
- Wallpaper BGM currently controls a web-safe audioSystem mute stub, ready for a future BGM player.
- Muse Overlay HUD can now be hidden entirely with `Overlay HUD: OFF`; `Esc` still exits the mode.
- Wallpaper Stage HUD and Muse Overlay HUD show the active FPS / Effects setting for quick verification.

### Wallpaper Low Power Verification

1. Run `npm run dev` and open Settings.
2. In `Wallpaper Settings`, set FPS to `30`, Effects to `low`, adjust `Wallpaper SE Scale`, and toggle `Overlay HUD`.
3. Enter `Wallpaper Stage` and confirm the HUD shows `30fps / low`.
4. Trigger Corner Hit or Near Corner feedback and confirm effects are visibly more subdued while Memory, Corner Hits, and stage progress still advance normally.
5. Enter `Muse Overlay` with `Overlay HUD: ON`, move the pointer, and confirm the HUD shows the active FPS / Effects values.
6. Set `Overlay HUD: OFF`, re-enter Muse Overlay, and confirm the HUD does not appear while `Esc` still returns to normal.
7. Switch FPS back to `60` and Effects to `normal`, then confirm Wallpaper modes become more responsive/bright again.
8. Reload the page, reopen Settings, and confirm the Wallpaper Settings values persist.
9. Run `npm run build` and confirm TypeScript and Vite build successfully.

## Stage Clear Rewards

- Clearing a stage now opens a dedicated Stage Clear modal with the cleared stage name and reward cards.
- Reward cards support skins, backgrounds, Muses, Memory, and Capsules.
- Stage 2 grants and displays Cozy Room, Lumi Pastel, and Astra.
- Skin reward cards can Equip immediately, background cards can Set Background or Open Gallery, and Muse cards can Set Active.
- Rewards are granted once when the stage is newly cleared and are saved before the modal is dismissed.
- Stage Clear uses a soft flash, small sparkles, a short jingle stub, and a reduced presentation when Motion Intensity is Low.
- When updates add unclaimed rewards to multiple already-cleared Stages, Continue grants every eligible reward and opens a Backfill Rewards modal grouped by Stage.
- Backfill reward groups use the same Reward cards and immediate Equip, Set Background, and Open Gallery actions as normal Stage Clear rewards.
- Closing the Backfill Rewards modal only dismisses the transient summary; granted rewards and `claimedRewardIds` remain saved.
- The Backfill Rewards modal keeps its header and Continue footer visible while only the Stage reward-group list scrolls.
- In development, open the Debug Panel and use `Show Backfill Rewards: 3 Stages`, `5 Stages`, or `10 Stages`. These fixtures replace only transient `pendingBackfillRewards`; they do not grant rewards or update `claimedRewardIds`.

### Backfill Rewards Layout Verification

Playwright is not currently installed. The automated viewport checks use the existing Electron renderer regression at 1280x720 and 1920x1080. Real-window visual inspection remains deferred until the Windows runtime startup failure is resolved.

1. Run `npm run dev`, enter the game, and open the Debug Panel with `Ctrl + Shift + D`.
2. Select `Show Backfill Rewards: 10 Stages`.
3. At 1920x1080 and 1280x720, confirm the modal remains inside the game viewport and the header and Continue button remain visible.
4. Scroll the Stage reward-group list and confirm the page/backdrop and header/footer do not scroll.
5. Confirm Stage groups with multiple rewards wrap into readable cards and long/Unknown/Already Claimed labels do not break the card layout.
6. Confirm Equip, Set Background, Open Gallery, and Continue remain operable.
7. Confirm merely opening the fixture does not change the saved `claimedRewardIds`.

## Master Data Validation

- Run `npm run verify:masters` whenever Stage, Reward, Muse, Skin, Background, Skill, Upgrade, or initial-state master data changes.
- The validator checks duplicate IDs, Reward references, generated claim keys, UnlockCondition references, initial unlock/equipment state, and the legacy Stage-claim migration snapshot.
- Missing image assets and not-yet-implemented Capsule, Conversation, or DLC masters are reported as warnings without failing validation.
- `npm run verify:all` runs `verify:masters` once after save migration verification.
- See `docs/MASTER_VALIDATION.md` for the full validation scope and snapshot policy.

### Stage Clear Reward Verification

1. Run `npm run dev` and start a new game.
2. In the development Debug Panel, use `Clear Stage` to complete Stage 1.
3. Confirm the Stage Clear modal shows Default Room and that `Open Gallery` opens the Gallery.
4. Complete Stage 2 and confirm Cozy Room, Lumi Pastel, and Astra appear as reward cards.
5. Use `Set Background` and `Equip`, then press `Continue`.
6. Save and reload, then confirm Cozy Room remains selected, Lumi Pastel remains equipped, and Astra remains unlocked.
7. Confirm clearing or reloading does not duplicate owned rewards.

## Bundle Splitting And Wallpaper FPS Verification

- Non-initial UI panels use `React.lazy` and `Suspense` so the title screen does not load every heavy panel up front.
- Lazy-loaded panels include Settings, Gallery, Credits, Stats, Debug Panel, Skill Tree, Skin Selector, and GameCanvas.
- Vite manual chunks split React, Zustand, and other vendor code without raising `build.chunkSizeWarningLimit`.
- PixiJS stays on Vite/Rollup automatic splitting because aggressive manual Pixi chunking produced circular chunk warnings.
- Current `npm run build` output has no 500 kB chunk warning. The largest chunks are GameCanvas/Pixi runtime code, React vendor code, and the small main index chunk.
- If the bundle grows again, consider adding `rollup-plugin-visualizer` as a dev-only dependency to inspect exact module weight before changing chunk strategy.
- Wallpaper FPS limits the Pixi ticker in Wallpaper Stage and Muse Overlay modes. This reduces both GameCanvas update callbacks and Pixi render cadence while preserving delta-time-based game speed.
- Normal gameplay keeps the existing unrestricted ticker behavior.
- The development Debug Panel shows `Wallpaper FPS`, `Update interval`, `Last delta`, and measured updates per second from GameCanvas while `import.meta.env.DEV` is true.
- Cadence must be checked in a visible window. The existing hidden-tab control stops the Pixi ticker, so a hidden Electron regression window cannot provide a meaningful 30/60fps measurement.

### Bundle And Wallpaper FPS Verification

1. Run `npm run dev` and enter the game screen.
2. Open Skill Tree and confirm it appears after the lightweight loading fallback.
3. Open Change Skin, equip an unlocked skin, and confirm the selected skin appears in the Muse panel.
4. Open Settings, Gallery, Stats, and Credits and confirm each opens and closes normally.
5. In Settings, set Wallpaper FPS to `30`.
6. Enter Wallpaper Stage Mode and confirm the Debug Panel reports `Wallpaper FPS 30`, an update interval near `33.3ms`, and measured updates near `30/s`.
7. Set Wallpaper FPS to `60` and confirm measured updates return near `60/s`.
8. Repeat the FPS check in Muse Overlay Mode.
9. Confirm Wall Hits, strict Corner Hits, Near Corners, Muse Tap, Memory gain, and stage progress still behave normally.
10. Run `npm run build` and confirm no 500 kB chunk warning appears.

## Wallpaper Mode Settings Persistence

- Wallpaper settings are now saved separately from game progress and normal app settings.
- The LocalStorage key is `desktopMuseIdle.wallpaperSettings`.
- Persisted wallpaper settings include FPS, effects quality, BGM enablement, Wallpaper SE scale, Stage HUD visibility, Overlay HUD visibility, Click Through preference, and Always on Top preference.
- `wallpaperMode` itself is intentionally not persisted. The app always starts with `wallpaperMode: "off"`.
- Reloading while in Wallpaper Stage Mode or Muse Overlay Mode returns to the normal game screen on next launch.
- Invalid or malformed wallpaper settings data falls back safely to defaults.
- Legacy wallpaper settings previously embedded in `desktop-muse-idle-settings` are read once as a migration fallback when the new key is missing.
- Wallpaper settings remain separate from Focus Mode, Screensaver Mode, and game save data.

### Wallpaper Mode Settings Persistence Verification

1. Run `npm run dev`.
2. Open Settings and set Wallpaper FPS to `30`.
3. Set Effects to `low`.
4. Set `Overlay HUD` to `OFF`.
5. Reload the page and confirm the Wallpaper Settings values are still restored.
6. Enter Wallpaper Stage Mode, reload, and confirm the app starts back in normal mode.
7. Enter Muse Overlay Mode, reload, and confirm the app starts back in normal mode.
8. Set `localStorage["desktopMuseIdle.wallpaperSettings"]` to invalid JSON, reload, and confirm the app does not crash and falls back to defaults.
9. Run `npm run build` and confirm TypeScript and Vite build successfully.
