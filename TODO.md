# Desktop Muse Idle TODO

最終更新: 2026-05-28

## 開発方針

Desktop Muse Idle は、画面内を跳ねる美少女アイコンを眺めながら、壁ヒット・Corner Hit・スキン収集・背景解放を楽しむデスクトップIdleゲーム。

初回リリースでは、まず「遊んで気持ちいい本体」を完成させる。

### v1.0 方針

- 有料買い切り想定
- 定価: ¥580
- 無料Muse Capsuleあり
- 有料ガチャなし
- Steamマーケットなし
- Steamトレードなし
- 本格オンライン要素なし
- Steam以外にもBOOTH / itch.io / DLsite / Microsoft Storeへ横展開できる構成にする

---

## Phase 0: 開発土台

### 必須

- [x] React + TypeScript + Vite + PixiJS + Zustand の構成を安定化する
- [ ] ファイル構成を整理する
  - [x] `src/data/`
  - [x] `src/store/`
  - [x] `src/components/`
  - [x] `src/game/`
  - [ ] `src/effects/`
  - [ ] `src/platform/`
  - [x] `src/systems/`
  - [x] `src/types/`
- [x] 数値バランスを `src/data/balance.ts` に集約する
- [x] 型定義を `src/types/game.ts` にまとめる
- [ ] Steam / BOOTH / itch.io / DLsite / Microsoft Storeへ横展開できるよう、Platform Adapter構成を用意する
  - [ ] `src/platform/platformAdapter.ts`
  - [ ] `src/platform/localAdapter.ts`
  - [ ] `src/platform/steamAdapter.ts`
  - [ ] `src/platform/platform.ts`
- [ ] `steamAdapter.ts` は初期段階ではstub実装でよい
- [ ] ゲーム本体からSteam SDKを直接呼ばない構成にする

---

## Phase 1: 固定16:9ステージ対応

### 最優先

- [x] ゲーム画面全体を固定比率ステージとして扱う
- [x] 基準解像度を `1920x1080` に固定する
- [x] `.appViewport` を作成する
- [x] `.gameStage` を作成する
- [x] ブラウザサイズに応じて `scale = min(windowWidth / 1920, windowHeight / 1080)` を計算する
- [x] ステージ全体を中央表示する
- [x] ステージ外の余白は背景グラデーションで埋める
- [x] React UIとPixiJS Canvasを同じ `gameStage` 内に配置する
- [x] GameCanvas内部座標は固定ステージ座標を基準にする
- [x] Corner Hit判定をブラウザサイズではなく固定ステージ座標基準にする
- [x] ブラウザリサイズ時にscaleを再計算する
- [x] 1280x720 / 1366x768 / 1920x1080 / 2560x1440 / 縦長画面で崩れを確認する

---

## Phase 2: MVPコア

### ゲームの核

- [x] 画面中央に美少女アイコンを1体表示する
- [x] アイコンが斜め方向に自動移動する
- [x] 壁に当たったら反射する
- [x] 壁ヒットで `Memory` を獲得する
- [x] 四隅付近で反射したら `Corner Hit` として扱う
- [x] Corner Hitで通常より大きなMemoryを獲得する
- [x] Corner Hit時に簡単な演出を出す
- [ ] 上部ResourceBarに以下を表示する
  - [x] Memory
  - [x] Memory/sec
  - [x] Corner Hit回数
  - [ ] 現在Stage
  - [ ] Stage進捗

### アップグレード

- [x] `Bounce Boost` を実装する
  - [x] 壁ヒット報酬アップ
- [x] `Speed Tune` を実装する
  - [x] 速度アップ
  - [x] ただし見た目速度に上限を設ける
- [x] `Corner Sensor` を実装する
  - [x] Corner Hit報酬アップ
  - [ ] Corner Hit判定補助
- [x] `UpgradePanel.tsx` を作成する
- [x] Memory不足時は購入ボタンをdisabledにする
- [x] Lvごとにコストが上昇するようにする

### セーブ

- [x] LocalStorage保存を実装する
- [x] 10秒ごとの自動保存を実装する
- [x] 起動時にセーブデータをロードする
- [x] セーブデータ破損時は初期化する
- [x] セーブデータにバージョンを持たせる
- [x] 将来のマイグレーションに備える
- [x] 手動セーブボタンを追加する
- [x] セーブ中 / 完了 / 失敗の表示を追加する

---

## Phase 3: 画面酔い対策

- [x] 見た目上の速度に上限を設定する
- [x] `Speed Tune` は一定Lv以降、速度ではなく内部効率アップに変換する
- [x] `visualSpeedMultiplier` と `internalSpeedBonus` を分ける
- [x] `Motion Intensity` 設定を追加する
  - [x] Low
  - [x] Medium
  - [x] High
- [x] Motion Low時は以下を適用する
  - [x] 速度上限を低めにする
  - [x] 残像を無効化する
  - [x] 画面揺れを無効化する
  - [x] 強いフラッシュを無効化する
  - [x] パーティクル数を減らす
- [x] 背景は基本固定にする
- [x] 常時背景スクロールはしない
- [x] Corner Hit演出は淡い色中心にする

---

## Phase 4: タイトル画面 / 設定画面

### タイトル画面

- [x] `TitleScreen.tsx` を作成する
- [x] ゲーム起動時はタイトル画面を表示する
- [x] タイトルロゴを表示する
- [x] サブコピーを表示する
- [x] 以下のボタンを配置する
  - [x] Start
  - [x] Continue
  - [x] Settings
  - [x] Gallery
  - [x] Credits
  - [x] Quit
- [x] セーブデータがない場合、Continueをdisabledにする
- [x] Startで新規ゲームを開始する
- [x] Continueで保存データをロードしてゲーム画面へ遷移する
- [x] QuitはWeb/Electron未対応時は「Electron版で対応予定」と表示する
- [x] タイトル背景はまずCSSグラデーションで実装する

### 設定画面

- [x] `SettingsModal.tsx` を作成する
- [x] BGM音量を設定できるようにする
- [x] SE音量を設定できるようにする
- [x] 言語を切り替えられるようにする
  - [x] `ja`
  - [x] `en`
- [x] Effects Qualityを設定できるようにする
  - [x] Low
  - [x] Medium
  - [x] High
- [x] Motion Intensityを設定できるようにする
  - [x] Low
  - [x] Medium
  - [x] High
- [x] Auto Save ON/OFFを設定できるようにする
- [x] セーブデータ初期化ボタンを追加する
- [x] 初期化前に確認ダイアログを出す
- [x] 設定をLocalStorageに保存する
- [x] ゲーム画面からも設定を開けるようにする

---

## Phase 5: 演出強化

### 基本エフェクトシステム

- [x] `src/effects/` を作成する
- [x] `src/effects/effectTypes.ts` を作成する
- [x] `src/effects/effectManager.ts` を作成する
- [ ] `src/effects/particleFactory.ts` を作成する
- [x] `src/effects/floatingText.ts` を作成する
- [x] `src/effects/screenFlash.ts` を作成する
- [x] `src/effects/ringEffect.ts` を作成する

### 素材なしで作る演出

- [ ] 壁ヒット時の小さい `+Memory` 表示
- [x] Corner Hit時の `CORNER HIT!` 表示
- [x] 光るリング
- [x] 星・ハート風パーティクル
- [x] 淡い画面フラッシュ
- [ ] Jackpot用の大きい文字演出
- [ ] Fever突入演出
- [x] Motion Low時は演出を控えめにする

### パチンコ風期待演出

- [ ] Near Corner演出を追加する
- [ ] Lucky Corner抽選を追加する
- [ ] Jackpot Corner抽選を追加する
- [ ] Jackpot Gaugeを追加する
- [ ] Fever Modeを追加する
- [ ] Fever中は演出と報酬を強化する
- [ ] 報酬ランクごとに演出を変える
  - [ ] Normal
  - [ ] Lucky
  - [ ] Super
  - [ ] Jackpot

### 音

- [ ] 壁ヒットSEを追加する
- [x] Corner Hit SEを追加する
- [ ] Lucky Corner SEを追加する
- [ ] Jackpot SEを追加する
- [ ] Fever突入ジングルを追加する
- [ ] アップグレード購入SEを追加する
- [ ] 背景解放SEを追加する

---

## Phase 6: Muse Tap

### 能動操作

- [x] キャラアイコンをクリック / タップ可能にする
- [x] タップ時にMuse Tapを発動する
- [x] Muse Tap中、対象キャラが一時加速する
- [x] Muse Tap発動時、進行方向を少し変更する
- [x] Muse Tap発動時、キャラボイスまたは字幕を再生する
- [x] Muse Tap発動時、エフェクトを表示する
- [x] Muse Tapにはクールタイムを設定する
- [x] 効果時間は初期値3秒にする
- [x] クールタイムは初期値8秒にする
- [x] Boost中のCorner Hit報酬を増加させる
- [x] Cloneはタップ不可にする
- [x] `MusePanel.tsx` にMuse Tap状態を表示する
  - [x] Ready
  - [x] Active
  - [x] Cooldown

---

## Phase 7: ステージ進行

- [x] `src/data/stages.ts` を作成する
- [x] ステージごとのCorner Hit目標を設定する
- [x] `stageCornerHits` を管理する
- [x] `totalCornerHits` を管理する
- [x] `StagePanel.tsx` を作成する
- [x] 目標達成でステージクリアにする
- [x] ステージクリア演出を表示する
- [x] 次ステージを解放する
- [x] ステージごとに背景報酬を設定する

### 初期ステージ案

- [x] Stage 1: Corner Hit 100回
- [x] Stage 2: Corner Hit 300回
- [x] Stage 3: Corner Hit 500回

---

## Phase 8: 背景解放 / Gallery

- [x] `src/data/backgrounds.ts` を作成する
- [x] 背景ID / 名前 / 説明 / 画像パスを定義する
- [x] ステージクリアで背景を解放する
- [x] 獲得済み背景をゲーム画面に設定可能にする
- [x] `GalleryPanel.tsx` を作成する
- [x] 獲得済み背景を一覧表示する
- [x] 未獲得背景はLocked表示にする
- [x] 背景プレビューを実装する
- [x] 現在設定中の背景を表示する
- [ ] 背景パッシブ効果はv1.0では後回し

---

## Phase 9: Focus / Screensaver / Wallpaper風

### Focus Mode

- [x] 周囲UIを非表示にする
- [x] GameCanvasを大きく表示する
- [x] Minimal HUDのみ表示する
- [x] Fキーで切り替えできるようにする
- [x] Escで解除できるようにする
- [x] Focus中もゲーム進行を継続する
- [x] Focus中もMuse Tap可能にする

### Screensaver Mode

- [ ] 一定時間操作なしで自動発動する
- [ ] 設定画面でON/OFF可能にする
- [ ] 起動時間を選べるようにする
  - [ ] 30秒
  - [ ] 60秒
  - [ ] 120秒
  - [ ] OFF
- [ ] Screensaver中は周囲UIを非表示にする
- [ ] Minimal HUDを一定時間後に薄くする
- [ ] クリック / タップ / Escで解除できるようにする
- [ ] Screensaver中もゲーム進行を継続する

### 簡易Wallpaper Mode

- [x] Wallpaper Modeの共通状態管理を追加する
- [x] `wallpaperMode: off / stage / muse_overlay` をAppStoreで管理する
- [x] SettingsからWallpaper Modeを選択できるようにする
- [x] ゲーム画面にWallpaperModePanelを追加する
- [x] ResourceBarからWallpaper Stage Modeを切り替えられるようにする
- [x] EscでWallpaper Modeを解除できるようにする
- [x] Focus Modeと競合しないよう、Focus ON時はWallpaper Modeを解除する
- [x] Wallpaper Stage Mode中は通常UIをほぼ非表示にする
- [x] Wallpaper Stage Mode中はGameCanvasを大きく表示する
- [x] Wallpaper Stage Mode用Minimal HUDを追加する
- [x] Wallpaper Stage Mode中もゲーム進行を継続する
- [x] Exitボタン / EscでWallpaper Stage Modeを解除できるようにする
- [x] Wallpaper Stage Modeの実表示レイアウトを設計する
- [ ] 低負荷モードを用意する
- [ ] 30fps / 60fps切替を検討する
- [ ] BGM OFF / SE小さめ設定を用意する
- [ ] クリック透過ON/OFFは後回しでもOK
- [ ] 本格的なOS壁紙化はv1.0では後回し
- [ ] Muse Overlay Modeの実表示レイアウトを設計する

---

## Phase 10: 無料Muse Capsule

### 無料ガチャ / ドロップ

- [ ] `Muse Capsule` を実装する
- [ ] Corner Hit / Jackpot / Stage ClearでCapsuleを入手できるようにする
- [ ] 中身はコスメ限定にする
  - [ ] キャラスキン
  - [ ] アイコン枠
  - [ ] エフェクト色
  - [ ] 称号
  - [ ] 背景差分
- [ ] 排出率を表示する
- [ ] 重複時は `Skin Shard` に変換する
- [ ] Shardで好きなスキンと交換できるようにする
- [ ] Capsule演出を追加する
- [ ] 有料ガチャはv1.0では入れない
- [ ] コンプガチャ形式は絶対に避ける

---

## Phase 11: 複数キャラ / キャラスキル

### 複数キャラ

- [x] 最大3体まで同時表示できるようにする
- [x] 各キャラが個別に位置・速度・倍率を持つ
- [x] キャラ解放機能を追加する
- [x] `src/data/muses.ts` を作成する
- [x] `MusePanel.tsx` に出撃中キャラを表示する

### 初期キャラ

- [x] Lumiを追加する
  - [x] 分裂スキル
- [x] Astraを追加する
  - [x] スピードアップスキル
- [x] Noirを追加する
  - [x] 巨大化スキル
- [x] AstraをStage 2クリアで解放する
- [x] NoirをStage 4クリアで解放する
- [x] 解放時にMuseUnlockModalを表示する
- [x] MusePanelで未解放キャラの条件を表示する

### 分裂スキル

- [x] 分身を生成する
- [x] 分身は一定時間で消える
- [x] 分身はさらに分裂しない
- [x] 分身報酬は本体の50%にする
- [x] 分身生成時に本体・他キャラと重ならないようにする
- [x] `src/game/spawnUtils.ts` を作成する
- [x] `findSafeCloneSpawnPosition()` を実装する
- [x] 分身の移動方向を本体と少し変える
- [x] 分身生成時にspawnエフェクトを出す

---

## Phase 12: Reboot / スキルツリー

### Reboot

- [x] Reboot条件を設定する
- [x] Reboot確認画面を作成する
- [x] Memory / 通常強化をリセットする
- [x] Reboot時に `Fragment` を獲得する
- [x] Reboot回数を保存する
- [x] Reboot後も解放済み背景は維持する
- [ ] スキン実装後はReboot後も解放済みスキンを維持する

### スキルツリー

- [x] `src/data/skillTree.ts` を作成する
- [x] Bounce Treeを作成する
- [x] Corner Treeを作成する
- [x] Muse Treeを作成する
- [x] `SkillTreePanel.tsx` を作成する
- [x] Fragment消費で恒久強化を解放する
- [x] 前提スキルを設定する
- [x] Lv管理を実装する
- [x] セーブ/ロードに対応する
- [x] 見た目速度を無限に上げるスキルは作らない

---

## Phase 13: 継続プレイ / 品質基盤

### Idle継続体験

- [x] オフライン報酬を実装する
- [x] 最終保存時刻を保存する
- [x] Continue時に経過時間からMemoryを計算する
- [x] オフライン報酬の上限時間を設定する
- [x] 復帰時に獲得Memoryを表示する
- [x] `Passive Cache` の `offline_reward` 効果を反映する

### セーブの安全性

- [x] 旧バージョンのセーブデータを読み込むマイグレーションテストを追加する
- [x] 背景 / ステージ / Muse / スキルツリー / 設定を含む旧セーブ検証データを用意する
- [x] 欠落フィールドを補完してロードできることを確認する
- [x] セーブ破損時に初期化してゲームを継続できることを確認する
- [x] 手動セーブ操作またはセーブ完了表示を追加する

### 実行負荷と安定性

- [x] ブラウザタブ非表示時に描画更新を抑制する
- [x] `visibilitychange` 復帰時は停止時間をオフライン処理へ渡す
- [x] 非表示中にCorner Hitや報酬が二重計上されないようにする
- [ ] Effects Qualityに応じてパーティクル量や描画負荷を調整する
- [ ] 30fps / 60fpsの描画設定を検討する
- [x] 背景画像 / キャラアイコン欠損時のフォールバック表示を追加する
- [x] ボイス欠損時に字幕または通知へフォールバックすることを検証する

### 開発・検証支援

- [x] 開発ビルド限定のDebug Panelを作成する
- [x] Memory追加操作を用意する
- [x] Corner Hit発生操作を用意する
- [x] Stage達成 / 背景解放操作を用意する
- [x] Fragment追加 / Reboot確認操作を用意する
- [x] 各MuseスキルとMuse Tapの発動確認操作を用意する
- [x] Debug Panelに衝突 / スキル検証ステータスを表示する
- [x] Debug PanelからVegaを開発用に出撃させる操作を用意する
- [x] Debug PanelからVega Bumperを手動発火できるようにする
- [x] Debug PanelからVega Bumper衝突を手動発火できるようにする
- [x] Debug PanelからClone Cornerを手動発火できるようにする
- [x] Debug PanelからNear Cornerを手動発火できるようにする
- [ ] Debug PanelのVega Bumper / Clone Corner / Near Corner手動発火をブラウザ上で目視QAする
- [ ] Vega Bumper衝突時にCorner Hit / Stage進捗が増えないことをDebug Panelで確認する
- [ ] Clone Corner時にClone報酬倍率とStage進捗が期待通りか確認する
- [ ] Near Corner時にCorner Hit / Stage進捗が増えないことを確認する
- [ ] Debug Panelの検証ログを必要に応じて直近数件の履歴表示に拡張する

### 初回体験と操作性

- [x] 初回プレイ用の短いチュートリアルを追加する
- [x] Corner Hit / Muse Tap / Galleryの基本操作を案内する
- [x] Settingsからチュートリアルを再表示できるようにする
- [x] チュートリアル文言を日本語/英語切替に対応させる
- [x] 設定画面とGalleryをキーボードで操作できるようにする
- [x] `Enter` / `Esc` の決定・戻る操作を整理する
- [x] ボタンや音量スライダーにアクセシブルなラベルを付与する
- [x] 主要モーダルにフォーカストラップを追加する
- [x] スクリーンリーダー向け文言を日本語/英語で精査する

### 統計・蓄積表示

- [x] 統計画面を追加する
- [x] TitleScreenから統計画面を開けるようにする
- [x] Settings画面から統計画面を開けるようにする
- [x] ゲーム画面右上から統計画面を開けるようにする
- [x] 総壁ヒット数 / 総Corner Hit数を表示する
- [x] 最高到達Stage / Reboot回数を表示する
- [x] プレイ時間 / 獲得背景数を表示する
- [x] 累計獲得Memory / Near Corner回数を表示する
- [x] Jackpot回数 / Fever突入回数の表示枠を用意する
- [x] 統計をセーブ / ロード対象にする
- [x] 旧セーブデータにstatsがない場合の補完を追加する
- [ ] 統計画面をブラウザ上で目視QAする
- [ ] Steam Stats連携時に使う統計ID対応表を作成する
- [ ] 将来的に日別 / セッション別の詳細統計を検討する

---

## Phase 14: 素材制作 / 差し替え準備

### 素材共通ルール

- [x] 素材の保存場所と命名規則を整理する
  - [x] `src/assets/ui/`
  - [x] `src/assets/icons/`
  - [x] `src/assets/backgrounds/`
  - [x] `src/assets/effects/`
  - [x] `src/assets/audio/`
  - [x] `src/assets/store/`
- [x] 画像素材の推奨サイズ、形式、圧縮方針をREADMEまたは素材仕様にまとめる
- [x] Web版 / Electron版で同じ素材パスを使えるようにする
- [x] 欠損素材があってもゲームがクラッシュしないフォールバックを用意する
- [x] 素材差し替え時に `npm run build` で検出できる確認手順を用意する
- [x] ライセンス、生成元、利用範囲を記録する素材台帳を作成する

### UI素材

- [ ] タイトル画面用ロゴ素材を作成する
- [ ] Start / Continue / Settings / Gallery / Credits / Quit のボタン見た目を統一する
- [ ] ResourceBar用のMemory / Memory/sec / Corner Hit / Fragmentアイコンを作成する
- [ ] UpgradePanel用のアップグレードカード背景を作成する
- [ ] StagePanel用の進捗バー素材を作成する
- [ ] RebootPanel / SkillTreePanel用のカード・カテゴリ見出し素材を作成する
- [ ] Settings / Gallery / Credits / Debug Panel のパネル背景を統一する
- [ ] Focus Mode用のMinimal HUD素材を作成する
- [ ] ボタン hover / active / disabled 状態の見た目を整理する
- [ ] 1920x1080固定ステージで読みやすい余白・文字サイズに調整する

### キャラ / アイコン素材

- [ ] Lumi / Astra / Noir の本番アイコンを作成する
- [ ] 各Museの通常状態、Tap Boost状態、スキル発動状態の見分けを付ける
- [ ] Clone用の半透明・分身表現素材を用意する
- [ ] GalleryやMusePanelで使うキャラ小アイコンを作成する
- [ ] 将来のMuse追加に備えたアイコン仕様をまとめる
- [x] アイコン欠損時の仮表示を実装・検証する
- [ ] 画像の輪郭が背景に埋もれないよう、アウトラインまたはグロー方針を決める

### 背景素材

- [ ] `bg_default_room` の本番背景を作成する
- [x] `bg_cozy_room` の本番背景を作成する
- [x] `bg_neon_room` の本番背景を作成する
- [x] `bg_pinball_neon` の本番背景を作成する
- [ ] 各背景を1920x1080で用意する
- [ ] GameCanvas上でキャラが見えやすい明度・コントラストに調整する
- [ ] Gallery用サムネイルを作成する
- [ ] 背景解放時のプレビュー画像を整える
- [x] `bg_neon_room` にCSSの発光アニメーションレイヤーを追加する
- [x] `bg_pinball_neon` にピンボール風CSSアニメーションレイヤーを追加する
- [x] 背景欠損時のグラデーションフォールバックを用意する
- [ ] 将来の追加背景用に `backgrounds.ts` の登録ルールを整理する

### エフェクト素材

- [ ] 壁ヒット用の小さな火花 / リング素材を作成する
- [ ] Corner Hit用の強めのリング / 星 / ハート素材を作成する
- [ ] Stage Clear用の祝福エフェクト素材を作成する
- [ ] 背景解放用のアンロック演出素材を作成する
- [ ] Muse Tap用の `BOOST!` 表示素材またはスタイルを整える
- [ ] Clone Spawn用の分身発生エフェクトを整える
- [ ] Reboot用のFragment獲得演出素材を作成する
- [ ] Effects Quality Low / Medium / High で素材量を切り替えられるようにする
- [ ] 強い白フラッシュや画面揺れに頼らない演出方針を守る

### 音素材

- [ ] 壁ヒットSEを用意する
- [ ] Corner Hit SEを本番素材へ差し替える
- [ ] Muse TapボイスをLumi / Astra / Noir 各3種類ずつ用意する
- [ ] スキル発動SEをMuseごとに用意する
- [ ] Stage Clearジングルを用意する
- [ ] 背景解放SEを用意する
- [ ] Reboot実行SEを用意する
- [ ] UI決定 / キャンセル / disabled操作のSEを用意する
- [ ] BGMの仮素材または無音運用方針を決める
- [ ] 音量設定と連動しているか確認する
- [x] 音声ファイル欠損時に字幕・通知へフォールバックすることを検証する

### ストア素材

- [ ] Steam用カプセル画像を作成する
  - [ ] Header Capsule
  - [ ] Small Capsule
  - [ ] Main Capsule
  - [ ] Vertical Capsule
  - [ ] Library Capsule
- [ ] Steamページ用スクリーンショットを用意する
- [ ] Steamページ用短尺GIFまたは動画素材を検討する
- [ ] BOOTH / itch.io / DLsite向けのサムネイルを用意する
- [ ] Microsoft Store向けのストア画像サイズを調査する
- [ ] ゲームタイトルロゴとキーアートをストア共通で使えるように整理する
- [ ] ストア説明文に合わせた見せ場スクリーンショットを選定する
- [ ] 年齢レーティングや権利表記に必要な素材確認を行う

---

## Phase 15: Steam / 横展開対応

### Platform Adapter

- [ ] Steam SDKをゲーム本体に直結しない
- [ ] `platformAdapter.ts` を作成する
- [ ] `localAdapter.ts` を作成する
- [ ] `steamAdapter.ts` を作成する
- [ ] `VITE_PLATFORM` でadapterを切り替える
- [ ] Steam初期化失敗時もゲームがクラッシュしないようにする

### Steam版

- [ ] Steam実績を検討する
- [ ] Steam Statsを検討する
- [ ] Steam Cloud / Auto-Cloudを検討する
- [ ] Steamランキングはv1.0では後回し
- [ ] Steam Inventoryはv1.0では後回し
- [ ] Steamマーケットはv1.0では後回し

### 非Steam版

- [ ] ローカル実績を用意する
- [ ] ローカル記録を用意する
- [ ] ローカルセーブを用意する
- [ ] BOOTH / itch.io / DLsite / Microsoft Storeに流用できるzip構成にする

---

## v1.0ではやらない

- [ ] 有料ガチャ
- [ ] Steamマーケット
- [ ] Steamトレード
- [ ] Steam Inventory本実装
- [ ] 本格Wallpaper Engine風OS背景化
- [ ] オンラインランキング
- [ ] 独自サーバー
- [ ] 成人向け版
- [ ] 大量キャラ
- [ ] 大量スキン販売
- [ ] Live2D
- [ ] フルボイス
- [ ] デイリーイベント運用
- [ ] スマホ版同時開発

---

## v1.1以降で検討

- [ ] DLC Skin Pack Vol.1
- [ ] BOOTH応援版
- [ ] DLsite版
- [ ] itch.io版
- [ ] Microsoft Store版
- [ ] Android版
- [ ] Steamランキング
- [ ] Rich Presence
- [ ] Steam Screenshots
- [ ] Endless Stage
- [ ] 称号追加
- [ ] 背景パッシブ効果
- [ ] Steam Inventory調査
- [ ] 本格Wallpaper Mode調査

---

## 次に対応する順番

### 完了済み

- 固定16:9ステージ対応
- MVPコア / LocalStorageセーブ
- タイトル画面 / 設定画面
- Muse Tap
- ステージクリア / 背景解放 / Gallery
- Focus Mode
- 複数キャラ / キャラ固有スキル / 安全な分身生成
- Reboot / スキルツリー

### 次に進める候補

1. `bg_default_room` の本番差し替え
2. キャラアイコン3種の本番差し替え
3. Muse Tapボイス / 壁ヒットSE / Stage Clearジングル
4. UI素材の統一
5. Effects Quality連動の負荷調整
6. 統計画面
7. ストア素材の作成
8. Screensaver Mode
9. 無料Muse Capsule / Shard交換
10. Steam / 横展開対応

## Muse Skin System

- [x] Create `src/data/skins.ts` as the skin registry.
- [x] Define `MuseSkin`, `SkinRarity`, and skin unlock method types.
- [x] Add default skins for Lumi, Astra, and Noir.
- [x] Add locked test skins for future stage, capsule, shard, and DLC flows.
- [x] Save and load `unlockedSkinIds` and `equippedSkinByMuseId`.
- [x] Migrate old saves by restoring default unlocked skins and default equipment.
- [x] Add `SkinSelectorModal` from `MusePanel`.
- [x] Block equipping locked skins or skins for locked Muses.
- [x] Reflect equipped skin palettes in `GameCanvas`.
- [ ] Add real Muse skin image assets for all registered skins.
- [ ] Add stage/capsule/shard/DLC unlock integration for non-default skins.
- [ ] Add a dev-only verification shortcut for unlocking test skins if needed.
- [ ] Add skin-specific thumbnails once final character art is ready.
