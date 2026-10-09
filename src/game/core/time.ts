export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
export const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

/** Converts game minutes into game seconds. */
export const minutes = (value: number): number => value * SECONDS_PER_MINUTE;

/** Parses a "HH:MM" string into seconds since midnight. */
export function parseClock(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid clock time "${value}", expected HH:MM`);
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) throw new Error(`Clock time out of range: "${value}"`);
  return hours * SECONDS_PER_HOUR + mins * SECONDS_PER_MINUTE;
}

/** Formats seconds since midnight as "HH:MM". */
export function formatClock(secondsOfDay: number): string {
  const normalized =
    ((Math.floor(secondsOfDay) % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;
  const h = Math.floor(normalized / SECONDS_PER_HOUR);
  const m = Math.floor((normalized % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Formats a game-time duration as "1h 05m" or "45m". */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds / SECONDS_PER_MINUTE));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/** True when `secondsOfDay` is within [from, to) — supports windows that cross midnight. */
export function isWithinWindow(secondsOfDay: number, from: number, to: number): boolean {
  return from <= to
    ? secondsOfDay >= from && secondsOfDay < to
    : secondsOfDay >= from || secondsOfDay < to;
}
