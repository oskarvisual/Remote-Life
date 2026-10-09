import type { DifficultyId } from '../src/game/config/difficulties';
import { GameSession, type GameSessionOptions } from '../src/game/GameSession';
import { parseClock } from '../src/game/core/time';

export const FRAME_MS = 250;

export function createSession(
  difficulty: DifficultyId = 'medium',
  options: GameSessionOptions = {},
): GameSession {
  return new GameSession(difficulty, { seed: 42, ...options });
}

/** Advances the session in normal-sized frames until `gameMinutes` have passed. */
export function advanceMinutes(session: GameSession, gameMinutes: number): void {
  const target = session.state.now + gameMinutes * 60;
  while (session.state.now < target && session.state.isRunning) {
    const remainingReal = ((target - session.state.now) / session.clock.scale) * 1000;
    session.update(Math.min(FRAME_MS, Math.max(remainingReal, 1)));
  }
}

/** Advances until the clock reads `hhmm` on the current day. */
export function advanceTo(session: GameSession, hhmm: string): void {
  const target = session.state.dayStart() + parseClock(hhmm);
  advanceMinutes(session, (target - session.state.now) / 60);
}
