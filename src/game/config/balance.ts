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
    startHydration: 82,
    startReputation: 72,
    startMeals: 2,
    startBladder: 15,
    startDirt: 10,
  },

  needs: {
    foodDrainPerHour: 5,
    hydrationDrainPerHour: 6.5,
    energyDrainPerHour: 2,
    starvingThreshold: 20,
    starvingStressPerHour: 6,
    thirstyThreshold: 25,
    thirstyStressPerHour: 0.5,
    exhaustedStressPerHour: 4,
    bladderGainPerHour: 6,
    bladderUrgentThreshold: 60,
    bladderCriticalThreshold: 85,
    bladderCriticalStressPerHour: 0.5,
    dirtGainPerHour: 4.5,
    dirtSmellThreshold: 40,
    dirtFliesThreshold: 75,
    dirtFliesStressPerHour: 0.5,
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
    drink: { minutes: 3, hydration: 45, energy: 3, stress: -3 },
    toilet: { minutes: 4, stress: -5 },
    shower: { minutes: 6, energy: 4, stress: -8 },
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
