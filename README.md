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

- `src/data/stages.ts` に Stage 1 から Stage 3 の Corner Hit 目標を定義
- `currentStageId`、`stageCornerHits`、`clearedStages` を Zustand とセーブデータへ追加
- Corner Hit の累計 `totalCornerHits` は維持しつつ、ステージクリア判定には現在ステージ専用の進捗だけを使用
- 右側の `StagePanel` に現在ステージ名、進捗、必要 Corner Hit 数、クリア済み数を表示
- 目標達成時はクリア記録を追加し、次のステージへ自動的に移行

現在はステージ目標による進行確認に加え、`rewardBackgroundId` に対応する背景の解放、Gallery での閲覧、現在背景の選択にも対応しています。追加のスチルカテゴリや大量の背景コンテンツはまだ実装していません。

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

- `src/systems/settingsSystem.ts` にゲーム進行セーブとは独立した設定保存を追加し、`bgmVolume: 70`、`seVolume: 80`、`language: "ja"`、`effectsQuality: "medium"`、`autoSaveEnabled: true` を初期値としました。
- `SettingsModal` で `BGM Volume`、`SE Volume`、`Language`、`Effects Quality`、`Auto Save`、`Reset Save Data` を設定できます。
- BGM は音源をまだ追加していないため音量値の保存までに留め、SE Volume は Corner Hit SE、Effects Quality は Corner Hit の粒子数へ反映します。
- `Auto Save` を OFF にするとゲーム画面の10秒オートセーブを停止し、再度 ON にすると再開します。
- `Reset Save Data` は確認ダイアログの後にゲーム進行だけを初期化し、設定値は保持します。
- タイトル画面から Settings を開いた場合はタイトルへ、ゲーム画面上部の `Settings` から開いた場合はゲームへ戻ります。
- Language は現段階では設定画面内の説明と確認文の切替、および設定値の保持に対応しています。

### 設定画面の確認方法

1. タイトル画面の `Settings` を選択し、各音量スライダー、Language、Effects Quality、Auto Save、Reset Save Data、Back が表示されることを確認します。
2. `BGM Volume` と `SE Volume` を変更し、Language を `en`、Effects Quality を `high`、Auto Save を `OFF` に変更します。
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
- `Passive Cache` のオフライン報酬倍率は `rewardCalculator` に計算口を追加しています。オフライン収益の付与自体は、既存プロトタイプに復帰収益システムがないため今後の実装対象です。
- 旧セーブデータは Fragment `0`、未解放ツリー、Reboot 回数 `0` として読み込み、既存の進行を維持します。Reboot とスキル解放は操作直後にも保存します。

### Reboot とスキルツリーの確認方法

1. ゲーム画面下部の `Skill Tree` を選択し、Bounce / Corner / Muse の3カテゴリと各スキルカードが表示されることを確認します。
2. Fragment がない状態では購入ボタンが無効で、`Bounce Memory II` などの前提付きノードが `Locked` と表示されることを確認します。
3. `100,000 Memory` 以上で `Reboot` を選択し、確認後に Memory と通常アップグレードが初期化され、Fragment が増えることを確認します。
4. Fragment を使用して `Bounce Memory I` や `Corner Bonus I` を解放し、残 Fragment とスキル Lv が更新されることを確認します。
5. 前提ノードを解放すると、その先のノードの Unlock が選択可能になることを確認します。
6. Corner 報酬ノード解放後の Corner Hit 報酬、Corner Sensor I 解放後の判定距離、Muse ノード解放後のスキル ACTIVE / CD 時間に効果が反映されることを確認します。
7. ページを再読み込みして Continue を選択し、Fragment、Reboot 回数、解放済みノードが保持されることを確認します。
8. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。

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

## Muse Tap

- ゲームエリア内の本体 Muse アイコンをクリックまたはタップすると、対象 Muse が3秒間 Boost 状態になります。Clone はタップ対象になりません。
- Boost 中は移動速度が一時的に上がり、発動時に進行方向を軽く変化させ、Corner Hit ボーナスが `x1.5` になります。
- 連打による稼ぎを避けるため、各 Muse は8秒のクールタイムを持ち、Boost 中やクールタイム中の再タップは無効です。
- `MusePanel` に Muse Tap の `Ready`、`Active`、`Cooldown` と残り時間を表示します。
- タップ時はアイコン周辺に光るリングと小さな星、`BOOST!` とキャラ字幕を短時間表示します。仮ボイス音源がまだ存在しない場合も字幕表示で動作し、エラーで停止しません。
- Motion Intensity 設定は現時点では未導入のため、Muse Tap は medium 相当の速度倍率 `x1.25` と方向変化 `±15度` を利用します。
- 見た目の速度倍率には上限を設け、既存の Speed Tune や一時スキルと組み合わせても過剰な視覚速度にならないようにしました。

### Muse Tap の確認方法

1. ゲーム画面で本体 Muse アイコンをクリックし、周囲にリングと星、`BOOST!` と字幕が表示されることを確認します。
2. 右側の `MusePanel` で対象キャラの Muse Tap が `Active` になり、3秒後に `Cooldown`、約8秒後に `Ready` に戻ることを確認します。
3. `Active` または `Cooldown` 中に同じアイコンを再タップしても、Boost が重ねがけされず残り時間が再開始しないことを確認します。
4. Lumi の分身が表示されている間、半透明の Clone をタップしても Muse Tap が発動しないことを確認します。
5. Boost 中の対象キャラによる Corner Hit で、通常より大きな Corner 報酬が表示されることを確認します。
6. `npm run build` を実行し、TypeScript と Vite のビルドが成功することを確認します。
