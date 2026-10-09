import { emit } from '../core/EventBus.js'; import { BALANCE } from '../config/balance.js';
export class BabyNeedsSystem {
  constructor(state) { this.state = state; }
  tick(delta) { const b=this.state.baby, rate=BALANCE.difficulties[this.state.difficulty].babyDrain; b.needs=Math.max(0,b.needs-delta/1000*.16*rate); if (b.crying) { this.state.adjust('stress', delta/1000*.12); if (b.needs < 24) b.critical=true; } if (!b.crying && b.needs < 55) { b.crying=true; emit('baby:crying'); } }
  attend() { const b=this.state.baby; b.needs=94; b.crying=false; b.critical=false; this.state.adjust('energy',-7); this.state.adjust('stress',-8); emit('baby:attended'); }
}
