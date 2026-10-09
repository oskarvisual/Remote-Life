import { DIFFICULTIES, type DifficultyId } from '../game/config/difficulties';

const SAVE_KEY = 'remote-life-profile';

export interface UserProfile {
  difficulty: DifficultyId;
}

export const loadProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
  } catch {
    // ignore local storage errors in private mode
  }
};

export const clearProfile = (): void => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
};

export class StartMenu {
  private readonly dialog: HTMLDialogElement;

  constructor(
    dialogElement: HTMLDialogElement,
    private readonly onSelect: (difficulty: DifficultyId) => void,
  ) {
    this.dialog = dialogElement;
  }

  show(): void {
    this.dialog.innerHTML = `
      <div class="start-card">
        <p class="eyebrow">REMOTE LIFE // NEW GAME</p>
        <h1>SURVIVE<br>THE WIFI.</h1>
        <p>Choose the pressure level for your remote work week:</p>
        <div class="difficulty-list">
          ${Object.values(DIFFICULTIES)
            .map(
              (diff) => `
            <button type="button" data-diff="${diff.id}">
              <b>${diff.label}</b>
              <small>${diff.description}</small>
            </button>
          `,
            )
            .join('')}
        </div>
        <p class="start-foot">Survive 7 days, pay $700 rent, manage stress and care for the baby.</p>
      </div>
    `;

    this.dialog.querySelectorAll<HTMLButtonElement>('[data-diff]').forEach((button) => {
      button.addEventListener('click', () => {
        const diff = button.dataset.diff as DifficultyId;
        saveProfile({ difficulty: diff });
        this.dialog.close();
        this.onSelect(diff);
      });
    });

    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  close(): void {
    if (this.dialog.open) {
      this.dialog.close();
    }
  }
}
