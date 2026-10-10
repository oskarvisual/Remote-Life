---
name: remote-life-standards
description: >-
  Enforces Remote Life project standards when adding features, UI text, Phaser sprites,
  activities, or simulation systems. Use this skill whenever creating or modifying any
  in-game text, notifications, HUD labels, Phaser scene elements, or simulation logic.
---

# Remote Life Project Standards & Workflow

Follow these mandatory rules whenever adding or modifying features in **Remote Life**:

## 1. 100% English In-Game Text & Codebase Rule

- **All player-facing text MUST be in English**:
  - HUD labels, badges, and control hints (`src/ui/HUD.ts`).
  - Toast notifications (`notify` events across systems and scenes).
  - Phaser floating prompts, status labels, baby demand tags, and placeholder labels (`src/game/scenes/ApartmentScene.ts`).
  - Computer OS apps, emails, tasks, meetings, market items, and dialogs (`src/ui/Computer.ts`, `src/game/config/content.ts`).
- **All code identifiers and code comments MUST be in English**:
  - Variable names, method names, types, interfaces, and inline/JSDoc comments must be written in English.
  - Note: You may still converse with the user in their preferred language (e.g., Spanish) in chat responses, but **never** put non-English text inside the game UI or source code.

## 2. Headless Simulation vs. Presentation Separation

- Keep `src/game/core/`, `src/game/systems/`, and `src/game/activities/` strictly free of Phaser or DOM imports so the simulation remains deterministic and unit-testable in Vitest (`tests/`).
- All tunable rates, durations, and thresholds belong in `src/game/config/balance.ts`.

## 3. Phaser Scene Layering & Popup Isolation

- **Depth Layering in `ApartmentScene.ts`**:
  - `0`: Apartment background (`bg-hard`, `bg-medium`, `bg-easy`).
  - `2`: Wall-mounted furniture (`bed`, `desk`, `crib` back/mattress, missing-asset placeholders).
  - `3`: Seated player at desk (`char-typing-north`) and Baby inside crib (`babySprite` behind crib bars).
  - `4`: Foreground furniture (`chair` rear view, `crib` front bars).
  - `5`: Furniture floor labels.
  - `6–7`: Player in bed/shower/toilet, Baby sleeping on bed.
  - `9–10`: Loose crawling baby, hazard effects, walking/idle player.
  - `11`: Character effects (stink waves, flies, shower drops) and `ambientOverlay` (Day/Afternoon/Night tint).
  - `12–15`: Floating UI prompts (`YOU`, `[E]`, baby demands, urgency alerts) so they remain crisp and readable at night.
- **Popup Isolation**:
  - Ambient lighting overlays and filters must stay inside `#game` / Phaser canvas and **never** tint DOM modals (`#computer`, `#start-menu`, `#game-over-modal`, or future popups).

## 4. Verification Checklist

Before finishing any task or pushing to Git:

1. Search `src/` for any accidental Spanish strings or comments.
2. Run `npm run format && npm run check` (`tsc --noEmit`, `eslint`, `prettier`, and `vitest run`) and ensure 0 errors.
