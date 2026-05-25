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
```

Electron導入後は以下を追加予定。

```bash
npm run electron:dev
npm run electron:build
```

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
