import Phaser from 'phaser';
import type { DifficultyId } from './game/config/difficulties';
import { GameSession } from './game/GameSession';
import { ApartmentScene } from './game/scenes/ApartmentScene';
import './styles/main.css';
import './styles/start-menu.css';
import { Computer } from './ui/Computer';
import { GameOverModal } from './ui/GameOverModal';
import { HUD } from './ui/HUD';
import { Notifications } from './ui/Notifications';
import { loadProfile, saveProfile, StartMenu } from './ui/StartMenu';

let phaserGame: Phaser.Game | null = null;
let currentSession: GameSession | null = null;
let currentHud: HUD | null = null;
let currentNotifications: Notifications | null = null;
let currentComputer: Computer | null = null;
let currentGameOverModal: GameOverModal | null = null;

function startGame(difficulty: DifficultyId): void {
  // 1. Cleanup previous session and UI if exists
  if (currentSession) {
    currentSession.dispose();
  }
  if (currentHud) {
    currentHud.destroy();
  }
  if (currentNotifications) {
    currentNotifications.destroy();
  }
  if (currentComputer) {
    currentComputer.destroy();
  }

  // 2. Initialize new GameSession
  currentSession = new GameSession(difficulty);

  // 3. Mount UI components
  const hudContainer = document.querySelector<HTMLElement>('#hud');
  const notificationsContainer = document.querySelector<HTMLElement>('#notifications');
  const computerContainer = document.querySelector<HTMLElement>('#computer');
  const gameOverDialog = document.querySelector<HTMLDialogElement>('#game-over-modal');

  if (hudContainer) {
    currentHud = new HUD(hudContainer, currentSession);
  }
  if (notificationsContainer) {
    currentNotifications = new Notifications(notificationsContainer, currentSession.events);
  }
  if (computerContainer) {
    currentComputer = new Computer(computerContainer, currentSession);
  }
  if (gameOverDialog) {
    currentGameOverModal = new GameOverModal(gameOverDialog, () => {
      showStartMenu();
    });
  }

  // Listen for game over
  currentSession.events.on('game:over', (outcome) => {
    currentGameOverModal?.show(outcome);
  });

  // 4. Initialize or update Phaser Game
  if (!phaserGame) {
    phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: 480,
      height: 270,
      pixelArt: true,
      backgroundColor: '#573d42',
      scene: [ApartmentScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
  }

  phaserGame.registry.set('session', currentSession);

  // If scene is already running, restart it with the new session
  if (phaserGame.scene.isActive('Apartment')) {
    phaserGame.scene.stop('Apartment');
    phaserGame.scene.start('Apartment');
  }
}

function showStartMenu(): void {
  const startMenuDialog = document.querySelector<HTMLDialogElement>('#start-menu');
  if (startMenuDialog) {
    const menu = new StartMenu(startMenuDialog, (difficulty) => {
      startGame(difficulty);
    });
    menu.show();
  }
}

function init(): void {
  window.addEventListener('keydown', (event) => {
    const keyMap: Record<string, DifficultyId> = {
      '1': 'hard',
      '2': 'medium',
      '3': 'easy',
    };
    const nextDiff = keyMap[event.key];
    if (nextDiff && currentSession?.state.player.mode !== 'computer') {
      saveProfile({ difficulty: nextDiff });
      startGame(nextDiff);
    }
  });

  const profile = loadProfile();
  if (profile?.difficulty) {
    startGame(profile.difficulty);
  } else {
    showStartMenu();
  }
}

init();
