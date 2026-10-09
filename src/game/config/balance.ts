/**
 * Every tunable number lives here. All durations are expressed in GAME time
 * (minutes / "HH:MM") and all rates are "per game hour", so the schedule
 * shown to the player always matches the clock in the HUD.
 *
 * With `realSecondsPerDay: 600`, 1 real second = 2.4 game minutes.
 */
export const BALANCE = {
  time: {
    realSecondsPerDay: 600,
    startTime: '09:00',
    /** Largest real frame delta processed at once (protects against tab-switch spikes). */
    maxFrameMs: 250,
  },

  player: {
    walkSpeed: 105,
    startFood: 74,
    startReputation: 72,
    startMeals: 2,
  },

  needs: {
    foodDrainPerHour: 5,
    energyDrainPerHour: 2,
    starvingThreshold: 20,
    starvingStressPerHour: 6,
    exhaustedStressPerHour: 4,
  },

  tasks: {
    deadlineMinutes: 200,
    urgentDeadlineMinutes: 110,
    reward: 120,
    urgentReward: 180,
    workUnits: 5,
    urgentWorkUnits: 7,
    penalty: 8,
    urgentPenalty: 12,
    failStress: 8,
    completeReputation: 3,
    workEnergyCost: 1.8,
    workStressRelief: 0.7,
    /** Progress per click while the internet is unstable. */
    unstableProgress: 0.5,
    maxActive: 5,
    randomSpawn: { from: '09:00', to: '18:00', everyMinutes: 120, chance: 0.6 },
  },

  meeting: {
    startTime: '10:30',
    inviteLeadMinutes: 50,
    durationMinutes: 90,
    questionAfterMinutes: 30,
    startAttention: 82,
    presentDrainPerHour: 30,
    awayDrainPerHour: 62,
    unstableDrainMultiplier: 1.5,
    activityBoost: 1,
    activityCooldownMs: 1000,
    correctBonus: 12,
    wrongPenalty: 25,
    passAttention: 20,
    successReputation: 5,
    failReputation: -12,
    successStress: -5,
    failStress: 12,
  },

  baby: {
    startNeeds: 92,
    drainPerHour: 4,
    cryThreshold: 55,
    criticalThreshold: 24,
    cryingStressPerHour: 3,
    criticalStressMultiplier: 3,
    attendRestores: 94,
  },

  internet: { outageMinutes: 45 },

  economy: { rent: 700, rentEveryDays: 7, victoryDay: 8 },

  jobs: {
    offersPerDay: 3,
    reward: [90, 220] as const,
    workUnits: [4, 8] as const,
    deadlineMinutes: [180, 360] as const,
  },

  activities: {
    nap: { minutes: 10, energy: 16, stress: -6 },
    care: { minutes: 5, energy: -7, stress: -8 },
    eat: { minutes: 5, food: 35, stress: -2 },
  },

  /** Daily script. `action` must match a handler registered in GameSession. */
  schedule: [
    { id: 'first-task', at: '09:15', action: 'task' },
    { id: 'baby-hungry', at: '11:30', action: 'baby-hungry' },
    { id: 'urgent-task', at: '13:45', action: 'urgent-task' },
    { id: 'outage', at: '13:45', action: 'internet-outage' },
  ],
} as const;

export type Balance = typeof BALANCE;
