import {
  APARTMENT_CATALOG,
  type ApartmentTierSpec,
  EQUIPMENT_CATALOG,
  type EquipmentTierItem,
  MARKET_ITEMS,
  type MarketItem,
} from '../config/content';
import { GameSystem, type SystemContext } from '../core/GameSystem';
import type { EquipmentSlot, ItemTier } from '../core/models';
import type { BabySystem } from './BabySystem';

export type PurchaseResult = 'ok' | 'unknown' | 'insufficient-funds' | 'already-owned';
export type SellResult = 'ok' | 'not-owned' | 'trade-only';
export type TradeResult = 'ok' | 'same-tier' | 'insufficient-funds' | 'unknown';

/**
 * Online shop, trade exchange & resale market:
 * - Buy consumables (food, drinks, baby milk) that restock the refrigerator.
 * - Buy 3-tier apartment equipment (devices, furniture, appliances) when a slot is empty.
 * - Sell owned apartment equipment for cash.
 * - Trade Apartment, PC Desk/Setup, and Desk Chair separately up or down across 3 levels.
 */
export class MarketSystem extends GameSystem {
  readonly equipmentCatalog: readonly EquipmentTierItem[] = EQUIPMENT_CATALOG;
  readonly apartmentCatalog: readonly ApartmentTierSpec[] = APARTMENT_CATALOG;

  constructor(
    ctx: SystemContext,
    private readonly baby: BabySystem,
    readonly items: readonly MarketItem[] = MARKET_ITEMS,
  ) {
    super(ctx);
  }

  /**
   * Returns net cash difference for trading to `targetTier` apartment:
   * - Positive value = cost the player must pay to upgrade.
   * - Negative value = cash refund the player receives when moving to a cheaper apartment.
   * - 0 = already at this tier.
   */
  getApartmentTradeDiff(targetTier: ItemTier): number {
    const currentTier = this.state.apartmentTier;
    if (targetTier === currentTier) return 0;

    const currentSpec = this.apartmentCatalog.find((a) => a.tier === currentTier);
    const targetSpec = this.apartmentCatalog.find((a) => a.tier === targetTier);
    if (!currentSpec || !targetSpec) return 0;

    if (targetTier > currentTier) {
      return targetSpec.tradeValue - currentSpec.tradeValue;
    }
    const refund = Math.round((currentSpec.tradeValue - targetSpec.tradeValue) * 0.8);
    return -refund;
  }

  /**
   * Returns net cash difference for trading `desk` or `chair` to `targetTier`:
   * - Positive value = cost the player must pay to upgrade.
   * - Negative value = cash refund the player receives when downgrading.
   * - 0 = already at this tier.
   */
  getSetupTradeDiff(slot: 'desk' | 'chair', targetTier: ItemTier): number {
    const currentTier = this.state.equipment[slot] ?? 1;
    if (targetTier === currentTier) return 0;

    const currentSpec = this.equipmentCatalog.find(
      (e) => e.slot === slot && e.tier === currentTier,
    );
    const targetSpec = this.equipmentCatalog.find((e) => e.slot === slot && e.tier === targetTier);
    if (!currentSpec || !targetSpec) return 0;

    if (targetTier > currentTier) {
      return Math.max(15, targetSpec.buyPrice - currentSpec.sellPrice);
    }
    const refund = Math.max(15, currentSpec.sellPrice - targetSpec.sellPrice);
    return -refund;
  }

  tradeApartment(targetTier: ItemTier): TradeResult {
    const currentTier = this.state.apartmentTier;
    if (targetTier === currentTier) return 'same-tier';

    const targetSpec = this.apartmentCatalog.find((a) => a.tier === targetTier);
    if (!targetSpec) return 'unknown';

    const diff = this.getApartmentTradeDiff(targetTier);
    if (diff > 0) {
      if (!this.state.player.spend(diff)) {
        this.notify(`Not enough money to move into ${targetSpec.label} (need $${diff})`, 'warn');
        return 'insufficient-funds';
      }
      this.state.apartmentTier = targetTier;
      this.events.emit('apartment:changed', { tier: targetTier });
      this.notify(
        `🏢 Upgraded to ${targetSpec.label} (-$${diff})! Weekly rent is now $${targetSpec.weeklyRent}.`,
        'success',
      );
    } else {
      const refund = Math.abs(diff);
      this.state.player.earn(refund);
      this.state.apartmentTier = targetTier;
      if (targetTier === 1) {
        this.state.equipment.table = null;
      }
      this.events.emit('apartment:changed', { tier: targetTier });
      this.notify(
        `📦 Moved to cheaper ${targetSpec.label} (+$${refund} deposit refund)! Weekly rent is now $${targetSpec.weeklyRent}.`,
        'info',
      );
    }

    this.changed();
    return 'ok';
  }

  tradeSetup(slot: 'desk' | 'chair', targetTier: ItemTier): TradeResult {
    const currentTier = this.state.equipment[slot] ?? 1;
    if (targetTier === currentTier) return 'same-tier';

    const targetSpec = this.equipmentCatalog.find((e) => e.slot === slot && e.tier === targetTier);
    if (!targetSpec) return 'unknown';

    const diff = this.getSetupTradeDiff(slot, targetTier);
    if (diff > 0) {
      if (!this.state.player.spend(diff)) {
        this.notify(`Not enough money to trade up to ${targetSpec.label} (need $${diff})`, 'warn');
        return 'insufficient-funds';
      }
      this.state.equipment[slot] = targetTier;
      this.events.emit('equipment:changed', { slot, level: targetTier });
      this.notify(`🔄 Upgraded to ${targetSpec.label} (-$${diff})!`, 'success');
    } else {
      const refund = Math.abs(diff);
      this.state.player.earn(refund);
      this.state.equipment[slot] = targetTier;
      this.events.emit('equipment:changed', { slot, level: targetTier });
      this.notify(`🔄 Downgraded to ${targetSpec.label} and received +$${refund} cash!`, 'info');
    }

    this.changed();
    return 'ok';
  }

  buy(itemId: string): PurchaseResult {
    // 1. Check if it's a 3-tier equipment item first
    const equipItem = this.equipmentCatalog.find((e) => e.id === itemId);
    if (equipItem) {
      return this.buyEquipment(equipItem.id);
    }

    // 2. Otherwise check standard market consumables/apps
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return 'unknown';

    if (
      (item.effects.meals ||
        item.effects.fastFood ||
        item.effects.instantSoup ||
        item.effects.healthySalad ||
        item.effects.water ||
        item.effects.energyDrink ||
        item.effects.babyMilk) &&
      this.state.equipment.fridge === null
    ) {
      this.notify('You sold your refrigerator! Buy a Fridge first to store food & drinks.', 'warn');
      return 'unknown';
    }

    if (!this.state.player.spend(item.price)) {
      this.notify(`Not enough money for ${item.label}`, 'warn');
      return 'insufficient-funds';
    }

    const {
      meals,
      fastFood,
      instantSoup,
      healthySalad,
      water,
      energyDrink,
      babyMilk,
      energy,
      stress,
      food,
      baby,
    } = item.effects;
    const { player, fridge } = this.state;

    if (meals) fridge.meals += meals;
    if (fastFood) fridge.fastFood += fastFood;
    if (instantSoup) fridge.instantSoup += instantSoup;
    if (healthySalad) fridge.healthySalad += healthySalad;
    if (water) fridge.water += water;
    if (energyDrink) fridge.energyDrink += energyDrink;
    if (babyMilk) fridge.babyMilk += babyMilk;

    if (energy) player.adjust('energy', energy);
    if (stress) player.adjust('stress', stress);
    if (food) player.adjust('food', food);
    if (baby) this.baby.soothe(baby);

    this.events.emit('market:purchase', { itemId });
    this.notify(`Bought ${item.label} (-$${item.price})`, 'success');
    this.changed();
    return 'ok';
  }

  buyEquipment(equipmentId: string): PurchaseResult {
    const equip = this.equipmentCatalog.find((e) => e.id === equipmentId);
    if (!equip) return 'unknown';

    if (equip.slot === 'table' && this.state.apartmentTier === 1) {
      this.notify(
        'The Compact Studio (Hard) has no space for a Dining Table! Move to a larger apartment first.',
        'warn',
      );
      return 'already-owned';
    }

    if (this.state.equipment[equip.slot] !== null) {
      this.notify(
        `You already own a ${equip.slotLabel}. Sell your current one first to buy another!`,
        'warn',
      );
      return 'already-owned';
    }

    if (!this.state.player.spend(equip.buyPrice)) {
      this.notify(`Not enough money for ${equip.label}`, 'warn');
      return 'insufficient-funds';
    }

    this.state.equipment[equip.slot] = equip.tier;
    this.events.emit('equipment:changed', { slot: equip.slot, level: equip.tier });
    this.events.emit('market:purchase', { itemId: equip.id });
    this.notify(`Purchased ${equip.label} (-$${equip.buyPrice})`, 'success');
    this.changed();
    return 'ok';
  }

  sellEquipment(slot: EquipmentSlot): SellResult {
    if (slot === 'desk' || slot === 'chair') {
      this.notify('Use the TRADE tab to upgrade or downgrade your Desk and Chair!', 'warn');
      return 'trade-only';
    }

    const currentTier = this.state.equipment[slot];
    if (currentTier === null) return 'not-owned';

    const equip = this.equipmentCatalog.find((e) => e.slot === slot && e.tier === currentTier);
    const sellPrice = equip?.sellPrice ?? 40;
    const label = equip?.label ?? slot.toUpperCase();

    this.state.equipment[slot] = null;
    if ((slot === 'tv' || slot === 'sofa') && this.state.wife.activity === 'watching-tv') {
      this.state.wife.activity = 'idle';
    }
    if (slot === 'bed' && this.state.wife.activity === 'sleeping') {
      this.state.wife.activity = 'idle';
    }
    this.state.player.earn(sellPrice);
    this.events.emit('equipment:changed', { slot, level: null });
    this.notify(`💰 Sold ${label} for +$${sellPrice}!`, 'info');
    this.changed();
    return 'ok';
  }
}
