# Desktop Muse Idle Asset Ledger

素材を追加・差し替えしたら、この台帳を更新します。

| asset_id | category | status | source_path | runtime_path | license | source_or_author | usage | notes |
|---|---|---|---|---|---|---|---|---|
| bg_default_room | background | placeholder | src/assets/backgrounds/ | public/assets/backgrounds/bg_default_room.svg | project-original-placeholder | Codex generated placeholder | Stage 1 reward / GameCanvas / Gallery | Replace with final 1920x1080 background before release. |
| bg_cozy_room | background | review | src/assets/backgrounds/bg_cozy_room.png | public/assets/backgrounds/bg_cozy_room.webp | user-provided | User-provided image | Stage 2 reward / GameCanvas / Gallery | Warm room WebP runtime asset added. Confirm final rights/license before release. |
| bg_neon_room | background | review | src/assets/backgrounds/bg_neon_room.png | public/assets/backgrounds/bg_neon_room.webp | user-provided | User-provided image | Stage 3 reward / GameCanvas / Gallery / NeonBackground | Neon sci-fi room runtime asset updated. Confirm final rights/license before release. |
| bg_pinball_neon | background | review | src/assets/backgrounds/bg_pinball_neon.png | public/assets/backgrounds/bg_pinball_neon.webp | user-provided | User-provided image | Stage 3 unlock / GameCanvas / Gallery / PinballBackground | CSS-only animation layers added. Confirm final rights/license before release. |
| muse_lumi_icon | character_icon | needs_final | src/assets/icons/muse_lumi_icon.png | public/assets/characters/muse_lumi_icon.png | TBD | TBD | Lumi in GameCanvas / MusePanel | Current game uses procedural Pixi drawing and `lumi-orchid` palette. |
| muse_astra_icon | character_icon | needs_final | src/assets/icons/muse_astra_icon.png | public/assets/characters/muse_astra_icon.png | TBD | TBD | Astra in GameCanvas / MusePanel | Current game uses procedural Pixi drawing and `astra-cyan` palette. |
| muse_noir_icon | character_icon | needs_final | src/assets/icons/muse_noir_icon.png | public/assets/characters/muse_noir_icon.png | TBD | TBD | Noir in GameCanvas / MusePanel | Current game uses procedural Pixi drawing and `noir-rose` palette. |
| voice_lumi_tap_01 | voice | missing | src/assets/audio/voice_lumi_tap_01.wav | public/assets/voices/tap_lumi_01.ogg | TBD | TBD | Lumi Muse Tap | Subtitle fallback exists. |
| voice_lumi_tap_02 | voice | missing | src/assets/audio/voice_lumi_tap_02.wav | public/assets/voices/tap_lumi_02.ogg | TBD | TBD | Lumi Muse Tap | Subtitle fallback exists. |
| voice_lumi_tap_03 | voice | missing | src/assets/audio/voice_lumi_tap_03.wav | public/assets/voices/tap_lumi_03.ogg | TBD | TBD | Lumi Muse Tap | Subtitle fallback exists. |
| voice_astra_tap_01 | voice | missing | src/assets/audio/voice_astra_tap_01.wav | public/assets/voices/tap_astra_01.ogg | TBD | TBD | Astra Muse Tap | Subtitle fallback exists. |
| voice_astra_tap_02 | voice | missing | src/assets/audio/voice_astra_tap_02.wav | public/assets/voices/tap_astra_02.ogg | TBD | TBD | Astra Muse Tap | Subtitle fallback exists. |
| voice_astra_tap_03 | voice | missing | src/assets/audio/voice_astra_tap_03.wav | public/assets/voices/tap_astra_03.ogg | TBD | TBD | Astra Muse Tap | Subtitle fallback exists. |
| voice_noir_tap_01 | voice | missing | src/assets/audio/voice_noir_tap_01.wav | public/assets/voices/tap_noir_01.ogg | TBD | TBD | Noir Muse Tap | Subtitle fallback exists. |
| voice_noir_tap_02 | voice | missing | src/assets/audio/voice_noir_tap_02.wav | public/assets/voices/tap_noir_02.ogg | TBD | TBD | Noir Muse Tap | Subtitle fallback exists. |
| voice_noir_tap_03 | voice | missing | src/assets/audio/voice_noir_tap_03.wav | public/assets/voices/tap_noir_03.ogg | TBD | TBD | Noir Muse Tap | Subtitle fallback exists. |
| se_corner_hit_01 | se | placeholder | src/assets/audio/se_corner_hit_01.wav | generated in audioSystem oscillator | project-original-placeholder | Codex generated procedural audio | Corner Hit SE | Replace with final OGG when audio pass begins. |
| se_wall_hit_01 | se | needs_final | src/assets/audio/se_wall_hit_01.wav | public/assets/audio/se_wall_hit_01.ogg | TBD | TBD | Wall hit SE | Not implemented yet. |
| se_stage_clear_01 | se | needs_final | src/assets/audio/se_stage_clear_01.wav | public/assets/audio/se_stage_clear_01.ogg | TBD | TBD | Stage Clear jingle | Not implemented yet. |
| ui_title_logo | ui | needs_final | src/assets/ui/ui_title_logo.svg | public/assets/ui/ui_title_logo.svg | TBD | TBD | Title screen logo | Current title is text/CSS only. |
| store_key_art | store | needs_final | src/assets/store/store_key_art.psd | public/assets/store/store_key_art.png | TBD | TBD | Store pages / capsule source | Verify each store export size before submission. |

## Update Checklist

- [ ] `asset_id` matches the data/config ID where possible.
- [ ] `source_path` points to the editable source or source folder.
- [ ] `runtime_path` points to the file used by the app or store preview.
- [ ] `license` and `source_or_author` are filled before `final`.
- [ ] `status` is not `missing` or `needs_final` for release-blocking assets.
- [ ] `notes` include AI tool/prompt reference or purchase/license details when applicable.
