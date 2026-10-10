# Remote Life — Project Rules

1. **English-Only Game Text & Code**:
   - Every piece of in-game text (HUD, notifications, Phaser prompts, labels, placeholders, dialogs, emails, tasks) and all source code comments/identifiers **must be written in English**.
   - Even when the user prompts in Spanish, keep all game UI strings and code in English (while replying to the user in Spanish in chat if requested).

2. **Simulation / View Separation**:
   - Never import `phaser` or access `document`/`window` inside `src/game/core/`, `src/game/systems/`, or `src/game/activities/`. All simulation logic must run headlessly in Vitest.
   - Store all tunable numbers in `src/game/config/balance.ts`.

3. **Visual Layering & Modal Isolation**:
   - Ambient overlays (Day / Afternoon / Night) must only affect the Phaser apartment scene (`#game`) and must never tint popup windows (`#computer`, `<dialog>`, or future modals).
   - Keep baby-in-crib sprites at `depth(3)` behind the crib sprite at `depth(4)` so the baby renders inside the crib bars.

4. **Quality Gate**:
   - Always run `npm run format && npm run check` before committing or pushing changes.
