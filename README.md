# Remote Life

Playable pixel-art browser prototype for surviving remote work, family demands, money, and stress.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`).

On first launch, choose **Easy**, **Medium**, or **Hard**. This selection is stored in browser LocalStorage; clear site data to choose again.

## Controls

- **A / D** or **Arrow keys** — walk around the apartment.
- **E** — interact with the bed, computer, or crib.
- At the computer, use the mouse to do tasks, read email, open Calendar, join a meeting, and answer its question.
- Close the desktop to return to the apartment and care for the baby.

## Prototype flow

The game begins at 09:00. A task arrives after a few seconds, then a meeting invitation. The meeting becomes available at 09:42 and the baby begins crying shortly after. Time never pauses: leaving the computer lowers meeting attention, while ignoring the baby increases stress.

Rules live in modular systems under `src/game/systems`; visual apartment code remains in the Phaser scene, while the simulated computer is standard HTML/CSS in `src/ui`. Balance constants, including the 10-minute in-game day, are in `src/game/config/balance.js`.
