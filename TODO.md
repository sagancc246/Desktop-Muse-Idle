# Desktop Muse Idle TODO

## 運用ルール

- 1回の作業で1機能だけ進める
- Codexに依頼する前に対象ファイルを指定する
- 実装後は必ず `npm run dev` で確認する
- 変更が問題なければGitでコミットする
- 見た目の調整はMVP後にまとめて行う
- まずはSteamリリース実績を最優先する

---

# Phase 0: プロジェクト準備

## 0-1. 環境構築

- [ ] Node.jsをインストールする
- [ ] GitHubリポジトリを作成する
- [ ] Vite + React + TypeScriptプロジェクトを作成する
- [ ] PixiJSを導入する
- [ ] Zustandを導入する
- [ ] ESLint/Prettierを必要に応じて導入する
- [ ] `npm run dev` で起動確認する
- [ ] README.mdを配置する
- [ ] DEVELOPMENT_SPEC.mdを配置する
- [ ] TODO.mdを配置する

## 0-2. 初期フォルダ作成

- [ ] `src/components` を作成する
- [ ] `src/game` を作成する
- [ ] `src/store` を作成する
- [ ] `src/data` を作成する
- [ ] `src/systems` を作成する
- [ ] `src/types` を作成する
- [ ] `src/assets` を作成する
- [ ] `src/styles` を作成する

## 0-3. 初期レイアウト

- [ ] `App.tsx` に基本レイアウトを作る
- [ ] 上部 `ResourceBar` の仮表示を作る
- [ ] 左 `UpgradePanel` の仮表示を作る
- [ ] 中央 `GameCanvas` の仮表示を作る
- [ ] 右 `MusePanel` の仮表示を作る
- [ ] 下 `DialoguePanel` の仮表示を作る

完了条件:

- [ ] 1920x1080想定の1画面UIが表示される
- [ ] 中央にゲームエリアがある
- [ ] レイアウトが大きく崩れていない

---

# Phase 1: MVPコアゲーム

## 1-1. ゲーム状態管理

- [ ] `src/store/useGameStore.ts` を作成する
- [ ] `memory` を管理する
- [ ] `memoryPerSecond` を管理する
- [ ] `totalBounces` を管理する
- [ ] `totalCornerHits` を管理する
- [ ] `addMemory()` を作成する
- [ ] `incrementBounce()` を作成する
- [ ] `incrementCornerHit()` を作成する

完了条件:

- [ ] UI上にMemoryが表示される
- [ ] テスト的にMemoryを増やせる

## 1-2. PixiJSゲームエリア

- [ ] `GameCanvas.tsx` を作成する
- [ ] PixiJS Applicationを初期化する
- [ ] 中央のゲームエリアにCanvasを表示する
- [ ] リサイズ時に表示が破綻しないようにする
- [ ] 仮背景色を設定する

完了条件:

- [ ] Canvasが表示される
- [ ] コンソールエラーが出ない

## 1-3. バウンド物理

- [ ] `src/game/bouncePhysics.ts` を作成する
- [ ] アイコンの座標、速度を管理する
- [ ] 毎フレーム座標を更新する
- [ ] 左右端で反射する
- [ ] 上下端で反射する
- [ ] 壁ヒット時にイベントを返す

完了条件:

- [ ] アイコンが斜めに動く
- [ ] 画面端で反射する
- [ ] 壁を突き抜けない

## 1-4. 壁ヒット報酬

- [ ] 壁ヒット時にMemoryを加算する
- [ ] `baseMemoryPerBounce` を `src/data/balance.ts` に定義する
- [ ] 壁ヒット回数を加算する
- [ ] `ResourceBar` に壁ヒット回数を表示する

完了条件:

- [ ] 壁に当たるたびMemoryが増える
- [ ] 壁ヒット回数が増える

## 1-5. Corner Hit判定

- [ ] `src/game/cornerHit.ts` を作成する
- [ ] 四隅から一定距離以内か判定する
- [ ] `cornerThreshold` を `balance.ts` に定義する
- [ ] Corner Hit時に大きなMemoryを加算する
- [ ] Corner Hit回数を加算する

完了条件:

- [ ] 四隅付近でCorner Hitになる
- [ ] Corner Hit時だけ大きな報酬が入る
- [ ] Corner Hit回数が増える

## 1-6. アップグレード3種

- [ ] `src/data/upgrades.ts` を作成する
- [ ] Bounce Boostを定義する
- [ ] Speed Tuneを定義する
- [ ] Corner Sensorを定義する
- [ ] `UpgradePanel.tsx` に購入ボタンを表示する
- [ ] コスト計算を実装する
- [ ] Memoryが足りない場合は購入不可にする
- [ ] 購入後にLvと効果を反映する

完了条件:

- [ ] 3種類のアップグレードを購入できる
- [ ] 購入するとMemoryが減る
- [ ] 効果が実際に反映される

## 1-7. 自動セーブ

- [ ] `src/systems/saveSystem.ts` を作成する
- [ ] SaveData型を定義する
- [ ] 10秒ごとにLocalStorageへ保存する
- [ ] 起動時にLocalStorageから読み込む
- [ ] セーブデータがない場合は初期データを使う
- [ ] セーブデータのバージョンを持たせる

完了条件:

- [ ] 再読み込み後もMemoryが残る
- [ ] アップグレードLvが残る
- [ ] セーブデータ破損時にクラッシュしない

---

# Phase 2: 見た目・演出強化

## 2-1. 仮美少女アイコン

- [ ] 仮の美少女アイコン画像を配置する
- [ ] 画像をPixiJS Spriteとして表示する
- [ ] 画像サイズを統一する
- [ ] アイコンに軽い影または縁取りを付ける

## 2-2. 報酬ポップアップ

- [ ] 壁ヒット時に小さい `+Memory` 表示を出す
- [ ] Corner Hit時に大きい `CORNER HIT!` 表示を出す
- [ ] ポップアップは一定時間で消える
- [ ] 数字の表示位置をランダムに少しズラす

## 2-3. Corner Hit演出

- [ ] Corner Hit時にパーティクルを出す
- [ ] Corner Hit時に画面を軽くフラッシュさせる
- [ ] Corner Hit時に専用SEを鳴らす
- [ ] 演出がうるさすぎないように調整する

## 2-4. 音

- [ ] BGMを仮実装する
- [ ] 壁ヒットSEを入れる
- [ ] Corner Hit SEを入れる
- [ ] アップグレード購入SEを入れる
- [ ] 音量設定の下準備をする

## 2-5. UI見た目調整

- [ ] パステル系の配色を決める
- [ ] ResourceBarを見やすくする
- [ ] UpgradePanelを見やすくする
- [ ] MusePanelを見やすくする
- [ ] DialoguePanelを見やすくする
- [ ] 1920x1080スクショとして映えるようにする

---

# Phase 3: 美少女Idle化

## 3-1. キャラデータ

- [ ] `src/data/muses.ts` を作成する
- [ ] Lumiを定義する
- [ ] Astraを定義する
- [ ] Noirを定義する
- [ ] キャラごとの性能差を定義する
- [ ] MusePanelにキャラ一覧を表示する

## 3-2. キャラ解放

- [ ] 初期キャラはLumiのみ解放済みにする
- [ ] Memory条件でAstraを解放する
- [ ] Reboot条件でNoirを解放する
- [ ] 解放時に通知を出す

## 3-3. 好感度

- [ ] キャラごとのAffectionを管理する
- [ ] Corner Hit時に好感度が少し増える
- [ ] 一定値で好感度Lvが上がる
- [ ] MusePanelにハート表示を出す

## 3-4. 会話

- [ ] `src/data/dialogues.ts` を作成する
- [ ] Lumiの会話10本を追加する
- [ ] Astraの会話10本を追加する
- [ ] Noirの会話10本を追加する
- [ ] 条件達成で会話を解放する
- [ ] 下部に短文会話を表示する
- [ ] 解放済み会話ログを簡易表示する

## 3-5. 背景

- [ ] `src/data/backgrounds.ts` を作成する
- [ ] 初期背景を実装する
- [ ] Cozy Room背景を実装する
- [ ] Neon Muse Room背景を実装する
- [ ] 背景解放条件を設定する
- [ ] 背景切替UIを作る

---

# Phase 4: Idle長期プレイ要素

## 4-1. Memory/sec

- [ ] 現在のMemory/secを計算する
- [ ] ResourceBarに表示する
- [ ] アップグレード効果を反映する
- [ ] キャラ効果を反映する

## 4-2. オフライン報酬

- [ ] 最終保存時刻を保存する
- [ ] 起動時に経過時間を計算する
- [ ] 最大8時間まで報酬を計算する
- [ ] 復帰ポップアップを表示する
- [ ] Background Cacheアップグレードで倍率を上げる

## 4-3. Reboot

- [ ] Reboot条件を設定する
- [ ] Reboot確認画面を作る
- [ ] Reboot時にMemoryと通常強化をリセットする
- [ ] Fragmentを獲得する
- [ ] Fragmentで恒久強化を購入できるようにする
- [ ] Reboot回数を記録する

---

# Phase 5: 商品化

## 5-1. 設定画面

- [ ] BGM音量を調整できる
- [ ] SE音量を調整できる
- [ ] 言語を切り替えられる
- [ ] エフェクト品質を切り替えられる
- [ ] セーブデータを初期化できる

## 5-2. ローカライズ

- [ ] UI文言を日本語/英語で管理する
- [ ] 会話文を日本語/英語で管理する
- [ ] 言語切替を実装する
- [ ] 英語表示時にUIが崩れないようにする

## 5-3. 実績

- [ ] `src/data/achievements.ts` を作成する
- [ ] ゲーム内実績を20個作る
- [ ] 条件達成時に解除する
- [ ] 実績通知を表示する
- [ ] 実績一覧画面を作る

## 5-4. Electron化

- [ ] Electronを導入する
- [ ] Web版をElectronで起動する
- [ ] Windowsビルドを作る
- [ ] アプリ名とアイコンを設定する
- [ ] ビルド成果物を起動確認する

## 5-5. Steam準備

- [ ] Steamworks登録を進める
- [ ] ストア説明文を作る
- [ ] スクリーンショットを6〜8枚作る
- [ ] カプセル画像を作る
- [ ] 30〜45秒のトレーラーを作る
- [ ] 価格580円で設定する
- [ ] ローンチ割引10〜15%を設定する
- [ ] Windowsビルドをアップロードする
- [ ] 審査に出す

---

# Phase 6: リリース後

## 6-1. 初動確認

- [ ] 販売本数を確認する
- [ ] 返金率を確認する
- [ ] レビュー内容を確認する
- [ ] バグ報告を確認する
- [ ] 初回パッチ方針を決める

## 6-2. BOOTH展開

- [ ] DRMフリー版zipを作る
- [ ] BOOTH商品ページを作る
- [ ] 通常版580円を設定する
- [ ] 支援版980円を設定する
- [ ] 壁紙などのおまけを用意する

## 6-3. DLsite展開

- [ ] DLsite用の作品説明を作る
- [ ] AI利用表記を確認する
- [ ] 価格660〜770円で検討する
- [ ] 審査提出する

## 6-4. 追加DLC検討

- [ ] Supporter Pack案を検討する
- [ ] 追加背景を検討する
- [ ] 追加スキンを検討する
- [ ] おまけ会話を検討する

---

# Codex依頼テンプレート

```text
目的:
【ここに1機能だけを書く】

対象ファイル:
- 【変更してよいファイル】
- 【新規作成するファイル】

要件:
- 【要件1】
- 【要件2】
- 【要件3】

禁止:
- 既存機能を壊さない
- 無関係な大規模リファクタをしない
- 仕様外の機能を勝手に追加しない

完了条件:
- npm run dev で起動できる
- 画面上で確認できる
- 変更内容を簡潔に説明できる
```

---

# 最初のCodex依頼

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
