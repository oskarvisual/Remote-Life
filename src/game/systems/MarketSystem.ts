import { MARKET_ITEMS, type MarketItem } from '../config/content';
import { GameSystem, type SystemContext } from '../core/GameSystem';
import type { BabySystem } from './BabySystem';

export type PurchaseResult = 'ok' | 'unknown' | 'insufficient-funds';

/** Online shop: spend money for meals, energy, stress relief or baby items. */
export class MarketSystem extends GameSystem {
  constructor(
    ctx: SystemContext,
    private readonly baby: BabySystem,
    readonly items: readonly MarketItem[] = MARKET_ITEMS,
  ) {
    super(ctx);
  }

  buy(itemId: string): PurchaseResult {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return 'unknown';
    if (!this.state.player.spend(item.price)) {
      this.notify(`Not enough money for ${item.label}`, 'warn');
      return 'insufficient-funds';
    }
    const { meals, energy, stress, food, baby } = item.effects;
    const { player } = this.state;
    if (meals) this.state.fridge.meals += meals;
    if (energy) player.adjust('energy', energy);
    if (stress) player.adjust('stress', stress);
    if (food) player.adjust('food', food);
    if (baby) this.baby.soothe(baby);
    this.events.emit('market:purchase', { itemId });
    this.notify(`Bought ${item.label} (-$${item.price})`, 'success');
    this.changed();
    return 'ok';
  }
}
