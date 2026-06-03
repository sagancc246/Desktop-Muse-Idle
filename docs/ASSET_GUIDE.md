# Desktop Muse Idle Asset Guide

この文書は、UI素材・キャラ/アイコン素材・背景素材・エフェクト素材・音素材・ストア素材を追加/差し替えする時の共通ルールです。

## 基本方針

- ゲーム実装と素材制作を分離する。
- 制作元データと管理用メモは `src/assets/` に置く。
- ゲーム実行時にURLで直接参照する素材は `public/assets/` に置く。
- `src/data/*.ts` から参照するパスは、ElectronでもWebでも動くように `./assets/...` または `/assets/...` に統一する。
- 素材を追加したら必ず `docs/ASSET_LEDGER.md` に記録する。
- ライセンス、生成元、加工履歴が不明な素材は本番採用しない。
- 欠損素材はフォールバック表示でゲーム継続できるが、リリース前には台帳上の `needs_final` / `missing` をなくす。

## フォルダ

### Source / Management

`src/assets/` は制作管理用です。PSD、作業用PNG、メモ、AI生成プロンプト、未圧縮音声など、ゲームから直接読み込まないものを置きます。

```text
src/assets/
  ui/
  icons/
  backgrounds/
  effects/
  audio/
  store/
```

### Runtime

`public/assets/` はゲームが直接参照する配布用素材です。

```text
public/assets/
  backgrounds/
  characters/
  effects/
  ui/
  voices/
  audio/
  store/
```

既存の背景は `public/assets/backgrounds/` にあります。Muse Tapの仮ボイスは `src/data/muses.ts` で `/assets/voices/...` を参照します。

## 命名規則

- 小文字の `snake_case` を使う。
- 半角英数字、`_`、`-` のみを使う。
- スペース、日本語、記号、連番だけの名前は使わない。
- ファイル名は用途が分かるようにする。
- 本番採用素材は `final` を付けず、差し替え時に台帳のステータスを更新する。
- ラフや検討版は `wip` または `draft` を付ける。

例:

```text
bg_default_room.webp
muse_lumi_icon.png
ui_button_primary.svg
fx_corner_hit_star_01.png
se_corner_hit_01.ogg
voice_lumi_tap_01.ogg
store_steam_header_capsule.png
```

## 画像仕様

### 背景

- 基準サイズ: `1920 x 1080`
- 推奨形式: `webp` または `png`
- 仮素材や軽量ベクターは `svg` 可
- GameCanvasでキャラが読めるよう、中央は明度差を強くしすぎない
- UIと重なる左右端/上部/下部には重要な絵柄を置きすぎない
- Gallery用サムネイルは同じ画像から生成してよい

### キャラ / アイコン

- 推奨サイズ: `512 x 512` 以上の正方形
- 推奨形式: 透過 `png` または `webp`
- 実画面では円形/小サイズで見えるため、輪郭とシルエットを優先する
- 背景に埋もれないよう、アウトラインまたはグロー前提で作る
- Clone用は本体素材を流用し、半透明・色味変更で区別してよい

### UI

- 推奨形式: `svg`、`png`、`webp`
- ボタン、パネル、アイコンは通常/hover/active/disabledの状態差を想定する
- 1920x1080固定ステージで読みやすい太さを優先する
- 文字入り画像は避け、可能な限りテキストはReact側で表示する

### エフェクト

- 推奨形式: 透過 `png`、`webp`、または小さなスプライトシート
- 強い白フラッシュや大きな画面揺れに頼らない
- Effects Quality `low` でも見栄えが破綻しない小素材を用意する
- ループ素材は開始/終了フレームが自然につながるようにする

### ストア素材

- Steam / BOOTH / itch.io / DLsite / Microsoft Store の最終サイズは提出前に各公式仕様を確認する。
- `src/assets/store/` に制作元、`public/assets/store/` に確認用の書き出しを置く。
- 共通キーアート、ロゴなし版、ロゴあり版、スクリーンショット候補を分けて管理する。

## 音仕様

### SE / Voice

- 推奨形式: `ogg`
- 編集元は `wav` で保管してよい
- 音量差が大きくなりすぎないよう、SEは短く軽めにする
- Muse Tapボイスは実ファイルが欠損しても字幕が出るが、台帳上では `missing` として扱う
- クリックやCorner Hitのように頻繁に鳴る音は耳に刺さらない帯域にする

### BGM

- 初回リリースでBGMを入れる場合は、ループ可否と利用範囲を台帳へ必ず記録する。
- 作業用Idleゲームなので、長時間聞いて疲れにくい音量と密度を優先する。

## ライセンス記録

台帳には最低限以下を記録します。

- `asset_id`
- `category`
- `status`
- `source_path`
- `runtime_path`
- `license`
- `source_or_author`
- `usage`
- `notes`

AI生成素材の場合は、生成ツール名、生成日、プロンプト保存場所、追加加工の有無を `notes` に書きます。

購入素材の場合は、購入サイト、商品名、購入日、ライセンスURLまたはライセンス種別を記録します。

## 差し替え手順

1. 素材を `src/assets/<category>/` に保存する。
2. 必要なら配布用に圧縮/変換し、`public/assets/<category>/` に書き出す。
3. `src/data/backgrounds.ts` や `src/data/muses.ts` の参照先を更新する。
4. `docs/ASSET_LEDGER.md` のステータス、パス、ライセンスを更新する。
5. `npm run build` を実行する。
6. ゲーム画面、Gallery、Settings、Focus Modeなど、素材が出る画面で確認する。

## ステータス

| status | 意味 |
|---|---|
| `placeholder` | 仮素材。ゲーム確認用。 |
| `needs_final` | 本番素材が必要。 |
| `in_progress` | 制作中。 |
| `review` | 反映済み。見た目/音量/権利確認待ち。 |
| `final` | 本番採用可能。 |
| `missing` | 参照だけあるがファイル未配置。 |
| `rejected` | 不採用。 |

