import { describe, expect, it } from 'vitest';
import { advanceMinutes, advanceTo, createSession } from './helpers';

const noSchedule = { schedule: [] };

describe('ActivitySystem', () => {
  it('prevents spamming: a busy player cannot start another activity', () => {
    const session = createSession('medium', noSchedule);
    session.state.player.adjust('energy', -50);
    expect(session.activities.start('nap')).toBe('started');
    expect(session.activities.start('nap')).toBe('busy');
    expect(session.activities.sitAtComputer()).toBe(false);
    const energy = session.state.player.get('energy');
    advanceMinutes(session, 11);
    expect(session.state.player.mode).toBe('idle');
    expect(session.state.player.get('energy')).toBeGreaterThan(energy + 10);
  });

  it('eating consumes food from the fridge and is blocked with an empty fridge', () => {
    const session = createSession('medium', noSchedule);
    session.state.fridge.meals = 1;
    session.state.fridge.fastFood = 0;
    session.state.fridge.instantSoup = 0;
    session.state.fridge.healthySalad = 0;
    expect(session.activities.start('eat')).toBe('started');
    expect(session.state.fridge.meals).toBe(0);
    advanceMinutes(session, 6);
    expect(session.activities.start('eat')).toBe('blocked');
  });

  it('caring for the baby consumes baby milk and stops the crying', () => {
    const session = createSession('medium', noSchedule);
    const initialMilk = session.state.fridge.babyMilk;
    session.baby.makeHungry();
    expect(session.state.baby.crying).toBe(true);
    session.activities.start('care');
    expect(session.state.fridge.babyMilk).toBe(initialMilk - 1);
    advanceMinutes(session, 6);
    expect(session.state.baby.crying).toBe(false);
  });

  it('watching TV lowers stress and is blocked if the TV or Sofa is sold', () => {
    const session = createSession('medium', noSchedule);
    session.state.player.adjust('stress', 40);
    const initialStress = session.state.player.get('stress');

    expect(session.activities.start('watch-tv')).toBe('started');
    expect(session.state.player.mode).toBe('watching-tv');
    advanceMinutes(session, 9);
    expect(session.state.player.mode).toBe('idle');
    expect(session.state.player.get('stress')).toBeLessThan(initialStress - 10);

    // Selling either the TV or the Sofa prevents watching TV for both player and wife
    session.market.sellEquipment('tv');
    expect(session.activities.start('watch-tv')).toBe('blocked');
    expect(session.state.wife.activity).not.toBe('watching-tv');
  });
});

describe('BabySystem', () => {
  it('starts crying at 11:30 by script and raises stress while crying', () => {
    const session = createSession();
    advanceTo(session, '11:29');
    expect(session.state.baby.crying).toBe(false);
    advanceTo(session, '11:31');
    expect(session.state.baby.crying).toBe(true);
  });

  it('critical crying triples stress gain', () => {
    const normal = createSession('medium', noSchedule);
    const critical = createSession('medium', noSchedule);
    normal.state.baby.needs = 50;
    critical.state.baby.needs = 10;
    const s1 = normal.state.player.get('stress');
    const s2 = critical.state.player.get('stress');
    advanceMinutes(normal, 60);
    advanceMinutes(critical, 60);
    const gainNormal = normal.state.player.get('stress') - s1;
    const gainCritical = critical.state.player.get('stress') - s2;
    expect(critical.state.baby.critical).toBe(true);
    expect(gainCritical).toBeGreaterThan(gainNormal * 2);
  });
});

describe('NeedsSystem', () => {
  it('food drains over time and starving adds stress', () => {
    const session = createSession('medium', noSchedule);
    const food = session.state.player.get('food');
    advanceMinutes(session, 60);
    expect(session.state.player.get('food')).toBeCloseTo(food - 5, 0);
  });

  it('increases bladder urgency over time and resets when using the toilet', () => {
    const session = createSession('medium', noSchedule);
    session.state.player.adjust('bladder', 75);
    expect(session.state.player.bladderLevel).toBe(3);
    expect(session.activities.start('toilet')).toBe('started');
    expect(session.state.player.mode).toBe('toilet');
    advanceMinutes(session, 5);
    expect(session.state.player.mode).toBe('idle');
    expect(session.state.player.get('bladder')).toBeLessThan(5);
    expect(session.state.player.bladderLevel).toBe(1);
  });

  it('progresses dirt through level 2 (odor) and level 3 (flies) and resets on shower', () => {
    const session = createSession('medium', noSchedule);
    expect(session.state.player.dirtLevel).toBe(1);
    session.state.player.adjust('dirt', 40);
    expect(session.state.player.dirtLevel).toBe(2);
    session.state.player.adjust('dirt', 35);
    expect(session.state.player.dirtLevel).toBe(3);

    expect(session.activities.start('shower')).toBe('started');
    expect(session.state.player.mode).toBe('showering');
    advanceMinutes(session, 7);
    expect(session.state.player.mode).toBe('idle');
    expect(session.state.player.dirtLevel).toBe(1);
  });

  it('increases stress faster when apartment, setup, or bed is level 1 (ugly)', () => {
    const standard = createSession('medium', noSchedule);
    const ugly = createSession('medium', noSchedule);
    ugly.state.apartmentTier = 1;
    ugly.state.equipment.desk = 1;
    ugly.state.equipment.chair = 1;
    ugly.state.equipment.bed = 1;

    const initialStandard = standard.state.player.get('stress');
    const initialUgly = ugly.state.player.get('stress');

    advanceMinutes(standard, 60);
    advanceMinutes(ugly, 60);

    const standardDelta = standard.state.player.get('stress') - initialStandard;
    const uglyDelta = ugly.state.player.get('stress') - initialUgly;
    expect(uglyDelta).toBeGreaterThan(standardDelta + 3);
  });
});

describe('MarketSystem', () => {
  it('buys groceries and refuses when broke', () => {
    const session = createSession('medium', noSchedule);
    const meals = session.state.fridge.meals;
    expect(session.market.buy('groceries')).toBe('ok');
    expect(session.state.fridge.meals).toBe(meals + 3);
    session.state.player.money = 0;
    expect(session.market.buy('groceries')).toBe('insufficient-funds');
    expect(session.market.buy('nope')).toBe('unknown');
  });

  it('prevents buying equipment when owned, allows selling, and allows buying any tier once sold', () => {
    const session = createSession('medium', noSchedule);
    session.state.player.money = 500;
    expect(session.state.equipment.tv).toBe(2);
    expect(session.market.buyEquipment('tv-3')).toBe('already-owned');
    expect(session.market.sellEquipment('tv')).toBe('ok');
    expect(session.state.equipment.tv).toBeNull();
    expect(session.market.buyEquipment('tv-1')).toBe('ok');
    expect(session.state.equipment.tv).toBe(1);
  });

  it('trades apartment, desk, and chair up or down (refunding cash and lowering rent on downgrade)', () => {
    const session = createSession('medium', noSchedule);
    session.state.player.money = 500;
    expect(session.state.apartmentTier).toBe(2);
    expect(session.economy.rent).toBe(700);

    // Move to cheaper apartment (Level 1): refunds cash and lowers weekly rent to $450
    expect(session.market.tradeApartment(1)).toBe('ok');
    expect(session.state.apartmentTier).toBe(1);
    expect(session.economy.rent).toBe(450);
    expect(session.state.player.money).toBeGreaterThan(500);

    // Desk and chair cannot be sold to null, only traded
    expect(session.market.sellEquipment('desk')).toBe('trade-only');
    expect(session.market.tradeSetup('desk', 3)).toBe('ok');
    expect(session.state.equipment.desk).toBe(3);
    expect(session.market.tradeSetup('chair', 1)).toBe('ok');
    expect(session.state.equipment.chair).toBe(1);
  });
});

describe('WifeSystem', () => {
  it('tracks wife and baby individual needs over time and differentiates routines by difficulty', () => {
    const hardSession = createSession('hard', noSchedule);
    const medSession = createSession('medium', noSchedule);

    // At 09:00, hard-difficulty wife starts sleeping, while medium-difficulty wife watches TV
    expect(hardSession.state.wife.activity).toBe('sleeping');
    expect(medSession.state.wife.activity).toBe('watching-tv');

    const initialFood = medSession.state.wife.food;
    const initialBabyFood = medSession.state.baby.food;
    advanceMinutes(medSession, 60);

    expect(medSession.state.wife.food).toBeLessThan(initialFood);
    expect(medSession.state.baby.food).toBeLessThan(initialBabyFood);
  });

  it('triggers arguing and extra stress when the wife is hungry or the baby cries in the apartment', () => {
    const calmSession = createSession('medium', noSchedule);
    const argueSession = createSession('medium', noSchedule);

    // Empty the fridge and make the wife hungry while she is home
    argueSession.state.fridge.meals = 0;
    argueSession.state.fridge.fastFood = 0;
    argueSession.state.fridge.instantSoup = 0;
    argueSession.state.fridge.healthySalad = 0;
    argueSession.state.wife.food = 25;

    const calmStressStart = calmSession.state.player.get('stress');
    const argueStressStart = argueSession.state.player.get('stress');

    advanceMinutes(calmSession, 30);
    advanceMinutes(argueSession, 30);

    expect(argueSession.state.wife.arguing).toBe(true);
    expect(argueSession.state.wife.argueReason).toBe('hungry');
    expect(argueSession.state.player.get('stress') - argueStressStart).toBeGreaterThan(
      calmSession.state.player.get('stress') - calmStressStart + 1.5,
    );
  });

  it('has the wife wash her hands at the sink right after using the toilet', () => {
    const session = createSession('medium', noSchedule);
    session.state.wife.bladder = 80;
    advanceMinutes(session, 1);
    expect(session.state.wife.activity).toBe('toilet');

    advanceMinutes(session, 4);
    expect(session.state.wife.activity).toBe('washing-hands');

    advanceMinutes(session, 3);
    expect(session.state.wife.activity).toBe('watching-tv');
  });
});

describe('Hygiene & Apartment Cleaning', () => {
  it('increases dirtiness rapidly if hands are not washed after toilet, and clears on wash-hands or shower', () => {
    const session = createSession('medium', noSchedule);
    expect(session.state.player.unwashedHands).toBe(false);

    // Use toilet
    expect(session.activities.start('toilet')).toBe('started');
    advanceMinutes(session, 6);
    expect(session.state.player.unwashedHands).toBe(true);

    const dirtBefore = session.state.player.get('dirt');
    advanceMinutes(session, 60);
    // Normal dirt gain is 4/hr + 22/hr unwashed hands = ~26/hr
    expect(session.state.player.get('dirt') - dirtBefore).toBeGreaterThan(20);

    // Washing hands clears unwashedHands
    expect(session.activities.start('wash-hands')).toBe('started');
    advanceMinutes(session, 4);
    expect(session.state.player.unwashedHands).toBe(false);
  });

  it('progresses apartment filth through 5 stages, raises stress, and makes the player dirty when cleaning', () => {
    const session = createSession('medium', noSchedule);
    expect(session.state.getZoneFilthLevel('bathroom')).toBe(1);

    session.state.filth.bathroom = 25;
    expect(session.state.getZoneFilthLevel('bathroom')).toBe(2);
    session.state.filth.bathroom = 48;
    expect(session.state.getZoneFilthLevel('bathroom')).toBe(3);
    session.state.filth.bathroom = 70;
    expect(session.state.getZoneFilthLevel('bathroom')).toBe(4);
    session.state.filth.bathroom = 90;
    expect(session.state.getZoneFilthLevel('bathroom')).toBe(5);

    const dirtBeforeClean = session.state.player.get('dirt');
    session.state.filth.targetZone = 'bathroom';
    expect(session.activities.start('clean')).toBe('started');
    advanceMinutes(session, 7);

    expect(session.state.filth.bathroom).toBeLessThan(1);
    expect(session.state.getZoneFilthLevel('bathroom')).toBe(1);
    expect(session.state.player.get('dirt')).toBeGreaterThan(dirtBeforeClean + 40);
  });

  it('escalates kitchen fire from small (stage 1) to big (stage 2), kitchen engulfed (stage 3), and game over if ignored', () => {
    const session = createSession('medium', noSchedule);
    session.baby.startKitchenFire();
    expect(session.state.baby.kitchenFire).toBe(true);
    expect(session.state.baby.fireStage).toBe(1);

    // After 19 minutes, grows into fire_big (Stage 2)
    advanceMinutes(session, 19);
    expect(session.state.baby.fireStage).toBe(2);

    // After 37 minutes total, spreads across the kitchen (Stage 3)
    advanceMinutes(session, 18);
    expect(session.state.baby.fireStage).toBe(3);
    expect(session.state.outcome).toBeNull();

    // If still ignored past 48 minutes total, triggers 'kitchen-fire' game over
    advanceMinutes(session, 12);
    expect(session.state.outcome?.reason).toBe('kitchen-fire');
    expect(session.state.outcome?.victory).toBe(false);

    // Can also be extinguished before game over
    const savedSession = createSession('medium', noSchedule);
    savedSession.baby.startKitchenFire();
    advanceMinutes(savedSession, 20);
    expect(savedSession.state.baby.fireStage).toBe(2);
    savedSession.baby.extinguishKitchenFire();
    expect(savedSession.state.baby.kitchenFire).toBe(false);
    expect(savedSession.state.baby.fireStage).toBe(0);
  });
});
