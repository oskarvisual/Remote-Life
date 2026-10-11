import type {
  EquipmentSlot,
  FridgeItemKey,
  ItemTier,
  MarketCategory,
  MeetingTemplate,
} from '../core/models';

export interface TaskTemplate {
  title: string;
  type: string;
}

export const TASK_TEMPLATES: readonly TaskTemplate[] = [
  { title: 'Write component', type: 'Code' },
  { title: 'Fix checkout bug', type: 'Bug' },
  { title: 'Reply to client', type: 'Email' },
  { title: 'Design landing page', type: 'Design' },
  { title: 'Review pull request', type: 'Review' },
  { title: 'Update API docs', type: 'Docs' },
  { title: 'Optimize images', type: 'Perf' },
];

/** One meeting per day, cycling through this list. */
export const MEETING_TEMPLATES: readonly MeetingTemplate[] = [
  {
    title: 'Sprint sync',
    briefing: 'Remember: the client asked for a',
    keyFact: 'blue onboarding page',
    dialogue: 'Let’s keep the blue onboarding page approachable.',
    question: 'What color did the client request for onboarding?',
    options: ['Red', 'Blue', 'Green'],
    answerIndex: 1,
  },
  {
    title: 'Client check-in',
    briefing: 'The launch date was moved to',
    keyFact: 'Friday',
    dialogue: 'So we are all aligned on shipping this Friday.',
    question: 'When is the new launch date?',
    options: ['Monday', 'Wednesday', 'Friday'],
    answerIndex: 2,
  },
  {
    title: 'Design review',
    briefing: 'The approved logo uses a',
    keyFact: 'rounded font',
    dialogue: 'The rounded font feels friendlier for our users.',
    question: 'Which font style was approved for the logo?',
    options: ['Rounded', 'Serif', 'Monospace'],
    answerIndex: 0,
  },
  {
    title: 'Retrospective',
    briefing: 'Last sprint the main blocker was',
    keyFact: 'slow code reviews',
    dialogue: 'We really need to speed up code reviews this time.',
    question: 'What was the main blocker last sprint?',
    options: ['Server costs', 'Slow code reviews', 'Too many meetings'],
    answerIndex: 1,
  },
];

export interface FridgeItemSpec {
  key: FridgeItemKey;
  icon: string;
  label: string;
  description: string;
  kind: 'eat' | 'drink' | 'baby';
  food?: number;
  hydration?: number;
  energy?: number;
  stress?: number;
}

export const FRIDGE_ITEMS: readonly FridgeItemSpec[] = [
  {
    key: 'meals',
    icon: '🍱',
    label: 'Home-Cooked Meal',
    description: '+35 Hunger, -2 Stress',
    kind: 'eat',
    food: 35,
    stress: -2,
  },
  {
    key: 'fastFood',
    icon: '🍔',
    label: 'Fast Food Burger',
    description: '+45 Hunger, +5 Energy, -4 Stress',
    kind: 'eat',
    food: 45,
    energy: 5,
    stress: -4,
  },
  {
    key: 'instantSoup',
    icon: '🍜',
    label: 'Instant Ramen Cup',
    description: '+25 Hunger, +10 Hydration, -2 Stress',
    kind: 'eat',
    food: 25,
    hydration: 10,
    stress: -2,
  },
  {
    key: 'healthySalad',
    icon: '🥗',
    label: 'Fresh Green Salad',
    description: '+28 Hunger, +15 Hydration, -8 Stress',
    kind: 'eat',
    food: 28,
    hydration: 15,
    stress: -8,
  },
  {
    key: 'water',
    icon: '💧',
    label: 'Water Bottle',
    description: '+45 Hydration, +3 Energy, -3 Stress',
    kind: 'drink',
    hydration: 45,
    energy: 3,
    stress: -3,
  },
  {
    key: 'energyDrink',
    icon: '🥤',
    label: 'Cold Brew Coffee',
    description: '+25 Hydration, +18 Energy, +2 Stress',
    kind: 'drink',
    hydration: 25,
    energy: 18,
    stress: 2,
  },
  {
    key: 'babyMilk',
    icon: '🍼',
    label: 'Baby Milk Formula',
    description: 'Consumed when you or your wife feed the baby',
    kind: 'baby',
  },
];

export interface MarketEffects {
  meals?: number;
  fastFood?: number;
  instantSoup?: number;
  healthySalad?: number;
  water?: number;
  energyDrink?: number;
  babyMilk?: number;
  energy?: number;
  stress?: number;
  food?: number;
  baby?: number;
}

export interface MarketItem {
  id: string;
  category: Exclude<MarketCategory, 'all'>;
  label: string;
  description: string;
  price: number;
  icon: string;
  image?: string;
  effects: MarketEffects;
}

export const MARKET_ITEMS: readonly MarketItem[] = [
  // Food & Drinks (restocks Fridge)
  {
    id: 'groceries',
    category: 'food',
    label: 'Groceries Pack (x3)',
    description: '+3 Home-Cooked Meals stored in the refrigerator.',
    price: 40,
    icon: '🍲',
    effects: { meals: 3 },
  },
  {
    id: 'fast-food-pack',
    category: 'food',
    label: 'Fast Food Combo (x2)',
    description: '+2 Fast Food Burgers stored in the refrigerator.',
    price: 28,
    icon: '🍔',
    effects: { fastFood: 2 },
  },
  {
    id: 'ramen-pack',
    category: 'food',
    label: 'Instant Ramen Pack (x3)',
    description: '+3 Instant Ramen Cups stored in the refrigerator.',
    price: 18,
    icon: '🍜',
    effects: { instantSoup: 3 },
  },
  {
    id: 'salad-pack',
    category: 'food',
    label: 'Fresh Salad Bowl (x2)',
    description: '+2 Healthy Salads stored in the refrigerator.',
    price: 24,
    icon: '🥗',
    effects: { healthySalad: 2 },
  },
  {
    id: 'water-pack',
    category: 'food',
    label: 'Water Bottles 4-Pack',
    description: '+4 Mineral Water Bottles stored in the refrigerator.',
    price: 14,
    icon: '💧',
    effects: { water: 4 },
  },
  {
    id: 'coffee-pack',
    category: 'food',
    label: 'Cold Brew 2-Pack',
    description: '+2 Cold Brew Coffees stored in the refrigerator.',
    price: 16,
    icon: '🥤',
    effects: { energyDrink: 2 },
  },
  {
    id: 'delivery',
    category: 'food',
    label: 'Express Meal Delivery',
    description: 'Eaten immediately: +40 Hunger.',
    price: 18,
    icon: '🥡',
    effects: { food: 40 },
  },
  {
    id: 'coffee',
    category: 'food',
    label: 'Single Espresso Shot',
    description: 'Drunk immediately: +12 Energy, +2 Stress.',
    price: 6,
    icon: '☕',
    effects: { energy: 12, stress: 2 },
  },

  // Baby supplies
  {
    id: 'baby-milk-pack',
    category: 'baby',
    label: 'Baby Milk Formula (x3)',
    description: '+3 Baby Milk bottles stored in the refrigerator.',
    price: 26,
    icon: '🍼',
    effects: { babyMilk: 3 },
  },
  {
    id: 'mobile',
    category: 'baby',
    label: 'Baby Musical Mobile',
    description: 'Calms the baby immediately (+25 Comfort).',
    price: 35,
    icon: '🎠',
    effects: { baby: 25 },
  },
  {
    id: 'baby-care-kit',
    category: 'baby',
    label: 'Diaper & Lullaby Kit',
    description: 'Soothes crying and restores +35 Baby Comfort.',
    price: 28,
    icon: '🧷',
    effects: { baby: 35 },
  },

  // Devices / Apps
  {
    id: 'meditation',
    category: 'devices',
    label: 'Mindfulness App Pass',
    description: 'Guided breathing session: -15 Stress.',
    price: 12,
    icon: '🧘',
    effects: { stress: -15 },
  },
];

export interface ApartmentTierSpec {
  id: string;
  tier: ItemTier;
  label: string;
  description: string;
  weeklyRent: number;
  tradeValue: number;
}

export const APARTMENT_CATALOG: readonly ApartmentTierSpec[] = [
  {
    id: 'apt-1',
    tier: 1,
    label: 'Compact Studio Apartment',
    description:
      'Cramped budget studio ($450/wk rent). ⚠️ Ugly & noisy: Stress rises faster (+1.2/hr)!',
    weeklyRent: 450,
    tradeValue: 300,
  },
  {
    id: 'apt-2',
    tier: 2,
    label: 'Standard Family Apartment',
    description:
      'Comfortable 2-bedroom apartment ($700/wk rent). Balanced comfort (no extra stress).',
    weeklyRent: 700,
    tradeValue: 600,
  },
  {
    id: 'apt-3',
    tier: 3,
    label: 'Luxury Penthouse Loft',
    description:
      'Spacious penthouse with city view ($1,000/wk rent). ✨ Passively reduces Stress (-0.5/hr)!',
    weeklyRent: 1000,
    tradeValue: 1050,
  },
];

export interface EquipmentTierItem {
  id: string;
  slot: EquipmentSlot;
  slotLabel: string;
  tier: ItemTier;
  category: 'devices' | 'furniture';
  label: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
  icon: string;
  image?: string;
}

export const EQUIPMENT_CATALOG: readonly EquipmentTierItem[] = [
  // PC Setup (Devices)
  {
    id: 'desk-1',
    slot: 'desk',
    slotLabel: 'PC Workstation',
    tier: 1,
    category: 'devices',
    label: 'Barrel Desk & CRT PC',
    description:
      'Makeshift barrel desk & flickering CRT. ⚠️ Ugly setup: Stress rises faster while working!',
    buyPrice: 90,
    sellPrice: 60,
    icon: '🖥️',
    image:
      'assets/setup-computer-level01/Pixel_art_computer_desk_setup/rotations/Pixel_art_computer_desk_setup.png',
  },
  {
    id: 'desk-2',
    slot: 'desk',
    slotLabel: 'PC Workstation',
    tier: 2,
    category: 'devices',
    label: 'Modern Dual-Screen Setup',
    description: 'Clean wooden desk with laptop and external monitor (standard stress rate).',
    buyPrice: 210,
    sellPrice: 140,
    icon: '🖥️',
    image:
      'assets/setup-computer-level02/Pixel_art_modern_desk_setup_f/rotations/Pixel_art_modern_desk_setup_f.png',
  },
  {
    id: 'desk-3',
    slot: 'desk',
    slotLabel: 'PC Workstation',
    tier: 3,
    category: 'devices',
    label: 'Pro Triple-Monitor Rig',
    description: 'High-end RGB workstation. ✨ Passively lowers Stress and makes work relaxing!',
    buyPrice: 380,
    sellPrice: 250,
    icon: '🖥️',
    image:
      'assets/setup-computer-level03/Pixel_art_ultimate_professiona/rotations/Pixel_art_ultimate_professiona.png',
  },

  // Television (Devices)
  {
    id: 'tv-1',
    slot: 'tv',
    slotLabel: 'Television',
    tier: 1,
    category: 'devices',
    label: 'Small Tube TV',
    description: 'Old 14-inch CRT television for basic entertainment.',
    buyPrice: 65,
    sellPrice: 40,
    icon: '📺',
    image:
      'assets/tv-level01/television_from_behind_we_only/rotations/television_from_behind_we_only.png',
  },
  {
    id: 'tv-2',
    slot: 'tv',
    slotLabel: 'Television',
    tier: 2,
    category: 'devices',
    label: '42" LED Smart TV',
    description: 'Crisp flat-screen TV that keeps your wife relaxed.',
    buyPrice: 150,
    sellPrice: 100,
    icon: '📺',
    image:
      'assets/tv-level-02-03/television_from_behind_we_only/rotations/television_from_behind_we_only.png',
  },
  {
    id: 'tv-3',
    slot: 'tv',
    slotLabel: 'Television',
    tier: 3,
    category: 'devices',
    label: '65" OLED Home Theater',
    description: 'Cinema-grade OLED screen with surround sound.',
    buyPrice: 290,
    sellPrice: 195,
    icon: '📺',
    image:
      'assets/tv-level-02-03/television_from_behind_we_only/rotations/television_from_behind_we_only.png',
  },

  // Bed (Furniture)
  {
    id: 'bed-1',
    slot: 'bed',
    slotLabel: 'Bed',
    tier: 1,
    category: 'furniture',
    label: 'Folding Canvas Cot',
    description:
      'Uncomfortable folding cot. ⚠️ Ugly bed: Stress rises faster (+0.8/hr) & naps recover less!',
    buyPrice: 75,
    sellPrice: 50,
    icon: '🛏️',
    image: 'assets/bed-level01/bed/rotations/bed.png',
  },
  {
    id: 'bed-2',
    slot: 'bed',
    slotLabel: 'Bed',
    tier: 2,
    category: 'furniture',
    label: 'Classic Wooden Bed',
    description: 'Comfortable oak frame bed with warm red duvet (standard rest & stress).',
    buyPrice: 165,
    sellPrice: 110,
    icon: '🛏️',
    image: 'assets/bed-level02/bed/rotations/bed.png',
  },
  {
    id: 'bed-3',
    slot: 'bed',
    slotLabel: 'Bed',
    tier: 3,
    category: 'furniture',
    label: 'Royal Carved King Bed',
    description:
      'Plush luxury mattress. ✨ Lowers passive Stress (-0.4/hr) & deep restorative naps!',
    buyPrice: 310,
    sellPrice: 205,
    icon: '🛏️',
    image: 'assets/bed-level03/bed/rotations/bed.png',
  },

  // Desk Chair (Furniture)
  {
    id: 'chair-1',
    slot: 'chair',
    slotLabel: 'Desk Chair',
    tier: 1,
    category: 'furniture',
    label: 'Cardboard Shipping Box',
    description:
      'An upside-down cardboard box seat. ⚠️ Severe back pain: Stress rises faster while working!',
    buyPrice: 20,
    sellPrice: 12,
    icon: '📦',
    image: 'assets/setup-chair-level01/shipping_box_of_amazon/rotations/shipping_box_of_amazon.png',
  },
  {
    id: 'chair-2',
    slot: 'chair',
    slotLabel: 'Desk Chair',
    tier: 2,
    category: 'furniture',
    label: 'Ergonomic Office Chair',
    description: 'Swivel mesh chair with lumbar support (standard comfort).',
    buyPrice: 95,
    sellPrice: 65,
    icon: '💺',
    image:
      'assets/setup-chair-level02/Pixel_art_office_chair_rear_v/rotations/Pixel_art_office_chair_rear_v.png',
  },
  {
    id: 'chair-3',
    slot: 'chair',
    slotLabel: 'Desk Chair',
    tier: 3,
    category: 'furniture',
    label: 'Pro Gaming Bucket Chair',
    description: 'Full-recline racing seat. ✨ Passively reduces Stress during long shifts!',
    buyPrice: 190,
    sellPrice: 125,
    icon: '💺',
    image:
      'assets/setup-chair-level03/Pixel_art_gaming_chair_rear_v/rotations/Pixel_art_gaming_chair_rear_v.png',
  },

  // Baby Crib (Furniture)
  {
    id: 'crib-1',
    slot: 'crib',
    slotLabel: 'Baby Crib',
    tier: 1,
    category: 'furniture',
    label: 'Weathered Pine Crib',
    description: 'Second-hand wooden crib that keeps the baby contained.',
    buyPrice: 60,
    sellPrice: 40,
    icon: '👶',
    image: 'assets/empty_baby_crib-level01/empty_baby_crib/rotations/empty_baby_crib.png',
  },
  {
    id: 'crib-2',
    slot: 'crib',
    slotLabel: 'Baby Crib',
    tier: 2,
    category: 'furniture',
    label: 'Sturdy Nursery Crib',
    description: 'Safe modern crib with soft mattress.',
    buyPrice: 135,
    sellPrice: 90,
    icon: '👶',
    image: 'assets/empty_baby_crib-level02/empty_baby_crib/rotations/empty_baby_crib.png',
  },
  {
    id: 'crib-3',
    slot: 'crib',
    slotLabel: 'Baby Crib',
    tier: 3,
    category: 'furniture',
    label: 'Deluxe Canopy Crib',
    description: 'Handcrafted luxury crib that helps the baby sleep longer.',
    buyPrice: 240,
    sellPrice: 160,
    icon: '👶',
    image: 'assets/empty_baby_crib-level03/empty_baby_crib/rotations/empty_baby_crib.png',
  },

  // Sofa / Couch (Furniture)
  {
    id: 'sofa-1',
    slot: 'sofa',
    slotLabel: 'Living Sofa',
    tier: 1,
    category: 'furniture',
    label: 'Worn Three-Seater Sofa',
    description: 'Basic worn sofa in front of the TV.',
    buyPrice: 55,
    sellPrice: 35,
    icon: '🛋️',
    image: 'assets/sofa-level01/three-seater_sofa/rotations/three-seater_sofa.png',
  },
  {
    id: 'sofa-2',
    slot: 'sofa',
    slotLabel: 'Living Sofa',
    tier: 2,
    category: 'furniture',
    label: 'Cozy Fabric Sofa',
    description: 'Soft fabric sofa for the living room.',
    buyPrice: 130,
    sellPrice: 85,
    icon: '🛋️',
    image: 'assets/sofa-level02/three-seater_sofa/rotations/three-seater_sofa.png',
  },
  {
    id: 'sofa-3',
    slot: 'sofa',
    slotLabel: 'Living Sofa',
    tier: 3,
    category: 'furniture',
    label: 'Luxury Lounge Sofa',
    description: 'Spacious luxury sofa for maximum comfort.',
    buyPrice: 250,
    sellPrice: 165,
    icon: '🛋️',
    image: 'assets/sofa-level03/three-seater_sofa/rotations/three-seater_sofa.png',
  },

  // Dining Table (Furniture)
  {
    id: 'table-1',
    slot: 'table',
    slotLabel: 'Dining Table',
    tier: 1,
    category: 'furniture',
    label: 'Folding Side Table',
    description: 'Compact wooden table with chairs for quick meals.',
    buyPrice: 45,
    sellPrice: 30,
    icon: '🍽️',
    image: 'assets/dinner-table-level01/dinner_table/rotations/dinner_table.png',
  },
  {
    id: 'table-2',
    slot: 'table',
    slotLabel: 'Dining Table',
    tier: 2,
    category: 'furniture',
    label: 'Family Dining Table',
    description: 'Solid oak dining table with chairs.',
    buyPrice: 110,
    sellPrice: 75,
    icon: '🍽️',
    image: 'assets/dinner-table-level02/dinner_table/rotations/dinner_table.png',
  },
  {
    id: 'table-3',
    slot: 'table',
    slotLabel: 'Dining Table',
    tier: 3,
    category: 'furniture',
    label: 'Marble Banquet Table',
    description: 'Elegant dining centerpiece with chairs.',
    buyPrice: 210,
    sellPrice: 140,
    icon: '🍽️',
    image: 'assets/dinner-table-level03/dinner_table/rotations/dinner_table.png',
  },

  // Kitchen Stove (Furniture / Appliances)
  {
    id: 'stove-1',
    slot: 'stove',
    slotLabel: 'Kitchen Stove',
    tier: 1,
    category: 'furniture',
    label: 'Portable 2-Burner Hotplate',
    description: 'Compact stove top for heating soup and meals.',
    buyPrice: 60,
    sellPrice: 40,
    icon: '🍳',
    image: 'assets/stove-level01/stove/rotations/stove.png',
  },
  {
    id: 'stove-2',
    slot: 'stove',
    slotLabel: 'Kitchen Stove',
    tier: 2,
    category: 'furniture',
    label: '4-Burner Gas Range & Oven',
    description: 'Standard apartment stove and oven.',
    buyPrice: 140,
    sellPrice: 95,
    icon: '🍳',
    image: 'assets/stove-level02/stove/rotations/stove.png',
  },
  {
    id: 'stove-3',
    slot: 'stove',
    slotLabel: 'Kitchen Stove',
    tier: 3,
    category: 'furniture',
    label: 'Smart Induction Chef Range',
    description: 'Stainless steel induction stove.',
    buyPrice: 260,
    sellPrice: 175,
    icon: '🍳',
    image: 'assets/stove-level03/stove/rotations/stove.png',
  },

  // Refrigerator (Furniture / Appliances)
  {
    id: 'fridge-1',
    slot: 'fridge',
    slotLabel: 'Refrigerator',
    tier: 1,
    category: 'furniture',
    label: 'Mini Dorm Fridge',
    description: 'Holds basic drinks, milk, and meals.',
    buyPrice: 70,
    sellPrice: 45,
    icon: '🧊',
    image: 'assets/refrigerator-level01/refrigerator/rotations/refrigerator.png',
  },
  {
    id: 'fridge-2',
    slot: 'fridge',
    slotLabel: 'Refrigerator',
    tier: 2,
    category: 'furniture',
    label: 'Frost-Free Family Fridge',
    description: 'Full-size refrigerator and freezer.',
    buyPrice: 155,
    sellPrice: 105,
    icon: '🧊',
    image: 'assets/refrigerator-level02/refrigerator/rotations/refrigerator.png',
  },
  {
    id: 'fridge-3',
    slot: 'fridge',
    slotLabel: 'Refrigerator',
    tier: 3,
    category: 'furniture',
    label: 'Double-Door Smart Fridge',
    description: 'High-capacity stainless steel refrigerator.',
    buyPrice: 280,
    sellPrice: 190,
    icon: '🧊',
    image: 'assets/refrigerator-level03/refrigerator/rotations/refrigerator.png',
  },

  // Wi-Fi Router / Modem Cabinet (Devices)
  {
    id: 'router-1',
    slot: 'router',
    slotLabel: 'Wi-Fi Router',
    tier: 1,
    category: 'devices',
    label: 'Basic ADSL Modem Cabinet',
    description: 'Budget router on a small wooden stand.',
    buyPrice: 50,
    sellPrice: 32,
    icon: '📡',
    image:
      'assets/router-level01/small_cabinet_with_modem-route/rotations/small_cabinet_with_modem-route.png',
  },
  {
    id: 'router-2',
    slot: 'router',
    slotLabel: 'Wi-Fi Router',
    tier: 2,
    category: 'devices',
    label: 'Dual-Band Fiber Router',
    description: 'Reliable home fiber router and cabinet.',
    buyPrice: 115,
    sellPrice: 75,
    icon: '📡',
    image:
      'assets/router-level02/small_cabinet_with_modem-route/rotations/small_cabinet_with_modem-route.png',
  },
  {
    id: 'router-3',
    slot: 'router',
    slotLabel: 'Wi-Fi Router',
    tier: 3,
    category: 'devices',
    label: 'Pro Wi-Fi 6E Mesh Tower',
    description: 'High-speed low-latency router setup.',
    buyPrice: 210,
    sellPrice: 140,
    icon: '📡',
    image:
      'assets/router-level03/small_cabinet_with_modem-route/rotations/small_cabinet_with_modem-route.png',
  },
];
