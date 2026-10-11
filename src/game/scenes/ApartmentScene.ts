import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import type { DifficultyId } from '../config/difficulties';
import type { GameSession } from '../GameSession';

import type { CleanZoneId, ItemTier } from '../core/models';

interface InteractiveZone {
  name: string;
  x: number;
  width: number;
  actionText: string;
  onInteract: () => void;
}

type MischiefTarget = 'kitchen' | 'modem' | 'desk' | 'table';

interface LevelLayout {
  bgKey: string;
  bedKey: string;
  cribKey: string;
  deskKey: string;
  chairKey: string;
  chairScale: number;
  worldWidth: number;
  floorY: number;
  wallFloorY: number;
  minWalkX: number;
  maxWalkX: number;
  startX: number;
  bedX: number;
  deskX: number;
  fridgeX: number;
  cribX: number;
  toiletX: number;
  sinkX: number;
  showerX: number;
  bathroomTrashX: number;
  kitchenTrashX: number;
  modemX: number;
  kitchenX: number;
  tableX: number;
  tvX: number;
  doorX: number;
}

const SPRITE_SCALE = 1.8;
const DESK_SCALE = 1.85;
const BABY_SCALE = 0.85;
const BABY_CARRIED_SCALE = 0.78;

const LEVEL_LAYOUTS: Readonly<Record<DifficultyId, LevelLayout>> = {
  // Level 1 (Hard): Cramped studio and bathroom
  hard: {
    bgKey: 'bg-hard',
    bedKey: 'bed-hard',
    cribKey: 'crib-hard',
    deskKey: 'desk-hard',
    chairKey: 'chair-hard',
    chairScale: 0.85,
    worldWidth: 750,
    floorY: 248,
    wallFloorY: 234,
    minWalkX: 48,
    maxWalkX: 715,
    startX: 290,
    bedX: 76,
    tvX: 162,
    tableX: 162,
    cribX: 242,
    kitchenX: 306,
    kitchenTrashX: 338,
    fridgeX: 372,
    modemX: 418,
    deskX: 472,
    doorX: 522,
    toiletX: 576,
    bathroomTrashX: 604,
    sinkX: 632,
    showerX: 688,
  },

  // Level 2 (Medium): 2 bedrooms, bathroom, kitchen, living & dining room
  medium: {
    bgKey: 'bg-medium',
    bedKey: 'bed-medium',
    cribKey: 'crib-medium',
    deskKey: 'desk-medium',
    chairKey: 'chair-medium',
    chairScale: 1.3,
    worldWidth: 1281,
    floorY: 246,
    wallFloorY: 232,
    minWalkX: 48,
    maxWalkX: 1240,
    startX: 836,
    bedX: 74,
    cribX: 415,
    toiletX: 608,
    bathroomTrashX: 638,
    sinkX: 668,
    showerX: 730,
    modemX: 882,
    deskX: 826,
    tvX: 948,
    tableX: 1044,
    kitchenX: 1128,
    kitchenTrashX: 1164,
    fridgeX: 1200,
    doorX: 1242,
  },

  // Level 3 (Easy): Multi-room penthouse with balcony
  easy: {
    bgKey: 'bg-easy',
    bedKey: 'bed-easy',
    cribKey: 'crib-easy',
    deskKey: 'desk-easy',
    chairKey: 'chair-easy',
    chairScale: 1.3,
    worldWidth: 1621,
    floorY: 246,
    wallFloorY: 232,
    minWalkX: 48,
    maxWalkX: 1590,
    startX: 760,
    bedX: 74,
    cribX: 375,
    toiletX: 545,
    bathroomTrashX: 572,
    sinkX: 600,
    showerX: 655,
    modemX: 745,
    deskX: 810,
    kitchenX: 1005,
    kitchenTrashX: 1048,
    fridgeX: 1090,
    tableX: 1240,
    doorX: 1320,
    tvX: 1390,
  },
};

export class ApartmentScene extends Phaser.Scene {
  private session!: GameSession;
  private layout!: LevelLayout;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyF!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;
  private keyC!: Phaser.Input.Keyboard.Key;
  private keyB!: Phaser.Input.Keyboard.Key;
  private keyN!: Phaser.Input.Keyboard.Key;
  private keyT!: Phaser.Input.Keyboard.Key;
  private keyM!: Phaser.Input.Keyboard.Key;
  private keyV!: Phaser.Input.Keyboard.Key;

  private bedImage!: Phaser.GameObjects.Image;
  private cribBackGraphics!: Phaser.GameObjects.Graphics;
  private cribImage!: Phaser.GameObjects.Image;
  private deskImage!: Phaser.GameObjects.Image;
  private chairImage!: Phaser.GameObjects.Image;
  private sofaImage!: Phaser.GameObjects.Image;
  private tvImage!: Phaser.GameObjects.Image;
  private tableImage!: Phaser.GameObjects.Image;
  private tableLabel!: Phaser.GameObjects.Text;
  private stoveImage!: Phaser.GameObjects.Image;
  private fridgeImage!: Phaser.GameObjects.Image;
  private routerImage!: Phaser.GameObjects.Image;

  private kitchenTrashImage!: Phaser.GameObjects.Image;
  private bathroomTrashImage!: Phaser.GameObjects.Image;
  private bathroomPoopImage!: Phaser.GameObjects.Image;
  private trashBagSprites: { zone: CleanZoneId; image: Phaser.GameObjects.Image }[] = [];
  private stoveFireImage!: Phaser.GameObjects.Image;
  private kitchenSpreadFireImages: Phaser.GameObjects.Image[] = [];

  private player!: Phaser.GameObjects.Sprite;
  private wifeSprite!: Phaser.GameObjects.Sprite;
  private wifeLabel!: Phaser.GameObjects.Text;
  private babySprite!: Phaser.GameObjects.Sprite;
  private babyLabel!: Phaser.GameObjects.Text;
  private effectsGraphics!: Phaser.GameObjects.Graphics;
  private comicGraphics!: Phaser.GameObjects.Graphics;
  private wifeComicText!: Phaser.GameObjects.Text;
  private playerComicText!: Phaser.GameObjects.Text;
  private hazardGraphics!: Phaser.GameObjects.Graphics;
  private ambientOverlay!: Phaser.GameObjects.Rectangle;
  private playerLabel!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private secondaryPromptText!: Phaser.GameObjects.Text;
  private cryText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private urgencyText!: Phaser.GameObjects.Text;

  private facing: 'east' | 'west' = 'east';
  private walkAnimTimer = 0;
  private walkStep = 0;

  // Wife movement and animation state
  private wifeX = 0;
  private wifeY = 0;
  private wifeFacing: 'east' | 'west' = 'east';
  private wifeWalkTimer = 0;
  private wifeWalkStep = 0;

  // Baby movement, needs, and mischief state
  private babyX = 0;
  private babyY = 0;
  private babyFacing: 'east' | 'west' = 'east';
  private babyCrawlTimer = 0;
  private babyCrawlStep = 0;
  private babyCribPoseTimer = 0;
  private babyCarryTimer = 0;
  private babyExerciseTimer = 0;
  private babyEscapeTimer = 0;
  private mischiefTarget: MischiefTarget = 'kitchen';
  private mischiefTimer = 0;
  private babyHurtTimer = 0;

  private zones: InteractiveZone[] = [];

  constructor() {
    super('Apartment');
  }

  preload(): void {
    // 3 level backgrounds
    this.load.image('bg-hard', 'assets/bg-level01.png');
    this.load.image('bg-medium', 'assets/bg-level02.png');
    this.load.image('bg-easy', 'assets/bg-level03.png');

    // Main character rotations and poses
    this.load.image('char-idle-east', 'assets/character-main/Idle/rotations/east.png');
    this.load.image('char-idle-west', 'assets/character-main/Idle/rotations/west.png');
    this.load.image('char-idle-north', 'assets/character-main/Idle/rotations/north.png');
    this.load.image('char-walk-east', 'assets/character-main/walking/rotations/east.png');
    this.load.image('char-walk-west', 'assets/character-main/walking/rotations/west.png');
    this.load.image(
      'char-walk2-east',
      'assets/character-main/walking_using_the_le/rotations/east.png',
    );
    this.load.image(
      'char-walk2-west',
      'assets/character-main/walking_using_the_le/rotations/west.png',
    );
    this.load.image(
      'char-typing-east',
      'assets/character-main/seated_and_typingju/rotations/east.png',
    );
    this.load.image(
      'char-typing-north',
      'assets/character-main/seated_and_typingju/rotations/north.png',
    );
    this.load.image(
      'char-eat-east',
      'assets/character-main/eating_instant_soup/rotations/east.png',
    );
    this.load.image(
      'char-drink-east',
      'assets/character-main/drinking_water_while/rotations/east.png',
    );
    this.load.image(
      'char-clean-east',
      'assets/main-character-cleaning/cleaning/rotations/east.png',
    );
    this.load.image(
      'char-clean-west',
      'assets/main-character-cleaning/cleaning/rotations/west.png',
    );

    // Sitting, shower, and sleeping poses
    this.load.image(
      'char-sitting-south',
      'assets/character-main-sitting/sitting/rotations/south.png',
    );
    this.load.image(
      'char-shower-south',
      'assets/character-main_shower/Taking_a_shower_but/rotations/south.png',
    );
    this.load.image(
      'char-sleep-west',
      'assets/character-main-sleeping/sleeping/rotations/west.png',
    );

    // Wife Level 1 (Hard: wife-low)
    this.load.image('wife-low-idle-east', 'assets/wife-low/Idle/rotations/east.png');
    this.load.image('wife-low-idle-west', 'assets/wife-low/Idle/rotations/west.png');
    this.load.image('wife-low-idle-south', 'assets/wife-low/Idle/rotations/south.png');
    this.load.image('wife-low-idle-north', 'assets/wife-low/Idle/rotations/north.png');
    this.load.image('wife-low-walk1-east', 'assets/wife-low/walking/rotations/east.png');
    this.load.image('wife-low-walk1-west', 'assets/wife-low/walking/rotations/west.png');
    this.load.image(
      'wife-low-walk2-east',
      'assets/wife-low/walking_with_left_le/rotations/east.png',
    );
    this.load.image(
      'wife-low-walk2-west',
      'assets/wife-low/walking_with_left_le/rotations/west.png',
    );
    this.load.image('wife-low-sit-south', 'assets/wife-low/sitting/rotations/south.png');
    this.load.image('wife-low-sleep-west', 'assets/wife-low/slepping/rotations/west.png');
    this.load.image(
      'wife-low-shower-south',
      'assets/wife-low/She_is_taking_a_show/rotations/south.png',
    );
    this.load.image(
      'wife-low-eat-south',
      'assets/wife_low-eating/eating_ramen_soup/rotations/south.png',
    );
    this.load.image(
      'wife-low-drink-south',
      'assets/wife_low-drinking/drinking_a_water_bot/rotations/south.png',
    );
    this.load.image('wife-low-clean-east', 'assets/wife-low-cleaning/cleaning/rotations/east.png');
    this.load.image('wife-low-clean-west', 'assets/wife-low-cleaning/cleaning/rotations/west.png');

    // Wife Level 2 & 3 (Medium & Easy: wife-mid-high)
    this.load.image('wife-high-idle-east', 'assets/wife-mid-high/Idle/rotations/east.png');
    this.load.image('wife-high-idle-west', 'assets/wife-mid-high/Idle/rotations/west.png');
    this.load.image('wife-high-idle-south', 'assets/wife-mid-high/Idle/rotations/south.png');
    this.load.image('wife-high-idle-north', 'assets/wife-mid-high/Idle/rotations/north.png');
    this.load.image('wife-high-walk1-east', 'assets/wife-mid-high/walking/rotations/east.png');
    this.load.image('wife-high-walk1-west', 'assets/wife-mid-high/walking/rotations/west.png');
    this.load.image(
      'wife-high-walk2-east',
      'assets/wife-mid-high/walking_using_the_le/rotations/east.png',
    );
    this.load.image(
      'wife-high-walk2-west',
      'assets/wife-mid-high/walking_using_the_le/rotations/west.png',
    );
    this.load.image('wife-high-sit-south', 'assets/wife-mid-high/sitting/rotations/south.png');
    this.load.image(
      'wife-high-sleep-west',
      'assets/wife-mid-high/sleeping_witho_bg_gr/rotations/west.png',
    );
    this.load.image(
      'wife-high-shower-south',
      'assets/wife-mid-high/She_is_taking_a_show/rotations/south.png',
    );
    this.load.image(
      'wife-high-eat-south',
      'assets/wife_mid-high-eating/eating_ramen_soup/rotations/south.png',
    );
    this.load.image(
      'wife-high-drink-south',
      'assets/wife_mid-high-drinking/drinking_a_water_bot/rotations/south.png',
    );
    this.load.image(
      'wife-high-clean-east',
      'assets/wife-mid-high-cleaning/cleaning/rotations/east.png',
    );
    this.load.image(
      'wife-high-clean-west',
      'assets/wife-mid-high-cleaning/cleaning/rotations/west.png',
    );

    // Baby sprites (sitting, sleeping, crying, drinking bottle, crawling)
    this.load.image('baby-sit-south', 'assets/baby/Idle/rotations/south.png');
    this.load.image('baby-sit-east', 'assets/baby/Idle/rotations/east.png');
    this.load.image('baby-sit-west', 'assets/baby/Idle/rotations/west.png');
    this.load.image('baby-sleep-south', 'assets/baby/16-bit_pixel_art_sle/rotations/south.png');
    this.load.image('baby-cry-south', 'assets/baby/16-bit_pixel_art_cry/rotations/south.png');
    this.load.image('baby-bottle-south', 'assets/baby/6-bit_pixel_art_baby/rotations/south.png');
    this.load.image('baby-crawl1-east', 'assets/baby/16-bit_pixel_art_cra/rotations/east.png');
    this.load.image('baby-crawl1-west', 'assets/baby/16-bit_pixel_art_cra/rotations/west.png');
    this.load.image('baby-crawl2-east', 'assets/baby/16-bit_pixel_art_bab/rotations/east.png');
    this.load.image('baby-crawl2-west', 'assets/baby/16-bit_pixel_art_bab/rotations/west.png');

    // Beds (3 levels)
    this.load.image('bed-hard', 'assets/bed-level01/bed/rotations/bed.png');
    this.load.image('bed-medium', 'assets/bed-level02/bed/rotations/bed.png');
    this.load.image('bed-easy', 'assets/bed-level03/bed/rotations/bed.png');

    // Empty baby cribs (3 levels)
    this.load.image(
      'crib-hard',
      'assets/empty_baby_crib-level01/empty_baby_crib/rotations/empty_baby_crib.png',
    );
    this.load.image(
      'crib-medium',
      'assets/empty_baby_crib-level02/empty_baby_crib/rotations/empty_baby_crib.png',
    );
    this.load.image(
      'crib-easy',
      'assets/empty_baby_crib-level03/empty_baby_crib/rotations/empty_baby_crib.png',
    );

    // Computer desks (3 levels)
    this.load.image(
      'desk-hard',
      'assets/setup-computer-level01/Pixel_art_computer_desk_setup/rotations/Pixel_art_computer_desk_setup.png',
    );
    this.load.image(
      'desk-medium',
      'assets/setup-computer-level02/Pixel_art_modern_desk_setup_f/rotations/Pixel_art_modern_desk_setup_f.png',
    );
    this.load.image(
      'desk-easy',
      'assets/setup-computer-level03/Pixel_art_ultimate_professiona/rotations/Pixel_art_ultimate_professiona.png',
    );

    // Desk chairs (3 levels)
    this.load.image(
      'chair-hard',
      'assets/setup-chair-level01/shipping_box_of_amazon/rotations/shipping_box_of_amazon.png',
    );
    this.load.image(
      'chair-medium',
      'assets/setup-chair-level02/Pixel_art_office_chair_rear_v/rotations/Pixel_art_office_chair_rear_v.png',
    );
    this.load.image(
      'chair-easy',
      'assets/setup-chair-level03/Pixel_art_gaming_chair_rear_v/rotations/Pixel_art_gaming_chair_rear_v.png',
    );

    // Dining Tables (3 levels, already include chairs)
    this.load.image(
      'table-hard',
      'assets/dinner-table-level01/dinner_table/rotations/dinner_table.png',
    );
    this.load.image(
      'table-medium',
      'assets/dinner-table-level02/dinner_table/rotations/dinner_table.png',
    );
    this.load.image(
      'table-easy',
      'assets/dinner-table-level03/dinner_table/rotations/dinner_table.png',
    );

    // Kitchen Stoves (3 levels)
    this.load.image('stove-hard', 'assets/stove-level01/stove/rotations/stove.png');
    this.load.image('stove-medium', 'assets/stove-level02/stove/rotations/stove.png');
    this.load.image('stove-easy', 'assets/stove-level03/stove/rotations/stove.png');

    // Refrigerators (3 levels)
    this.load.image(
      'fridge-hard',
      'assets/refrigerator-level01/refrigerator/rotations/refrigerator.png',
    );
    this.load.image(
      'fridge-medium',
      'assets/refrigerator-level02/refrigerator/rotations/refrigerator.png',
    );
    this.load.image(
      'fridge-easy',
      'assets/refrigerator-level03/refrigerator/rotations/refrigerator.png',
    );

    // Wi-Fi Routers / Modems (3 levels)
    this.load.image(
      'router-hard',
      'assets/router-level01/small_cabinet_with_modem-route/rotations/small_cabinet_with_modem-route.png',
    );
    this.load.image(
      'router-medium',
      'assets/router-level02/small_cabinet_with_modem-route/rotations/small_cabinet_with_modem-route.png',
    );
    this.load.image(
      'router-easy',
      'assets/router-level03/small_cabinet_with_modem-route/rotations/small_cabinet_with_modem-route.png',
    );

    // Sofas (3 levels)
    this.load.image(
      'sofa-hard',
      'assets/sofa-level01/three-seater_sofa/rotations/three-seater_sofa.png',
    );
    this.load.image(
      'sofa-medium',
      'assets/sofa-level02/three-seater_sofa/rotations/three-seater_sofa.png',
    );
    this.load.image(
      'sofa-easy',
      'assets/sofa-level03/three-seater_sofa/rotations/three-seater_sofa.png',
    );

    // Televisions (seen from behind: level 1 vs level 2/3, with level 3 scaled larger)
    this.load.image(
      'tv-hard',
      'assets/tv-level01/television_from_behind_we_only/rotations/television_from_behind_we_only.png',
    );
    this.load.image(
      'tv-med-easy',
      'assets/tv-level-02-03/television_from_behind_we_only/rotations/television_from_behind_we_only.png',
    );

    // Trash cans (3 levels), Poop (level 4), and Trash Bags (level 5)
    this.load.image(
      'trash-1',
      'assets/trash-level01/metal_trash_can/rotations/metal_trash_can.png',
    );
    this.load.image(
      'trash-2',
      'assets/trash-level02/metal_trash_can/rotations/metal_trash_can.png',
    );
    this.load.image(
      'trash-3',
      'assets/trash-level03/accumulated_trash/rotations/accumulated_trash.png',
    );
    this.load.image('poop', 'assets/poop/poop/rotations/poop.png');
    this.load.image(
      'trash-bags-1',
      'assets/trash-bags-level01/accumulated_trash/rotations/accumulated_trash.png',
    );
    this.load.image(
      'trash-bags-2',
      'assets/trash-bags-level02/accumulated_trash/rotations/accumulated_trash.png',
    );
    this.load.image('fire-small', 'assets/fire_small/fire/rotations/fire.png');
    this.load.image('fire-big', 'assets/fire_big/fire/rotations/fire.png');
  }

  create(): void {
    this.session = this.game.registry.get('session') as GameSession;
    if (!this.session) {
      throw new Error('GameSession not found in Phaser registry');
    }

    this.layout = LEVEL_LAYOUTS[this.tierSuffix(this.session.state.apartmentTier)];
    this.babyX = this.layout.cribX;
    this.babyY = this.layout.wallFloorY - 12;
    this.wifeX =
      this.session.state.wife.activity === 'sleeping' ? this.layout.bedX : this.layout.tvX + 12;
    this.wifeY = this.layout.floorY;

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      this.keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
      this.keyV = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);
    }

    this.drawApartment();
    this.createBabyAndPlayer();
    this.setupZones();
    this.setupCamera();
    this.setupEventListeners();
    this.syncEquipmentVisuals();
    this.syncFilthVisuals();
  }

  private tierSuffix(tier: ItemTier): 'hard' | 'medium' | 'easy' {
    return tier === 1 ? 'hard' : tier === 2 ? 'medium' : 'easy';
  }

  private syncEquipmentVisuals(): void {
    const eq = this.session.state.equipment;
    const { cribX, wallFloorY } = this.layout;

    // 1. Bed
    if (eq.bed !== null) {
      this.bedImage.setVisible(true).setTexture(`bed-${this.tierSuffix(eq.bed)}`);
    } else {
      this.bedImage.setVisible(false);
    }

    // 2. Baby crib
    this.cribBackGraphics.clear();
    if (eq.crib !== null) {
      this.cribBackGraphics.fillStyle(0x2b211b, 0.85).fillRect(cribX - 24, wallFloorY - 40, 48, 28);
      this.cribBackGraphics.fillStyle(0xf5ebe0, 0.95).fillRect(cribX - 23, wallFloorY - 18, 46, 8);
      this.cribImage.setVisible(true).setTexture(`crib-${this.tierSuffix(eq.crib)}`);
    } else {
      this.cribImage.setVisible(false);
    }

    // 3. Desk & Chair
    if (eq.desk !== null) {
      this.deskImage.setVisible(true).setTexture(`desk-${this.tierSuffix(eq.desk)}`);
    } else {
      this.deskImage.setVisible(false);
    }

    if (eq.chair !== null) {
      const scale = eq.chair === 1 ? 0.85 : 1.3;
      const chairY =
        eq.chair === 2 ? wallFloorY + 6 : eq.chair === 1 ? wallFloorY + 11 : this.layout.floorY + 2;
      this.chairImage
        .setVisible(true)
        .setPosition(this.layout.deskX, chairY)
        .setTexture(`chair-${this.tierSuffix(eq.chair)}`)
        .setScale(scale);
    } else {
      this.chairImage.setVisible(false);
    }

    // 4. Sofa & Foreground TV (TV is seen from behind, closer to camera at depth 11)
    if (eq.sofa !== null) {
      // sofa-medium has 13px of bottom padding and smaller internal bounds inside its 48x48 frame
      const sofaScale = eq.sofa === 2 ? 2.05 : eq.sofa === 1 ? 1.7 : 1.75;
      const sofaY = eq.sofa === 2 ? wallFloorY + 28 : wallFloorY + 6;
      this.sofaImage
        .setVisible(true)
        .setPosition(this.layout.tvX, sofaY)
        .setTexture(`sofa-${this.tierSuffix(eq.sofa)}`)
        .setScale(sofaScale);
    } else {
      this.sofaImage.setVisible(false);
    }

    if (eq.tv !== null) {
      const tvTex = eq.tv === 1 ? 'tv-hard' : 'tv-med-easy';
      // Hard is smaller (1.05), Medium is mid-sized (1.35), Easy is large (1.6) while keeping seated characters visible
      const tvScale = eq.tv === 1 ? 1.05 : eq.tv === 2 ? 1.35 : 1.6;
      this.tvImage.setVisible(true).setTexture(tvTex).setScale(tvScale);
    } else {
      this.tvImage.setVisible(false);
    }

    // 5. Dining Table (includes chairs; unavailable in Hard studio apartment) & Kitchen Stove
    if (eq.table !== null && this.session.state.apartmentTier !== 1) {
      this.tableImage
        .setVisible(true)
        .setTexture(`table-${this.tierSuffix(eq.table)}`)
        .setScale(2.05);
      this.tableLabel.setVisible(true);
    } else {
      this.tableImage.setVisible(false);
      this.tableLabel.setVisible(false);
    }

    if (eq.stove !== null) {
      this.stoveImage.setVisible(true).setTexture(`stove-${this.tierSuffix(eq.stove)}`);
    } else {
      this.stoveImage.setVisible(false);
    }

    // 6. Refrigerator & Wi-Fi Router (small, ~half the height of the main character)
    if (eq.fridge !== null) {
      this.fridgeImage.setVisible(true).setTexture(`fridge-${this.tierSuffix(eq.fridge)}`);
    } else {
      this.fridgeImage.setVisible(false);
    }

    if (eq.router !== null) {
      this.routerImage
        .setVisible(true)
        .setTexture(`router-${this.tierSuffix(eq.router)}`)
        .setScale(0.75);
    } else {
      this.routerImage.setVisible(false);
    }
  }

  private syncFilthVisuals(): void {
    const state = this.session.state;
    const kitchenLevel = state.getZoneFilthLevel('kitchen');
    const bathroomLevel = state.getZoneFilthLevel('bathroom');

    // Kitchen trash can: always present (Level 1 = clean, Level 2 = full, Level 3+ = overflowing)
    const kitchenTrashTex =
      kitchenLevel <= 1 ? 'trash-1' : kitchenLevel === 2 ? 'trash-2' : 'trash-3';
    this.kitchenTrashImage.setTexture(kitchenTrashTex).setScale(kitchenLevel >= 3 ? 0.78 : 0.66);

    // Bathroom trash can: always present (Level 1 = clean, Level 2 = full, Level 3+ = overflowing)
    const bathroomTrashTex =
      bathroomLevel <= 1 ? 'trash-1' : bathroomLevel === 2 ? 'trash-2' : 'trash-3';
    this.bathroomTrashImage.setTexture(bathroomTrashTex).setScale(bathroomLevel >= 3 ? 0.78 : 0.66);

    // Level 4+: Poop appears on the bathroom floor if bathroom is not cleaned
    this.bathroomPoopImage.setVisible(bathroomLevel >= 4);

    // Level 5: Trash bags appear across rooms that reach filth level 5
    for (const bag of this.trashBagSprites) {
      const zoneLevel = state.getZoneFilthLevel(bag.zone);
      bag.image.setVisible(zoneLevel >= 5);
    }
  }

  private drawApartment(): void {
    this.cameras.main.setBackgroundColor('#171722');
    const {
      bgKey,
      bedKey,
      cribKey,
      deskKey,
      chairKey,
      chairScale,
      worldWidth,
      floorY,
      wallFloorY,
      bedX,
      deskX,
      cribX,
      tvX,
      tableX,
      kitchenX,
      kitchenTrashX,
      fridgeX,
      modemX,
      toiletX,
      bathroomTrashX,
      sinkX,
      showerX,
    } = this.layout;

    // 1. Apartment background scaled to canvas height (270px)
    const bg = this.add.image(0, 0, bgKey).setOrigin(0, 0);
    bg.setDisplaySize(worldWidth, 270);

    // 2. Bed flush against the leftmost bedroom wall
    this.bedImage = this.add
      .image(bedX, wallFloorY + 6, bedKey)
      .setOrigin(0.5, 1)
      .setScale(SPRITE_SCALE)
      .setDepth(2);
    this.add
      .text(bedX, floorY + 2, 'BED', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 2b. Baby crib per level:
    // Mattress backing at depth 2, baby at depth 3, and crib bars in front at depth 4
    this.cribBackGraphics = this.add.graphics().setDepth(2);

    this.cribImage = this.add
      .image(cribX, wallFloorY + 6, cribKey)
      .setOrigin(0.5, 1)
      .setScale(SPRITE_SCALE)
      .setDepth(4);

    this.add
      .text(cribX, floorY + 2, 'BABY CRIB', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 3. Desk Setup layers: Wall -> Desk Setup (depth 2) -> Seated Player (depth 3) -> Chair (depth 4)
    this.deskImage = this.add
      .image(deskX, wallFloorY + 4, deskKey)
      .setOrigin(0.5, 1)
      .setScale(DESK_SCALE)
      .setDepth(2);

    this.chairImage = this.add
      .image(deskX, floorY + 2, chairKey)
      .setOrigin(0.5, 1)
      .setScale(chairScale)
      .setDepth(4);

    this.add
      .text(deskX, floorY + 2, 'DESK SETUP', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 3b. Living Room: Sofa against back wall (depth 2) and TV seen from behind in foreground (depth 11)
    // Characters walking past (depth 8-10) walk BETWEEN the sofa (depth 2) and the TV (depth 11)
    this.sofaImage = this.add
      .image(tvX, wallFloorY + 28, 'sofa-medium')
      .setOrigin(0.5, 1)
      .setScale(2.05)
      .setDepth(2);

    this.tvImage = this.add
      .image(tvX, floorY + 18, 'tv-med-easy')
      .setOrigin(0.5, 1)
      .setScale(1.35)
      .setDepth(11);

    this.add
      .text(tvX, floorY + 14, 'SOFA & TV', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(12);

    // 3c. Wi-Fi Router / Modem cabinet (depth 2, compact ~half character height)
    this.routerImage = this.add
      .image(modemX, wallFloorY - 4, 'router-medium')
      .setOrigin(0.5, 1)
      .setScale(0.75)
      .setDepth(2);

    this.add
      .text(modemX, floorY + 2, 'WI-FI', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#a8dadc',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 3d. Dining Table (includes chairs, depth 2; hidden in Hard studio apartment)
    this.tableImage = this.add
      .image(tableX, wallFloorY + 4, 'table-medium')
      .setOrigin(0.5, 1)
      .setScale(2.05)
      .setDepth(2);

    this.tableLabel = this.add
      .text(tableX, floorY + 2, 'TABLE', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 3e. Kitchen Stove & Refrigerator pushed further back against the rear kitchen wall (wallFloorY - 6)
    this.stoveImage = this.add
      .image(kitchenX, wallFloorY - 6, 'stove-medium')
      .setOrigin(0.5, 1)
      .setScale(1.55)
      .setDepth(2);

    this.add
      .text(kitchenX, floorY + 2, 'STOVE', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    this.fridgeImage = this.add
      .image(fridgeX, wallFloorY - 6, 'fridge-medium')
      .setOrigin(0.5, 1)
      .setScale(1.65)
      .setDepth(2);

    this.add
      .text(fridgeX, floorY + 2, 'FRIDGE', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 3f. Trash cans (always present in Kitchen & Bathroom starting at trash-level01), Poop (Lv.4), and Trash Bags (Lv.5)
    this.kitchenTrashImage = this.add
      .image(kitchenTrashX, wallFloorY - 2, 'trash-1')
      .setOrigin(0.5, 1)
      .setScale(0.66)
      .setDepth(3);

    this.bathroomTrashImage = this.add
      .image(bathroomTrashX, wallFloorY - 2, 'trash-1')
      .setOrigin(0.5, 1)
      .setScale(0.66)
      .setDepth(3);

    this.bathroomPoopImage = this.add
      .image(bathroomTrashX - 14, floorY - 2, 'poop')
      .setOrigin(0.5, 1)
      .setScale(0.48)
      .setDepth(3)
      .setVisible(false);

    // Random trash bags across all rooms (Bedroom, Nursery/Living, Bathroom, Kitchen) at Filth Level 5
    const hasTable = this.session.state.apartmentTier !== 1;
    const bagSpots: { zone: CleanZoneId; x: number; y: number; tex: string }[] = [
      { zone: 'bedroom', x: bedX + 34, y: floorY - 2, tex: 'trash-bags-1' },
      { zone: 'bedroom', x: cribX - 30, y: floorY - 1, tex: 'trash-bags-2' },
      { zone: 'bedroom', x: tvX - 36, y: floorY - 2, tex: 'trash-bags-1' },
      { zone: 'bathroom', x: showerX - 26, y: floorY - 2, tex: 'trash-bags-2' },
      { zone: 'kitchen', x: kitchenX - 24, y: floorY - 2, tex: 'trash-bags-1' },
      ...(hasTable
        ? [{ zone: 'kitchen' as CleanZoneId, x: tableX + 30, y: floorY - 1, tex: 'trash-bags-2' }]
        : []),
    ];
    this.trashBagSprites = bagSpots.map((spot) => ({
      zone: spot.zone,
      image: this.add
        .image(spot.x, spot.y, spot.tex)
        .setOrigin(0.5, 1)
        .setScale(0.82)
        .setDepth(3)
        .setVisible(false),
    }));

    // 3g. Kitchen fire sprites: Stage 1 (fire_small on stove), Stage 2 (fire_big on stove), Stage 3 (spreads across kitchen)
    this.stoveFireImage = this.add
      .image(kitchenX, wallFloorY - 22, 'fire-small')
      .setOrigin(0.5, 1)
      .setScale(0.95)
      .setDepth(9)
      .setVisible(false);

    const spreadPositions = [
      { x: kitchenX - 18, y: wallFloorY - 12, tex: 'fire-big' },
      { x: kitchenTrashX, y: wallFloorY - 4, tex: 'fire-small' },
      { x: fridgeX - 6, y: wallFloorY - 14, tex: 'fire-big' },
      ...(hasTable ? [{ x: tableX + 8, y: wallFloorY - 8, tex: 'fire-small' }] : []),
    ];
    this.kitchenSpreadFireImages = spreadPositions.map((pos) =>
      this.add
        .image(pos.x, pos.y, pos.tex)
        .setOrigin(0.5, 1)
        .setScale(1.0)
        .setDepth(9)
        .setVisible(false),
    );

    // 4. Bathroom labels (Toilet, Sink, and Shower built into the background)
    this.add
      .text(toiletX, floorY + 2, 'TOILET', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#a8dadc',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    this.add
      .text(sinkX, floorY + 2, 'SINK', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#a8dadc',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    this.add
      .text(showerX, floorY + 2, 'SHOWER', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#a8dadc',
        backgroundColor: '#1b1b26cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    // 5. Baby crying indicator
    this.cryText = this.add
      .text(cribX, wallFloorY - 68, 'WAHH!\n  ♫', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#f3315c',
        align: 'center',
        backgroundColor: '#1a1118dd',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(13)
      .setVisible(false);
  }

  private createBabyAndPlayer(): void {
    const { startX, floorY, cribX, wallFloorY } = this.layout;

    // Baby sprite: inside crib at depth 3 (behind crib bars at depth 4)
    this.babySprite = this.add
      .sprite(cribX, wallFloorY - 12, 'baby-sit-south')
      .setOrigin(0.5, 1)
      .setScale(BABY_SCALE)
      .setDepth(3);

    this.babyLabel = this.add
      .text(cribX, wallFloorY - 58, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#fff4d4',
        backgroundColor: '#8e243d',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(14)
      .setVisible(false);

    const wifePrefix = this.session.state.difficulty.id === 'hard' ? 'wife-low' : 'wife-high';
    this.wifeSprite = this.add
      .sprite(this.wifeX, floorY, `${wifePrefix}-idle-south`)
      .setOrigin(0.5, 1)
      .setScale(SPRITE_SCALE)
      .setDepth(8);

    this.wifeLabel = this.add
      .text(this.wifeX, floorY - 76, 'WIFE', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe8bb',
        backgroundColor: '#3d2842cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(13);

    const initialPlayerX =
      this.session.state.player.mode === 'computer' ? this.layout.deskX : startX;
    this.player = this.add
      .sprite(initialPlayerX, floorY, 'char-idle-east')
      .setOrigin(0.5, 1)
      .setScale(SPRITE_SCALE)
      .setDepth(10);

    // Graphics layer for kitchen fire, modem sparks, and unplugged PC cord
    this.hazardGraphics = this.add.graphics().setDepth(9);

    // Graphics layer for stink waves (Level 2), flies (Level 3), and shower drops
    this.effectsGraphics = this.add.graphics().setDepth(11);

    // Day / Afternoon / Night ambient overlay (fixed to apartment camera, never affects popup modals)
    this.ambientOverlay = this.add
      .rectangle(0, 0, 480, 270, 0x000000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(12);

    // Comic-book shout bubbles when wife and player are yelling at each other
    this.comicGraphics = this.add.graphics().setDepth(15);
    this.wifeComicText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        fontStyle: 'bold',
        color: '#1b1118',
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(16)
      .setVisible(false);

    this.playerComicText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        fontStyle: 'bold',
        color: '#1b1118',
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(16)
      .setVisible(false);

    this.playerLabel = this.add
      .text(initialPlayerX, floorY - 76, 'YOU', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#fff4d4',
        backgroundColor: '#181824cc',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(13);

    this.urgencyText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe6e6',
        backgroundColor: '#c0392b',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(14)
      .setVisible(false);

    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#151820',
        backgroundColor: '#ffe1a0',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(15)
      .setVisible(false);

    this.secondaryPromptText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#fff4d4',
        backgroundColor: '#2b3a4aee',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(15)
      .setVisible(false);

    this.statusText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffffff',
        backgroundColor: '#27ae60',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(15)
      .setVisible(false);
  }

  private getZoneForX(x: number): CleanZoneId {
    const { toiletX, showerX, kitchenX, tableX, fridgeX } = this.layout;
    const minBath = Math.min(toiletX, showerX) - 36;
    const maxBath = Math.max(toiletX, showerX) + 36;
    if (x >= minBath && x <= maxBath) {
      return 'bathroom';
    }
    const hasTable =
      this.session.state.equipment.table !== null && this.session.state.apartmentTier !== 1;
    const minKitchen =
      (hasTable ? Math.min(kitchenX, tableX, fridgeX) : Math.min(kitchenX, fridgeX)) - 36;
    const maxKitchen =
      (hasTable ? Math.max(kitchenX, tableX, fridgeX) : Math.max(kitchenX, fridgeX)) + 36;
    if (x >= minKitchen && x <= maxKitchen) {
      return 'kitchen';
    }
    return 'bedroom';
  }

  private startCleanZone(zone: CleanZoneId): void {
    if (this.session.state.baby.location === 'carried') {
      this.session.events.emit('notify', {
        text: '👶 Put the baby in the crib or bed before cleaning the apartment!',
        kind: 'warn',
      });
      return;
    }
    this.session.state.filth.targetZone = zone;
    this.session.activities.start('clean');
  }

  private setupZones(): void {
    const {
      bedX,
      fridgeX,
      deskX,
      cribX,
      tvX,
      toiletX,
      sinkX,
      showerX,
      bathroomTrashX,
      kitchenTrashX,
      kitchenX,
      modemX,
    } = this.layout;

    this.zones = [
      {
        name: 'bed',
        x: bedX,
        width: 44,
        actionText: '[E] REST / NAP',
        onInteract: () => {
          if (this.session.state.equipment.bed === null) {
            this.session.events.emit('notify', {
              text: '🛏️ You sold your bed! Buy a new bed in the MARKET app.',
              kind: 'warn',
            });
            return;
          }
          const baby = this.session.state.baby;
          if (baby.location === 'bed' && baby.demand === 'feed') {
            this.session.activities.start('care');
            return;
          }
          if (baby.location === 'bed' && baby.demand === 'crawl') {
            this.releaseBabyLoose(this.layout.bedX + 24);
            return;
          }
          if (baby.location === 'bed' && baby.demand === 'sleep') {
            this.pickUpBaby();
            return;
          }
          this.session.activities.start('nap');
        },
      },
      {
        name: 'clean-bedroom',
        x: bedX + 36,
        width: 24,
        actionText: '[E] / [C] 🧹 CLEAN BEDROOM',
        onInteract: () => this.startCleanZone('bedroom'),
      },
      {
        name: 'tv',
        x: tvX,
        width: 44,
        actionText: '[E] 📺 WATCH TV (-STRESS)',
        onInteract: () => {
          this.session.activities.start('watch-tv');
        },
      },
      {
        name: 'fridge',
        x: fridgeX,
        width: 38,
        actionText: '[E] 🧊 OPEN FRIDGE · [R] 💧 DRINK WATER',
        onInteract: () => {
          if (this.session.state.equipment.fridge === null) {
            this.session.events.emit('notify', {
              text: '🧊 You sold your refrigerator! Buy a new refrigerator in the MARKET app.',
              kind: 'warn',
            });
            return;
          }
          this.session.events.emit('fridge:open');
        },
      },
      {
        name: 'kitchen',
        x: kitchenX,
        width: 48,
        actionText: '[E] 🔥 EXTINGUISH FIRE',
        onInteract: () => {
          if (this.session.state.baby.location === 'carried') {
            this.session.events.emit('notify', {
              text: '👶 Put the baby in the crib or bed before extinguishing the fire!',
              kind: 'warn',
            });
            return;
          }
          if (this.session.state.baby.kitchenFire) {
            this.session.baby.extinguishKitchenFire();
          }
        },
      },
      {
        name: 'clean-kitchen',
        x: kitchenTrashX,
        width: 24,
        actionText: '[E] / [C] 🧹 CLEAN KITCHEN',
        onInteract: () => this.startCleanZone('kitchen'),
      },
      {
        name: 'modem',
        x: modemX,
        width: 34,
        actionText: '[E] 📡 RECONNECT WIFI',
        onInteract: () => {
          if (this.session.state.baby.location === 'carried') {
            this.session.events.emit('notify', {
              text: '👶 Put the baby in the crib or bed before reconnecting the modem!',
              kind: 'warn',
            });
            return;
          }
          if (this.session.state.baby.modemUnplugged) {
            this.session.state.baby.modemUnplugged = false;
            this.session.events.emit('internet:restored');
            this.session.events.emit('notify', {
              text: '📡 Wi-Fi modem reconnected. Internet restored!',
              kind: 'success',
            });
            this.session.events.emit('state:changed');
          }
        },
      },
      {
        name: 'desk',
        x: deskX,
        width: 44,
        actionText: '[E] OPEN COMPUTER',
        onInteract: () => {
          if (this.session.state.baby.location === 'carried') {
            this.session.events.emit('notify', {
              text: '👶 You cannot use the PC while holding the baby! Put the baby in the crib or bed (or sleep together).',
              kind: 'warn',
            });
            return;
          }
          if (this.session.state.baby.pcUnplugged) {
            this.session.state.baby.pcUnplugged = false;
            this.session.events.emit('notify', {
              text: '🔌 Plugged the PC power cable back in.',
              kind: 'success',
            });
            this.session.events.emit('state:changed');
            return;
          }
          this.session.events.emit('computer:open');
        },
      },
      {
        name: 'crib',
        x: cribX,
        width: 44,
        actionText: '[E] CARE FOR BABY',
        onInteract: () => {
          if (this.session.state.equipment.crib === null) {
            this.session.events.emit('notify', {
              text: '🛏️ You sold the baby crib! Buy a new crib in the MARKET app.',
              kind: 'warn',
            });
            return;
          }
          const baby = this.session.state.baby;
          if (baby.location === 'carried') {
            this.putBabyToSleepIn('crib');
          } else if (baby.location === 'crib') {
            if (baby.demand === 'crawl') {
              this.releaseBabyLoose(this.layout.cribX + 22);
            } else if (baby.demand === 'sleep') {
              this.pickUpBaby();
            } else {
              this.session.activities.start('care');
            }
          }
        },
      },
      {
        name: 'toilet',
        x: toiletX,
        width: 26,
        actionText: '[E] USE TOILET',
        onInteract: () => this.session.activities.start('toilet'),
      },
      {
        name: 'clean-bathroom',
        x: bathroomTrashX,
        width: 20,
        actionText: '[E] / [C] 🧹 CLEAN BATHROOM',
        onInteract: () => this.startCleanZone('bathroom'),
      },
      {
        name: 'sink',
        x: sinkX,
        width: 24,
        actionText: '[E] 🚰 WASH HANDS',
        onInteract: () => this.session.activities.start('wash-hands'),
      },
      {
        name: 'shower',
        x: showerX,
        width: 34,
        actionText: '[E] TAKE SHOWER',
        onInteract: () => this.session.activities.start('shower'),
      },
    ];
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, this.layout.worldWidth, 270);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  private setupEventListeners(): void {
    const unsubs = [
      this.session.events.on('apartment:changed', () => {
        this.scene.restart();
      }),
      this.session.events.on('equipment:changed', () => {
        this.syncEquipmentVisuals();
      }),
      this.session.events.on('baby:crying', () => {
        this.cryText.setVisible(true);
        this.cryText.setColor('#f3315c');
      }),
      this.session.events.on('baby:critical', () => {
        this.cryText.setVisible(true);
        this.cryText.setColor('#ff0033');
        this.cryText.setText('CRITICAL!\nWAHH!!');
      }),
      this.session.events.on('baby:attended', () => {
        this.cryText.setVisible(false);
        this.cryText.setText('WAHH!\n  ♫');
      }),
    ];

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const unsub of unsubs) {
        unsub();
      }
    });
  }

  private pickUpBaby(): void {
    const baby = this.session.state.baby;
    baby.location = 'carried';
    baby.carriedAsleep = false;
    baby.crying = false;
    baby.critical = false;
    this.babyCarryTimer = 0;
    this.babyHurtTimer = 0;
    this.mischiefTimer = 0;
    this.cryText.setVisible(false);

    if (baby.demand === 'crawl') {
      this.session.events.emit('notify', {
        text: '🏃 The baby wants to crawl around! Put the baby down on the floor with [F].',
        kind: 'info',
      });
    } else {
      this.session.events.emit('notify', {
        text: '👶 Picked up the baby. Walk around for a moment until the baby falls asleep on you, then place in crib or bed.',
        kind: 'info',
      });
    }
    this.session.events.emit('state:changed');
  }

  private putBabyToSleepIn(place: 'crib' | 'bed'): void {
    const baby = this.session.state.baby;
    if (baby.demand === 'sleep' && !baby.carriedAsleep) {
      this.session.events.emit('notify', {
        text: '⏳ Hold the baby for a few seconds until they fall asleep in your arms!',
        kind: 'warn',
      });
      return;
    }

    baby.location = place;
    baby.cribSleeping = baby.carriedAsleep || baby.demand === 'sleep' || Math.random() < 0.6;
    baby.carriedAsleep = false;
    baby.demand = 'none';
    this.babyX = place === 'crib' ? this.layout.cribX : this.layout.bedX + 8;
    this.babyY = place === 'crib' ? this.layout.wallFloorY - 12 : this.layout.wallFloorY - 8;
    this.babyEscapeTimer = 0;
    this.mischiefTimer = 0;
    this.session.baby.soothe(40);
    this.session.events.emit('notify', {
      text:
        place === 'crib'
          ? '🛏️ Placed the sleeping baby safely inside the crib. Your hands are free!'
          : '🛏️ Placed the sleeping baby on the bed. Your hands are free!',
      kind: 'success',
    });
  }

  private releaseBabyLoose(startX: number): void {
    const baby = this.session.state.baby;
    if (baby.carriedAsleep) {
      this.session.events.emit('notify', {
        text: '🛏️ The baby is asleep in your arms! Put the baby in the CRIB or BED (not on the floor).',
        kind: 'warn',
      });
      return;
    }

    baby.location = 'loose';
    baby.carriedAsleep = false;
    this.babyX = Phaser.Math.Clamp(startX, this.layout.minWalkX + 10, this.layout.maxWalkX - 10);
    this.babyY = this.layout.floorY;
    this.mischiefTimer = 0;
    this.babyHurtTimer = 0;
    this.babyExerciseTimer = 0;
    this.chooseNextMischiefTarget();
    this.session.events.emit('notify', {
      text:
        baby.demand === 'crawl'
          ? '🏃 Put the baby down to crawl around. Keep an eye out for mischief!'
          : '⚠️ The baby is loose! Put the baby in the crib or they will cause dangerous mischief.',
      kind: 'warn',
    });
    this.session.events.emit('state:changed');
  }

  private chooseNextMischiefTarget(): void {
    const hasTable =
      this.session.state.equipment.table !== null && this.session.state.apartmentTier !== 1;
    const targets: MischiefTarget[] = hasTable
      ? ['kitchen', 'modem', 'desk', 'table']
      : ['kitchen', 'modem', 'desk'];
    const currentIdx = targets.indexOf(this.mischiefTarget);
    this.mischiefTarget =
      targets[
        (currentIdx + 1 + Math.floor(Math.random() * Math.max(1, targets.length - 1))) %
          targets.length
      ];
    this.mischiefTimer = 0;
  }

  private getTargetX(target: MischiefTarget): number {
    switch (target) {
      case 'kitchen':
        return this.layout.kitchenX;
      case 'modem':
        return this.layout.modemX;
      case 'desk':
        return this.layout.deskX;
      case 'table':
        return this.layout.tableX;
    }
  }

  private triggerMischiefDisaster(target: MischiefTarget): void {
    const { baby, player } = this.session.state;

    if (target === 'kitchen') {
      this.session.baby.startKitchenFire();
    } else if (target === 'modem') {
      baby.modemUnplugged = true;
      this.session.events.emit('notify', {
        text: '📡 The baby unplugged the Wi-Fi MODEM! Reconnect it at the modem with [E].',
        kind: 'danger',
      });
    } else if (target === 'desk') {
      baby.pcUnplugged = true;
      if (player.mode === 'computer') {
        this.session.events.emit('computer:close');
      }
      this.session.events.emit('notify', {
        text: '🔌 The baby unplugged your PC! Reconnect the power cord at the desk with [E].',
        kind: 'danger',
      });
    } else if (target === 'table') {
      this.babyHurtTimer = 5500;
      baby.needs = Math.max(0, baby.needs - 35);
      baby.crying = true;
      player.adjust('stress', 22);
      player.money = Math.max(0, player.money - 50);
      this.session.events.emit('notify', {
        text: '🚑 The baby climbed the table and fell off! (-$50 medical care, +22 Stress). Pick them up!',
        kind: 'danger',
      });
    }

    this.session.events.emit('state:changed');
    this.chooseNextMischiefTarget();
  }

  private getDemandTag(): string {
    const { demand } = this.session.state.baby;
    if (demand === 'feed') return '🍼 NEEDS: MILK BOTTLE [E]';
    if (demand === 'crawl') return '🏃 NEEDS: LET DOWN TO CRAWL [F]';
    if (demand === 'sleep') return '😴 NEEDS: CARRY TO SLEEP [F]';
    return '';
  }

  private updateBabyBehavior(time: number, delta: number): void {
    const { baby, player } = this.session.state;
    const hour = this.session.state.secondsOfDay / 3600;

    // 1. Baby inside crib (depth 3 behind crib bars at depth 4) or on bed
    if (baby.location === 'crib' || baby.location === 'bed') {
      const inCrib = baby.location === 'crib';
      this.babyX = inCrib ? this.layout.cribX : this.layout.bedX + 8;
      this.babyY = inCrib ? this.layout.wallFloorY - 12 : this.layout.wallFloorY - 8;
      this.babySprite
        .setPosition(this.babyX, this.babyY)
        .setScale(BABY_SCALE)
        .setDepth(inCrib ? 3 : 7);

      const demandTag = this.getDemandTag();
      if (demandTag && player.mode !== 'caring') {
        this.babyLabel
          .setText(demandTag)
          .setPosition(this.babyX, this.babyY - 38)
          .setVisible(true);
      } else {
        this.babyLabel.setVisible(false);
      }
      this.cryText.setPosition(this.babyX, this.layout.wallFloorY - 68);

      // Alternate between sitting and sleeping when calm in the crib
      this.babyCribPoseTimer += delta;
      if (this.babyCribPoseTimer >= 12000) {
        this.babyCribPoseTimer = 0;
        const isNight = hour >= 20 || hour < 7;
        baby.cribSleeping = isNight ? true : !baby.cribSleeping;
      }

      if (player.mode === 'caring') {
        this.babySprite.setTexture('baby-bottle-south');
      } else if (baby.crying || baby.demand !== 'none') {
        this.babySprite.setTexture(baby.crying ? 'baby-cry-south' : 'baby-sit-south');
        if (baby.critical && inCrib) {
          this.babyEscapeTimer += delta;
          if (this.babyEscapeTimer >= 15000) {
            this.babyEscapeTimer = 0;
            this.releaseBabyLoose(this.layout.cribX + 20);
          }
        }
      } else if (baby.cribSleeping || !inCrib) {
        this.babySprite.setTexture('baby-sleep-south');
      } else {
        this.babySprite.setTexture('baby-sit-south');
      }
      return;
    }

    // 2. Baby carried in player's arms:
    // Starts sitting and falls asleep on top of the player after ~3.5 seconds (baby-sleep-south)
    if (baby.location === 'carried') {
      if (!baby.carriedAsleep && baby.demand !== 'crawl') {
        this.babyCarryTimer += delta;
        if (this.babyCarryTimer >= 3500) {
          baby.carriedAsleep = true;
          this.session.events.emit('notify', {
            text: '😴 The baby fell asleep on you! Put the baby in the CRIB or BED with [F] (or sleep in bed yourself).',
            kind: 'success',
          });
          this.session.events.emit('state:changed');
        }
      }

      const offsetX = this.facing === 'east' ? 6 : -6;
      this.babyX = this.player.x + offsetX;
      this.babyY = player.mode === 'napping' ? this.player.y - 10 : this.player.y - 24;
      this.babySprite
        .setPosition(this.babyX, this.babyY)
        .setScale(BABY_CARRIED_SCALE)
        .setDepth(this.player.depth + 1)
        .setTexture(
          baby.carriedAsleep || player.mode === 'napping' ? 'baby-sleep-south' : 'baby-sit-south',
        );

      if (baby.carriedAsleep) {
        this.babyLabel
          .setText('👶💤 ASLEEP -> PUT IN CRIB OR BED [F]')
          .setPosition(this.player.x, this.player.y - 90)
          .setVisible(true);
      } else if (baby.demand === 'crawl') {
        this.babyLabel
          .setText('🏃 WANTS TO CRAWL -> PUT ON FLOOR [F]')
          .setPosition(this.player.x, this.player.y - 90)
          .setVisible(true);
      } else {
        this.babyLabel
          .setText('⏳ FALLING ASLEEP IN YOUR ARMS...')
          .setPosition(this.player.x, this.player.y - 90)
          .setVisible(true);
      }
      this.cryText.setVisible(false);
      return;
    }

    // 3. Baby loose on floor ('loose'): crawls around and causes mischief if unwatched
    this.babySprite.setScale(BABY_SCALE).setDepth(9);

    // If baby wanted to crawl ('crawl'), after ~7s of crawling they get sleepy ('sleep')
    if (baby.demand === 'crawl') {
      this.babyExerciseTimer += delta;
      if (this.babyExerciseTimer >= 7000) {
        this.babyExerciseTimer = 0;
        baby.demand = 'sleep';
        this.session.events.emit('notify', {
          text: '😴 The baby finished crawling around and is sleepy now! Pick them up with [F] to rock to sleep.',
          kind: 'info',
        });
        this.session.events.emit('state:changed');
      }
    }

    if (this.babyHurtTimer > 0) {
      this.babyHurtTimer = Math.max(0, this.babyHurtTimer - delta);
      this.babyY = this.layout.floorY;
      this.babySprite.setPosition(this.babyX, this.babyY).setTexture('baby-cry-south');
      this.cryText
        .setText('😭 OUCH!\nWAHH!!')
        .setPosition(this.babyX, this.babyY - 46)
        .setVisible(true);
      this.babyLabel
        .setText('🚑 FELL OFF TABLE! [F] PICK UP')
        .setPosition(this.babyX, this.babyY - 30)
        .setVisible(true);
      return;
    }

    if (
      this.mischiefTarget === 'table' &&
      (this.session.state.equipment.table === null || this.session.state.apartmentTier === 1)
    ) {
      this.chooseNextMischiefTarget();
    }

    const targetX = this.getTargetX(this.mischiefTarget);
    const dist = targetX - this.babyX;

    if (Math.abs(dist) > 8) {
      // Crawling across the floor toward mischief target
      const crawlSpeed = 42;
      const step = Math.sign(dist) * ((crawlSpeed * delta) / 1000);
      this.babyX += step;
      this.babyY = this.layout.floorY;
      this.babyFacing = dist > 0 ? 'east' : 'west';

      this.babyCrawlTimer += delta;
      if (this.babyCrawlTimer >= 165) {
        this.babyCrawlTimer = 0;
        this.babyCrawlStep = (this.babyCrawlStep + 1) % 2;
      }

      const crawlTex =
        this.babyCrawlStep === 0
          ? `baby-crawl1-${this.babyFacing}`
          : `baby-crawl2-${this.babyFacing}`;
      this.babySprite.setPosition(this.babyX, this.babyY).setTexture(crawlTex);

      const targetNames: Record<MischiefTarget, string> = {
        kitchen: '🔥 STOVE',
        modem: '📡 WIFI MODEM',
        desk: '🔌 YOUR PC',
        table: '🪑 TABLE',
      };
      const prefix = baby.demand === 'sleep' ? '😴 SLEEPY (CARRY ME) · ' : '';
      this.babyLabel
        .setText(`${prefix}👶 -> ${targetNames[this.mischiefTarget]}`)
        .setPosition(this.babyX, this.babyY - 32)
        .setVisible(true);
    } else {
      // Reached furniture: climbs/tampers for 3.5 seconds before triggering disaster
      this.mischiefTimer += delta;
      const climbY =
        this.mischiefTarget === 'kitchen' || this.mischiefTarget === 'table'
          ? this.layout.wallFloorY - 26
          : this.layout.floorY - 4;
      this.babyY = climbY;

      const wobble = Math.sin(time * 0.02) * 2;
      this.babySprite.setPosition(this.babyX + wobble, this.babyY).setTexture('baby-sit-south');

      const actionNames: Record<MischiefTarget, string> = {
        kitchen: '⚠️ CLIMBING ON THE STOVE!',
        modem: '⚠️ PULLING MODEM CABLES!',
        desk: '⚠️ UNPLUGGING YOUR PC!',
        table: '⚠️ CLIMBING ON THE TABLE!',
      };
      this.babyLabel
        .setText(actionNames[this.mischiefTarget])
        .setPosition(this.babyX, this.babyY - 34)
        .setVisible(true);

      if (this.mischiefTimer >= 3500) {
        this.mischiefTimer = 0;
        this.triggerMischiefDisaster(this.mischiefTarget);
      }
    }
  }

  private updateWifeBehavior(time: number, delta: number): void {
    const { wife, difficulty, filth } = this.session.state;
    const prefix = difficulty.id === 'hard' ? 'wife-low' : 'wife-high';

    let targetX = this.layout.tvX + 14;
    let actionLabel = 'WIFE';

    switch (wife.activity) {
      case 'sleeping':
        targetX = this.layout.bedX - 4;
        actionLabel = 'WIFE · 😴 SLEEP';
        break;
      case 'watching-tv':
        // 3-seater sofa: wife always sits on the right side
        targetX = this.layout.tvX + 14;
        actionLabel = 'WIFE · 📺 TV';
        break;
      case 'out':
        targetX = this.layout.doorX;
        actionLabel = '🚪 WIFE IS OUT';
        break;
      case 'helping-baby':
        targetX = this.babyX + 18;
        actionLabel = 'WIFE · 🍼 HELPING BABY';
        break;
      case 'eating':
        targetX =
          this.session.state.equipment.table !== null && this.session.state.apartmentTier !== 1
            ? this.layout.tableX
            : this.layout.fridgeX - 18;
        actionLabel = 'WIFE · 🍲 EATING';
        break;
      case 'drinking':
        targetX = this.layout.fridgeX - 16;
        actionLabel = 'WIFE · 💧 DRINKING';
        break;
      case 'toilet':
        targetX = this.layout.toiletX;
        actionLabel = 'WIFE · 🚽 WC';
        break;
      case 'washing-hands':
        targetX = this.layout.sinkX;
        actionLabel = 'WIFE · 🧼 WASHING HANDS';
        break;
      case 'cleaning':
        targetX =
          filth.bathroom >= filth.kitchen && filth.bathroom >= filth.bedroom
            ? this.layout.bathroomTrashX
            : filth.kitchen >= filth.bedroom
              ? this.layout.kitchenTrashX
              : this.layout.bedX + 34;
        actionLabel = 'WIFE · 🧹 CLEANING';
        break;
      case 'showering':
        targetX = this.layout.showerX;
        actionLabel = 'WIFE · 🚿 SHOWER';
        break;
      default:
        targetX = this.layout.tvX + 14;
        break;
    }

    const dist = targetX - this.wifeX;
    if (Math.abs(dist) > 6) {
      // Walking toward her next activity spot
      const walkSpeed = 78;
      this.wifeX += Math.sign(dist) * ((walkSpeed * delta) / 1000);
      this.wifeY = this.layout.floorY;
      this.wifeFacing = dist > 0 ? 'east' : 'west';

      this.wifeWalkTimer += delta;
      if (this.wifeWalkTimer >= 135) {
        this.wifeWalkTimer = 0;
        this.wifeWalkStep = (this.wifeWalkStep + 1) % 4;
      }

      const frames = [
        `${prefix}-walk1-${this.wifeFacing}`,
        `${prefix}-idle-${this.wifeFacing}`,
        `${prefix}-walk2-${this.wifeFacing}`,
        `${prefix}-idle-${this.wifeFacing}`,
      ];
      this.wifeSprite
        .setVisible(true)
        .setPosition(this.wifeX, this.wifeY)
        .setDepth(8)
        .setTexture(frames[this.wifeWalkStep]);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 88)
        .setVisible(true);
      return;
    }

    this.wifeX = targetX;
    this.wifeWalkTimer = 0;
    this.wifeWalkStep = 0;

    if (wife.activity === 'out') {
      this.wifeSprite.setVisible(false);
      this.wifeLabel
        .setText('🚪 WIFE OUT')
        .setPosition(this.layout.doorX, this.layout.wallFloorY - 58)
        .setVisible(true);
      return;
    }

    this.wifeSprite.setVisible(true);

    if (wife.activity === 'sleeping') {
      this.wifeY = this.layout.wallFloorY + 2;
      this.wifeSprite
        .setPosition(this.wifeX, this.wifeY)
        .setDepth(5)
        .setTexture(`${prefix}-sleep-west`);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 54)
        .setVisible(true);
    } else if (wife.activity === 'toilet') {
      // Aligned higher up so she sits properly on the toilet bowl
      this.wifeY = this.layout.wallFloorY - 8;
      this.wifeSprite
        .setPosition(this.wifeX, this.wifeY)
        .setDepth(6)
        .setTexture(`${prefix}-sit-south`);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 88)
        .setVisible(true);
    } else if (wife.activity === 'washing-hands') {
      // Standing in front of the bathroom sink with her back to the camera
      this.wifeY = this.layout.wallFloorY + 2;
      this.wifeSprite
        .setPosition(this.wifeX, this.wifeY)
        .setDepth(6)
        .setTexture(`${prefix}-idle-north`);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 88)
        .setVisible(true);
    } else if (wife.activity === 'watching-tv') {
      this.wifeY = this.layout.wallFloorY + 4;
      this.wifeSprite
        .setPosition(this.wifeX, this.wifeY)
        .setDepth(6)
        .setTexture(`${prefix}-sit-south`);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 88)
        .setVisible(true);
    } else if (wife.activity === 'showering') {
      this.wifeY = this.layout.wallFloorY + 8;
      this.wifeSprite
        .setPosition(this.wifeX, this.wifeY)
        .setDepth(6)
        .setTexture(`${prefix}-shower-south`);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 88)
        .setVisible(true);
    } else if (wife.activity === 'cleaning') {
      this.wifeY = this.layout.floorY;
      const cleanDir = Math.floor(time / 420) % 2 === 0 ? 'east' : 'west';
      this.wifeSprite
        .setPosition(this.wifeX, this.wifeY)
        .setDepth(8)
        .setTexture(`${prefix}-clean-${cleanDir}`);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 88)
        .setVisible(true);
    } else if (wife.activity === 'eating') {
      this.wifeY = this.layout.floorY;
      this.wifeSprite
        .setPosition(this.wifeX, this.wifeY)
        .setDepth(8)
        .setTexture(`${prefix}-eat-south`);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 88)
        .setVisible(true);
    } else if (wife.activity === 'drinking') {
      this.wifeY = this.layout.floorY;
      this.wifeSprite
        .setPosition(this.wifeX, this.wifeY)
        .setDepth(8)
        .setTexture(`${prefix}-drink-south`);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 88)
        .setVisible(true);
    } else {
      this.wifeY = this.layout.floorY;
      const tex = wife.activity === 'helping-baby' ? `${prefix}-idle-west` : `${prefix}-idle-south`;
      this.wifeSprite.setPosition(this.wifeX, this.wifeY).setDepth(8).setTexture(tex);
      this.wifeLabel
        .setText(actionLabel)
        .setPosition(this.wifeX, this.wifeY - 88)
        .setVisible(true);
    }
  }

  /**
   * Renders visual effects for baby-caused disasters:
   * - Flames and smoke when the stove is on fire.
   * - Blinking red/amber warning on unplugged Wi-Fi modem.
   * - Unplugged indicator on the PC desk.
   */
  private renderHazardEffects(time: number): void {
    this.hazardGraphics.clear();
    const { baby } = this.session.state;
    const { modemX, deskX, wallFloorY } = this.layout;

    // 1. Kitchen stove fire:
    // Stage 1: fire_small on stove
    // Stage 2: fire_big on stove
    // Stage 3: fire spreads across the whole kitchen (stove + kitchen trash + fridge + table)
    if (baby.kitchenFire) {
      const stage = baby.fireStage || 1;
      const pulse = 1 + Math.sin(time * 0.018) * 0.08;
      const baseScale = stage === 1 ? 0.92 : 1.28;
      this.stoveFireImage
        .setVisible(true)
        .setTexture(stage === 1 ? 'fire-small' : 'fire-big')
        .setScale(baseScale * pulse);

      for (let i = 0; i < this.kitchenSpreadFireImages.length; i++) {
        const img = this.kitchenSpreadFireImages[i];
        if (stage >= 3) {
          const itemPulse = 1 + Math.sin(time * 0.02 + (i + 1) * 1.4) * 0.09;
          img.setVisible(true).setScale((i % 2 === 0 ? 1.18 : 0.96) * itemPulse);
        } else {
          img.setVisible(false);
        }
      }
    } else {
      this.stoveFireImage.setVisible(false);
      for (const img of this.kitchenSpreadFireImages) {
        img.setVisible(false);
      }
    }

    // 2. Unplugged Wi-Fi modem
    if (baby.modemUnplugged) {
      const blink = Math.sin(time * 0.015) > 0;
      this.hazardGraphics.fillStyle(blink ? 0xff0033 : 0xffbe0b, 0.95);
      this.hazardGraphics.fillRect(modemX - 6, wallFloorY - 24, 12, 6);
    }

    // 3. Unplugged PC
    if (baby.pcUnplugged) {
      const blink = Math.sin(time * 0.015) > 0;
      this.hazardGraphics.fillStyle(blink ? 0xff0033 : 0x151820, 0.95);
      this.hazardGraphics.fillRect(deskX - 14, wallFloorY - 28, 28, 8);
    }
  }

  /**
   * Draws a comic-book style shout bubble with a sharp pointer tail and action burst lines.
   */
  private drawComicShoutBubble(
    cx: number,
    cy: number,
    width: number,
    height: number,
    fillColor: number,
    borderColor: number,
  ): void {
    const left = cx - width / 2;
    const top = cy - height / 2;
    const bottom = cy + height / 2;

    // 1. Comic drop shadow
    this.comicGraphics.fillStyle(0x111118, 0.88);
    this.comicGraphics.fillRect(left + 3, top + 3, width, height);

    // 2. Main comic box fill & bold border
    this.comicGraphics.fillStyle(fillColor, 0.98);
    this.comicGraphics.fillRect(left, top, width, height);
    this.comicGraphics.lineStyle(2, borderColor, 1);
    this.comicGraphics.strokeRect(left, top, width, height);

    // 3. Comic pointer tail pointing down toward the character's head
    this.comicGraphics.fillStyle(fillColor, 0.98);
    this.comicGraphics.fillTriangle(cx - 6, bottom - 1, cx + 6, bottom - 1, cx - 2, bottom + 9);
    this.comicGraphics.lineStyle(2, borderColor, 1);
    this.comicGraphics.lineBetween(cx - 6, bottom, cx - 2, bottom + 9);
    this.comicGraphics.lineBetween(cx + 6, bottom, cx - 2, bottom + 9);

    // 4. Comic burst / shout rays at top corners
    this.comicGraphics.lineStyle(1.5, borderColor, 0.95);
    this.comicGraphics.lineBetween(left - 3, top - 2, left - 7, top - 6);
    this.comicGraphics.lineBetween(left + 2, top - 3, left, top - 8);
    this.comicGraphics.lineBetween(left + width + 3, top - 2, left + width + 7, top - 6);
    this.comicGraphics.lineBetween(left + width - 2, top - 3, left + width, top - 8);
  }

  /**
   * Renders comic-book speech bubbles above both the Wife and the Player when they are yelling at each other.
   */
  private renderComicShoutBubbles(time: number): void {
    this.comicGraphics.clear();
    const { wife } = this.session.state;

    if (!wife.arguing || wife.activity === 'out' || !this.wifeSprite.visible) {
      this.wifeComicText.setVisible(false);
      this.playerComicText.setVisible(false);
      return;
    }

    const phraseIndex = Math.floor(time / 3200) % 3;
    const wifeLines =
      wife.argueReason === 'hungry'
        ? ["I'M STARVING!!\nBUY FOOD NOW!", 'EMPTY FRIDGE?!\nFEED ME!!', 'WHERE IS\nMY DINNER?!']
        : [
            'THE BABY IS\nCRYING!! HELP!',
            'DO SOMETHING\nWITH THE BABY!',
            "I CAN'T TAKE\nTHIS CRYING!!",
          ];
    const playerLines = [
      "I'M WORKING!!\nHOLD ON!",
      "STOP YELLING!\nI'M STRESSED!",
      'I ONLY HAVE\nTWO HANDS!!',
    ];

    const jitterW = Math.sin(time * 0.045) * 1.5;
    const jitterP = Math.cos(time * 0.048) * 1.5;

    // Clamp X inside world bounds so bubbles never clip off-screen
    const minX = 56;
    const maxX = this.layout.worldWidth - 56;
    const wx = Phaser.Math.Clamp(this.wifeX + jitterW, minX, maxX);
    const px = Phaser.Math.Clamp(this.player.x + jitterP, minX, maxX);

    let wy = this.wifeY - 108;
    let py = this.player.y - 104;

    // Prevent overlap if Wife and Player are standing right next to each other
    if (Math.abs(wx - px) < 96) {
      wy -= 16;
      py += 12;
    }

    this.drawComicShoutBubble(wx, wy, 92, 26, 0xfff3b0, 0xe63946);
    this.wifeComicText.setText(wifeLines[phraseIndex]).setPosition(wx, wy).setVisible(true);

    this.drawComicShoutBubble(px, py, 88, 26, 0xffd6d6, 0xc1121f);
    this.playerComicText.setText(playerLines[phraseIndex]).setPosition(px, py).setVisible(true);
  }

  /**
   * Renders visual effects on the character, wife, and baby:
   * - Comic-book shout bubbles when arguing.
   * - Zzz when the baby or wife is sleeping.
   * - Falling water droplets while showering or washing hands.
   * - Dirt Level 2 (dirt >= 40): rising green stink waves.
   * - Dirt Level 3 (dirt >= 75): flies orbiting around the player.
   */
  private renderCharacterEffects(time: number): void {
    this.effectsGraphics.clear();
    this.renderComicShoutBubbles(time);

    const { player, wife, baby } = this.session.state;
    const mode = player.mode;
    const px = this.player.x;
    const py = this.player.y;

    // 0. Soft Zzz if the baby is sleeping (in crib, bed, or carried in arms)
    const babySleepingNow =
      (baby.location === 'crib' && baby.cribSleeping && !baby.crying) ||
      (baby.location === 'bed' && !baby.crying) ||
      (baby.location === 'carried' && baby.carriedAsleep);

    if (babySleepingNow) {
      this.effectsGraphics.fillStyle(0xa8dadc, 0.9);
      for (let i = 0; i < 2; i++) {
        const floatOffset = (time * 0.02 + i * 11) % 20;
        const zx = this.babyX + 6 + i * 4;
        const zy = this.babyY - 22 - floatOffset;
        this.effectsGraphics.fillRect(zx, zy, 3, 1.5);
      }
    }

    // 0b. Soft Zzz when wife is sleeping in bed
    if (wife.activity === 'sleeping' && this.wifeSprite.visible) {
      this.effectsGraphics.fillStyle(0xf4a261, 0.85);
      for (let i = 0; i < 2; i++) {
        const floatOffset = (time * 0.022 + i * 12) % 22;
        const zx = this.wifeX - 14 - i * 4;
        const zy = this.wifeY - 36 - floatOffset;
        this.effectsGraphics.fillRect(zx, zy, 3.5, 1.5);
      }
    }

    // 1. Water droplets while showering
    if (mode === 'showering') {
      this.effectsGraphics.fillStyle(0x72efdd, 0.85);
      for (let i = 0; i < 12; i++) {
        const dropOffset = (time * 0.14 + i * 19) % 62;
        const dropX = px - 14 + ((i * 7) % 28);
        const dropY = py - 74 + dropOffset;
        this.effectsGraphics.fillRect(dropX, dropY, 2, 5);
      }
      return;
    }

    // 1b. Sleep Zzz while napping in bed
    if (mode === 'napping') {
      this.effectsGraphics.fillStyle(0xffe8bb, 0.85);
      for (let i = 0; i < 3; i++) {
        const floatOffset = (time * 0.025 + i * 10) % 26;
        const zx = px - 18 - i * 4 + Math.sin(time * 0.005 + i) * 3;
        const zy = py - 46 - floatOffset;
        const size = 2 + i * 0.8;
        this.effectsGraphics.fillRect(zx, zy, size * 2, 1.5);
        this.effectsGraphics.fillRect(zx + size * 0.6, zy + size, size, 1.5);
        this.effectsGraphics.fillRect(zx, zy + size * 2, size * 2, 1.5);
      }
    }

    // 2. Dirt Level 2 & 3: Stink waves rising from player
    const dirtLevel = player.dirtLevel;
    if (dirtLevel >= 2) {
      const waveCount = dirtLevel === 3 ? 4 : 3;
      const stinkColor = dirtLevel === 3 ? 0x80b918 : 0xaacc00;
      this.effectsGraphics.lineStyle(1.5, stinkColor, 0.78);

      for (let w = 0; w < waveCount; w++) {
        const baseX = px - 14 + w * (28 / (waveCount - 1));
        const rise = (time * 0.03 + w * 12) % 26;
        const startY = py - 36 - rise;

        this.effectsGraphics.beginPath();
        for (let s = 0; s <= 14; s += 2) {
          const sway = Math.sin(time * 0.008 + s * 0.45 + w * 1.7) * 3.5;
          const vx = baseX + sway;
          const vy = startY - s;
          if (s === 0) {
            this.effectsGraphics.moveTo(vx, vy);
          } else {
            this.effectsGraphics.lineTo(vx, vy);
          }
        }
        this.effectsGraphics.strokePath();
      }
    }

    // 3. Dirt Level 3: Flies orbiting around player
    if (dirtLevel === 3) {
      const flyCount = 5;
      for (let f = 0; f < flyCount; f++) {
        const angle = time * (0.005 + f * 0.0012) + f * 1.25;
        const radiusX = 16 + (f % 2) * 7;
        const radiusY = 10 + (f % 3) * 5;
        const centerY = py - 42 - (f % 3) * 10;

        const fx = px + Math.cos(angle) * radiusX;
        const fy = centerY + Math.sin(angle * 1.7) * radiusY;

        this.effectsGraphics.fillStyle(0x14151b, 1);
        this.effectsGraphics.fillRect(fx, fy, 2.5, 2.5);

        const wingOffset = Math.sin(time * 0.06 + f) > 0 ? -1.5 : 0;
        this.effectsGraphics.fillStyle(0xffffff, 0.85);
        this.effectsGraphics.fillRect(fx - 1, fy + wingOffset, 1.5, 1.5);
        this.effectsGraphics.fillRect(fx + 2, fy + wingOffset, 1.5, 1.5);
      }
    }
  }

  /**
   * Updates the Day / Afternoon / Night ambient overlay and canvas filter.
   * Scoped strictly to the Phaser canvas (#game), so popup modals (#computer, etc.) are never affected.
   */
  private updateAmbientOverlay(): void {
    const hour = this.session.state.secondsOfDay / 3600;
    const sunsetColor = { r: 217, g: 107, b: 39 }; // Warm sunset amber (0xd96b27)
    const nightColor = { r: 10, g: 17, b: 40 }; // Deep night indigo (0x0a1128)

    let r = 0;
    let g = 0;
    let b = 0;
    let alpha = 0;
    let canvasFilter = 'none';

    if (hour >= 7 && hour < 16.5) {
      alpha = 0;
      canvasFilter = 'none';
    } else if (hour >= 16.5 && hour < 19.5) {
      const t = (hour - 16.5) / 3;
      r = sunsetColor.r;
      g = sunsetColor.g;
      b = sunsetColor.b;
      alpha = Phaser.Math.Linear(0, 0.28, t);
      const sepia = (0.2 * t).toFixed(2);
      const sat = (1 + 0.22 * t).toFixed(2);
      const bright = (1 - 0.06 * t).toFixed(2);
      canvasFilter = `sepia(${sepia}) saturate(${sat}) brightness(${bright})`;
    } else if (hour >= 19.5 && hour < 21) {
      const t = (hour - 19.5) / 1.5;
      r = Math.round(Phaser.Math.Linear(sunsetColor.r, nightColor.r, t));
      g = Math.round(Phaser.Math.Linear(sunsetColor.g, nightColor.g, t));
      b = Math.round(Phaser.Math.Linear(sunsetColor.b, nightColor.b, t));
      alpha = Phaser.Math.Linear(0.28, 0.48, t);
      const bright = Phaser.Math.Linear(0.94, 0.78, t).toFixed(2);
      const sat = Phaser.Math.Linear(1.22, 0.82, t).toFixed(2);
      canvasFilter = `brightness(${bright}) contrast(1.06) saturate(${sat})`;
    } else if (hour >= 21 || hour < 5.5) {
      r = nightColor.r;
      g = nightColor.g;
      b = nightColor.b;
      alpha = 0.48;
      canvasFilter = 'brightness(0.78) contrast(1.08) saturate(0.82)';
    } else {
      const t = (hour - 5.5) / 1.5;
      r = nightColor.r;
      g = nightColor.g;
      b = nightColor.b;
      alpha = Phaser.Math.Linear(0.48, 0, t);
      const bright = Phaser.Math.Linear(0.78, 1, t).toFixed(2);
      canvasFilter = `brightness(${bright})`;
    }

    const hexColor = Phaser.Display.Color.GetColor(r, g, b);
    this.ambientOverlay.setFillStyle(hexColor, alpha);
    if (this.game.canvas && this.game.canvas.style.filter !== canvasFilter) {
      this.game.canvas.style.filter = canvasFilter;
    }
  }

  override update(time: number, delta: number): void {
    // 1. Advance game simulation session
    this.session.update(delta);
    this.syncFilthVisuals();

    const { player: playerState, baby, filth } = this.session.state;
    const mode = playerState.mode;
    const isPlayerIdle = playerState.isIdle;

    // Debug/testing hotkeys:
    // [B] +Bladder, [N] +Dirt, [T] +2h Day/Dusk/Night, [M] cycle baby demand, [V] cycle apartment filth
    if (Phaser.Input.Keyboard.JustDown(this.keyB)) {
      playerState.adjust('bladder', 35);
      this.session.events.emit('state:changed');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
      const currentLevel = playerState.dirtLevel;
      const nextDirt = currentLevel === 1 ? 50 : currentLevel === 2 ? 85 : 0;
      const diff = nextDirt - playerState.get('dirt');
      playerState.adjust('dirt', diff);
      this.session.events.emit('state:changed');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.session.state.secondsOfDay = (this.session.state.secondsOfDay + 2 * 3600) % 86400;
      this.session.events.emit('clock:tick', {
        day: this.session.state.day,
        secondsOfDay: this.session.state.secondsOfDay,
      });
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      const order: ('feed' | 'crawl' | 'sleep')[] = ['feed', 'crawl', 'sleep'];
      const nextIdx = baby.demand === 'none' ? 0 : (order.indexOf(baby.demand) + 1) % order.length;
      baby.demand = order[nextIdx];
      baby.needs = 40;
      baby.crying = true;
      this.session.events.emit('state:changed');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyV)) {
      const steps = [0, 26, 50, 72, 92];
      const currentLevel = this.session.state.getZoneFilthLevel('bathroom');
      const nextVal = steps[currentLevel % steps.length];
      filth.bedroom = nextVal;
      filth.bathroom = nextVal;
      filth.kitchen = nextVal;
      this.syncFilthVisuals();
      this.session.events.emit('state:changed');
    }

    // [C] to clean the current room (bedroom/living, bathroom, or kitchen)
    if (Phaser.Input.Keyboard.JustDown(this.keyC) && isPlayerIdle) {
      this.startCleanZone(this.getZoneForX(this.player.x));
    }

    // [R] at the refrigerator to DRINK WATER (uses the water bottle animation)
    if (
      Phaser.Input.Keyboard.JustDown(this.keyR) &&
      isPlayerIdle &&
      Math.abs(this.player.x - this.layout.fridgeX) <= 42
    ) {
      this.session.activities.start('drink');
    }

    // [F] to Carry baby / Put sleeping baby in Crib or Bed / Let baby down to crawl
    if (Phaser.Input.Keyboard.JustDown(this.keyF) && isPlayerIdle) {
      const nearCrib = Math.abs(this.player.x - this.layout.cribX) <= 48;
      const nearBed = Math.abs(this.player.x - this.layout.bedX) <= 48;
      const nearLooseBaby = baby.location === 'loose' && Math.abs(this.player.x - this.babyX) <= 48;

      if (baby.location === 'carried') {
        if (nearCrib) {
          this.putBabyToSleepIn('crib');
        } else if (nearBed) {
          this.putBabyToSleepIn('bed');
        } else {
          this.releaseBabyLoose(this.player.x + (this.facing === 'east' ? 18 : -18));
        }
      } else if (baby.location === 'crib' && nearCrib) {
        if (baby.demand === 'crawl') {
          this.releaseBabyLoose(this.layout.cribX + 22);
        } else {
          this.pickUpBaby();
        }
      } else if (baby.location === 'bed' && nearBed) {
        if (baby.demand === 'crawl') {
          this.releaseBabyLoose(this.layout.bedX + 22);
        } else {
          this.pickUpBaby();
        }
      } else if (nearLooseBaby) {
        this.pickUpBaby();
      }
    }

    // Update Day / Afternoon / Night ambient overlay
    this.updateAmbientOverlay();

    // 2. Handle player input, movement, and 4-step walk cycle
    let dx = 0;

    if (isPlayerIdle) {
      if (this.cursors.left?.isDown || this.keyA?.isDown) dx = -1;
      if (this.cursors.right?.isDown || this.keyD?.isDown) dx = 1;
    }

    if (dx !== 0) {
      const speed = BALANCE.player.walkSpeed * 1.45;
      this.player.x = Phaser.Math.Clamp(
        this.player.x + (dx * speed * delta) / 1000,
        this.layout.minWalkX,
        this.layout.maxWalkX,
      );
      this.player.y = this.layout.floorY;
      this.player.setDepth(10);
      this.facing = dx > 0 ? 'east' : 'west';

      // 4-step walk cycle: walk1 -> idle -> walk2 -> idle
      this.walkAnimTimer += delta;
      if (this.walkAnimTimer >= 115) {
        this.walkAnimTimer = 0;
        this.walkStep = (this.walkStep + 1) % 4;
      }

      const cycleFrames = [
        `char-walk-${this.facing}`,
        `char-idle-${this.facing}`,
        `char-walk2-${this.facing}`,
        `char-idle-${this.facing}`,
      ];
      this.player.setTexture(cycleFrames[this.walkStep]);
    } else {
      this.walkAnimTimer = 0;
      this.walkStep = 0;

      if (mode === 'computer') {
        const chairTier = this.session.state.equipment.chair;
        this.player.x = this.layout.deskX;
        this.player.y =
          chairTier === 2
            ? this.layout.wallFloorY + 4
            : chairTier === 1
              ? this.layout.wallFloorY + 7
              : this.layout.wallFloorY + 10;
        this.player.setDepth(3);
        this.player.setTexture('char-typing-north');
      } else if (mode === 'toilet') {
        // Aligned higher up so the character sits properly on the toilet bowl
        this.player.x = this.layout.toiletX;
        this.player.y = this.layout.wallFloorY - 8;
        this.player.setDepth(6);
        this.player.setTexture('char-sitting-south');
      } else if (mode === 'washing-hands') {
        // Standing in front of the bathroom sink with back to the camera
        this.player.x = this.layout.sinkX;
        this.player.y = this.layout.wallFloorY + 2;
        this.player.setDepth(6);
        this.player.setTexture('char-idle-north');
      } else if (mode === 'showering') {
        this.player.x = this.layout.showerX;
        this.player.y = this.layout.wallFloorY + 8;
        this.player.setDepth(6);
        this.player.setTexture('char-shower-south');
      } else if (mode === 'napping') {
        this.player.x = this.layout.bedX + 2;
        this.player.y = this.layout.wallFloorY + 4;
        this.player.setDepth(6);
        this.player.setTexture('char-sleep-west');
      } else if (mode === 'watching-tv') {
        // 3-seater sofa: player always sits on the left side (wife sits on the right side)
        this.player.x = this.layout.tvX - 14;
        this.player.y = this.layout.wallFloorY + 4;
        this.player.setDepth(6);
        this.player.setTexture('char-sitting-south');
      } else if (mode === 'cleaning') {
        this.player.y = this.layout.floorY;
        this.player.setDepth(10);
        const cleanFacing = Math.floor(time / 420) % 2 === 0 ? 'east' : 'west';
        this.player.setTexture(`char-clean-${cleanFacing}`);
      } else {
        this.player.y = this.layout.floorY;
        this.player.setDepth(10);

        if (mode === 'eating') {
          this.player.setTexture('char-eat-east');
        } else if (mode === 'drinking') {
          // Uses the water bottle animation exclusively for hydrating at the fridge
          this.player.setTexture('char-drink-east');
        } else {
          // When feeding the baby (mode === 'caring') or idle, stands facing the baby without water bottle
          this.player.setTexture(`char-idle-${this.facing}`);
        }
      }
    }

    // 3. Update baby, wife behavior, and visual effects
    this.updateBabyBehavior(time, delta);
    this.updateWifeBehavior(time, delta);
    this.renderHazardEffects(time);
    this.renderCharacterEffects(time);

    const headY = this.player.y - 84;
    this.playerLabel.setPosition(this.player.x, headY);

    // 4. Show urgency alert for bathroom emergency, unwashed hands, filth, or kitchen fire
    if (baby.kitchenFire && isPlayerIdle) {
      const fireAlert =
        baby.fireStage >= 3
          ? '🔥🔥 KITCHEN ENGULFED IN FIRE!'
          : baby.fireStage === 2
            ? '🔥 BIG STOVE FIRE!'
            : '🔥 SMALL STOVE FIRE!';
      this.urgencyText
        .setText(fireAlert)
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else if (playerState.bladderLevel === 3 && isPlayerIdle) {
      this.urgencyText
        .setText('🚽 BATHROOM EMERGENCY!')
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else if (playerState.bladderLevel === 2 && isPlayerIdle) {
      this.urgencyText
        .setText('🚽 NEED TOILET')
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else if (playerState.unwashedHands && isPlayerIdle) {
      this.urgencyText
        .setText('🧼 WASH HANDS AT SINK!')
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else if (this.session.state.maxFilthLevel >= 3 && isPlayerIdle) {
      this.urgencyText
        .setText('🧹 FILTHY! PRESS [C] TO CLEAN')
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else {
      this.urgencyText.setVisible(false);
    }

    // 5. Check proximity to interactive zones
    let activeZone: InteractiveZone | null = null;
    if (isPlayerIdle) {
      for (const zone of this.zones) {
        if (zone.name === 'kitchen' && !baby.kitchenFire) continue;
        if (zone.name === 'modem' && !baby.modemUnplugged) continue;
        if (
          zone.name === 'clean-bathroom' &&
          this.session.state.getZoneFilthLevel('bathroom') < 2
        ) {
          continue;
        }
        if (zone.name === 'clean-kitchen' && this.session.state.getZoneFilthLevel('kitchen') < 2) {
          continue;
        }
        if (zone.name === 'clean-bedroom' && this.session.state.getZoneFilthLevel('bedroom') < 2) {
          continue;
        }
        if (Math.abs(this.player.x - zone.x) <= zone.width) {
          activeZone = zone;
          break;
        }
      }
    }

    // 6. Update prompt text & baby carry prompt
    const nearLooseBaby = baby.location === 'loose' && Math.abs(this.player.x - this.babyX) <= 46;

    if (nearLooseBaby && isPlayerIdle) {
      this.promptText
        .setText('[F] / [E] 👶 PICK UP BABY')
        .setPosition(this.player.x, headY - 14)
        .setVisible(true);
      this.secondaryPromptText.setVisible(false);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.pickUpBaby();
      }
    } else if (activeZone && isPlayerIdle) {
      let promptLabel = activeZone.actionText;
      if (activeZone.name === 'desk' && baby.pcUnplugged) {
        promptLabel = '[E] 🔌 PLUG IN PC CABLE';
      } else if (activeZone.name === 'bed') {
        if (baby.location === 'carried') {
          promptLabel = '[F] PUT BABY IN BED · [E] SLEEP TOGETHER';
        } else if (baby.location === 'bed') {
          if (baby.demand === 'crawl') {
            promptLabel = '[E] / [F] 🏃 LET BABY CRAWL';
          } else if (baby.demand === 'sleep') {
            promptLabel = '[E] / [F] 😴 CARRY TO SLEEP';
          } else if (baby.demand === 'feed') {
            promptLabel = '[E] 🍼 FEED BOTTLE · [F] CARRY';
          } else {
            promptLabel = '[E] REST / NAP · [F] CARRY BABY';
          }
        }
      } else if (activeZone.name === 'crib') {
        if (baby.location === 'carried') {
          promptLabel = '[E] / [F] 🛏️ PUT BABY IN CRIB';
        } else if (baby.location === 'crib') {
          if (baby.demand === 'crawl') {
            promptLabel = '[E] / [F] 🏃 LET BABY CRAWL';
          } else if (baby.demand === 'sleep') {
            promptLabel = '[E] / [F] 😴 CARRY TO SLEEP';
          } else {
            promptLabel = '[E] 🍼 FEED BOTTLE · [F] CARRY BABY';
          }
        }
      }

      this.promptText
        .setText(promptLabel)
        .setPosition(this.player.x, headY - 14)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        activeZone.onInteract();
      }
    } else {
      this.promptText.setVisible(false);
    }

    // Secondary prompt when holding baby away from crib and bed
    const nearCribOrBed =
      Math.abs(this.player.x - this.layout.cribX) <= 48 ||
      Math.abs(this.player.x - this.layout.bedX) <= 48;

    if (baby.location === 'carried' && isPlayerIdle && !nearCribOrBed) {
      this.secondaryPromptText
        .setText(baby.carriedAsleep ? '🛏️ TAKE TO CRIB OR BED [F]' : '[F] PUT BABY ON FLOOR')
        .setPosition(this.player.x, headY - 28)
        .setVisible(true);
    } else {
      this.secondaryPromptText.setVisible(false);
    }

    // 7. Show status badge when performing activity
    if (!isPlayerIdle && mode !== 'computer') {
      const label = mode.toUpperCase() + '...';
      this.statusText
        .setText(label)
        .setPosition(this.player.x, headY - 14)
        .setVisible(true);
    } else {
      this.statusText.setVisible(false);
    }
  }
}
