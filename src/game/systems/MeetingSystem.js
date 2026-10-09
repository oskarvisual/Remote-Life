import { BALANCE } from '../config/balance.js'; import { emit } from '../core/EventBus.js';
export class MeetingSystem {
  constructor(state) { this.state=state; this.active=false; this.invited=false; this.questionShown=false; this.lastMouse=0; }
  invite() { this.invited=true; this.state.emails.unshift({subject:'Meeting invite: Sprint sync',body:'Scheduled for 09:42. Please join from your computer.',unread:true,meeting:true}); emit('meeting:invite'); }
  start() { if (!this.invited || this.active) return; this.active=true; this.state.meeting={remaining:BALANCE.meeting.duration,attention:82,startedAt:this.state.elapsed,result:null}; emit('meeting:start'); }
  mouse() { if (!this.active) return; const now=performance.now(); if(now-this.lastMouse>500){ this.state.meeting.attention=Math.min(100,this.state.meeting.attention+1.4); this.lastMouse=now; } }
  answer(correct) { if(!this.active) return; this.state.meeting.attention=Math.max(0,this.state.meeting.attention+(correct?12:-25)); emit('meeting:answer', {correct}); }
  tick(delta) { if(!this.active) return; const m=this.state.meeting, seconds=delta/1000; m.remaining-=seconds; const away=this.state.player.mode!=='computer'; m.attention-=seconds*(away?BALANCE.meeting.awayDrain:BALANCE.meeting.attentionDrain); if(!this.questionShown && BALANCE.meeting.duration-m.remaining>BALANCE.meeting.questionAt) { this.questionShown=true; emit('meeting:question'); } if(m.remaining<=0 || m.attention<=0){ const success=m.remaining<=0&&m.attention>20; this.active=false; m.result=success?'success':'failed'; this.state.adjust('reputation',success?5:-12); this.state.adjust('stress',success?-5:12); emit('meeting:end',{success}); } }
}
