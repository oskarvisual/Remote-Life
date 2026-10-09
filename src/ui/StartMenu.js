import { BALANCE } from '../game/config/balance.js';
const SAVE_KEY = 'remote-life-profile';
export const loadProfile = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } };
export class StartMenu {
  constructor(onStart) { this.el = document.querySelector('#start-menu'); this.onStart = onStart; }
  show() {
    this.el.hidden = false;
    this.el.innerHTML = `<div class="start-card"><p class="eyebrow">REMOTE LIFE // NEW GAME</p><h1>SURVIVE<br>THE WIFI.</h1><p>Choose the pressure level for your first apartment.</p><div class="difficulty-list">${Object.entries(BALANCE.difficulties).map(([id, value]) => `<button data-difficulty="${id}"><b>${value.label}</b><small>${value.description}</small></button>`).join('')}</div><p class="start-foot">The choice is saved in this browser.</p></div>`;
    this.el.querySelectorAll('[data-difficulty]').forEach(button => button.addEventListener('click', () => { const difficulty = button.dataset.difficulty; localStorage.setItem(SAVE_KEY, JSON.stringify({ difficulty })); this.el.hidden = true; this.onStart(difficulty); }));
  }
}
