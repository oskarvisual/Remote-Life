import { emit } from './EventBus.js';
import { BALANCE } from '../config/balance.js';
export class GameState {
  constructor(difficulty = 'medium') {
    const settings = BALANCE.difficulties[difficulty] || BALANCE.difficulties.medium;
    this.difficulty = difficulty;
    this.day = 1; this.seconds = 9 * 60 * 60; this.elapsed = 0;
    this.player = { money: settings.money, stress: settings.stress, energy: settings.energy, hunger: 74, reputation: 72, mode: 'idle' };
    this.tasks = []; this.emails = []; this.meeting = null;
    this.baby = { needs: 92, crying: false, critical: false };
  }
  adjust(key, amount) { this.player[key] = Math.max(0, Math.min(100, this.player[key] + amount)); emit('state:changed'); }
  timeLabel() { const h = Math.floor(this.seconds / 3600) % 24; const m = Math.floor(this.seconds / 60) % 60; return `DAY ${this.day} · ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
}
