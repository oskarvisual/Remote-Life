export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultySettings {
  id: DifficultyId;
  label: string;
  description: string;
  money: number;
  stress: number;
  energy: number;
  /** Multiplies every task deadline (higher = more time). */
  deadlineMultiplier: number;
  /** Multiplies how fast the baby's needs drain. */
  babyDrainMultiplier: number;
}

export const DIFFICULTIES: Readonly<Record<DifficultyId, DifficultySettings>> = {
  easy: {
    id: 'easy',
    label: 'EASY',
    description: 'More energy, relaxed deadlines.',
    money: 650,
    stress: 14,
    energy: 92,
    deadlineMultiplier: 1.3,
    babyDrainMultiplier: 0.7,
  },
  medium: {
    id: 'medium',
    label: 'MEDIUM',
    description: 'The intended Remote Life experience.',
    money: 480,
    stress: 22,
    energy: 82,
    deadlineMultiplier: 1,
    babyDrainMultiplier: 1,
  },
  hard: {
    id: 'hard',
    label: 'HARD',
    description: 'Tighter deadlines. Little room for mistakes.',
    money: 320,
    stress: 36,
    energy: 70,
    deadlineMultiplier: 0.75,
    babyDrainMultiplier: 1.3,
  },
};

export const isDifficultyId = (value: unknown): value is DifficultyId =>
  typeof value === 'string' && value in DIFFICULTIES;
