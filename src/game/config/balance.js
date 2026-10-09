export const BALANCE = {
  daySeconds: 600, startHour: 9, walkSpeed: 105,
  taskTick: 2, taskDeadline: 85, taskReward: 120,
  rent: 700, rentEveryDays: 7,
  milestones: { task: 6, invite: 18, meeting: 42, baby: 65 },
  meeting: { duration: 75, attentionDrain: 1.25, awayDrain: 2.5, questionAt: 23 },
  difficulties: {
    easy: { label: 'EASY', description: 'More energy, relaxed deadlines.', money: 650, stress: 14, energy: 92, taskDeadline: 1.3, babyDrain: .7 },
    medium: { label: 'MEDIUM', description: 'The intended Remote Life experience.', money: 480, stress: 22, energy: 82, taskDeadline: 1, babyDrain: 1 },
    hard: { label: 'HARD', description: 'Tighter deadlines. Little room for mistakes.', money: 320, stress: 36, energy: 70, taskDeadline: .75, babyDrain: 1.3 },
  },
};
