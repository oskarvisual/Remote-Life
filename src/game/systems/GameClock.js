import { BALANCE } from '../config/balance.js'; import { emit } from '../core/EventBus.js';
export class GameClock {
  constructor(state) { this.state = state; this.running = true; }
  tick(delta) { if (!this.running) return; const real = delta / 1000; this.state.elapsed += real; this.state.seconds += real * (86400 / BALANCE.daySeconds); if (this.state.seconds >= 86400) { this.state.seconds -= 86400; this.state.day++; emit('day:changed'); } emit('clock:tick'); }
}
